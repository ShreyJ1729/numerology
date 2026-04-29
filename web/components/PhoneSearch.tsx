"use client";

import { useMemo, useRef, useState } from "react";
import {
  COUNTRY_OPTIONS,
  bhagyankFromDob,
  generateAnchors,
  mulankFromDob,
  scoreNumber,
  sortMatches,
  stripCountryCode,
  type Match,
  type TwilioNumber,
} from "@/lib/numerology";
import PhoneCard from "./PhoneCard";
import Tooltip from "./Tooltip";

type Status = "idle" | "searching" | "done" | "error" | "cancelled";

const ANCHOR_LENGTHS = [5, 4, 3, 2];
const PAGE_SIZE = 50;

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
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [seenCount, setSeenCount] = useState(0);
  const [currentAnchor, setCurrentAnchor] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const inputsValid = bn !== null && dn !== null;

  async function startSearch() {
    if (bn === null || dn === null) return;

    setStatus("searching");
    setError(null);
    setMatches([]);
    setSeenCount(0);
    setCurrentAnchor("");

    const controller = new AbortController();
    abortRef.current = controller;

    const allAnchors = ANCHOR_LENGTHS.flatMap((L) => generateAnchors(bn, dn, L));
    setProgress({ current: 0, total: allAnchors.length });

    const seen = new Map<string, TwilioNumber>();
    const found: Match[] = [];

    try {
      for (let i = 0; i < allAnchors.length; i++) {
        if (controller.signal.aborted) {
          setStatus("cancelled");
          return;
        }

        setCurrentAnchor(allAnchors[i]);

        const params = new URLSearchParams({
          country,
          contains: allAnchors[i],
          pageSize: String(PAGE_SIZE),
        });

        const resp = await fetch(`/api/twilio?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${resp.status}`);
        }
        const data = await resp.json();
        const results: TwilioNumber[] = data.available_phone_numbers || [];

        for (const r of results) {
          if (!r.phone_number || seen.has(r.phone_number)) continue;
          seen.set(r.phone_number, r);

          const domestic = stripCountryCode(r.phone_number, country);
          if (!/^\d+$/.test(domestic)) continue;
          const s = scoreNumber(domestic, bn, dn);
          if (s.bn_dn_pct < 0.5) continue;
          if (s.digital_root !== bn && s.digital_root !== dn) continue;

          found.push({ ...r, domestic, ...s });
        }

        setMatches(sortMatches(found));
        setSeenCount(seen.size);
        setProgress({ current: i + 1, total: allAnchors.length });
      }
      setStatus("done");
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        setStatus("cancelled");
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
    }
  }

  function cancelSearch() {
    abortRef.current?.abort();
  }

  const pct = progress.total ? (progress.current / progress.total) * 100 : 0;

  const barColor =
    status === "error"
      ? "bg-[#8B2C2C]"
      : status === "cancelled"
      ? "bg-[#C9A961]"
      : status === "done"
      ? "bg-[#7A8B5C]"
      : "bg-gradient-to-r from-[#E97724] to-[#C9A961]";

  const statusLabel: React.ReactNode =
    status === "searching"
      ? currentAnchor
        ? (
          <>
            Trying numbers containing{" "}
            <code style={{ fontFamily: "var(--font-mono)" }} className="tabular-nums">{currentAnchor}</code>
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
                  <Tooltip label="Anchor">
                    An anchor is a short digit pattern built from your Mulank ({bn}) and
                    Bhagyank ({dn}). Available numbers containing it are then fetched.
                  </Tooltip>
                )}
              </span>
            </div>
            <div className="text-[#6B6B6B] tabular-nums text-xs whitespace-nowrap pl-4 sm:pl-0 self-end sm:self-auto">
              {seenCount} seen ·{" "}
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
              Anchors are digit patterns of length 5 to 2 made from your Mulank and
              Bhagyank. We sweep from longest to shortest so the rarest, strongest
              matches surface first.
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
