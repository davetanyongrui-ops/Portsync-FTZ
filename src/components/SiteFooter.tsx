import type { LegalDoc } from "../data/legal";
import { KPB } from "../data/constants";
import type { Page } from "../App";

const PRODUCT: [string, Page][] = [
  ["Terminal", "terminal"],
  ["Capabilities", "features"],
  ["Pricing", "pricing"],
  ["FAQ & help", "faq"],
  ["About", "about"],
  ["Contact", "contact"],
  ["Sources", "sources"],
];

const LEGAL: [string, LegalDoc][] = [
  ["Disclaimer", "disclaimer"],
  ["Terms of service", "tos"],
  ["Privacy & trade data", "privacy"],
  ["Acceptable use", "acceptable-use"],
];

export function SiteFooter({
  onNavigate,
  onOpenLegal,
}: {
  onNavigate: (p: Page) => void;
  onOpenLegal?: (doc: LegalDoc) => void;
}) {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-[20px] place-items-center rounded-[4px] bg-ink">
              <span className="display text-[12px] leading-none text-paper">P</span>
            </span>
            <span className="text-[12.5px] font-semibold text-ink">PortSync FTZ</span>
          </div>
          <p className="mt-2.5 max-w-[220px] text-[11px] leading-[1.6] text-ink-3">
            Independent, unofficial pre-declaration estimation for the Batam free trade zone. Not affiliated with any
            government agency. AI-assisted output — verify everything.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-semibold tracking-[0.09em] text-ink-3 uppercase">Product</div>
          <ul className="mt-1.5 space-y-0.5 text-[11.5px]">
            {PRODUCT.map(([label, page]) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => onNavigate(page)}
                  className="inline-block cursor-pointer py-1 text-ink-2 transition-colors hover:text-ink"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-semibold tracking-[0.09em] text-ink-3 uppercase">Legal</div>
          <ul className="mt-1.5 space-y-0.5 text-[11.5px]">
            {LEGAL.map(([label, doc]) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => onOpenLegal?.(doc)}
                  className="inline-block cursor-pointer py-1 text-ink-2 transition-colors hover:text-ink"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-semibold tracking-[0.09em] text-ink-3 uppercase">Jurisdiction</div>
          <p className="mt-2.5 text-[11px] leading-[1.6] text-ink-3">
            {KPB.region}. Reference register BTKI 2022 · {KPB.regulation}.
          </p>
          <p className="mt-2 font-mono text-[10px] text-ink-3">{KPB.customsOffice}</p>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-4 font-mono text-[10px] text-ink-3 sm:px-8">
        <span>© 2026 PT Portsync Logistics Systems</span>
        <span className="text-warn">unofficial · AI-assisted · no guarantee</span>
        <span className="ml-auto">UU 17/2006</span>
        <span>PP 10/2012</span>
        <span>PMK 47/PMK.04/2012</span>
      </div>
    </footer>
  );
}
