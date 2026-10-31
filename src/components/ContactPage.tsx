import { useState } from "react";
import { CheckCircle2, Mail, MapPin, MessageSquare, Phone, Send, ShieldCheck } from "lucide-react";

export function ContactPage({ onNavigate }: { onNavigate: (p: any) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-zinc-950 text-zinc-100 antialiased">
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
            <MessageSquare size={13} /> Support &amp; Deployment Desk
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Get in Touch with PortSync FTZ
          </h1>
          <p className="mt-3 text-[14.5px] text-zinc-400">
            Have questions about custom BTKI tariff integration, CEISA 4.0 pipelines, or enterprise deployments in Batam?
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 items-start">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                  <MapPin size={17} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-zinc-100">Batam Logistics Hub</div>
                  <div className="text-[11px] text-zinc-400">KPBPB Free Trade Zone Enclave</div>
                </div>
              </div>
              <p className="mt-3 text-[12.5px] text-zinc-400 leading-relaxed">
                Kawasan Industri Batamindo &amp; Pelabuhan Batu Ampar, Batam, Kepulauan Riau 29433, Indonesia
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                  <Mail size={17} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-zinc-100">Electronic Mail</div>
                  <div className="text-[11px] text-zinc-400">24/7 Monitored Dispatch</div>
                </div>
              </div>
              <div className="mt-3 font-mono text-[12px] text-cyan-300">
                ops@portsync-ftz.io · customs@portsync.id
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                  <Phone size={17} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-zinc-100">Direct Broker Hotline</div>
                  <div className="text-[11px] text-zinc-400">WIB (Western Indonesia Time)</div>
                </div>
              </div>
              <div className="mt-3 font-mono text-[12px] text-zinc-300">
                +62 (778) 412-9800 · WhatsApp: +62 811-7788-0912
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck size={14} /> Customs Emergency Clearing Desk
              </div>
              <p className="mt-1 text-[11.5px] text-emerald-400/80 leading-relaxed">
                Operating 24/7 at Batu Ampar Port (POD: IDBTM) for rapid document rectification during vessel berthing.
              </p>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">Inquiry Received</h3>
                <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto">
                  Thank you, <span className="text-zinc-200 font-semibold">{name}</span>. A licensed PortSync customs specialist will review your request and reply shortly.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setMessage(""); }}
                  className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-white">Send Inquiry or Request Demo</h3>
                <div>
                  <label className="text-[12px] font-medium text-zinc-300">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hendra Setiawan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-medium text-zinc-300">Corporate Email</label>
                    <input
                      type="email"
                      required
                      placeholder="h.setiawan@company.co.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-zinc-300">Organization / Forwarder</label>
                    <input
                      type="text"
                      placeholder="e.g. PT Batam Precision Diecasting"
                      value={org}
                      onChange={(e) => setOrg(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-zinc-300">Message / Consignment Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about your import/export commodities, monthly declaration volume, or required EDI integrations..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-cyan-400 transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  <Send size={14} /> Send Message to Customs Team
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 text-center border-t border-zinc-800/80 pt-6">
          <button
            type="button"
            onClick={() => onNavigate("terminal")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            ← Or return to the Customs Declaration Terminal
          </button>
        </div>
      </section>
    </div>
  );
}
