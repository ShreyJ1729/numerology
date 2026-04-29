import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Dates of the month — Numerology Studio",
  description: "Which dates of an upcoming month resonate with your roots, and which sit at odds.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Timing"
        title="Dates of the month"
        lede={
          <>
            Within any month, certain dates resonate with your roots and others sit at odds.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            This tool will rank the 1–31 dates of an upcoming month against your <em>Mulank</em> and <em>Bhagyank</em> — surfacing strong dates for major commitments and flagging the ones better left for routine work.
          </>
        }
        bullets={[
          <>Date scoring against Mulank and Bhagyank</>,
          <>Strong, neutral, and weak dates per month</>,
          <>Multi-month outlook for planning</>,
          <>Print-ready calendar export</>,
        ]}
      />
    </StudioPage>
  );
}
