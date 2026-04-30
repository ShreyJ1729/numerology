import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Case studies — Numerology",
  description: "Worked examples reading names, dates, and compounds end to end.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader eyebrow="Learn" title="Case studies" />
      <ComingSoonStub
        bullets={[
          <>Single names vs. full names</>,
          <>Reading the compound under the root</>,
          <>Pairing partners and businesses</>,
        ]}
      />
    </StudioPage>
  );
}
