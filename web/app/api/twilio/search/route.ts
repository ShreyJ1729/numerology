import { NextRequest, NextResponse } from "next/server";
import {
  generatePatternsAtK,
  scoreNumber,
  type ScoredNumber,
} from "@/lib/patterns";
import { stripCountryCode } from "@/lib/numerology";
import {
  isRequestAllowed,
  getTwilioAuth,
  twilioLocalUrl,
  TWILIO_API_BASE,
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
const SAMPLING_RATE = 0.06;
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

  const numberLength = country === "US" || country === "CA" ? 10 : undefined;

  const auth = getTwilioAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Fan out across pattern-grid tiers k ∈ FANOUT_TIERS, sampling each emitted
  // pattern with probability SAMPLING_RATE. Twilio Contains is substring
  // matching, so patterns generated for length 10 still match longer
  // international numbers — patternLength caps probe length, not number length.
  // Tiers are disjoint by construction (k uniquely determines the count of
  // non-`x` chars in a pattern), so no cross-tier dedup is needed; per-tier
  // dedup happens inside generatePatternsAtK.
  const patternLength = numberLength ?? 10;
  const probes: string[] = [];
  for (const k of FANOUT_TIERS) {
    for (const pat of generatePatternsAtK(bn, dn, k, patternLength)) {
      if (Math.random() < SAMPLING_RATE) probes.push(pat.q);
    }
  }
  // Shuffle so worker pool & maxQueries truncation see a uniform mix of tiers.
  for (let i = probes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [probes[i], probes[j]] = [probes[j], probes[i]];
  }

  const expectMin = country === "US" || country === "CA" ? 10 : 6;
  const expectMax = country === "US" || country === "CA" ? 10 : 15;

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
          numberLength: numberLength ?? null,
          samplingRate: SAMPLING_RATE,
          tiers: FANOUT_TIERS,
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
        numberLength: numberLength ?? null,
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
  probes: string[];
  maxQueries: number;
  minPct: number;
  requireRoot: boolean;
  expectMin: number;
  expectMax: number;
  numberLength: number | null;
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

  const maybeEmitProgress = (force = false) => {
    const now = Date.now();
    if (!force && now - lastProgressAt < 250) return;
    lastProgressAt = now;
    emit(
      sse("progress", {
        queriesDone,
        queriesPlanned,
        currentK: numberLength ?? 0,
        matchesEmitted,
        seenCount: seen.size,
      })
    );
  };

  async function fetchPage(url: string): Promise<TwilioListResponse> {
    const resp = await fetch(url, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.warn(
        `[twilio/search] HTTP ${resp.status} for ${url}: ${body.slice(0, 200)}`
      );
      throw new Error(`twilio_${resp.status}`);
    }
    return (await resp.json()) as TwilioListResponse;
  }

  function processNumbers(list: TwilioRawNumber[], probe: string) {
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
      };
      matchesEmitted++;
      emit(sse("match", match));
    }
  }

  async function runProbe(probe: string) {
    let nextUrl: string | null = twilioLocalUrl(
      sid,
      country,
      new URLSearchParams({ Contains: probe, PageSize: String(PAGE_SIZE) })
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
      try {
        const data = await fetchPage(nextUrl);
        if (isCancelled()) {
          stoppedReason = "client-disconnected";
          return;
        }
        const list = Array.isArray(data.available_phone_numbers)
          ? data.available_phone_numbers
          : [];
        processNumbers(list, probe);

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
        failedQueries++;
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.startsWith("twilio_")) {
          console.warn(`[twilio/search] fetch error probe="${probe}": ${msg}`);
        }
        nextUrl = null;
      } finally {
        queriesDone++;
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
