import type { LegalDoc } from "../data/legal";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, Moon, Scale, Sun, UserCheck, X } from "lucide-react";
import { KPB, OPERATOR } from "../data/constants";
import { FX, LIVE_MARKET_FX, refreshFx, subscribeFx } from "../lib/fx";
import { cn } from "../lib/cn";
import { Btn } from "./ui";
import type { AuthUser } from "../lib/auth";
import type { Page } from "../App";

const NAV: { key: Page; label: string }[] = [
  { key: "home", label: "Overview" },
  { key: "features", label: "Capabilities" },
  { key: "pricing", label: "Pricing" },
  { key: "faq", label: "FAQ" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
  { key: "sources", label: "Sources" },
];

export function TopBar({
  page,
  onNavigate,
  agent,
  user,
  theme = "light",
  onToggleTheme,
  onLogout,
  onOpenLegal,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  agent: { text: string; tone: "idle" | "busy" | "ready" };
  user?: AuthUser | null;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onOpenLegal?: (doc: LegalDoc) => void;
}) {
  const [, force] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeFx(() => force((n) => n + 1));
    refreshFx();
    const interval = setInterval(() => refreshFx(), 60000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  /** Every route, in one place, so the sheet and the tab strip cannot drift. */
  const routes: { key: Page; label: string }[] = [{ key: "terminal", label: "Terminal" }, ...NAV];

  const name = user?.name || OPERATOR.user;
  const role = user?.role || OPERATOR.role;
  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "DT";

  return (
    <header className="relative z-40 flex h-12 shrink-0 items-center gap-4 border-b border-line bg-surface px-3 sm:px-4">
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className="-my-2 flex shrink-0 cursor-pointer items-center gap-2 px-1 py-2"
        aria-label="PortSync FTZ home"
      >
        <span className="grid size-[22px] place-items-center rounded-[4px] bg-ink">
          <span className="display text-[13px] leading-none text-paper">P</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-ink">PortSync</span>
          <span className="hidden font-mono text-[10px] tracking-[0.08em] text-ink-3 sm:inline">FTZ</span>
        </span>
      </button>

      <span className="hidden h-4 w-px shrink-0 bg-line md:block" />

      <nav className="hidden items-center lg:flex" aria-label="Primary">
        <button
          type="button"
          onClick={() => onNavigate("terminal")}
          className={cn(
            "h-12 cursor-pointer border-b-2 px-2.5 text-[12.5px] transition-colors",
            page === "terminal"
              ? "border-ink font-medium text-ink"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          Terminal
        </button>
        {NAV.map((n) => (
          <button
            key={n.key}
            type="button"
            onClick={() => onNavigate(n.key)}
            className={cn(
              "h-12 cursor-pointer border-b-2 px-2.5 text-[12.5px] transition-colors",
              page === n.key ? "border-ink font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setNavOpen((v) => !v)}
          className="grid size-7 cursor-pointer place-items-center rounded-[5px] text-ink-2 transition-colors hover:bg-sunken hover:text-ink lg:hidden"
          aria-expanded={navOpen}
          aria-controls="mobile-nav"
          aria-label="Menu"
        >
          {navOpen ? <X size={15} strokeWidth={2} /> : <Menu size={15} strokeWidth={2} />}
        </button>

        {page === "terminal" && (
          <div className="hidden items-center gap-1.5 lg:flex" title={`${KPB.regulation} · ${KPB.customsOffice}`}>
            <span
              className={cn(
                "size-[5px] rounded-full",
                agent.tone === "ready" ? "bg-ok" : agent.tone === "busy" ? "bg-warn" : "bg-ink-3",
              )}
            />
            <span className="font-mono text-[10.5px] whitespace-nowrap text-ink-3">{agent.text}</span>
          </div>
        )}

        <div
          className="hidden items-center gap-1.5 border-l border-line pl-3 xl:flex"
          title={
            LIVE_MARKET_FX.isLive
              ? `Duty is computed on the statutory kurs pabean (${FX.USD_IDR.toLocaleString("id-ID")}). Market spot is ${LIVE_MARKET_FX.spotUsdIdr.toLocaleString("id-ID")} via ${LIVE_MARKET_FX.source} — shown for reference only, never used in the declaration.`
              : `${LIVE_MARKET_FX.source}. Showing the statutory kurs pabean used for duty (${FX.USD_IDR.toLocaleString("id-ID")}).`
          }
        >
          <span className="font-mono text-[10.5px] text-ink-3">USD/IDR</span>
          <span className="tnum font-mono text-[10.5px] text-ink-2">
            {FX.USD_IDR.toLocaleString("id-ID")}
          </span>
          <span className="font-mono text-[10px] text-ink-3">kurs pabean</span>
          {LIVE_MARKET_FX.isLive && (
            <span className="ml-1 font-mono text-[10px] text-ink-3">
              · spot {LIVE_MARKET_FX.spotUsdIdr.toLocaleString("id-ID")}
            </span>
          )}
        </div>

        {page !== "terminal" && (
          <span className="hidden lg:block">
            <Btn size="sm" variant="primary" onClick={() => onNavigate("terminal")}>
              Open terminal
            </Btn>
          </span>
        )}

        {onOpenLegal && (
          <button
            type="button"
            onClick={() => onOpenLegal("disclaimer")}
            className="hidden size-7 cursor-pointer items-center justify-center rounded-[5px] text-ink-3 transition-colors hover:bg-sunken hover:text-ink lg:grid"
            title="Legal, terms and privacy"
            aria-label="Legal and compliance"
          >
            <Scale size={14} strokeWidth={1.9} />
          </button>
        )}

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="grid size-7 cursor-pointer place-items-center rounded-[5px] text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            aria-label="Toggle colour theme"
          >
            {theme === "light" ? <Moon size={14} strokeWidth={1.9} /> : <Sun size={14} strokeWidth={1.9} />}
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-1.5 rounded-[5px] border border-line py-[3px] pr-1.5 pl-[3px] transition-colors hover:border-line-strong"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="grid size-[19px] place-items-center rounded-[3px] bg-sunken font-mono text-[9.5px] font-semibold text-ink-2">
              {initials}
            </span>
            <ChevronDown size={11} className="text-ink-3" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="animate-rise absolute top-[calc(100%+6px)] right-0 w-60 overflow-hidden rounded-[6px] border border-line bg-surface shadow-[var(--shadow-modal)]"
            >
              <div className="border-b border-line px-3 py-2.5">
                <div className="text-[12.5px] font-medium text-ink">{name}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-ink-3">{role}</div>
                {user?.licenseNo ? (
                  <div className="mt-1.5 font-mono text-[10px] text-ink-3">{user.licenseNo}</div>
                ) : user?.local ? (
                  <div className="mt-1.5 font-mono text-[10px] text-warn">
                    local session · credentials not verified
                  </div>
                ) : null}
              </div>
              <div className="p-1">
                {!user && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onNavigate("login");
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-[12px] text-ink-2 hover:bg-sunken hover:text-ink"
                  >
                    <UserCheck size={13} strokeWidth={2} /> Sign in
                  </button>
                )}
                {onOpenLegal && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenLegal("disclaimer");
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-[12px] text-ink-2 hover:bg-sunken hover:text-ink"
                  >
                    <Scale size={13} strokeWidth={2} /> Legal &amp; disclaimer
                  </button>
                )}
                {user && onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-[12px] text-ink-2 hover:bg-sunken hover:text-ink"
                  >
                    <LogOut size={13} strokeWidth={2} /> Sign out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {navOpen && (
        <div
          id="mobile-nav"
          ref={navRef}
          className="animate-rise absolute inset-x-0 top-12 border-b border-line bg-surface shadow-[var(--shadow-modal)] lg:hidden"
        >
          {routes.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setNavOpen(false);
                onNavigate(r.key);
              }}
              className={cn(
                "flex h-11 w-full cursor-pointer items-center border-b border-line px-4 text-left text-[13px] transition-colors last:border-b-0",
                page === r.key ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:bg-sunken/60 hover:text-ink",
              )}
            >
              {r.label}
            </button>
          ))}
          {!user && (
            <button
              type="button"
              onClick={() => {
                setNavOpen(false);
                onNavigate("login");
              }}
              className="flex h-11 w-full cursor-pointer items-center border-t border-line px-4 text-left text-[13px] text-ink-2 transition-colors hover:bg-sunken/60 hover:text-ink"
            >
              Sign in
            </button>
          )}
        </div>
      )}
    </header>
  );
}
