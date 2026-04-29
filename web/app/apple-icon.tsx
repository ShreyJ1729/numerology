import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const N = 9;

export default function AppleIcon() {
  const ptsAt = (radius: number) =>
    Array.from({ length: N }).map((_, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      return [Math.cos(a) * radius, Math.sin(a) * radius] as const;
    });

  const buildStar = (radius: number, step: number) => {
    const pts = ptsAt(radius);
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
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-90 -90 180 180" width="180" height="180">
    <rect x="-90" y="-90" width="180" height="180" rx="36" fill="#FDF8F1"/>
    <circle cx="0" cy="0" r="80" fill="none" stroke="#C9A961" stroke-width="2"/>
    <circle cx="0" cy="0" r="60" fill="none" stroke="#C9A961" stroke-width="1.5" stroke-opacity="0.7"/>
    <circle cx="0" cy="0" r="40" fill="none" stroke="#E97724" stroke-width="1.6" stroke-opacity="0.8"/>
    <path d="${buildStar(72, 4)}" fill="none" stroke="#B05818" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="${buildStar(36, 2)}" fill="none" stroke="#B05818" stroke-width="1.4" stroke-opacity="0.8" stroke-linejoin="round"/>
    <circle cx="0" cy="0" r="8" fill="#B05818"/>
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
        <img src={dataUri} width={180} height={180} />
      </div>
    ),
    { ...size }
  );
}
