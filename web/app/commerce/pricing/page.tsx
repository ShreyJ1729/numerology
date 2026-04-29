import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Pricing — Numerology Studio",
  description: "Pick prices whose digital roots reinforce your own numbers.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Commerce"
        title="Pricing"
        lede={
          <>
            The digits in a price aren&rsquo;t neutral &mdash; pick prices whose roots reinforce yours and the number does some work for you.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            This tool will help you choose prices &mdash; invoice totals, list prices, retainer figures &mdash; whose digital roots align with your <em>Mulank</em> or <em>Bhagyank</em>. It will also flag prices that sit at numerical odds with the seller, so you can see at a glance where a figure is working with you and where it&rsquo;s working against you.
          </>
        }
        bullets={[
          <>Generate prices aligned to your roots</>,
          <>Score an existing price you&rsquo;re considering</>,
          <>Round vs. specific &mdash; when each helps</>,
          <>Currency-aware, with major and minor units</>,
        ]}
      />
    </StudioPage>
  );
}
