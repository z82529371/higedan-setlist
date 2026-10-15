export function getSourceLabel(url) {
  if (!url) return "來源紀錄";
  if (/higedan\.com/i.test(url)) return "官方網站 來源紀錄";
  if (/x\.com|twitter\.com/i.test(url)) return "X 來源紀錄";
  if (/livefans\.jp/i.test(url)) return "LiveFans 來源紀錄";
  if (/wikipedia\.org/i.test(url)) return "維基百科 來源紀錄";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `${host} 來源紀錄`;
  } catch {
    return "來源紀錄";
  }
}
import { CATEGORY_ORDER } from "../../lib/constants.js";
import { routeHash } from "../../lib/routes.js";
import { useI18n } from "../../lib/i18n.jsx";
export { CATEGORY_ORDER };

const CAPSULE_MODES = [
  {
    key: "tour",
    label: "巡演總覽",
    icon: "📜",
    title: "切換至巡演總覽，檢視全巡演定番歌單與出賽統計",
  },
  {
    key: "show",
    label: "單場即時票根",
    icon: "🎫",
    title: "切換至單場即時票根，檢視特定場次實際歌單與演出細節",
  },
];

export function DualModeCapsuleToggle({
  isTour,
  mode = "show",
  unitId,
  showId,
  onToggleMode,
  onSelectTour,
  onSelectShow,
}) {
  const { t, locale } = useI18n();
  if (!isTour) return null;

  const handleClick = (e, targetKey) => {
    e.preventDefault();
    if (onToggleMode) {
      onToggleMode(targetKey);
    } else if (targetKey === "tour" && onSelectTour && unitId) {
      onSelectTour(unitId);
    } else if (targetKey === "show" && onSelectShow && showId) {
      onSelectShow(showId);
    }
  };

  return (
    <div
      className="my-3 flex items-center justify-center select-none"
      aria-label={t("slips.toggleModeAria", "票券檢視模式切換")}
    >
      <div
        role="tablist"
        aria-label={t("slips.toggleModeAria", "票券檢視模式切換")}
        className="inline-flex items-center gap-1 rounded-full border border-ink/40 bg-paper/95 p-1 shadow-[1px_1px_0_rgba(0,0,0,0.14)]"
      >
        {CAPSULE_MODES.map((item, index) => {
          const isActive = mode === item.key;
          const href =
            item.key === "tour"
              ? unitId
                ? routeHash.tour(unitId, locale)
                : routeHash.tour("", locale)
              : showId
                ? routeHash.show(showId, locale)
                : routeHash.show("", locale);

          const itemLabel =
            item.key === "tour"
              ? t("slips.modeTour", "巡演總覽")
              : t("slips.modeShow", "單場票根");

          return (
            <span key={item.key} className="inline-flex items-center gap-1">
              {index > 0 && (
                <span
                  className="text-muted/40 font-mono text-[10px] select-none"
                  aria-hidden="true"
                >
                  ⟷
                </span>
              )}
              <a
                role="tab"
                aria-selected={isActive}
                href={href}
                onClick={(e) => handleClick(e, item.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] sm:text-[12px] font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-band text-band-ink border border-ink/40 shadow-[1px_1px_0_#000000]"
                    : "text-muted hover:text-ink hover:bg-tape-tint/50 border border-transparent"
                }`}
                title={item.title}
              >
                <span>{item.icon}</span>
                <span>{itemLabel}</span>
              </a>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export const songFilterPillClass = (isActive) =>
  `appearance-none w-full flex items-center justify-center gap-1 rounded border-[1.5px] px-1.5 py-[5px] sm:px-2 text-[12px] font-semibold cursor-pointer whitespace-nowrap transition-colors motion-reduce:transition-none text-center focus-visible:outline-[2px] focus-visible:outline-pool focus-visible:outline-offset-2 ${
    isActive
      ? "bg-band text-band-ink border-band shadow-[1px_1px_0_#d5a200] font-bold"
      : "border-line bg-paper text-ink hover:bg-pool-wash hover:border-pool hover:text-pool"
  }`;

export function TicketPerforationDivider() {
  return (
    <div
      className="relative -mx-[26px] max-sm:-mx-4 mb-4 sm:mb-5 select-none"
      aria-hidden="true"
    >
      <div className="relative flex items-center">
        {/* Left Inward Punch Notch */}
        <span className="absolute -left-[2px] top-1/2 -translate-y-1/2 h-[22px] w-[13px] rounded-r-full bg-paper border-r-[1.5px] border-y-[1.5px] border-ink z-10" />
        {/* Perforated Dashed Tear Line */}
        <div className="w-full border-t-[2px] border-dashed border-ink/40" />
        {/* Right Inward Punch Notch */}
        <span className="absolute -right-[2px] top-1/2 -translate-y-1/2 h-[22px] w-[13px] rounded-l-full bg-paper border-l-[1.5px] border-y-[1.5px] border-ink z-10" />
      </div>

      {/* Microprint Security Stripe */}
      <div className="mt-1 px-4 flex items-center justify-between overflow-hidden text-[8px] sm:text-[8.5px] font-mono tracking-[0.22em] uppercase text-muted/60 whitespace-nowrap opacity-85">
        <span className="truncate">
          •••• OFFICIAL HIGEDAN DISM STAGE ARCHIVE •••• ADMIT ONE ALL ACCESS •••• OFFICIAL HIGEDAN DISM ••••
        </span>
        <span className="hidden sm:inline shrink-0 font-bold ml-2">
          SEC-PASS // VALIDATED
        </span>
      </div>
    </div>
  );
}

export function TicketBarcodeFooter({ serial, label = "ADMIT ONE // STAGE SETLIST RUN SHEET" }) {
  return (
    <div className="mt-8 border-t border-line-soft pt-3.5 flex flex-wrap items-center justify-between gap-3 text-muted font-mono select-none">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-muted/80 truncate">
          <span className="text-band font-black" aria-hidden="true">★</span>
          <span>{label}</span>
        </div>
        <div className="text-[12px] sm:text-[13px] font-black tracking-wider text-ink tabular-nums truncate">
          {serial}
        </div>
      </div>

      {/* Decorative Vintage Barcode */}
      <div className="shrink-0 flex items-center gap-2">
        <div className="flex items-end gap-[2px] h-7 px-2 py-1 rounded bg-paper/80 border border-line-soft" aria-hidden="true">
          <span className="w-[2px] h-full bg-ink" />
          <span className="w-[1px] h-4 bg-ink" />
          <span className="w-[3px] h-full bg-ink" />
          <span className="w-[1px] h-3 bg-ink" />
          <span className="w-[2px] h-5 bg-ink" />
          <span className="w-[4px] h-full bg-ink" />
          <span className="w-[1px] h-4 bg-ink" />
          <span className="w-[2px] h-full bg-ink" />
          <span className="w-[1px] h-5 bg-ink" />
          <span className="w-[3px] h-full bg-ink" />
          <span className="w-[1px] h-3 bg-ink" />
          <span className="w-[2px] h-full bg-ink" />
          <span className="w-[1px] h-4 bg-ink" />
          <span className="w-[4px] h-full bg-ink" />
          <span className="w-[2px] h-5 bg-ink" />
          <span className="w-[1px] h-full bg-ink" />
          <span className="w-[3px] h-4 bg-ink" />
        </div>
      </div>
    </div>
  );
}
