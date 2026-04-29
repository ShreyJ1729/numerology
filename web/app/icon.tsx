import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const N = 9;

export default function Icon() {
  const pts = Array.from({ length: N }).map((_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(a) * 26, Math.sin(a) * 26] as const;
  });

  const step = 4;
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
  const starPath = segs.join(" ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64" width="64" height="64">
    <rect x="-32" y="-32" width="64" height="64" rx="12" fill="#FDF8F1"/>
    <circle cx="0" cy="0" r="28" fill="none" stroke="#C9A961" stroke-width="1.4"/>
    <circle cx="0" cy="0" r="20" fill="none" stroke="#E97724" stroke-width="1.2" stroke-opacity="0.8"/>
    <path d="${starPath}" fill="none" stroke="#B05818" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="0" cy="0" r="4" fill="#B05818"/>
  </svg>`;
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FDF8F1",
        }}
      >
        <img src={dataUri} width={64} height={64} />
      </div>
    ),
    { ...size }
  );
}
