# ADR-0112: 多語言字體架構、語言專屬字體棧與 CJK 異體字隔離（Multi-Lingual Typography and Locale-Isolated Font Stacks）

## Status
Accepted

## Context
1. **CJK 異體字筆畫污染痛點**：
   專案原先在 `style.css` 宣告單一全域 `--font-body: "Noto Sans TC", "Zen Kaku Gothic New", system-ui, sans-serif`。這導致嚴重的字形衝突：
   - 在日文（`ja`）環境下，日文漢字會優先被 `Noto Sans TC` 攔截，以台灣國字標準字體（繁體筆畫風格）顯示，破壞日語原創語境的排版原生感。
   - 若將日文字型排在前面，繁體中文使用者看到的「直、返、骨、角」等常用字又會變成日本新字體形態。
2. **韓文字型缺失（裸奔回退）**：
   在 `index.html` 的 Google Fonts 載入連結中，完全未引入任何韓文字型（韓語模式無 `Noto Sans KR` 或 `Pretendard`），導致韓語使用者在 Windows 與 macOS 上呈現出粗細不一、行高破版且垂直基線不整齊之系統預設字型。
3. **英文視覺個性淡薄**：
   英文模式缺乏具備樂團實體周邊與工藝感的專屬西文字體，直接回退至 CJK 字型中的拉丁字母，缺乏視覺張力。
4. **數字與曲序之工業秩序不變量**：
   曲目序號（`M01`、`EN1`、`MC`）、開演時戳與場次計數必須維持縱向對齊，不受語言切換產生水平抖動。

## Decision
1. **動態同步 `document.documentElement.lang`**：
   在 `I18nProvider`（`site/src/lib/i18n.jsx`）中，加入 `useEffect` 監聽 `locale` 變化，即時將目前語系（`zh-TW`、`ja`、`ko`、`en`）同步至 `<html>` 標籤的 `lang` 屬性。
2. **CSS `:lang()` 建立語言專屬字體棧**：
   在 `site/src/style.css` 透過 CSS 偽類選擇器分流宣告：
   - **日文（`ja`）**：
     - `--font-display`: `"M PLUS Rounded 1c"`, `"Zen Kaku Gothic New"`, `sans-serif`
     - `--font-body`: `"Zen Kaku Gothic New"`, `"Hiragino Sans"`, `"Yu Gothic"`, `sans-serif`
   - **繁體中文（`zh-TW` / `zh-Hant`）**：
     - `--font-display`: `"Noto Sans TC"`, `"PingFang TC"`, `"Microsoft JhengHei"`, `sans-serif`
     - `--font-body`: `"Noto Sans TC"`, `"PingFang TC"`, `"Microsoft JhengHei"`, `system-ui`, `sans-serif`
   - **韓文（`ko`）**：
     - `--font-display` & `--font-body`: `"Pretendard"`, `"Noto Sans KR"`, `"Apple SD Gothic Neo"`, `"Malgun Gothic"`, `sans-serif`
   - **英文（`en`）**：
     - `--font-display` & `--font-body`: `"Plus Jakarta Sans"`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`
3. **擴充 Google Fonts 資源連結**：
   在 `site/index.html` 中補齊 `Noto Sans KR`（500/700）與 `Plus Jakarta Sans`（500/600/700/800），配合 `display=swap` 與 `preconnect`，保障極速漸進加載。
4. **嚴格守護 The Cue Monospace Rule**：
   `--font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace` 作為跨語系全域不變量，配合 `tabular-nums`，嚴禁任何語言分流或覆蓋。

## Consequences
- **Positive**: 徹底根除 CJK 漢字筆畫混用問題；日語恢復標準新字體、繁中保持標準國字、韓文結束裸奔狀態、英文擁有溫潤幾何質感。
- **Positive**: 零額外多餘體積浪費，利用 Google Fonts 的 unicode-range 切片機制僅下載使用者瀏覽當前語言所需字形。
- **Neutral**: `DESIGN.md` 與前端樣式表已完整同步，全套自動化測試與不變量測試持續守護。
