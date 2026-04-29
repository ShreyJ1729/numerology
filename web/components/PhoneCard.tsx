"use client";

import { useState } from "react";
import { Match } from "@/lib/numerology";

type Band = "premium" | "strong" | "standard";

function classifyBand(match: Match, isTopTier: boolean): Band {
  if (isTopTier) return "premium";
  if (match.bn_dn_pct >= 0.65) return "strong";
  return "standard";
}

export default function PhoneCard({
  match,
  bn,
  dn,
  isTopTier,
}: {
  match: Match;
  bn: number;
  dn: number;
  isTopTier: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const bnDn = new Set([String(bn), String(dn)]);
  const display = match.friendly_name || match.phone_number;
  const band = classifyBand(match, isTopTier);
  const pctRounded = Math.round(match.bn_dn_pct * 100);
  const isPremium = band === "premium";
  const accent = isPremium ? "#2F7A3A" : "#B05818";
  const accentHoverBg = isPremium ? "#E6F2E1" : "#FBF0E0";

  async function copyNumber(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(match.phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={`card-band bg-white border border-[#EADFCB] rounded-2xl px-3 sm:px-4 py-3 is-${band}`}
    >
      <div className="text-[1.05rem] sm:text-xl tracking-wide truncate" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
        {Array.from(display).map((c, i) => (
          <span
            key={i}
            style={bnDn.has(c) ? { color: accent } : undefined}
            className={
              bnDn.has(c)
                ? "font-semibold"
                : /\d/.test(c)
                ? "text-[#2A2A2A]"
                : "text-[#B5A790]"
            }
          >
            {c}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-end mt-1.5 text-xs text-[#6B6B6B] gap-2">
        <div className="flex items-center gap-2 tabular-nums shrink-0">
          <span className="font-semibold" style={{ color: accent }}>{pctRounded}%</span>
          <span className="text-[#B5A790]">·</span>
          <span>
            root <span className="font-semibold" style={{ color: accent }}>{match.digital_root}</span>
          </span>
          <button
            type="button"
            onClick={copyNumber}
            className="cursor-pointer inline-flex items-center justify-center w-9 h-9 sm:w-7 sm:h-7 -mr-1 sm:mr-0 rounded-md text-[#6B6B6B] transition-colors"
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = accent;
              e.currentTarget.style.backgroundColor = accentHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "";
              e.currentTarget.style.backgroundColor = "";
            }}
            aria-label={copied ? "Number copied" : "Copy phone number"}
            title={copied ? "Copied" : "Copy number"}
          >
            <span aria-hidden="true" className="leading-none inline-flex">
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
