import { ArrowRight, Check, CircleAlert, CircleHelp, FlaskConical, Laptop } from "lucide-react";
import { Btn, Tag } from "./ui";
import { SiteFooter } from "./SiteFooter";
import { REGISTER_SIZE, TARIFF_FETCHED } from "../data/tariff";
import { SOURCE_GROUPS, SOURCES, STATUS_LABEL, type SourceRecord, type SourceStatus } from "../data/sources";
import { cn } from "../lib/cn";
import type { Page } from "../App";

const STATUS_TONE: Record<SourceStatus, { tone: "ok" | "warn" | "brand" | "neutral"; icon: typeof Check; note: string }> = {
  published: {
    tone: "ok",
    icon: Check,
    note: "Retrieved from a named public source. Still check it against the current instrument.",
  },
  modelled: {
    tone: "warn",
    icon: FlaskConical,
    note: "A rule this build applies. Plausible, but not read from a published schedule.",
  },
  derived: {
    tone: "brand",
    icon: CircleHelp,
    note: "Computed by this application's own code from the sources above it.",
  },
  local: {
    tone: "neutral",
    icon: Laptop,
    note: "Runs on your device. Nothing is sent anywhere.",
  },
};

function SourceCard({ s }: { s: SourceRecord }) {
  const view = STATUS_TONE[s.status];
  const Icon = view.icon;
  return (
    <article id={s.id} className="scroll-mt-20 border-t border-line py-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <h3 className="min-w-0 flex-1 text-[15px] font-medium text-ink">{s.name}</h3>
        <Tag tone={view.tone} title={view.note} className="shrink-0">
          <Icon size={10} strokeWidth={2.4} />
          {STATUS_LABEL[s.status]}
        </Tag>
      </div>

      <p className="mt-1 text-[11.5px] text-ink-3">{s.publisher}</p>

      <dl className="mt-3 space-y-2.5">
        <div>
          <dt className="font-mono text-[9.5px] tracking-[0.09em] text-ink-3 uppercase">Feeds</dt>
          <dd className="mt-0.5 text-[12px] leading-relaxed text-ink-2">{s.feeds}</dd>
        </div>

        <div>
          <dt className="font-mono text-[9.5px] tracking-[0.09em] text-ink-3 uppercase">How it is used</dt>
          <dd className="mt-0.5 text-[12px] leading-relaxed text-ink-2">{s.method}</dd>
        </div>

        <div>
          <dt className="flex items-center gap-1 font-mono text-[9.5px] tracking-[0.09em] text-ink-3 uppercase">
            <CircleAlert size={9} strokeWidth={2.4} /> What it cannot tell you
          </dt>
          <dd className="mt-0.5 text-[12px] leading-relaxed text-ink-2">{s.limits}</dd>
        </div>

        {(s.reference || s.url || s.retrieved) && (
          <div className="rounded-[5px] border border-line bg-sunken/60 px-2.5 py-2">
            {s.reference && (
              <div className="font-mono text-[10.5px] leading-relaxed break-words text-ink-2">{s.reference}</div>
            )}
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-mono text-[10.5px] break-all text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
              >
                {s.url}
              </a>
            )}
            {s.retrieved && (
              <div className="mt-1 font-mono text-[10px] text-ink-3">retrieved {s.retrieved}</div>
            )}
          </div>
        )}
      </dl>
    </article>
  );
}

export function SourcesPage({
  onNavigate,
  onOpenLegal,
}: {
  onNavigate: (p: Page) => void;
  onOpenLegal?: (doc: "disclaimer" | "tos" | "privacy") => void;
}) {
  const counts = SOURCES.reduce<Record<SourceStatus, number>>(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
    { published: 0, modelled: 0, derived: 0, local: 0 },
  );

  return (
    <div className="bg-paper">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[860px] px-5 pt-12 pb-10 sm:px-8">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
            <span className="size-[5px] rounded-full bg-warn" />
            Provenance
          </div>
          <h1 className="display mt-4 text-[30px] leading-[1.1] text-ink sm:text-[38px]">
            Where every number comes from
          </h1>
          <p className="mt-4 max-w-[620px] text-[13px] leading-[1.7] text-ink-2">
            Nothing in the terminal is looked up live. Classification runs in your browser against a{" "}
            {REGISTER_SIZE}-heading register compiled into the build, and the duty rates in that register were pulled
            once from a public dataset on {TARIFF_FETCHED}. This page lists each input, what it feeds, and — the part
            that matters — what it cannot tell you.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["published", "From a public source"],
                ["modelled", "Rule this build applies"],
                ["derived", "Computed by the app"],
                ["local", "Runs on your device"],
              ] as [SourceStatus, string][]
            ).map(([status, label]) => (
              <div key={status} className="rounded-[6px] border border-line bg-surface px-3 py-2.5">
                <div className="tnum font-mono text-[17px] font-semibold text-ink">{counts[status]}</div>
                <div className="mt-0.5 text-[10.5px] leading-snug text-ink-3">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-[6px] border border-warn/30 bg-warn-soft/50 px-3 py-2.5">
            <CircleAlert size={12} className="mt-[2px] shrink-0 text-warn" strokeWidth={2.2} />
            <p className="text-[11.5px] leading-relaxed text-ink-2">
              <span className="font-medium text-ink">The classification is a proposal, not a determination.</span>{" "}
              Choosing a heading is a legal act under the General Rules for Interpretation, and it turns on material,
              function and essential character — none of which a keyword matcher can see. Treat every suggested code as
              something to accept or overrule.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-8">
          {SOURCE_GROUPS.map((group) => {
            const items = SOURCES.filter((s) => s.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mb-10 last:mb-0">
                <div className="mb-3 flex items-center gap-2.5">
                  <h2 className="text-[11px] font-semibold tracking-[0.09em] text-ink-3 uppercase">{group}</h2>
                  <span className="h-px flex-1 bg-line" />
                  <span className="font-mono text-[10px] text-ink-3">{items.length}</span>
                </div>
                <div className="rounded-[7px] border border-line bg-surface px-4 py-5 sm:px-5">
                  {items.map((s) => (
                    <SourceCard key={s.id} s={s} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-[860px] flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <div className="text-[13px] font-medium text-ink">See the evidence on a real line</div>
            <p className="mt-1 max-w-[440px] text-[11.5px] leading-relaxed text-ink-2">
              Open the terminal, load an invoice and switch to the Advisory tab. Every line shows the terms that matched,
              the heading that won, and which source the rate came from.
            </p>
          </div>
          <div className={cn("flex shrink-0 gap-2")}>
            <Btn variant="secondary" onClick={() => onOpenLegal?.("disclaimer")}>
              Statutory disclaimer
            </Btn>
            <Btn variant="primary" icon={ArrowRight} onClick={() => onNavigate("terminal")}>
              Open terminal
            </Btn>
          </div>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
    </div>
  );
}
