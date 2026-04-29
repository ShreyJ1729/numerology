"use client";

import { useMemo, useState } from "react";
import { nameNumber } from "@/lib/numerology";
import Tooltip from "./Tooltip";

function masterAt(total: number): number | null {
  let n = total;
  while (n > 9) {
    if (n === 11 || n === 22 || n === 33) return n;
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return null;
}

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

  const totalMaster = result ? masterAt(result.total.total) : null;

  return (
    <div className="space-y-6">
      <div>
        <label className="eyebrow block mb-2" htmlFor="name-input">
          Your Name
        </label>
        <input
          id="name-input"
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
              <div className="eyebrow flex items-center">
                Total
              </div>
              <div className="font-serif text-2xl text-[#2A2A2A] tabular-nums leading-none">
                {result.total.total}
              </div>
            </div>
            <div className="bg-[#FDF8F1] border border-[#EADFCB] rounded-xl px-4 py-3 flex items-baseline justify-between">
              <div className="eyebrow flex items-center">
                Root
              </div>
              <div className="font-serif text-2xl text-[#B05818] tabular-nums leading-none">
                {result.total.root}
              </div>
            </div>
          </div>

          {totalMaster && (
            <div className="flex items-center justify-between bg-[#FBF0E0] border border-[#EADFCB] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="master-badge">Master {totalMaster}</span>
                <span className="text-xs text-[#6B6B6B]">
                  Reduces to {result.total.root}, but carries {totalMaster}’s heightened vibration.
                </span>
              </div>
              <Tooltip label="Master Numbers">
                In numerology, 11, 22, and 33 are master numbers — kept unreduced
                because they are believed to amplify the qualities of their reduced root.
              </Tooltip>
            </div>
          )}

          <div className="space-y-3">
            {result.perWord.map((w, i) => {
              const wordMaster = masterAt(w.total);
              return (
                <div
                  key={i}
                  className="bg-[#FDF8F1] border border-[#EADFCB] rounded-2xl p-5 card-lift"
                >
                  <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-serif text-xl text-[#2A2A2A]">
                        {w.word}
                      </div>
                      {wordMaster && (
                        <span className="master-badge">Master {wordMaster}</span>
                      )}
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
                        <span className="text-[#B5A790] mx-1.5">·</span>
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
      ) : (
        <div className="py-10 text-[#6B6B6B] text-sm">
          Enter a name to compute its number.
        </div>
      )}
    </div>
  );
}
