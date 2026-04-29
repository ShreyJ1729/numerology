import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Compound names — Numerology Studio",
  description: "Reading the two- or three-digit compound that sits beneath a name's single-digit root.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Learn"
        title="Compound names"
        lede={
          <>
            Beneath your single-digit name root sits a two- or three-digit compound — and it has its
            own meaning.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            Names rarely sum to a single digit on the first pass; the intermediate compound (say, 27 or
            43) carries its own classical reading. This page will explain how to read both the root and
            the compound for any name the studio computes.
          </>
        }
        bullets={[
          <>Why the pre-reduction sum matters</>,
          <>Classical readings for compound numbers</>,
          <>When the compound contradicts the root</>,
          <>Pairing with a partner&apos;s or business&apos;s name</>,
        ]}
      />
    </StudioPage>
  );
}
