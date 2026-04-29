import NameCalculator from "@/components/NameCalculator";
import { StudioPage, StudioPageHeader } from "@/components/StudioPage";

export const metadata = {
  title: "Name number — Numerology Studio",
  description: "Compute the Vedic numerological value of a name, with the per-letter breakdown.",
};

export default function NamePage() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Calculate"
        title="Name number"
        lede={
          <>
            Every letter represents a digit; every name reduces to a single root.
            Type a name to see its breakdown — per word, per letter, with the
            running sum and its single-digit reduction.
          </>
        }
      />
      <div className="bg-white border border-[var(--color-rule)] rounded-2xl p-4 sm:p-6 lg:p-7 max-w-3xl">
        <NameCalculator />
      </div>
    </StudioPage>
  );
}
