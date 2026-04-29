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
      className={`card-band bg-white border border-[#EADFCB] rounded-2xl px-4 py-3 is-${band}`}
    >
      <div className="font-tech text-xl tracking-wider truncate">
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
            className="cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded-md text-[#6B6B6B] transition-colors"
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
            <span aria-hidden="true" className="text-sm leading-none">
              {copied ? "✓" : "⧉"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
