import { Mail, MapPin, Phone } from "lucide-react";

export function ContactPage({ onNavigate }: { onNavigate: (p: any) => void }) {
  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50">
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact</h1>
        <p className="mt-2 text-[14px] text-slate-600">Get in touch with the PortSync FTZ team.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <Mail size={18} className="text-blue-600" />
            <div className="mt-3 text-[13px] font-semibold text-slate-900">Email</div>
            <div className="mt-1 text-[12.5px] text-slate-500">support@portsync-ftz.example</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <Phone size={18} className="text-blue-600" />
            <div className="mt-3 text-[13px] font-semibold text-slate-900">Phone</div>
            <div className="mt-1 text-[12.5px] text-slate-500">+62 778 000 0000</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <MapPin size={18} className="text-blue-600" />
            <div className="mt-3 text-[13px] font-semibold text-slate-900">Office</div>
            <div className="mt-1 text-[12.5px] text-slate-500">Batam, Kepulauan Riau, Indonesia</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="mt-8 text-[13px] font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to home
        </button>
      </section>
    </div>
  );
}
