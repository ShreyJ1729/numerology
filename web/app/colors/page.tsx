import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Colors — Numerology Studio",
  description:
    "Traditional color associations for each digit, with palettes to lean into, palettes to avoid, and pairings that reconcile a mismatched root and path.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Palette"
        title="Colors"
        lede={
          <>
            Each digit carries a traditional color — red for 1, yellow for 3, blue for 8, and so on — and wearing or surrounding yourself with those colors is meant to amplify the digit&rsquo;s vibration.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            This section will show, for any <em>Mulank</em> and <em>Bhagyank</em>, the canonical color associations drawn from classical numerology. You&rsquo;ll see the colors to lean into, the colors to avoid, and the gentle pairings that reconcile a mismatched root and path.
          </>
        }
        bullets={[
          <>Canonical color for each digit, 1 through 9</>,
          <>Colors to lean into and colors to avoid</>,
          <>Pairings when <em>Mulank</em> and <em>Bhagyank</em> disagree</>,
          <>Hex swatches you can copy into a design tool</>,
        ]}
      />
    </StudioPage>
  );
}
