"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function StudioShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="studio-shell">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div
        className="studio-sidebar-backdrop lg:hidden"
        data-open={open ? "true" : "false"}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="lg:hidden">
        <Sidebar mobile open={open} onNavigate={() => setOpen(false)} />
      </div>

      <div className="studio-content">
        <header className="studio-topbar">
          <button
            type="button"
            className="studio-menu-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="font-serif text-[1.05rem] leading-none tracking-tight text-[#2A2A2A] whitespace-nowrap lg:hidden">
            Numerology
          </span>
          <div className="ml-auto" />
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
