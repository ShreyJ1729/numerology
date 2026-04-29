import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Mulank & Bhagyank — Numerology Studio",
  description: "Per-digit readings for the day root and the full-date root, and how the pair plays together.",
};

export default function Page() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Learn"
        title="Mulank & Bhagyank"
        lede={
          <>
            Your <em>Mulank</em> is the root of your day of birth; your <em>Bhagyank</em> is the root of
            the whole date — together they describe nature and path.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            This page will give a digit-by-digit reading of all nine roots (1 through 9), what each one
            emphasizes, and how a <em>Mulank</em> and <em>Bhagyank</em> pair reads when the two agree,
            quietly complement each other, or pull in different directions.
          </>
        }
        bullets={[
          <>Per-digit profiles for 1 through 9</>,
          <>How <em>Mulank</em> and <em>Bhagyank</em> interact</>,
          <>Common pair readings, in plain language</>,
        ]}
      />
    </StudioPage>
  );
}
