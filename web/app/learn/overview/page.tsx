import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Overview — Numerology",
  description: "A grounded primer on Vedic numerology.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader eyebrow="Learn" title="Overview" />
      <ComingSoonStub
        bullets={[
          <>What numerology is — and what it isn&apos;t</>,
          <>Vedic vs. Pythagorean and Chaldean</>,
          <>How digits, dates, and names interact</>,
        ]}
      />
    </StudioPage>
  );
}
