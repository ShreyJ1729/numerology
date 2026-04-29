"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

type Props = {
  label: string;
  children: React.ReactNode;
};

export default function Tooltip({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const tipId = useId();
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Keep the bubble fully on-screen by measuring after open and computing
  // a pixel shift the CSS uses to nudge it (and the arrow stays anchored).
  useLayoutEffect(() => {
    if (!open || !bubbleRef.current) {
      setShift(0);
      return;
    }
    const margin = 8;
    const rect = bubbleRef.current.getBoundingClientRect();
    let next = 0;
    if (rect.left < margin) next = margin - rect.left;
    else if (rect.right > window.innerWidth - margin)
      next = window.innerWidth - margin - rect.right;
    setShift(next);
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`What is ${label}?`}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        className="tip-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && (
        <span
          ref={bubbleRef}
          id={tipId}
          role="tooltip"
          className={`tip-bubble${shift !== 0 ? " is-shifted" : ""}`}
          style={shift !== 0 ? ({ "--tip-shift": `${shift}px` } as React.CSSProperties) : undefined}
        >
          {children}
        </span>
      )}
    </span>
  );
}
