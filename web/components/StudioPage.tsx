import type { ReactNode } from "react";

export function StudioPage({ children }: { children: ReactNode }) {
  return <div className="studio-page">{children}</div>;
}

export function StudioPageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
}) {
  return (
    <header className="studio-page-header">
      {eyebrow && <div className="studio-page-eyebrow">{eyebrow}</div>}
      <h1 className="studio-page-title">{title}</h1>
      {lede && <p className="studio-page-lede">{lede}</p>}
    </header>
  );
}

export function ComingSoonStub({
  description,
  bullets,
}: {
  description: ReactNode;
  bullets: ReactNode[];
}) {
  return (
    <div className="stub-card">
      <span className="stub-tag">Coming soon</span>
      <p className="prose" style={{ marginTop: 0 }}>
        {description}
      </p>
      <h3 style={{ marginTop: "1.25rem" }}>What this section will hold</h3>
      <ul>
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
