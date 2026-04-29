import Link from "next/link";
import { StudioPage, StudioPageHeader } from "@/components/StudioPage";
import { NAV_GROUPS } from "@/lib/nav";

export default function Home() {
  const live = NAV_GROUPS.find((g) => g.label === "Calculate")!.items;
  const upcoming = NAV_GROUPS.filter((g) => g.label !== "Calculate")
    .flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })))
    .filter((i) => i.soon);

  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Studio"
        title="Numerology, computed and explained."
        lede={
          <>
            A studio for Vedic numerology.
          </>
        }
      />

      <figure className="term-quote">
        <div>
          <span className="term-quote-word">ankaśāstram</span>
          <span className="term-quote-pron">/ ang-kuh-SHAAS-truhm /</span>
        </div>
        <span className="term-quote-devanagari" lang="sa">अङ्कशास्त्रम्</span>
        <p className="term-quote-def">
          <em>noun.</em> The science of numbers; the Vedic discipline of reading
          a life through the single-digit roots of its names and dates.
        </p>
      </figure>

      <section className="prose">
        <p>
          Every name carries a number; every birthday reduces to one. Your{" "}
          <em>Mulank</em> is the root of your day of birth — a single digit
          between one and nine. Your <em>Bhagyank</em> is the root of the whole
          date. Together they describe the shape of a life: the nature you
          were born with and the path it tends to follow.
        </p>
      </section>

      <hr className="studio-divider" />

      <section>
        <h2 className="font-serif text-xl text-[#2A2A2A] mb-3">Sanskrit roots</h2>
        <p className="prose-narrow text-[#6B6B6B] text-[0.95rem] mb-4">
          The vocabulary, read literally. <em>aṅka</em> (अङ्क) means
          &ldquo;number&rdquo;; the rest is what the number is <em>of</em>.
        </p>
        <dl className="term-list">
          <div className="term-row">
            <dt><em>ankaśāstra</em> </dt>
            <dd>
              <em>aṅka</em> (अङ्क, number) + <em>śāstra</em> (शास्त्र,
              treatise, science) — the science of numbers.
            </dd>
          </div>
          <div className="term-row">
            <dt><em>mūlāṅka</em> </dt>
            <dd>
              <em>mūla</em> (मूल, root) + <em>aṅka</em> (अङ्क) — the root
              number, taken from the day of birth.
            </dd>
          </div>
          <div className="term-row">
            <dt><em>bhāgyāṅka</em> </dt>
            <dd>
              <em>bhāgya</em> (भाग्य, fortune, share, destiny) + <em>aṅka</em>{" "}
              (अङ्क) — the fortune number, taken from the full date.
            </dd>
          </div>
        </dl>
      </section>

      <hr className="studio-divider" />

      <section>
        <h2 className="font-serif text-xl text-[#2A2A2A] mb-3">Open a tool</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl">
          {live.map((item) => (
            <Link key={item.href} href={item.href} className="studio-tile">
              <span className="studio-tile-eyebrow">Calculate</span>
              <span className="studio-tile-title">{item.label}</span>
              <span className="studio-tile-desc">
                {item.href === "/name"
                  ? "Reduce any name to its single-digit root, with the per-letter breakdown."
                  : "Find available phone numbers whose digits align with your Mulank and Bhagyank."}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <hr className="studio-divider" />

      <section>
        <h2 className="font-serif text-xl text-[#2A2A2A] mb-3">What&apos;s coming</h2>
        <p className="prose-narrow text-[#6B6B6B] text-[0.95rem] mb-4">
          Each of these will become its own tool or essay. Click through for a
          short description of the plan.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {upcoming.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="studio-tile"
              data-soon="true"
            >
              <span className="studio-tile-soon">Soon</span>
              <span className="studio-tile-eyebrow">{item.group}</span>
              <span className="studio-tile-title">{item.label}</span>
              <span className="studio-tile-desc">{descriptionFor(item.href)}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-16 pt-6 border-t border-[var(--color-rule)] text-sm text-[#6B6B6B]">
        Built with love by{" "}
        <a
          href="https://shreyjoshi.com"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[#B05818] hover:text-[#8B2C2C] underline underline-offset-4"
        >
          Shrey Joshi
        </a>
        .
      </footer>
    </StudioPage>
  );
}

function descriptionFor(href: string): string {
  switch (href) {
    case "/learn/overview":
      return "A short, grounded primer on what Vedic numerology is — and isn't.";
    case "/learn/numbers":
      return "What each Mulank and Bhagyank digit signifies, and how they interact.";
    case "/learn/compound-names":
      return "Reading the compound number that emerges from your full name.";
    case "/timing/days":
      return "Which day of the week to start, sustain, or finish a task.";
    case "/timing/dates":
      return "Dates of the month tuned to your Mulank and Bhagyank.";
    case "/colors":
      return "The color palette traditionally paired with each number.";
    case "/commerce/pricing":
      return "Setting prices whose digits reinforce your roots.";
    case "/commerce/negotiation":
      return "Counter-offers and round numbers that hold their own meaning.";
    case "/vehicles":
      return "Generate vehicle plate numbers aligned to your roots.";
    default:
      return "";
  }
}
