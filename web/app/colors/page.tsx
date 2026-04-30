import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Colors — Numerology",
  description: "Color palette paired with each digit.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader eyebrow="Calculate" title="Colors" />
      <ComingSoonStub
        bullets={[
          <>Color for each digit, 1 through 9</>,
          <>Colors to lean into and to avoid</>,
          <>Pairings when <em>Mulank</em> and <em>Bhagyank</em> disagree</>,
          <>Hex swatches</>,
        ]}
      />
    </StudioPage>
  );
}
