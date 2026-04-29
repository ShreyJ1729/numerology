import { NextRequest, NextResponse } from "next/server";
import {
  generatePatternsInterleaved,
  countPatterns,
  scoreNumber,
  type SearchPattern,
  type ScoredNumber,
} from "@/lib/patterns";
import { stripCountryCode } from "@/lib/numerology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- origin guard (copied from /api/twilio/route.ts) ----------
function isRequestAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const secFetchSite = req.headers.get("sec-fetch-site");

  if (!origin) {
    return secFetchSite === null || secFetchSite === "same-origin" || secFetchSite === "none";
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    if (host && new URL(origin).host === host) return true;
  } catch {}

  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

// ---------- types ----------
type TwilioRawNumber = {
  phone_number: string;
  friendly_name?: string;
  region?: string;
  locality?: string;
  iso_country?: string;
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

// ---------- SSE helper ----------
const ENC = new TextEncoder();
function sse(event: string, data: unknown): Uint8Array {
  return ENC.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ---------- main handler ----------
export async function GET(req: NextRequest) {
  if (!isRequestAllowed(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // ----- param validation -----
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

  const kMin = clampInt(searchParams.get("kMin"), 5, 1, 15);
  const maxQueries = clampInt(searchParams.get("maxQueries"), 2000, 1, 5000);
  const concurrency = clampInt(searchParams.get("concurrency"), 25, 1, 50);
  const minPctRaw = searchParams.get("minPct");
  const minPct = minPctRaw === null ? 0.5 : Number(minPctRaw);
  if (!Number.isFinite(minPct) || minPct < 0 || minPct > 1) {
    return NextResponse.json({ error: "minPct must be 0-1" }, { status: 400 });
  }
  const requireRoot = (searchParams.get("requireRoot") ?? "true") !== "false";

  // numberLength: default to 10 for US/CA, else undefined (let patterns module pick)
  const numberLength = country === "US" || country === "CA" ? 10 : undefined;

  // ----- env / auth -----
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const keySid = process.env.TWILIO_API_KEY_SID;
  const keySecret = process.env.TWILIO_API_KEY_SECRET;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid) {
    return NextResponse.json(
      { error: "TWILIO_ACCOUNT_SID missing on server. Set it in .env.local" },
      { status: 500 }
    );
  }
  let user: string;
  let pass: string;
  if (keySid && keySecret) {
    user = keySid;
    pass = keySecret;
  } else if (token) {
    user = sid;
    pass = token;
  } else {
    return NextResponse.json(
      { error: "Need TWILIO_API_KEY_SID+SECRET or TWILIO_AUTH_TOKEN" },
      { status: 500 }
    );
  }
  const auth = Buffer.from(`${user}:${pass}`).toString("base64");

  // ----- counts -----
  const queriesAvailable = countPatterns(bn, dn, { kMin, numberLength });
  const queriesPlanned = Math.min(maxQueries, queriesAvailable);

  // Domestic length expectations
  const expectMin = country === "US" || country === "CA" ? 10 : 6;
  const expectMax = country === "US" || country === "CA" ? 10 : 15;

  // ----- stream setup -----
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
        } catch {}
      };

      // Detect client disconnect via request signal.
      const onAbort = () => {
        cancelled = true;
      };
      try {
        req.signal.addEventListener("abort", onAbort);
      } catch {}

      // ----- emit meta -----
      safeEnqueue(
        sse("meta", {
          queriesPlanned,
          queriesAvailable,
          kMin,
          numberLength: numberLength ?? null,
        })
      );

      // ----- run worker pool -----
      runSearch({
        sid,
        auth,
        country,
        bn,
        dn,
        kMin,
        numberLength,
        maxQueries,
        queriesPlanned,
        concurrency,
        minPct,
        requireRoot,
        expectMin,
        expectMax,
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
          } catch {}
          safeClose();
        });
    },

    cancel() {
      // Client closed the connection; the runSearch loop polls isCancelled
      // via the request's abort signal. Nothing else needed.
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

// ---------- worker pool driver ----------
type RunOpts = {
  sid: string;
  auth: string;
  country: string;
  bn: number;
  dn: number;
  kMin: number;
  numberLength: number | undefined;
  maxQueries: number;
  queriesPlanned: number;
  concurrency: number;
  minPct: number;
  requireRoot: boolean;
  expectMin: number;
  expectMax: number;
  isCancelled: () => boolean;
  emit: (chunk: Uint8Array) => void;
};

async function runSearch(opts: RunOpts) {
  const {
    sid,
    auth,
    country,
    bn,
    dn,
    kMin,
    numberLength,
    maxQueries,
    queriesPlanned,
    concurrency,
    minPct,
    requireRoot,
    expectMin,
    expectMax,
    isCancelled,
    emit,
  } = opts;

  const seen = new Map<string, ScoredNumber>();
  let queriesDone = 0;
  let queriesInFlight = 0;
  let matchesEmitted = 0;
  let failedQueries = 0;
  let dispatched = 0;
  let currentK = -1;
  let lastProgressAt = 0;
  let stoppedReason: "completed" | "client-disconnected" | "max-queries-reached" =
    "completed";

  const gen = generatePatternsInterleaved(bn, dn, { kMin, numberLength });

  const maybeEmitProgress = (force = false) => {
    const now = Date.now();
    if (!force && now - lastProgressAt < 250) return;
    lastProgressAt = now;
    emit(
      sse("progress", {
        queriesDone,
        queriesPlanned,
        currentK,
        matchesEmitted,
        seenCount: seen.size,
      })
    );
  };

  // Future work: paginate beyond first 30 (Page=N) for ultra-rare patterns.
  // For v1, single-page fan-out across thousands of patterns is sufficient.
  async function fetchPattern(p: SearchPattern): Promise<TwilioRawNumber[]> {
    const params = new URLSearchParams({ Contains: p.q, PageSize: "30" });
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/AvailablePhoneNumbers/${country}/Local.json?${params.toString()}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.warn(
        `[twilio/search] HTTP ${resp.status} for pattern="${p.q}" k=${p.k}: ${body.slice(0, 200)}`
      );
      throw new Error(`twilio_${resp.status}`);
    }
    const data: unknown = await resp.json();
    const list = (data as { available_phone_numbers?: TwilioRawNumber[] })
      .available_phone_numbers;
    return Array.isArray(list) ? list : [];
  }

  async function worker() {
    while (true) {
      if (isCancelled()) {
        stoppedReason = "client-disconnected";
        return;
      }
      // Stop dispatching when we'd exceed maxQueries.
      if (dispatched >= maxQueries) {
        if (queriesDone + queriesInFlight >= maxQueries) {
          stoppedReason = "max-queries-reached";
        }
        return;
      }
      const next = gen.next();
      if (next.done) return;
      const pattern = next.value;
      dispatched++;
      queriesInFlight++;

      // Detect k transition for forced progress emission.
      if (pattern.k !== currentK) {
        currentK = pattern.k;
        maybeEmitProgress(true);
      }

      try {
        const list = await fetchPattern(pattern);
        if (isCancelled()) return;

        for (const item of list) {
          const phone = item.phone_number;
          if (!phone || seen.has(phone)) continue;

          const domestic = stripCountryCode(phone, country);
          if (!/^\d+$/.test(domestic)) continue;
          if (domestic.length < expectMin || domestic.length > expectMax) continue;

          const score = scoreNumber(domestic, bn, dn);
          // Mark as seen regardless of pass/fail to avoid recomputing.
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
            viaPattern: pattern.q,
            viaK: pattern.k,
          };
          matchesEmitted++;
          emit(sse("match", match));
        }
      } catch (e: unknown) {
        failedQueries++;
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.startsWith("twilio_")) {
          console.warn(`[twilio/search] fetch error pattern="${pattern.q}": ${msg}`);
        }
      } finally {
        queriesDone++;
        queriesInFlight--;
        maybeEmitProgress(false);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  // Final progress flush.
  maybeEmitProgress(true);

  if (isCancelled()) {
    stoppedReason = "client-disconnected";
    // Don't emit done if client is gone.
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

// ---------- utils ----------
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
