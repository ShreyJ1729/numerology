import NameCalculator from "@/components/NameCalculator";
import PhoneSearch from "@/components/PhoneSearch";

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-30 backdrop-blur bg-[#FDF8F1]/80 border-b border-[#EADFCB]">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center">
          <div className="flex items-baseline gap-2">
            <span className="font-serif italic text-lg text-[#6B6B6B] tracking-tight">
              Art of
            </span>
            <span className="text-2xl font-serif tracking-tight text-[#2A2A2A]">
              <span className="text-[#B05818]">Numero</span>logy
            </span>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-8 pt-10 pb-8 fade-up">
        <div className="text-center max-w-6xl mx-auto">
          <div className="eyebrow mb-3">
            <span className="eyebrow-accent">Vedic</span> &nbsp;Numerology &nbsp;Studio
          </div>
          <h1 className="text-4xl md:text-6xl leading-[1.05] text-[#2A2A2A] font-medium">
            Find numbers in <span className="text-[#B05818] italic">harmony</span> with your essence
          </h1>
          <p className="text-[#6B6B6B] mt-4 text-lg leading-relaxed max-w-2xl mx-auto">
            Calculate the vibration of your name and discover phone numbers
            aligned with your Mulank and Bhagyank — guided by the timeless
            wisdom of Vedic numerology.
          </p>
          <div className="mt-5 flex justify-center">
            <div className="divider-gold w-24" />
          </div>
        </div>
      </section>

      <section id="dashboard" className="max-w-7xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div id="name" className="lg:col-span-2 fade-up fade-up-delay-1">
            <PanelHeader
              eyebrow="Step One"
              title="Name Vibration"
              caption="Reveal the resonance carried by your given name."
            />
            <div className="bg-white border border-[#EADFCB] rounded-3xl p-7 shadow-[0_8px_30px_-12px_rgba(139,44,44,0.08)]">
              <NameCalculator />
            </div>
          </div>

          <div id="phone" className="lg:col-span-3 fade-up fade-up-delay-2">
            <PanelHeader
              eyebrow="Step Two"
              title="Auspicious Numbers"
              caption="Search Twilio inventory for numbers matching your Mulank & Bhagyank."
            />
            <div className="bg-white border border-[#EADFCB] rounded-3xl p-7 shadow-[0_8px_30px_-12px_rgba(139,44,44,0.08)]">
              <PhoneSearch />
            </div>
          </div>
        </div>
      </section>

      <footer id="about" className="bg-[#F5EBDC] border-t border-[#EADFCB]">
        <div className="max-w-7xl mx-auto px-8 py-14 text-center">
          <div className="eyebrow mb-3">
            <span className="eyebrow-accent">Crafted</span> &nbsp;with &nbsp;intention
          </div>
          <p className="text-[#6B6B6B] max-w-xl mx-auto leading-relaxed text-sm">
            Built on Vedic letter mappings and Twilio's phone-number catalog.
            Numbers are tools — wisdom is yours.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="divider-gold w-16" />
          </div>
        </div>
      </footer>
    </main>
  );
}

function PanelHeader({
  eyebrow,
  title,
  caption,
}: {
  eyebrow: string;
  title: string;
  caption: string;
}) {
  return (
    <div className="mb-5 px-1">
      <div className="eyebrow mb-2">
        <span className="eyebrow-accent">{eyebrow.split(" ")[0]}</span>{" "}
        {eyebrow.split(" ").slice(1).join(" ")}
      </div>
      <h2 className="text-3xl text-[#2A2A2A] font-medium">{title}</h2>
      <p className="text-[#6B6B6B] mt-1.5 text-sm">{caption}</p>
    </div>
  );
}
