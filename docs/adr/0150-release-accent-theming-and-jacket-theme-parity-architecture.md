# ADR-0150: 發行作品主題色與歌曲封套色彩一致架構 (Release Accent Theming & Jacket-Theme Parity Architecture)

- **狀態**: 已採納 (Accepted)
- **日期**: 2026-11-20
- **關聯 ADR**: ADR-0143（唱片封套一手首發優先權）、ADR-0144（錄音室歷年發行底冊）、ADR-0149（巡演時代主題色架構）

## 背景與問題

在 ADR-0149 建立巡演時代主題色（Tour Era Accent）後，巡演總覽與單場票券已能隨時代切換專屬點綴與紙膠帶色彩。相對地，歌曲詳情票券（`SongSlip`）頂部雖已依 ADR-0143 展示官方一手唱片封套（`AlbumJacketCard`），但全域點綴與紙膠帶層仍固定為 Stage Gold；若為 110 首歌曲逐首獨立定義色票，將導致資料重複且易與首發封套視覺脫節。

## 決策

1. **領域歸屬（Release-Level SSOT）**：
   - 主題色不掛載於歌曲主檔（`data/songs.json`），而是作為 `theme` 物件（`{ light, lightInk, dark, darkInk, source }`）直接掛載於 [`data/discography.json`](../../data/discography.json) 中每筆具備封套的獨立發行作品（實體單曲、數位單曲、合作單曲、EP、正規／迷你／伴奏專輯）。
   - 歌曲詳情頁透過 `getSongReleaseId(songId)` 依 ADR-0143 一手首發優先權（單曲／合作單曲／EP > 正規專輯）自動繼承對應發行作品之 `theme`。

2. **封面所見即所得（Jacket-Theme Parity）與例外邊界**：
   - 全數 94 首具備官方封套之已發行作品（含 2 首合作單曲 `koi-no-saichu`、`bukiyou-na-futari-de`，對應 `single-koi-no-saichu`）皆適用對應發行作品主題色。
   - 16 首未發行曲目（`unreleased: true`，黑膠佔位圖標）不掛載發行作品，靜默回退為經典 Stage Gold（`#d19f00`）。

3. **離線高彩主色擷取與 WCAG AA 雙模式校準**：
   - 維持零執行期外部 API 依賴與零 CORS 閃爍（ADR-0123），於離線建置期從各發行作品官方 `coverUrl` 擷取高彩視覺重點色（Vibrant Accent），排除純白／純黑大面積底色並校準淺色模式（`light`/`lightInk`）與深色模式（`dark`/`darkInk`），嚴格通過 `>= 4.5:1` WCAG AA 對比門禁後固化寫入 `data/discography.json`。

4. **視圖邊界與靜默回退**：
   - 沿用 ADR-0149 之 Accent & Tape Layer 機制（`resolveRouteEraTheme` + `useEraTheme`），僅於 `viewMode === "archive" && tab === "song"` 時套用歌曲對應之 Release Accent；`#/releases` 發行總覽頁維持 Stage Gold 作為中性舞台框，避免數十張封套色彩同時衝突。

## 影響與結果

- `site/src/lib/song-release.js` 補齊合作單曲 `SINGLE_EP_PROVENANCE` 對映，使 94 首已發行曲目 100% 皆可解析至對應發行 ID。
- `site/src/lib/tour-theme.js` 新增 `resolveReleaseEraTheme` 並擴充 `resolveRouteEraTheme` 支援 `tab === "song"`。
- `site/src/components/slips/SongSlip.jsx` 修正淺／深色標籤對比（將 `bg-band/15` 與 `bg-tape-tint` 上的文字從 `text-band-ink` 改為 `text-ink`）。
- `site/tests/invariants/tour-theme-data.test.js` 同步納入 `data/discography.json` 全數有封套發行作品之 `theme` 與 WCAG AA 對比驗證。
