import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Timing — Numerology",
  description: "Days and dates tuned to your Mulank and Bhagyank.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader eyebrow="Calculate" title="Timing" />
      <ComingSoonStub
        bullets={[
          <>Best weekdays to start, sustain, or finish</>,
          <>Date scoring across an upcoming month</>,
          <>Multi-month outlook for planning</>,
        ]}
      />
    </StudioPage>
  );
}
