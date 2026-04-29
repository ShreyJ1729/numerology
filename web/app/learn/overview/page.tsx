import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Overview — Numerology Studio",
  description: "A plain-language primer on Vedic numerology and what this section will teach.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Learn"
        title="Overview"
        lede={
          <>
            Vedic numerology reads your day, date, and name as digits — this section is the studio&apos;s
            grounded primer for what those digits actually mean.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            Numerology assigns each letter and date a digit, and reducing those digits to a single root
            surfaces an underlying vibration. This section will be the studio&apos;s plain-language
            primer — a working introduction, not a mystical sales pitch.
          </>
        }
        bullets={[
          <>What numerology is — and what it isn&apos;t</>,
          <>The Vedic system vs. Pythagorean and Chaldean</>,
          <>How digits, dates, and names interact</>,
          <>Reading results without overclaiming</>,
        ]}
      />
    </StudioPage>
  );
}
