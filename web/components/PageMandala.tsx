const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const N = DIGITS.length;

function nonagramPath(radius: number, step: number): string {
  const pts = Array.from({ length: N }).map((_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(a) * radius, Math.sin(a) * radius] as const;
  });
  const path: string[] = [];
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
    path.push(
      `M ${pts[first][0].toFixed(2)} ${pts[first][1].toFixed(2)} ` +
        rest
          .map((i) => `L ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`)
          .join(" ")
    );
  }
  return path.join(" ");
}

export default function PageMandala() {
  return (
    <svg
      viewBox="-500 -500 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="pageMandalaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E97724" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#C9A961" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#FDF8F1" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="0" cy="0" r="500" fill="url(#pageMandalaGlow)" />

      {[78, 140, 220, 320, 420, 472].map((r) => (
        <circle
          key={r}
          cx="0"
          cy="0"
          r={r}
          fill="none"
          stroke="#C9A961"
          strokeWidth="1.4"
          strokeOpacity="0.85"
        />
      ))}

      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const x = Math.cos(a) * 472;
        const y = Math.sin(a) * 472;
        return (
          <line
            key={`tick-${i}`}
            x1={Math.cos(a) * 420}
            y1={Math.sin(a) * 420}
            x2={x}
            y2={y}
            stroke="#C9A961"
            strokeWidth="1.2"
            strokeOpacity="0.85"
          />
        );
      })}

      {Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 470;
        const y = Math.sin(a) * 470;
        return (
          <line
            key={`spoke-${i}`}
            x1="0"
            y1="0"
            x2={x}
            y2={y}
            stroke="#C9A961"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />
        );
      })}

      {Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 220;
        const y = Math.sin(a) * 220;
        const rot = (a * 180) / Math.PI;
        return (
          <ellipse
            key={`petal-${i}`}
            cx={x}
            cy={y}
            rx="86"
            ry="34"
            transform={`rotate(${rot} ${x} ${y})`}
            fill="none"
            stroke="#E97724"
            strokeWidth="1.4"
            strokeOpacity="0.85"
          />
        );
      })}

      <path
        d={nonagramPath(320, 4)}
        fill="none"
        stroke="#B05818"
        strokeWidth="1.3"
        strokeOpacity="0.8"
        strokeLinejoin="round"
      />

      <path
        d={nonagramPath(140, 2)}
        fill="none"
        stroke="#B05818"
        strokeWidth="1.1"
        strokeOpacity="0.7"
        strokeLinejoin="round"
      />

      {DIGITS.map((d, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 446;
        const y = Math.sin(a) * 446;
        return (
          <text
            key={`outer-${d}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: "var(--font-serif-display), serif" }}
            fontSize="34"
            fill="#B05818"
            fillOpacity="0.9"
          >
            {d}
          </text>
        );
      })}

      {DIGITS.map((d, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2 + Math.PI / N;
        const x = Math.cos(a) * 100;
        const y = Math.sin(a) * 100;
        return (
          <text
            key={`inner-${d}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: "var(--font-serif-display), serif" }}
            fontSize="16"
            fill="#B05818"
            fillOpacity="0.8"
          >
            {d}
          </text>
        );
      })}

      <circle
        cx="0"
        cy="0"
        r="22"
        fill="none"
        stroke="#B05818"
        strokeWidth="1.2"
        strokeOpacity="0.8"
      />
      <circle cx="0" cy="0" r="7" fill="#B05818" fillOpacity="0.9" />
    </svg>
  );
}
