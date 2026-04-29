import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Days of the week — Numerology Studio",
  description: "How each weekday’s ruling planet and number shape what you should start, sustain, or skip.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Timing"
        title="Days of the week"
        lede={
          <>
            Each weekday is ruled by a planet and carries a numeric vibration — some days are better for starting things, others for sustaining or finishing.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            Enter your <em>Mulank</em> and <em>Bhagyank</em>, and this tool will read any week against them — showing which days suit launches, which suit steady work, and which are best left alone.
          </>
        }
        bullets={[
          <>Planetary rulers and their digits</>,
          <>Best days for starting a new venture</>,
          <>Best days for sustaining ongoing work</>,
          <>Days to avoid for important moves</>,
        ]}
      />
    </StudioPage>
  );
}
