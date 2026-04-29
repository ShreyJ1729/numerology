import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Negotiation — Numerology Studio",
  description: "Counter-offer values that stay near your target and land on favorable digits.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Commerce"
        title="Negotiation"
        lede={
          <>
            Counter-offers carry numerical weight &mdash; the digit you land on can either match your root or cut against it.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            This tool will suggest counter-offer values during a negotiation that stay close to a target dollar figure but land on digits favorable to your <em>Mulank</em> and <em>Bhagyank</em>. It&rsquo;s built for salary, contract, and procurement conversations &mdash; the moments when the exact number you say out loud matters as much as the ballpark.
          </>
        }
        bullets={[
          <>Counter-offer suggestions near a target</>,
          <>Digit-level reading of an offer on the table</>,
          <>Anchor numbers that round well in your favor</>,
          <>Quick mental math during a live conversation</>,
        ]}
      />
    </StudioPage>
  );
}
