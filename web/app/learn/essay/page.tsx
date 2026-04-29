import Link from "next/link";
import { StudioPage } from "@/components/StudioPage";
import NameCalculator from "@/components/NameCalculator";

export const metadata = {
  title: "A name reduced to a single digit — Numerology Studio",
  description:
    "An essay on ankaśāstram: how a name and a date become numbers, and what the tradition reads in the result.",
};

export default function Page() {
  return (
    <StudioPage>
      <article className="essay">
        <header>
          <div className="essay-eyebrow">Studio · An essay</div>
          <h1 className="essay-title">A name reduced to a single digit</h1>
          <div className="essay-date">29 April 2026 · 8 minute read</div>
          <p className="essay-lede">
            <em>ankaśāstram</em>, the Vedic science of numbers, asks one
            operation of a name: spell it, add it, reduce it. Everything the
            tradition reads into a person branches off this single move.
          </p>
          <a href="#figure-1" className="essay-skip">
            Skip to the calculator ↓
          </a>
        </header>

        <div className="essay-body">
          <p className="essay-dropcap">
            For a tradition that asks the world to be read as numbers,{" "}
            <em>ankaśāstram</em> makes a small request. Pick a name. Spell it
            out. Add the digits. Reduce. The number you arrive at — between
            one and nine — is the one the tradition wants to talk about.
          </p>

          <aside className="essay-margin">
            <span className="essay-margin-num">Etymology</span>
            <em>aṅka</em> (अङ्क), &ldquo;number, mark.&rdquo;{" "}
            <em>śāstra</em> (शास्त्र), &ldquo;treatise, science.&rdquo;{" "}
            Together: the science of marks.
          </aside>

          <p>
            That is the whole engine. Everything else — the planets, the
            colors, the day of the week to begin a venture — branches off
            the same operation, applied to a different input. Apply it to
            your full date of birth and you get your <em>bhāgyāṅka</em>,
            the fortune number. Apply it to the day alone and you get your{" "}
            <em>mūlāṅka</em>, the root.
          </p>

          <section className="essay-section" id="section-1">
            <span className="essay-section-mark">
              <span className="essay-pilcrow">§1</span>
              The operation, in one figure
            </span>
            <h2 className="essay-section-title">
              What it looks like in motion
            </h2>

            <p>
              Below is the operation itself — typed in, reduced, shown letter
              by letter. The page is happiest when it has an argument to
              compute, so try a name you actually know.
            </p>

            <figure className="essay-figure" id="figure-1">
              <div className="essay-figure-frame">
                <NameCalculator />
              </div>
              <figcaption className="essay-figure-caption">
                <span className="essay-figure-caption-num">Figure 1.</span>
                Each letter takes a digit from the Chaldean mapping
                (<span className="font-mono">a</span>→1,{" "}
                <span className="font-mono">b</span>→2, …); the digits are
                summed, then summed again until one remains. The number on
                the right — the <em>root</em> — is the part the tradition
                reads from. The per-word breakdown is shown so the reduction
                is auditable, not a black box.
              </figcaption>
            </figure>

            <aside className="essay-margin">
              <span className="essay-margin-num">On the mapping</span>
              The Chaldean and Pythagorean systems differ in two columns.
              The studio defaults to Chaldean for names because it is older
              and the one Vedic readers cite; Pythagorean is offered as a
              toggle for readers from that tradition.
            </aside>
          </section>

          <section className="essay-section" id="section-2">
            <span className="essay-section-mark">
              <span className="essay-pilcrow">§2</span>
              Why the root, and not the sum
            </span>
            <h2 className="essay-section-title">Compounds and roots</h2>

            <p>
              The traditional answer is that single digits are the only
              numbers that are <em>fully themselves</em> — anything larger
              is, in the etymological sense, a <em>compound</em>, a thing
              made of smaller things. The reduction is not a discarding of
              information; it is a claim that the information at the root is
              the part that determines character.
            </p>

            <aside className="essay-margin">
              <span className="essay-margin-num">A parallel</span>
              Compare Pythagoras: <em>all is number, but number means whole
              number, and whole number means small.</em> The Vedic and
              Pythagorean traditions disagree on the mapping. They agree on
              the smallness.
            </aside>

            <p>
              A reader who finds this unconvincing is in good company. The
              studio&apos;s own position is that the reduction is a{" "}
              <em>lens</em>, not a proof — useful for the same reason a
              horoscope or a Myers-Briggs result is useful, which is that
              it offers a vocabulary for talking about yourself.
            </p>
          </section>

          <section className="essay-section" id="section-3">
            <span className="essay-section-mark">
              <span className="essay-pilcrow">§3</span>
              The two roots
            </span>
            <h2 className="essay-section-title">Mūlāṅka and bhāgyāṅka</h2>

            <aside className="essay-margin">
              <span className="essay-margin-num">Etymology</span>
              <em>mūla</em> (मूल), &ldquo;root, origin.&rdquo;{" "}
              <em>bhāgya</em> (भाग्य), &ldquo;fortune, share, allotted
              portion.&rdquo;
            </aside>

            <p>
              The two numbers most often quoted in a reading come from the
              same operation applied to different cuts of a birth date.
            </p>

            <ul>
              <li>
                <strong>
                  <em>Mūlāṅka</em>
                </strong>{" "}
                — from the day of birth alone. A person born on the 19th
                has a mūlāṅka of 1+9 = 10 → 1.
              </li>
              <li>
                <strong>
                  <em>Bhāgyāṅka</em>
                </strong>{" "}
                — from the full date. The same person, born on 19 March
                1992, has a bhāgyāṅka of 1+9+0+3+1+9+9+2 = 34 → 7.
              </li>
            </ul>

            <p>
              The first is read as the nature you were born with; the
              second, as the shape of the path. Where they agree, the
              tradition reads <em>coherence</em>. Where they disagree, it
              reads <em>tension</em> — neither good nor bad, but a thing the
              reader is doing.
            </p>
          </section>

          <section className="essay-section" id="section-4">
            <span className="essay-section-mark">
              <span className="essay-pilcrow">§4</span>
              What the studio computes, and what it does not
            </span>
            <h2 className="essay-section-title">On the limits of the lens</h2>

            <p>
              This studio reduces names and dates. It scores phone numbers
              against a target root. It pairs digits with the colors and
              weekdays the tradition associates with them. It does not{" "}
              <em>predict</em> — and the prose around each tool will say so
              when the temptation arises.
            </p>

            <aside className="essay-margin">
              <span className="essay-margin-num">A test</span>
              If a tool here ever tells you what <em>will</em> happen, it
              has bugs. The studio reports what the tradition <em>says
              about</em> a number. The interpretation is yours.
            </aside>
          </section>

          <section className="essay-section" id="section-5">
            <span className="essay-section-mark">
              <span className="essay-pilcrow">§5</span>
              Where to go from here
            </span>
            <h2 className="essay-section-title">From this essay to the rest</h2>

            <p>
              Two essays follow this one:{" "}
              <Link href="/learn/numbers">Mulank &amp; Bhagyank</Link>{" "}
              (the digits, one through nine, what each carries) and{" "}
              <Link href="/learn/compound-names">Compound names</Link>{" "}
              (what to do when &ldquo;Shrey&rdquo; reduces differently from
              &ldquo;Shrey Joshi&rdquo;). Read them in any order; the
              operation in §1 is the only thing they share.
            </p>

            <p>
              The tools live one click away. The{" "}
              <Link href="/name">name reducer</Link> is Figure 1 with its
              frame removed. The{" "}
              <Link href="/phone">phone search</Link> applies the same
              operation, in reverse, to ten-digit candidates.
            </p>
          </section>

          <span className="essay-end-mark">·   ·   ·</span>

          <footer className="essay-signature">
            <span className="essay-signature-name">Shrey Joshi</span>
            <span className="essay-signature-revised">
              Last revised 29 April 2026
            </span>
          </footer>
        </div>
      </article>
    </StudioPage>
  );
}
