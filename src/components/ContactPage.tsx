import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Btn, FIELD, Label } from "./ui";
import { SiteFooter } from "./SiteFooter";
import { KPB } from "../data/constants";
import type { Page } from "../App";

const TOPICS = [
  "Evaluate the engine",
  "Broker desk subscription",
  "Facility / private deployment",
  "Customs rules question",
  "Something is wrong",
];

export function ContactPage({
  onNavigate,
  onOpenLegal,
}: {
  onNavigate: (p: Page) => void;
  onOpenLegal?: (doc: "disclaimer" | "tos" | "privacy") => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter a name we can reply to.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = "That address does not look complete.";
    if (message.trim().length < 12) next.message = "A sentence or two about the consignment helps.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      org.trim() ? `Organisation: ${org.trim()}` : null,
      `Topic: ${topic}`,
      "",
      message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const href = `mailto:customs@portsync.id?subject=${encodeURIComponent(
      `[${topic}] ${org.trim() || name.trim()}`,
    )}&body=${encodeURIComponent(body)}`;

    setSent(href);
  };

  const reset = () => {
    setSent(null);
    setMessage("");
    setErrors({});
  };

  return (
    <div className="bg-paper">
      <section className="mx-auto grid max-w-[1040px] grid-cols-1 gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <div>
          <div className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">Contact</div>
          <h1 className="display mt-3 text-[30px] text-ink sm:text-[34px]">Tell us what you are clearing</h1>
          <p className="mt-3 max-w-[460px] text-[12.5px] leading-[1.65] text-ink-2">
            A commodity, a volume and a port is usually enough to say whether the engine fits. If you already have an
            invoice with a line that keeps getting reclassified, send that.
          </p>

          {sent ? (
            <div className="mt-8 rounded-[7px] border border-line bg-surface p-5">
              <div className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-ok-soft text-ok">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span className="text-[12.5px] font-medium text-ink">Message prepared</span>
              </div>
              <p className="mt-2 text-[11.5px] leading-[1.65] text-ink-2">
                This build has no mail server, so the message was handed to your mail client instead of being posted
                silently. If nothing opened, use the link below.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={sent}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-ink bg-ink px-3 text-[12px] font-medium text-paper"
                >
                  Open in mail client <ArrowRight size={12} />
                </a>
                <Btn variant="secondary" size="sm" onClick={reset}>
                  Write another
                </Btn>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name">
                    <Label>Name</Label>
                  </label>
                  <input
                    id="c-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Hendra Setiawan"
                    className={`mt-1.5 ${FIELD}`}
                  />
                  {errors.name && <p className="mt-1 text-[10.5px] text-bad">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="c-email">
                    <Label>Work email</Label>
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="h.setiawan@company.co.id"
                    className={`mt-1.5 ${FIELD}`}
                  />
                  {errors.email && <p className="mt-1 text-[10.5px] text-bad">{errors.email}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-org">
                    <Label>Organisation</Label>
                  </label>
                  <input
                    id="c-org"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="PT Batam Precision Diecasting"
                    className={`mt-1.5 ${FIELD}`}
                  />
                </div>
                <div>
                  <label htmlFor="c-topic">
                    <Label>Topic</Label>
                  </label>
                  <select
                    id="c-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={`mt-1.5 ${FIELD}`}
                  >
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="c-msg">
                  <Label>Message</Label>
                </label>
                <textarea
                  id="c-msg"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Commodities, monthly declaration volume, and which port you clear through."
                  className={`mt-1.5 resize-none ${FIELD}`}
                />
                {errors.message && <p className="mt-1 text-[10.5px] text-bad">{errors.message}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Btn variant="primary" type="submit" iconRight={ArrowRight}>
                  Prepare message
                </Btn>
                <span className="font-mono text-[10px] text-ink-3">no account required</span>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-6 lg:border-l lg:border-line lg:pl-8">
          <div>
            <Label>Batam desk</Label>
            <p className="mt-2 text-[11.5px] leading-[1.7] text-ink-2">
              Kawasan Industri Batamindo
              <br />
              Mukakuning, Batam 29433
              <br />
              Kepulauan Riau, Indonesia
            </p>
          </div>
          <div>
            <Label>Direct</Label>
            <dl className="mt-2 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-3">customs</dt>
                <dd className="text-ink-2">customs@portsync.id</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-3">ops</dt>
                <dd className="text-ink-2">ops@portsync-ftz.io</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-3">tel</dt>
                <dd className="text-ink-2">+62 778 412 9800</dd>
              </div>
            </dl>
          </div>
          <div>
            <Label>Customs office</Label>
            <p className="mt-2 text-[11px] leading-[1.7] text-ink-2">
              {KPB.customsOffice}
              <br />
              <span className="font-mono text-ink-3">{KPB.code}</span>
            </p>
          </div>
          <div className="rounded-[6px] border border-line bg-surface px-3 py-2.5">
            <p className="text-[10.5px] leading-[1.6] text-ink-3">
              We do not give tariff rulings. Classification advice comes from a licensed PPJK; we only show you what the
              register and the rules say.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("terminal")}
            className="-my-2 inline-flex cursor-pointer items-center gap-1.5 py-2 text-[11.5px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            Skip the form — open the terminal
          </button>
        </aside>
      </section>

      <SiteFooter onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
    </div>
  );
}
