import { useI18n } from "../../lib/i18n.jsx";
import { useTicketBook } from "../../lib/ticket-book.js";
import LanguageSwitcher from "../LanguageSwitcher.jsx";

export function MobileFloatingControls({
  tab,
  onOpenSearch,
  onOpenDrawer,
  onReturnHome,
  onSelectTickets,
  storage,
}) {
  const { t } = useI18n();
  const { count: ticketCount } = useTicketBook({ storage });

  return (
    <>
      {/* Mobile Floating Action Buttons (Vertical Stack: Top Language FAB + Middle Round Search FAB + Bottom Filter Pill FAB) */}
      <div className="fixed bottom-5 right-4 z-40 sm:hidden flex flex-col items-end gap-2.5 select-none">
        {/* Language FAB (drop-up menu, round silhouette matching Search FAB) */}
        <LanguageSwitcher fab menuPosition="up" />

        {/* Secondary Action: Search Round FAB (Paper White with Ink Border) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-11 w-11 items-center justify-center rounded-full border-[2px] border-ink bg-paper text-ink shadow-[2.5px_2.5px_0_#000] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all text-base"
          aria-label={t("mobile.openSearchAria", "開啟全域搜尋")}
        >
          <span aria-hidden="true">🔍</span>
        </button>

        {/* Primary Action: Filter Pill FAB (Brand Yellow with Ink Border) */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border-[2px] border-ink bg-band text-band-ink shadow-[3px_3px_0_#000] font-display text-[13px] font-black cursor-pointer hover:brightness-105 active:scale-95 transition-all"
          aria-label={t("mobile.openFilterAria", "開啟篩選抽屜")}
        >
          <span className="text-base" aria-hidden="true">
            {tab === "show" ? "🏷️" : tab === "song" ? "🎵" : "🏛️"}
          </span>
          <span>
            {tab === "show" ? t("mobile.filterShow", "篩選場次") : tab === "song" ? t("mobile.pickSong", "挑選歌曲") : t("mobile.pickVenue", "挑選場地")}
          </span>
        </button>
      </div>

      {/* Mobile Floating Action Cluster (Left-aligned: Ticket Book FAB vertically above Home + Scroll to Top) */}
      <div className="fixed bottom-5 left-4 z-30 sm:hidden flex flex-col items-start gap-2.5 select-none">
        {/* Ticket Book Floating Action Button (placed directly above Home button, round FAB matching Search FAB style) */}
        {onSelectTickets && (
          <button
            type="button"
            data-testid="mobile-ticket-book-fab"
            onClick={onSelectTickets}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-ink bg-paper/95 text-ink shadow-md cursor-pointer hover:bg-tape-tint active:scale-95 transition-all text-base backdrop-blur-xs"
            aria-label={t("ticketBook.title", "我的巡演票夾")}
            title={t("ticketBook.title", "我的巡演票夾")}
          >
            <span aria-hidden="true">🎟️</span>
            {ticketCount > 0 && (
              <span
                data-testid="mobile-ticket-badge-count"
                className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-tape text-ink font-mono font-bold text-[10px] min-w-[18px] h-[18px] px-1 border border-ink shadow-2xs tabular-nums"
              >
                {ticketCount}
              </span>
            )}
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReturnHome}
            className="inline-flex items-center gap-1 px-3 h-10 rounded-full bg-paper/95 text-ink font-bold shadow-md border-[1.5px] border-ink text-[12px] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all backdrop-blur-xs"
            aria-label={t("mobile.backHomeAria", "回到首頁門面")}
            title={t("mobile.backHomeTitle", "回到首頁門面")}
          >
            <span aria-hidden="true">🏠</span>
            <span>{t("mobile.home", "首頁")}</span>
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-paper/95 text-ink font-bold shadow-md border border-ink text-[14px] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all backdrop-blur-xs"
            aria-label={t("mobile.backTopAria", "回到頁首")}
            title={t("mobile.backTopTitle", "回到頁首")}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
