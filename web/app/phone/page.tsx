import PhoneSearch from "@/components/PhoneSearch";
import { StudioPage, StudioPageHeader } from "@/components/StudioPage";

export const metadata = {
  title: "Phone — Numerology",
  description: "Search available phone numbers whose digits resonate with your Mulank and Bhagyank.",
};

export default function PhonePage() {
  return (
    <StudioPage>
      <StudioPageHeader eyebrow="Calculate" title="Phone" />
      <div className="bg-white border border-[var(--color-rule)] rounded-2xl p-4 sm:p-6 lg:p-7">
        <PhoneSearch />
      </div>
    </StudioPage>
  );
}
