import { useState, useRef, useEffect } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { useTicketBook } from "../../lib/ticket-book.js";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import {
  TicketIcon,
  MusicNoteIcon,
  VenuePinIcon,
  RouteIcon,
  ChartBarsIcon,
  DiscIcon,
  SearchIcon,
  HomeIcon,
  ArchiveBoxIcon,
  FilterIcon,
} from "../common/ArchivalIcons.jsx";

const STAMP_BTN_SQUARE =
  "inline-flex items-center justify-center w-10 h-10 rounded-[3px] bg-paper text-ink font-bold border-[1.5px] border-ink shadow-[2px_2px_0_#000] dark:shadow-none cursor-pointer hover:bg-tape-tint touch-stamp transition-colors";

export function MobileFloatingControls({
  tab,
  onOpenSearch,
  onOpenDrawer,
  onReturnHome,
  onSelectTickets,
  onSelectRanking,
  onSelectJourney,
  onSelectReleases,
  onReturnArchive,
  storage,
}) {
  const { t } = useI18n();
  const { count: ticketCount } = useTicketBook({ storage });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const navItems = [
    onReturnHome && {
      key: "landing",
      label: t("statusBar.home", "首頁"),
      icon: HomeIcon,
      onClick: onReturnHome,
      active: tab === "landing",
    },
    onReturnArchive && {
      key: "archive",
      label: t("nav.archive", "檔案庫"),
      icon: ArchiveBoxIcon,
      onClick: onReturnArchive,
      active: tab === "show" || tab === "song" || tab === "venue",
    },
    onSelectTickets && {
      key: "tickets",
      label: t("nav.ticketBook", "票夾"),
      icon: TicketIcon,
      onClick: onSelectTickets,
      active: tab === "tickets",
      badge: ticketCount > 0 ? ticketCount : 0,
    },
    onSelectRanking && {
      key: "ranking",
      label: t("nav.ranking", "排行"),
      icon: ChartBarsIcon,
      onClick: onSelectRanking,
      active: tab === "ranking",
    },
    onSelectJourney && {
      key: "journey",
      label: t("nav.journey", "巡演長征"),
      icon: RouteIcon,
      onClick: onSelectJourney,
      active: tab === "journey",
    },
    onSelectReleases && {
      key: "releases",
      label: t("nav.releases", "作品"),
      icon: DiscIcon,
      onClick: onSelectReleases,
      active: tab === "releases",
    },
  ].filter(Boolean);

  const isArchiveDimension = tab === "show" || tab === "song" || tab === "venue";

  return (
    <>
      {/* Bottom-Right: Language Stamp + Page High-Frequency Actions */}
      <div className="fixed bottom-5 right-4 z-40 sm:hidden flex flex-col items-end gap-2 select-none">
        <LanguageSwitcher fab menuPosition="up" />

        {tab === "journey" && onOpenDrawer && (
          <button
            type="button"
            data-testid="mobile-journey-filter-fab"
            onClick={onOpenDrawer}
            className={STAMP_BTN_SQUARE}
            title={t("mobile.filter", "篩選")}
            aria-label={t("mobile.filter", "篩選")}
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        )}

        {isArchiveDimension && (
          <>
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className={STAMP_BTN_SQUARE}
                aria-label={t("mobile.openSearchAria", "開啟全域搜尋")}
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            )}
            {onOpenDrawer && (
              <button
                type="button"
                onClick={onOpenDrawer}
                className="flex items-center gap-1.5 px-3.5 h-10 rounded-[3px] border-[1.5px] border-ink bg-band text-band-ink shadow-[3px_3px_0_#000] dark:shadow-none font-display text-[13px] font-black cursor-pointer hover:brightness-105 touch-stamp transition-colors"
                aria-label={t("mobile.openFilterAria", "開啟篩選抽屜")}
              >
                {tab === "show" ? (
                  <TicketIcon className="w-4 h-4 shrink-0" />
                ) : tab === "song" ? (
                  <MusicNoteIcon className="w-4 h-4 shrink-0" />
                ) : (
                  <VenuePinIcon className="w-4 h-4 shrink-0" />
                )}
                <span>{t("mobile.filter", "篩選")}</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom-Left: Single Floating Menu Stamp Button (Drop-up navigation) */}
      {navItems.length > 0 && (
        <div
          ref={menuRef}
          className="fixed bottom-5 left-4 z-40 sm:hidden select-none"
        >
          {menuOpen && (
            <div
              role="menu"
              data-testid="mobile-floating-menu"
              className="absolute bottom-full mb-2 left-0 w-44 rounded-[3px] border-[1.5px] border-ink bg-card shadow-[4px_4px_0_#000] dark:shadow-none py-1 z-50 divide-y divide-line-soft/60"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      item.onClick();
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between gap-2 cursor-pointer touch-stamp transition-colors ${
                      item.active
                        ? "bg-band text-band-ink font-black"
                        : "text-ink hover:bg-tape-tint/50 font-bold"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.badge > 0 && (
                      <span className="inline-flex items-center justify-center rounded-[2px] bg-ink text-paper text-[10px] font-bold min-w-[18px] h-[18px] px-1 tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            data-testid="mobile-floating-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label={t("nav.directionLabel", "頁面導覽選單")}
            className="relative inline-flex items-center gap-1.5 px-3 h-10 rounded-[3px] bg-paper text-ink font-mono font-black text-[12px] border-[1.5px] border-ink shadow-[2px_2px_0_#000] dark:shadow-none cursor-pointer hover:bg-tape-tint touch-stamp transition-colors"
          >
            <span aria-hidden="true">≡</span>
            <span>MENU</span>
            {ticketCount > 0 && (
              <span
                data-testid="mobile-ticket-badge-count"
                className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-[2px] bg-tape text-ink font-mono font-bold text-[10px] min-w-[18px] h-[18px] px-1 border border-ink tabular-nums"
              >
                {ticketCount}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
}

export default MobileFloatingControls;
