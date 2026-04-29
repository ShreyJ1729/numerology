"use client";

import { Match } from "@/lib/numerology";

export default function PhoneCard({
  match,
  bn,
  dn,
}: {
  match: Match;
  bn: number;
  dn: number;
}) {
  const bnDn = new Set([String(bn), String(dn)]);
  const display = match.friendly_name || match.phone_number;
  const locale = [match.locality, match.region].filter(Boolean).join(", ");

  return (
    <div className="bg-white border border-[#EADFCB] rounded-2xl px-4 py-3 card-lift">
      <div className="font-tech text-xl tracking-wider">
        {Array.from(display).map((c, i) => (
          <span
            key={i}
            className={
              bnDn.has(c)
                ? "text-[#B05818]"
                : /\d/.test(c)
                ? "text-[#2A2A2A]"
                : "text-[#C9A961]"
            }
          >
            {c}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs text-[#6B6B6B]">
        <div className="italic font-serif truncate">
          {locale || <span className="opacity-60">—</span>}
        </div>
        <div className="flex items-center gap-2 tabular-nums shrink-0 ml-2">
          <span className="text-[#B05818] font-semibold">
            {Math.round(match.bn_dn_pct * 100)}%
          </span>
          <span className="text-[#C9A961]">·</span>
          <span>
            root <span className="text-[#B05818] font-semibold">{match.digital_root}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
