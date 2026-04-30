"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav";
import MandalaMark from "./MandalaMark";

type Props = {
  mobile?: boolean;
  open?: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({ mobile = false, open = false, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className="studio-sidebar"
      data-mobile={mobile ? "true" : "false"}
      data-open={open ? "true" : "false"}
      aria-label="Primary"
    >
      <Link
        href="/"
        className="studio-brand"
        onClick={onNavigate}
        aria-label="Numerology home"
      >
        <span className="studio-brand-mark" aria-hidden="true">
          <MandalaMark />
        </span>
        <span>Numerology</span>
      </Link>

      <nav className="studio-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="studio-nav-section">{group.label}</div>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="studio-nav-item"
                  data-active={active ? "true" : "false"}
                  onClick={onNavigate}
                >
                  <span>{item.label}</span>
                  {item.soon && <span className="studio-nav-soon">Soon</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
