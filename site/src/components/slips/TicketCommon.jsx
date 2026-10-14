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
export { CATEGORY_ORDER };

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
