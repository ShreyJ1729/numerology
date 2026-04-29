import NameCalculator from "@/components/NameCalculator";
import PhoneSearch from "@/components/PhoneSearch";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-[#FDF8F1] focus:border focus:border-[#EADFCB] focus:rounded-md focus:px-3 focus:py-2 focus:text-[#2A2A2A]"
      >
        Skip to tools
      </a>

      <nav className="sticky top-0 z-30 backdrop-blur bg-[#FDF8F1]/85 border-b border-[#EADFCB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 flex items-center">
          <span className="text-lg sm:text-xl lg:text-2xl font-serif text-[#2A2A2A] tracking-tight">
            Art of <span className="text-[#B05818]">Numerology</span>
          </span>
        </div>
      </nav>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-4 sm:pb-6 overflow-hidden">
        <div className="hero-mandala" aria-hidden="true">
          <HeroMandala />
        </div>
        <div className="relative max-w-3xl">
          <h1 className="text-[clamp(1.75rem,6vw,3rem)] md:text-5xl text-[#2A2A2A] font-normal leading-tight text-balance">
            Numerology for names and phone numbers.
          </h1>
          <p className="text-[#6B6B6B] mt-4 sm:mt-5 text-base sm:text-lg max-w-[68ch]">
            Compute your Mulank and Bhagyank, then find phone numbers that align.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10">
        <p className="text-[#2A2A2A] max-w-[68ch] text-[0.95rem] sm:text-base">
          In Vedic numerology, every name and date carries a numeric vibration.
          Your <em>Mulank</em> is the digital root of your day of birth (1–9),
          reflecting your core nature. Your <em>Bhagyank</em> reduces your full
          date of birth to a single digit, marking the path your life is drawn
          toward. The tools below compute your <em>name number</em> and find
          phone numbers whose digits resonate with these two roots.
        </p>
      </section>

      <section id="dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          <div id="name" className="lg:col-span-2">
            <PanelHeader
              index="1."
              title="Name number"
              caption="The single-digit value of your name."
            />
            <div className="bg-white border border-[#EADFCB] rounded-2xl p-4 sm:p-6 lg:p-7">
              <NameCalculator />
            </div>
          </div>

          <div id="phone" className="lg:col-span-3">
            <PanelHeader
              index="2."
              title="Phone numbers"
              caption="Available numbers that match your Mulank and Bhagyank."
            />
            <div className="bg-white border border-[#EADFCB] rounded-2xl p-4 sm:p-6 lg:p-7">
              <PhoneSearch />
            </div>
          </div>
        </div>
      </section>

      <footer id="about" className="bg-[#F5EBDC] border-t border-[#EADFCB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <p className="text-[#6B6B6B] text-sm">
            By{" "}
            <a
              href="https://shreyjoshi.com"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[#B05818] hover:text-[#8B2C2C] underline underline-offset-4"
            >
              Shrey Joshi
            </a>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}

function PanelHeader({
  index,
  title,
  caption,
}: {
  index: string;
  title: string;
  caption: string;
}) {
  return (
    <div className="mb-4 sm:mb-5 px-1">
      <div className="flex items-baseline gap-2">
        <span className="text-[#B05818] font-serif text-lg sm:text-xl tabular-nums">
          {index}
        </span>
        <h2 className="text-2xl sm:text-3xl text-[#2A2A2A] font-normal">{title}</h2>
      </div>
      <p className="text-[#6B6B6B] mt-1.5 text-sm max-w-[68ch]">{caption}</p>
    </div>
  );
}

function HeroMandala() {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const radius = 240;
  return (
    <svg viewBox="-300 -300 600 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mandalaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E97724" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#C9A961" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FDF8F1" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="0" cy="0" r="280" fill="url(#mandalaGlow)" />

      {[60, 110, 170, 230].map((r) => (
        <circle
          key={r}
          cx="0"
          cy="0"
          r={r}
          fill="none"
          stroke="#C9A961"
          strokeWidth="0.6"
        />
      ))}

      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x = Math.cos(a) * 250;
        const y = Math.sin(a) * 250;
        return (
          <line
            key={`spoke-${i}`}
            x1="0"
            y1="0"
            x2={x}
            y2={y}
            stroke="#C9A961"
            strokeWidth="0.4"
            strokeOpacity="0.5"
          />
        );
      })}

      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x = Math.cos(a) * 130;
        const y = Math.sin(a) * 130;
        return (
          <ellipse
            key={`petal-${i}`}
            cx={x}
            cy={y}
            rx="50"
            ry="22"
            transform={`rotate(${(i / 8) * 360} ${x} ${y})`}
            fill="none"
            stroke="#E97724"
            strokeWidth="0.7"
            strokeOpacity="0.55"
          />
        );
      })}

      {digits.map((d, i) => {
        const a = (i / digits.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        return (
          <text
            key={d}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: "var(--font-serif-display), serif" }}
            fontSize="22"
            fill="#B05818"
            fillOpacity="0.7"
          >
            {d}
          </text>
        );
      })}

      <circle cx="0" cy="0" r="6" fill="#B05818" fillOpacity="0.6" />
    </svg>
  );
}
