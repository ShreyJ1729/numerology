import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Digits — Numerology",
  description: "What each digit signifies, and how Mulank and Bhagyank interact.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader eyebrow="Learn" title="Digits" />
      <ComingSoonStub
        bullets={[
          <>Profiles for each digit, 1 through 9</>,
          <>How <em>Mulank</em> and <em>Bhagyank</em> interact</>,
          <>Common pair readings</>,
        ]}
      />
    </StudioPage>
  );
}
