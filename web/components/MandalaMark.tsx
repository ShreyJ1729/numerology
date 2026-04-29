const N = 9;

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

export default function MandalaMark() {
  return (
    <svg
      viewBox="-50 -50 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="0" cy="0" r="46" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.9" />
      <circle cx="0" cy="0" r="34" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.55" />

      {Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 22;
        const y = Math.sin(a) * 22;
        const rot = (a * 180) / Math.PI;
        return (
          <ellipse
            key={`petal-${i}`}
            cx={x}
            cy={y}
            rx="9"
            ry="3.4"
            transform={`rotate(${rot} ${x} ${y})`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeOpacity="0.85"
          />
        );
      })}

      <path
        d={nonagramPath(32, 4)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.95"
        strokeLinejoin="round"
      />

      <circle cx="0" cy="0" r="3.2" fill="currentColor" />
    </svg>
  );
}
