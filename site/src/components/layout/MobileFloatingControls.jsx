export function MobileFloatingControls({
  tab,
  onOpenSearch,
  onOpenDrawer,
  onReturnHome,
}) {
  return (
    <>
      {/* Mobile Floating Action Buttons (Vertical Stack: Top Round Search FAB + Bottom Filter Pill FAB) */}
      <div className="fixed bottom-5 right-4 z-40 sm:hidden flex flex-col items-end gap-2.5 select-none">
        {/* Secondary Action: Search Round FAB (Paper White with Ink Border) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-11 w-11 items-center justify-center rounded-full border-[2px] border-ink bg-paper text-ink shadow-[2.5px_2.5px_0_#000] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all text-base"
          aria-label="開啟全域搜尋"
        >
          <span aria-hidden="true">🔍</span>
        </button>

        {/* Primary Action: Filter Pill FAB (Brand Yellow with Ink Border) */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border-[2px] border-ink bg-band text-band-ink shadow-[3px_3px_0_#000] font-display text-[13px] font-black cursor-pointer hover:brightness-105 active:scale-95 transition-all"
          aria-label="開啟篩選抽屜"
        >
          <span className="text-base" aria-hidden="true">
            {tab === "show" ? "🏷️" : tab === "song" ? "🎵" : "🏛️"}
          </span>
          <span>
            {tab === "show" ? "篩選場次" : tab === "song" ? "挑選歌曲" : "挑選場地"}
          </span>
        </button>
      </div>

      {/* Mobile Floating Action Cluster (Left-aligned: Home + Scroll to Top) */}
      <div className="fixed bottom-5 left-4 z-30 sm:hidden flex items-center gap-2 select-none">
        <button
          type="button"
          onClick={onReturnHome}
          className="inline-flex items-center gap-1 px-3 h-10 rounded-full bg-paper/95 text-ink font-bold shadow-md border-[1.5px] border-ink text-[12px] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all backdrop-blur-xs"
          aria-label="回到首頁門面"
          title="回到首頁門面"
        >
          <span aria-hidden="true">🏠</span>
          <span>首頁</span>
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-paper/95 text-ink font-bold shadow-md border border-ink text-[14px] cursor-pointer hover:bg-tape-tint active:scale-95 transition-all backdrop-blur-xs"
          aria-label="回到頁首"
          title="回到頁首"
        >
          ↑
        </button>
      </div>
    </>
  );
}
