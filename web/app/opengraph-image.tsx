import { ImageResponse } from "next/og";

export const alt = "Art of Numerology — Vedic name and phone numerology";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const N = 9;
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

function nonagramPath(radius: number, step: number): string {
  const pts = Array.from({ length: N }).map((_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(a) * radius, Math.sin(a) * radius] as const;
  });
  const segs: string[] = [];
  const visited = new Set<number>();
  for (let start = 0; start < N; start++) {
    if (visited.has(start)) continue;
    let cur = start;
    const seg = [cur];
    visited.add(cur);
    while (true) {
      const next = (cur + step) % N;
      seg.push(next);
      if (next === start) break;
      visited.add(next);
      cur = next;
    }
    const [first, ...rest] = seg;
    segs.push(
      `M ${pts[first][0].toFixed(2)} ${pts[first][1].toFixed(2)} ` +
        rest
          .map((i) => `L ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`)
          .join(" ")
    );
  }
  return segs.join(" ");
}

function buildMandalaSvg(): string {
  const circles = [78, 140, 220, 320, 420, 472]
    .map(
      (r) =>
        `<circle cx="0" cy="0" r="${r}" fill="none" stroke="#C9A961" stroke-width="1.6" stroke-opacity="0.9"/>`
    )
    .join("");

  const ticks = Array.from({ length: 18 })
    .map((_, i) => {
      const a = (i / 18) * Math.PI * 2;
      return `<line x1="${(Math.cos(a) * 420).toFixed(2)}" y1="${(Math.sin(a) * 420).toFixed(2)}" x2="${(Math.cos(a) * 472).toFixed(2)}" y2="${(Math.sin(a) * 472).toFixed(2)}" stroke="#C9A961" stroke-width="1.4" stroke-opacity="0.9"/>`;
    })
    .join("");

  const spokes = Array.from({ length: N })
    .map((_, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      return `<line x1="0" y1="0" x2="${(Math.cos(a) * 470).toFixed(2)}" y2="${(Math.sin(a) * 470).toFixed(2)}" stroke="#C9A961" stroke-width="0.9" stroke-opacity="0.6"/>`;
    })
    .join("");

  const petals = Array.from({ length: N })
    .map((_, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * 220;
      const y = Math.sin(a) * 220;
      const rot = (a * 180) / Math.PI;
      return `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="86" ry="34" transform="rotate(${rot.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})" fill="none" stroke="#E97724" stroke-width="1.6" stroke-opacity="0.9"/>`;
    })
    .join("");

  const outerDigits = DIGITS.map((d, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * 446;
    const y = Math.sin(a) * 446;
    return `<text x="${x.toFixed(2)}" y="${(y + 12).toFixed(2)}" text-anchor="middle" font-family="Georgia, serif" font-size="38" fill="#B05818" fill-opacity="0.95">${d}</text>`;
  }).join("");

  const innerDigits = DIGITS.map((d, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2 + Math.PI / N;
    const x = Math.cos(a) * 100;
    const y = Math.sin(a) * 100;
    return `<text x="${x.toFixed(2)}" y="${(y + 6).toFixed(2)}" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#B05818" fill-opacity="0.85">${d}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -500 1000 1000" width="1000" height="1000">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#E97724" stop-opacity="0.28"/>
        <stop offset="55%" stop-color="#C9A961" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#FDF8F1" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="0" cy="0" r="500" fill="url(#g)"/>
    ${circles}
    ${ticks}
    ${spokes}
    ${petals}
    <path d="${nonagramPath(320, 4)}" fill="none" stroke="#B05818" stroke-width="1.5" stroke-opacity="0.85" stroke-linejoin="round"/>
    <path d="${nonagramPath(140, 2)}" fill="none" stroke="#B05818" stroke-width="1.3" stroke-opacity="0.75" stroke-linejoin="round"/>
    ${outerDigits}
    ${innerDigits}
    <circle cx="0" cy="0" r="22" fill="none" stroke="#B05818" stroke-width="1.4" stroke-opacity="0.85"/>
    <circle cx="0" cy="0" r="7" fill="#B05818" fill-opacity="0.95"/>
  </svg>`;
}

export default async function Image() {
  const svg = buildMandalaSvg();
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#FDF8F1",
          position: "relative",
        }}
      >
        <img
          src={dataUri}
          width={760}
          height={760}
          style={{
            position: "absolute",
            left: -120,
            top: -65,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginLeft: 660,
            marginRight: 70,
            height: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 78,
              color: "#3E2A18",
              lineHeight: 1.04,
              letterSpacing: -1.5,
            }}
          >
            Art of Numerology
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#6B4A2B",
              marginTop: 26,
              lineHeight: 1.35,
            }}
          >
            Vedic name and phone numerology — find numbers that align with your roots.
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#B05818",
              marginTop: 36,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Mulank · Bhagyank · Name Number
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
