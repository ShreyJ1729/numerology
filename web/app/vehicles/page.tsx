import { StudioPage, StudioPageHeader, ComingSoonStub } from "@/components/StudioPage";

export const metadata = {
  title: "Vehicle numbers — Numerology Studio",
  description:
    "Generate license plate candidates that align with your Mulank and Bhagyank, scoped to your region’s plate format.",
};

export default function VehiclesPage() {
  return (
    <StudioPage>
      <StudioPageHeader
        eyebrow="Vehicles"
        title="Vehicle numbers"
        lede={
          <>
            A license plate is a number you live with for years — making it
            resonate with your roots is a small, durable lift.
          </>
        }
      />
      <ComingSoonStub
        description={
          <>
            Given your <em>Mulank</em> and <em>Bhagyank</em>, this tool will
            generate candidate plate numbers that satisfy both numerological
            alignment and the plate-format constraints of your region. Over
            time it will integrate with state and country plate-availability
            databases, so suggestions are live rather than theoretical.
          </>
        }
        bullets={[
          <>Generate plates aligned to your roots</>,
          <>Region-aware plate formats (US, IN, UK, more)</>,
          <>Score an existing plate you already own</>,
          <>Live availability lookup against public databases</>,
        ]}
      />
    </StudioPage>
  );
}
