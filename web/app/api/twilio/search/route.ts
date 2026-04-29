import { NextRequest, NextResponse } from "next/server";
import {
  generatePatternsAtK,
  scoreNumber,
  type ScoredNumber,
} from "@/lib/patterns";
import { stripCountryCode, getCountrySpec } from "@/lib/numerology";
import {
  isRequestAllowed,
  getTwilioAuth,
  twilioAvailableUrl,
  TWILIO_API_BASE,
  type TwilioNumberType,
} from "@/lib/twilio-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TwilioRawNumber = {
  phone_number: string;
  friendly_name?: string;
  region?: string;
  locality?: string;
  iso_country?: string;
};

type TwilioListResponse = {
  available_phone_numbers?: TwilioRawNumber[];
  next_page_uri?: string | null;
};

type Match = ScoredNumber & {
  phone_number: string;
  friendly_name: string;
  region: string;
  locality: string;
  iso_country: string;
  viaPattern: string;
  viaK: number;
  numberType: TwilioNumberType;
};

const ENC = new TextEncoder();
function sse(event: string, data: unknown): Uint8Array {
  return ENC.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Twilio caps PageSize at 1000 for AvailablePhoneNumbers; observed silent cap
// is ~30 per page regardless. We fan out across the pattern grid (k=5..2) to
// widen coverage instead of relying on a single anchor probe.
const PAGE_SIZE = 1000;
const FANOUT_TIERS = [5, 4, 3, 2];
// Base sampling rate. We adapt this per-country: 0.06 was tuned for countries
// with 3 resource types (US-style: each pattern probed 2-3 times across types).
// Countries with only 1-2 types (e.g. IN: Mobile only, JP: Local only) need a
// proportionally higher rate to compensate, otherwise sparse inventory yields
// zero matches.
const BASE_SAMPLING_RATE = 0.06;
// Compact patterns (L === k, pure-digit substrings like "37" or "373") are by
// far the most productive against small inventory. Always emit them, then
// sample longer/wildcarded variants. This guarantees IN/JP-style countries
// get the highest-yield probes for free.
const FULL_COVER_COMPACT = true;
const PROBE_CONCURRENCY = 15;

export async function GET(req: NextRequest) {
  if (!isRequestAllowed(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const country = searchParams.get("country");
  const bnRaw = searchParams.get("bn");
  const dnRaw = searchParams.get("dn");

  if (!country || !/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ error: "country (ISO-2) required" }, { status: 400 });
  }
  const spec = getCountrySpec(country);
  if (!spec) {
    return NextResponse.json(
      { error: `country ${country} not supported` },
      { status: 400 }
    );
  }
  const bn = Number(bnRaw);
  const dn = Number(dnRaw);
  if (!Number.isInteger(bn) || bn < 1 || bn > 9) {
    return NextResponse.json({ error: "bn must be integer 1-9" }, { status: 400 });
  }
  if (!Number.isInteger(dn) || dn < 1 || dn > 9) {
    return NextResponse.json({ error: "dn must be integer 1-9" }, { status: 400 });
  }

  // kMin is unused algorithmically; retained because the client still sends it
  // and surfaces it in copy. Drop once the client stops referencing it.
  const kMin = clampInt(searchParams.get("kMin"), 5, 1, 15);
  const maxQueries = clampInt(searchParams.get("maxQueries"), 1500, 1, 10000);
  const minPctRaw = searchParams.get("minPct");
  const minPct = minPctRaw === null ? 0.5 : Number(minPctRaw);
  if (!Number.isFinite(minPct) || minPct < 0 || minPct > 1) {
    return NextResponse.json({ error: "minPct must be 0-1" }, { status: 400 });
  }
  const requireRoot = (searchParams.get("requireRoot") ?? "true") !== "false";

  const numberLength = spec.domesticMax;

  const auth = getTwilioAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Fan out across pattern-grid tiers k ∈ FANOUT_TIERS, sampling each emitted
  // pattern with probability SAMPLING_RATE. Twilio Contains is substring
  // matching, so length-L patterns (L ≤ patternLength) substring-match every
  // number the country offers — patternLength = domesticMin guarantees a fit
  // even for the country's shortest numbers (e.g., AU/FR at 9 digits).
  // Per-tier dedup happens inside generatePatternsAtK; tiers are disjoint by
  // construction (k determines anchored-char count).
  //
  // Probes are then replicated across the country's Twilio resource types
  // (Local/Mobile/National) since most non-US/CA countries do not stock Local
  // inventory; their numbers live under Mobile or National.
  const patternLength = Math.max(2, spec.domesticMin);
  const tiers = FANOUT_TIERS.filter((k) => k <= patternLength && k >= 2);
  // Adaptive sampling: scale up when the country has fewer resource types so
  // each pattern still gets adequate inventory coverage. 3 types -> 0.06,
  // 2 types -> 0.09, 1 type -> 0.18.
  const samplingRate = Math.min(
    1,
    BASE_SAMPLING_RATE * Math.max(1, 3 / spec.numberTypes.length)
  );
  const basePatterns: string[] = [];
  for (const k of tiers) {
    for (const pat of generatePatternsAtK(bn, dn, k, patternLength)) {
      // Always include compact pure-digit patterns (L === k): "37", "373",
      // "3737". These are pure substrings, the most productive shape against
      // small inventory. Only sample the longer wildcarded variants.
      if (FULL_COVER_COMPACT && pat.L === pat.k) {
        basePatterns.push(pat.q);
      } else if (Math.random() < samplingRate) {
        basePatterns.push(pat.q);
      }
    }
  }
  const probes: { q: string; type: TwilioNumberType }[] = [];
  for (const type of spec.numberTypes) {
    for (const q of basePatterns) probes.push({ q, type });
  }
  // Shuffle so worker pool & maxQueries truncation see a uniform mix of tiers
  // and resource types.
  for (let i = probes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [probes[i], probes[j]] = [probes[j], probes[i]];
  }

  const expectMin = spec.domesticMin;
  const expectMax = spec.domesticMax;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let cancelled = false;
      let closed = false;
      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed || cancelled) return;
        try {
          controller.enqueue(chunk);
        } catch {
          closed = true;
        }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch { }
      };

      const onAbort = () => {
        cancelled = true;
      };
      try {
        req.signal.addEventListener("abort", onAbort);
      } catch { }

      safeEnqueue(
        sse("meta", {
          queriesPlanned: probes.length,
          queriesAvailable: maxQueries,
          kMin,
          numberLength,
          samplingRate,
          tiers,
          numberTypes: spec.numberTypes,
        })
      );

      runDiscovery({
        sid: auth.sid,
        authHeader: auth.authHeader,
        country,
        bn,
        dn,
        probes,
        maxQueries,
        minPct,
        requireRoot,
        expectMin,
        expectMax,
        numberLength,
        isCancelled: () => cancelled,
        emit: safeEnqueue,
      })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
          safeEnqueue(sse("error", { message: msg }));
        })
        .finally(() => {
          try {
            req.signal.removeEventListener("abort", onAbort);
          } catch { }
          safeClose();
        });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

type DiscoveryOpts = {
  sid: string;
  authHeader: string;
  country: string;
  bn: number;
  dn: number;
  probes: { q: string; type: TwilioNumberType }[];
  maxQueries: number;
  minPct: number;
  requireRoot: boolean;
  expectMin: number;
  expectMax: number;
  numberLength: number;
  isCancelled: () => boolean;
  emit: (chunk: Uint8Array) => void;
};

async function runDiscovery(opts: DiscoveryOpts) {
  const {
    sid,
    authHeader,
    country,
    bn,
    dn,
    probes,
    maxQueries,
    minPct,
    requireRoot,
    expectMin,
    expectMax,
    numberLength,
    isCancelled,
    emit,
  } = opts;

  const seen = new Map<string, ScoredNumber>();
  let queriesDone = 0;
  let queriesInFlight = 0;
  let queriesPlanned = probes.length;
  let matchesEmitted = 0;
  let failedQueries = 0;
  let stoppedReason: "completed" | "client-disconnected" | "max-queries-reached" =
    "completed";
  let lastProgressAt = 0;

  // (country, type) pairs that returned 20404 — the resource subroute itself
  // doesn't exist for that country (e.g. AU/National). Once seen, all
  // subsequent probes for that type short-circuit without burning maxQueries.
  const deadTypes = new Set<TwilioNumberType>();

  const maybeEmitProgress = (force = false) => {
    const now = Date.now();
    if (!force && now - lastProgressAt < 250) return;
    lastProgressAt = now;
    emit(
      sse("progress", {
        queriesDone,
        queriesPlanned,
        currentK: numberLength,
        matchesEmitted,
        seenCount: seen.size,
      })
    );
  };

  // Custom error so the caller can branch on HTTP status (specifically 404 for
  // resource-type short-circuiting) without parsing message strings.
  class TwilioHttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "TwilioHttpError";
    }
  }

  async function fetchPage(url: string): Promise<TwilioListResponse> {
    const resp = await fetch(url, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      // Suppress the noisy log for 404s — they're expected when probing a
      // (country, type) the account/region doesn't stock. The caller marks the
      // type dead and short-circuits subsequent probes.
      if (resp.status !== 404) {
        console.warn(
          `[twilio/search] HTTP ${resp.status} for ${url}: ${body.slice(0, 200)}`
        );
      }
      throw new TwilioHttpError(resp.status, `twilio_${resp.status}`);
    }
    return (await resp.json()) as TwilioListResponse;
  }

  function processNumbers(
    list: TwilioRawNumber[],
    probe: string,
    type: TwilioNumberType
  ) {
    for (const item of list) {
      const phone = item.phone_number;
      if (!phone || seen.has(phone)) continue;

      const domestic = stripCountryCode(phone, country);
      if (!/^\d+$/.test(domestic)) continue;
      if (domestic.length < expectMin || domestic.length > expectMax) continue;

      const score = scoreNumber(domestic, bn, dn);
      seen.set(phone, score);

      if (score.bn_dn_pct < minPct) continue;
      if (requireRoot && score.digital_root !== bn && score.digital_root !== dn) {
        continue;
      }

      const match: Match = {
        phone_number: phone,
        friendly_name: item.friendly_name ?? "",
        region: item.region ?? "",
        locality: item.locality ?? "",
        iso_country: item.iso_country ?? country,
        ...score,
        viaPattern: probe,
        viaK: score.bn_dn_count,
        numberType: type,
      };
      matchesEmitted++;
      emit(sse("match", match));
    }
  }

  async function runProbe(probe: { q: string; type: TwilioNumberType }) {
    // If a previous probe already learned this resource type 404s for the
    // country, abandon immediately — without incrementing queriesDone, since
    // no real query went out.
    if (deadTypes.has(probe.type)) return;

    let nextUrl: string | null = twilioAvailableUrl(
      sid,
      country,
      probe.type,
      new URLSearchParams({ Contains: probe.q, PageSize: String(PAGE_SIZE) })
    );

    while (nextUrl) {
      if (isCancelled()) {
        stoppedReason = "client-disconnected";
        return;
      }
      if (queriesDone + queriesInFlight >= maxQueries) {
        stoppedReason = "max-queries-reached";
        return;
      }

      queriesInFlight++;
      let countThisQuery = true;
      try {
        const data = await fetchPage(nextUrl);
        if (isCancelled()) {
          stoppedReason = "client-disconnected";
          return;
        }
        const list = Array.isArray(data.available_phone_numbers)
          ? data.available_phone_numbers
          : [];
        processNumbers(list, probe.q, probe.type);

        const nextPath = data.next_page_uri || null;
        if (nextPath && queriesDone + 1 < maxQueries) {
          // +2 = the in-flight current probe (not yet counted) + the discovered next page.
          queriesPlanned = Math.max(queriesPlanned, queriesDone + 2);
          nextUrl = nextPath.startsWith("http")
            ? nextPath
            : `${TWILIO_API_BASE}${nextPath}`;
        } else {
          nextUrl = null;
        }
      } catch (e: unknown) {
        const status = e instanceof TwilioHttpError ? e.status : 0;
        if (status === 404 && !deadTypes.has(probe.type)) {
          // Twilio returns 20404 when the AvailablePhoneNumbers/{country}/{type}
          // resource itself doesn't exist (e.g. AU/National). Mark the type
          // dead, drop this probe from the query budget, and emit a notice so
          // the client can dim that type if it cares.
          deadTypes.add(probe.type);
          countThisQuery = false;
          emit(
            sse("notice", {
              kind: "type_unsupported",
              country,
              type: probe.type,
            })
          );
        } else {
          failedQueries++;
          const msg = e instanceof Error ? e.message : String(e);
          // Non-404 twilio_* errors (rate limit, 5xx) are already logged by
          // fetchPage; only log truly unexpected transport errors here.
          if (status === 0) {
            console.warn(
              `[twilio/search] fetch error probe="${probe.q}" type=${probe.type}: ${msg}`
            );
          }
        }
        nextUrl = null;
      } finally {
        if (countThisQuery) queriesDone++;
        queriesInFlight--;
        maybeEmitProgress(false);
      }
    }
  }

  // JS is single-threaded so nextIdx++ is atomic at the statement level.
  let nextIdx = 0;
  async function worker() {
    while (true) {
      if (isCancelled()) {
        stoppedReason = "client-disconnected";
        return;
      }
      if (queriesDone + queriesInFlight >= maxQueries) {
        stoppedReason = "max-queries-reached";
        return;
      }
      const idx = nextIdx++;
      if (idx >= probes.length) return;
      await runProbe(probes[idx]);
    }
  }
  const concurrency = Math.min(PROBE_CONCURRENCY, probes.length);
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  maybeEmitProgress(true);

  if (isCancelled()) {
    stoppedReason = "client-disconnected";
    return;
  }

  emit(
    sse("done", {
      queriesDone,
      matchesEmitted,
      seenCount: seen.size,
      failedQueries,
      stoppedReason,
    })
  );
}

function clampInt(
  raw: string | null,
  def: number,
  min: number,
  max: number
): number {
  if (raw === null || raw === "") return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}
