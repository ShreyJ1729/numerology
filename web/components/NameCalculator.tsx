"use client";

import { useMemo, useState } from "react";
import { nameNumber } from "@/lib/numerology";

export default function NameCalculator() {
  const [name, setName] = useState("");

  const result = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const words = trimmed.split(/\s+/);
    const full = words.join(" ");
    return {
      full,
      total: nameNumber(full),
      perWord: words.map((w) => ({ word: w, ...nameNumber(w) })),
    };
  }, [name]);

  return (
    <div className="space-y-6">
      <div>
        <label className="eyebrow block mb-2">Your Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Shrey Joshi"
          autoFocus
          className="input-aol text-lg"
        />
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FDF8F1] border border-[#EADFCB] rounded-xl px-4 py-3 flex items-baseline justify-between">
              <div className="eyebrow">Total</div>
              <div className="font-serif text-2xl text-[#2A2A2A] tabular-nums leading-none">
                {result.total.total}
              </div>
            </div>
            <div className="bg-[#FBF0E0] border border-[#F0D9B8] rounded-xl px-4 py-3 flex items-baseline justify-between shadow-[0_4px_14px_-10px_rgba(233,119,36,0.25)]">
              <div className="text-[10px] tracking-[0.18em] uppercase font-semibold text-[#B05818]/80">
                Root
              </div>
              <div className="font-serif text-2xl text-[#B05818] tabular-nums leading-none">
                {result.total.root}
              </div>
            </div>
          </div>

          <div className="divider-gold" />

          <div className="space-y-3">
            {result.perWord.map((w, i) => (
              <div
                key={i}
                className="bg-[#FDF8F1] border border-[#EADFCB] rounded-2xl p-5 card-lift"
              >
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div className="font-serif text-xl text-[#2A2A2A]">
                    {w.word}
                  </div>
                  <div className="flex items-baseline gap-3 whitespace-nowrap">
                    <div className="text-xs text-[#6B6B6B] tabular-nums">
                      sum <span className="text-[#2A2A2A] font-medium">{w.total}</span>
                    </div>
                    <div className="font-serif text-3xl text-[#B05818] tabular-nums leading-none">
                      {w.root}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {w.pairs.map((p, j) => (
                    <div
                      key={j}
                      className="px-2.5 py-1 bg-white border border-[#EADFCB] rounded-lg text-sm"
                    >
                      <span className="font-mono text-[#2A2A2A]">{p.letter}</span>
                      <span className="text-[#C9A961] mx-1.5">·</span>
                      <span className="text-[#B05818] font-semibold tabular-nums">
                        {p.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-[#6B6B6B] text-sm italic font-serif">
          Enter a name to reveal its numerical essence
        </div>
      )}
    </div>
  );
}
