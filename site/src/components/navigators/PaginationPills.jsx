import { useI18n } from "../../lib/i18n.jsx";

export const PAGE_SIZE = 10;
export const CHUNK_SIZE = 50;

// Reusable adaptive pagination: single-tier when <= 50, two-tier (chunked by 50) when > 50
export function PaginationPills({
  total,
  pageSize = PAGE_SIZE,
  chunkSize = CHUNK_SIZE,
  page,
  onPageChange,
  label,
}) {
  const { t } = useI18n();
  const defaultLabel = t("navigators.pagination.segment", "分段");
  const displayLabel = label || defaultLabel;
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;

  const safePage = Math.min(Math.max(0, page), Math.max(0, pageCount - 1));
  const needsChunks = total > chunkSize;
  const chunkCount = Math.ceil(total / chunkSize);
  const pagesPerChunk = Math.round(chunkSize / pageSize); // 5 pages per chunk
  const currentChunk = Math.floor(safePage / pagesPerChunk);

  const startPageIndex = needsChunks ? currentChunk * pagesPerChunk : 0;
  const endPageIndex = needsChunks
    ? Math.min(startPageIndex + pagesPerChunk, pageCount)
    : pageCount;

  return (
    <div className="mb-2.5 flex flex-col gap-1.5 rounded bg-tape-tint/25 p-2 border border-line-soft font-mono text-[11px]">
      {/* Tier 1: Large Chunks (only displayed if total > 50) */}
      {needsChunks && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted font-sans text-xs font-bold w-[52px] shrink-0 text-right">
            {t("navigators.pagination.broadRange", "大區間：")}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: chunkCount }, (_, c) => {
              const cStart = c * chunkSize + 1;
              const cEnd = Math.min((c + 1) * chunkSize, total);
              const isCurChunk = currentChunk === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (!isCurChunk) {
                      onPageChange(c * pagesPerChunk);
                    }
                  }}
                  className={`rounded px-2.5 py-0.5 font-bold transition-colors motion-reduce:transition-none cursor-pointer border ${
                    isCurChunk
                      ? "bg-band text-band-ink border-ink/40 shadow-xs"
                      : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                  }`}
                >
                  {cStart}-{cEnd}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier 2: 10-item sub-pages (always at most 5 buttons when chunked, or at most 5 buttons when total <= 50) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted font-sans text-xs font-bold w-[52px] shrink-0 text-right">
          {needsChunks ? t("navigators.pagination.subPage", "細分頁：") : `${displayLabel}：`}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: endPageIndex - startPageIndex }, (_, offset) => {
            const i = startPageIndex + offset;
            const start = i * pageSize + 1;
            const end = Math.min((i + 1) * pageSize, total);
            const isCur = safePage === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPageChange(i)}
                className={`rounded px-2 py-0.5 font-bold transition-colors motion-reduce:transition-none cursor-pointer border ${
                  isCur
                    ? "bg-band text-band-ink border-ink/40 shadow-xs"
                    : "bg-paper text-ink border-line-soft hover:bg-tape-tint/50 hover:border-ink/60"
                }`}
              >
                {start}-{end}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PaginationPills;
