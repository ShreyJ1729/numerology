import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Pricing — Numerology",
  description: "Pick prices whose digital roots reinforce your own.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader eyebrow="Calculate" title="Pricing" />
      <ComingSoonStub
        bullets={[
          <>Prices aligned to your Mulank or Bhagyank</>,
          <>Score an existing price</>,
          <>Currency-aware, with major and minor units</>,
        ]}
      />
    </StudioPage>
  );
}
