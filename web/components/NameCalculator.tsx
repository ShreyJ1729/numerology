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
    <div className="space-y-5 sm:space-y-6">
      <div>
        <label className="eyebrow block mb-2" htmlFor="name-input">
          Your Name
        </label>
        <input
          id="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name to compute its number."
          autoComplete="name"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          className="input-aol"
        />
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-[#FDF8F1] border border-[#EADFCB] rounded-xl px-3 sm:px-4 py-3 flex items-baseline justify-between gap-2">
              <div className="eyebrow flex items-center">
                Total
              </div>
              <div className="font-serif text-xl sm:text-2xl text-[#2A2A2A] tabular-nums leading-none">
                {result.total.total}
              </div>
            </div>
            <div className="bg-[#FDF8F1] border border-[#EADFCB] rounded-xl px-3 sm:px-4 py-3 flex items-baseline justify-between gap-2">
              <div className="eyebrow flex items-center">
                Root
              </div>
              <div className="font-serif text-xl sm:text-2xl text-[#B05818] tabular-nums leading-none">
                {result.total.root}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {result.perWord.map((w, i) => {
              return (
                <div
                  key={i}
                  className="bg-[#FDF8F1] border border-[#EADFCB] rounded-2xl p-4 sm:p-5 card-lift"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <div className="font-serif text-lg sm:text-xl text-[#2A2A2A] break-words">
                        {w.word}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2.5 sm:gap-3 whitespace-nowrap shrink-0">
                      <div className="text-xs text-[#6B6B6B] tabular-nums">
                        sum <span className="text-[#2A2A2A] font-medium">{w.total}</span>
                      </div>
                      <div className="font-serif text-2xl sm:text-3xl text-[#B05818] tabular-nums leading-none">
                        {w.root}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {w.pairs.map((p, j) => (
                      <div
                        key={j}
                        className="px-2 sm:px-2.5 py-1 bg-white border border-[#EADFCB] rounded-lg text-[0.8rem] sm:text-sm"
                      >
                        <span className="font-mono text-[#2A2A2A]">{p.letter}</span>
                        <span className="text-[#B5A790] mx-1 sm:mx-1.5">·</span>
                        <span className="text-[#B05818] font-semibold tabular-nums">
                          {p.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
