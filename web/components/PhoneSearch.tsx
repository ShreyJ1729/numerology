"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COUNTRY_OPTIONS,
  bhagyankFromDob,
  mulankFromDob,
  sortMatches,
  type Match,
} from "@/lib/numerology";
import PhoneCard from "./PhoneCard";
import Tooltip from "./Tooltip";

type Status = "idle" | "searching" | "done" | "error" | "cancelled";

type SseMatch = {
  phone_number: string;
  friendly_name: string;
  region: string;
  locality: string;
  iso_country: string;
  domestic: string;
  bn_count: number;
  dn_count: number;
  bn_dn_count: number;
  bn_dn_pct: number;
  digital_root: number;
  longest_bn_dn_run: number;
  longest_repeat_run: number;
  trailing4: string;
  viaPattern?: string;
  viaK?: number;
};

type SseMeta = {
  queriesPlanned: number;
  queriesAvailable: number;
  kMin: number;
  numberLength: number;
};

type SseProgress = {
  queriesDone: number;
  queriesPlanned: number;
  currentK: number;
  matchesEmitted: number;
  seenCount: number;
};

type SseDone = {
  queriesDone: number;
  matchesEmitted: number;
  stoppedReason: string;
};

const FLUSH_INTERVAL_MS = 150;

export default function PhoneSearch() {
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("US");

  const bn = useMemo(() => mulankFromDob(dob), [dob]);
  const dn = useMemo(() => bhagyankFromDob(dob), [dob]);

  const dobWords = useMemo(() => {
    if (bn === null) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const d = new Date(year, month - 1, day);
    const locale = country === "US" ? "en-US" : "en-GB";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  }, [dob, bn, country]);

  const [status, setStatus] = useState<Status>("idle");
  const [meta, setMeta] = useState<SseMeta | null>(null);
  const [progress, setProgress] = useState<SseProgress>({
    queriesDone: 0,
    queriesPlanned: 0,
    currentK: 0,
    matchesEmitted: 0,
    seenCount: 0,
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Tracks the previous currentK so we can show a brief "k = N" announcement.
  const [kAnnounce, setKAnnounce] = useState<number | null>(null);
  const kAnnounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // Buffer of matches we've received but not yet flushed to React state.
  const matchBufferRef = useRef<Match[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKRef = useRef<number>(0);

  const inputsValid = bn !== null && dn !== null;

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (kAnnounceTimerRef.current) clearTimeout(kAnnounceTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function scheduleFlush() {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      const buf = matchBufferRef.current;
      if (buf.length === 0) return;
      // Replace with sorted snapshot of the full buffer.
      setMatches(sortMatches(buf.slice()));
    }, FLUSH_INTERVAL_MS);
  }

  function flushNow() {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const buf = matchBufferRef.current;
    setMatches(sortMatches(buf.slice()));
  }

  function announceK(k: number) {
    setKAnnounce(k);
    if (kAnnounceTimerRef.current) clearTimeout(kAnnounceTimerRef.current);
    kAnnounceTimerRef.current = setTimeout(() => {
      setKAnnounce(null);
      kAnnounceTimerRef.current = null;
    }, 1200);
  }

  function handleSseMessage(raw: string) {
    // Parse a single SSE message block: lines like "event: foo" and "data: ...".
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).replace(/^ /, ""));
      }
      // Comments (":") and other field types are ignored.
    }
    if (dataLines.length === 0) return;
    const dataStr = dataLines.join("\n");

    let payload: unknown;
    try {
      payload = JSON.parse(dataStr);
    } catch {
      return;
    }

    if (eventName === "meta") {
      const m = payload as SseMeta;
      setMeta(m);
      setProgress((prev) => ({
        ...prev,
        queriesPlanned: m.queriesPlanned,
        currentK: m.numberLength,
      }));
      lastKRef.current = m.numberLength;
      announceK(m.numberLength);
    } else if (eventName === "progress") {
      const p = payload as SseProgress;
      setProgress(p);
      if (p.currentK !== lastKRef.current) {
        lastKRef.current = p.currentK;
        announceK(p.currentK);
      }
    } else if (eventName === "match") {
      const evt = payload as SseMatch;
      const match: Match = {
        phone_number: evt.phone_number,
        friendly_name: evt.friendly_name,
        locality: evt.locality,
        region: evt.region,
        iso_country: evt.iso_country,
        domestic: evt.domestic,
        bn_dn_count: evt.bn_dn_count,
        bn_dn_pct: evt.bn_dn_pct,
        digital_root: evt.digital_root,
        longest_repeat_run: evt.longest_repeat_run,
        longest_bn_dn_run: evt.longest_bn_dn_run,
        trailing4: evt.trailing4,
      };
      matchBufferRef.current.push(match);
      scheduleFlush();
    } else if (eventName === "done") {
      const d = payload as SseDone;
      setProgress((prev) => ({
        ...prev,
        queriesDone: d.queriesDone,
        matchesEmitted: d.matchesEmitted,
      }));
      flushNow();
      setStatus("done");
    } else if (eventName === "error") {
      const errPayload = payload as { message?: string };
      setError(errPayload.message || "Server error");
      flushNow();
      setStatus("error");
    }
  }

  async function startSearch() {
    if (bn === null || dn === null) return;

    setStatus("searching");
    setError(null);
    setMatches([]);
    setMeta(null);
    setProgress({
      queriesDone: 0,
      queriesPlanned: 0,
      currentK: 0,
      matchesEmitted: 0,
      seenCount: 0,
    });
    matchBufferRef.current = [];
    lastKRef.current = 0;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({
      country,
      bn: String(bn),
      dn: String(dn),
      kMin: "5",
    });

    try {
      const resp = await fetch(`/api/twilio/search?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: "text/event-stream" },
      });

      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const body = await resp.json();
          if (body?.error) msg = body.error;
          else if (body?.message) msg = body.message;
        } catch {
          // ignore; keep HTTP-status fallback
        }
        throw new Error(msg);
      }

      if (!resp.body) {
        throw new Error("Streaming not supported by this browser.");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      // SSE messages are separated by a blank line. Per the spec the
      // separator can be "\n\n" or "\r\n\r\n"; normalize CRLFs first.
      while (true) {
        if (controller.signal.aborted) break;
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        buf = buf.replace(/\r\n/g, "\n");

        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const raw = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          if (raw.length > 0) handleSseMessage(raw);
        }
      }

      // Flush trailing message if the stream closed without a final blank line.
      const tail = buf.trim();
      if (tail.length > 0) handleSseMessage(tail);

      flushNow();
      // Only mark done if the stream ended without a `done`/`error`/abort event
      // having already moved us out of "searching".
      setStatus((prev) => (prev === "searching" ? "done" : prev));
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        flushNow();
        setStatus("cancelled");
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      flushNow();
      setStatus("error");
    }
  }

  function cancelSearch() {
    abortRef.current?.abort();
  }

  const pct = progress.queriesPlanned
    ? (progress.queriesDone / progress.queriesPlanned) * 100
    : 0;

  const barColor =
    status === "error"
      ? "bg-[#8B2C2C]"
      : status === "cancelled"
      ? "bg-[#C9A961]"
      : status === "done"
      ? "bg-[#7A8B5C]"
      : "bg-gradient-to-r from-[#E97724] to-[#C9A961]";

  const numberLength = meta?.numberLength ?? 0;
  const kMin = meta?.kMin ?? 5;

  const statusLabel: React.ReactNode =
    status === "searching"
      ? kAnnounce !== null
        ? (
          <>
            k = <code style={{ fontFamily: "var(--font-mono)" }} className="tabular-nums">{numberLength || kAnnounce}</code>{" "}
            placements (rarest first) — k ={" "}
            <code style={{ fontFamily: "var(--font-mono)" }} className="tabular-nums">{kAnnounce}</code>
          </>
        )
        : progress.queriesPlanned > 0
        ? (
          <>
            Searching k ={" "}
            <code style={{ fontFamily: "var(--font-mono)" }} className="tabular-nums">{progress.currentK}</code>{" "}
            placements ·{" "}
            <span className="tabular-nums">{progress.queriesDone}</span> of{" "}
            <span className="tabular-nums">{progress.queriesPlanned}</span>
          </>
        )
        : "Preparing search…"
      : status === "done"
      ? "Search complete"
      : status === "cancelled"
      ? "Cancelled"
      : status === "error"
      ? "Error"
      : "";

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="eyebrow block mb-1.5" htmlFor="dob-input">Date of Birth</label>
            <input
              id="dob-input"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="input-aol tabular-nums cursor-pointer"
            />
          </div>
          <SelectField
            label="Country"
            value={country}
            onChange={setCountry}
            options={COUNTRY_OPTIONS}
          />
        </div>

        {dobWords && (
          <div className="flex items-baseline gap-2 text-xs flex-wrap">
            <span className="eyebrow text-[#6B6B6B]">Reading as</span>
            <span className="font-serif text-[#2A2A2A]">{dobWords}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <DerivedPill
            label={<>Mulank <span style={{ fontVariantCaps: "all-small-caps", letterSpacing: "0.05em" }}>(bn)</span></>}
            ariaLabel="Mulank"
            value={bn}
            tooltip="Mulank (Birth Number) is the digital root of your day of birth, reduced to 1–9. It reflects your core personality vibration."
          />
          <DerivedPill
            label={<>Bhagyank <span style={{ fontVariantCaps: "all-small-caps", letterSpacing: "0.05em" }}>(dn)</span></>}
            ariaLabel="Bhagyank"
            value={dn}
            tooltip="Bhagyank (Destiny Number) is the digital root of your full date of birth (DD-MM-YYYY). It reflects the path your life is drawn toward."
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 pt-1">
          {status !== "searching" ? (
            <button
              onClick={startSearch}
              disabled={!inputsValid}
              className="btn-saffron w-full sm:w-auto"
              aria-label="Begin phone number search"
            >
              Search<span aria-hidden="true"> →</span>
            </button>
          ) : (
            <button
              onClick={cancelSearch}
              className="btn-cancel w-full sm:w-auto"
              aria-label="Cancel ongoing search"
            >
              Cancel search
            </button>
          )}
          {inputsValid && bn === dn && (
            <div className="text-xs text-[#6B6B6B] leading-snug">
              BN equals DN — only one anchor pattern will be searched.
            </div>
          )}
        </div>
      </div>

      {status !== "idle" && (
        <div className="bg-[#FDF8F1] border border-[#EADFCB] rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {status === "searching" && (
                <span className="inline-block w-2 h-2 rounded-full bg-[#E97724] animate-pulse shrink-0" />
              )}
              {status === "done" && (
                <span className="inline-block w-2 h-2 rounded-full bg-[#7A8B5C] shrink-0" />
              )}
              {status === "cancelled" && (
                <span className="inline-block w-2 h-2 rounded-full bg-[#C9A961] shrink-0" />
              )}
              {status === "error" && (
                <span className="inline-block w-2 h-2 rounded-full bg-[#8B2C2C] shrink-0" />
              )}
              <span className="text-[#2A2A2A] font-medium flex items-center min-w-0">
                <span className="truncate">{statusLabel}</span>
                {status === "searching" && (
                  <Tooltip label="k">
                    k is the number of digits guaranteed to be Mulank ({bn}) or
                    Bhagyank ({dn}). We start at k ={" "}
                    {numberLength || "the full number length"} (rarest matches)
                    and broaden down to k = {kMin}.
                  </Tooltip>
                )}
              </span>
            </div>
            <div className="text-[#6B6B6B] tabular-nums text-xs whitespace-nowrap pl-4 sm:pl-0 self-end sm:self-auto">
              {progress.seenCount} seen ·{" "}
              <span className="text-[#B05818] font-semibold">{matches.length} matches</span>
            </div>
          </div>
          <div className="h-1.5 bg-[#EADFCB] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {status === "searching" && (
            <p className="text-[11px] text-[#6B6B6B] leading-snug max-w-[60ch]">
              k is how many digits are guaranteed to be your Mulank or Bhagyank.
              We sweep from the largest k (rarest, strongest matches) down to
              the floor so the most resonant numbers surface first.
            </p>
          )}
          {error && (
            <div className="text-sm text-[#8B2C2C] bg-white border border-[#EADFCB] rounded-xl p-3 break-words">
              {error}
            </div>
          )}
        </div>
      )}

      {matches.length > 0 && bn !== null && dn !== null && (() => {
        const topMatches = matches.slice(0, 24);
        const maxPct = Math.max(...topMatches.map((m) => m.bn_dn_pct));
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
            {topMatches.map((m) => (
              <PhoneCard
                key={m.phone_number}
                match={m}
                bn={bn}
                dn={dn}
                isTopTier={m.bn_dn_pct === maxPct}
              />
            ))}
          </div>
        );
      })()}

      {status === "done" && matches.length === 0 && (
        <div className="py-10 sm:py-12 text-[#6B6B6B] text-sm sm:text-base">
          No matches passed both filters.
        </div>
      )}
    </div>
  );
}

function DerivedPill({
  label,
  value,
  tooltip,
  ariaLabel,
}: {
  label: React.ReactNode;
  value: number | null;
  tooltip?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="bg-[#FDF8F1] border border-[#EADFCB] rounded-xl px-3 sm:px-4 py-3 flex items-baseline justify-between gap-2">
      <div className="text-[10px] tracking-[0.14em] uppercase font-medium text-[#6B6B6B] flex items-center min-w-0">
        <span className="truncate">{label}</span>
        {tooltip && (
          <Tooltip label={ariaLabel ?? "info"}>{tooltip}</Tooltip>
        )}
      </div>
      <div className="font-serif text-xl sm:text-2xl text-[#B05818] tabular-nums leading-none shrink-0">
        {value ?? "–"}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { code: string; name: string }[];
}) {
  return (
    <div>
      <label className="eyebrow block mb-1.5" htmlFor={`select-${label}`}>{label}</label>
      <select
        id={`select-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-aol cursor-pointer pr-10"
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.name} ({o.code})
          </option>
        ))}
      </select>
    </div>
  );
}
