# ADR-0089: 日系手撕和紙膠帶、微縮防偽線與實體票券雙色結構工藝 (Serrated Washi Tape, Microprint Security Stripe, and Two-Tone Ticket Stub Architecture)

## 狀態
已通過 (Accepted)

## 背景 (Context)
在 ADR-0088 解決了膠帶半透明透光與基本撕票缺口問題後，使用者進一步針對「紙膠帶擬真度」與「票券實體層次」提出改進要求：
1. **紙膠帶擬真度**：先前的純黃色塊雖不透底，但兩端平直、表面單調，缺乏真實日本文具和紙膠帶（Washi Tape）經由膠帶台鋸齒齒刀撕下時的咬痕邊（Zig-zag edge）與和紙紙漿的微消光斜向纖維質感。
2. **票券本體結構層次**：整張單據原本維持單一純白背景，缺乏實體日本演唱會門票（如 PIA、Lawson Ticket 或官方專場硬票）常見的「上半截驗票存根（Stub）」與「下半截歌單本券」的雙色層次分界，以及防偽微縮線條。
3. **極簡票券版面原則**：依使用者回饋，取消額外蓋印朱紅戳章，維持票券資訊純淨易讀與專業控台票券風格。

---

## 決策 (Decision)

### 1. 齒刀鋸齒手撕和紙膠帶 (`.washi-tape`, `SLIP_TAPE`)
- **鋸齒撕裂邊（Zig-zag Sawtooth Edge）**：
  - 運用 CSS `clip-path: polygon(...)`，在膠帶左右兩側切劃出 5 個微細的三角齒刀咬痕，完美重現手撕和紙膠帶斷面的物理特徵。
  - 搭配 `filter: drop-shadow(0 2px 4px rgba(0,0,0,0.24))`，讓投影沿著鋸齒輪廓精確投射，不再受到一般 `box-shadow` 的矩形限制。
- **和紙半消光斜纖維（Washi Paper Fibers）**：
  - 在官方芥末黃色底（`--color-band`）之上，疊加 45° 微細半透明白紋（`repeating-linear-gradient(45deg, rgba(255,255,255,0.16)...)`），營造和紙自然啞光紙纖維觸感，同時維持 95%+ 實心覆蓋率，杜絕後方邊框穿透。

### 2. 日系雙色票券結構（Two-Tone Ticket Stub Architecture）
- **票頭存根層次**：
  - 將上半截票根抬頭區塊（包含演出名稱、場次、時間、場館與操作列）設定為溫潤的日系微暖紙色（`bg-paper/40`），負邊距通欄貼齊卡片頂部與兩側邊框。
  - 下半截演出曲目清單本體維持純淨白卡（`bg-card`），形成實體票券在撕票前「驗票副券」與「歌迷收藏主聯」的經典雙色票根分界。

### 3. 微縮防偽線與實體撕票齒孔 (`<TicketPerforationDivider />`)
- **無縫接合**：撕票齒線緊貼雙色票根下緣，左側與右側各具備內凹半圓咬口，中央貫穿 `border-t-[2px] border-dashed border-ink/40`。
- **微縮文字安全帶（Microprint Security Stripe）**：
  - 在撕票線正下方加入極細微的等寬防偽微縮文字（`•••• OFFICIAL HIGEDAN DISM STAGE ARCHIVE •••• ADMIT ONE ALL ACCESS •••• OFFICIAL HIGEDAN DISM ••••` 與 `SEC-PASS // VALIDATED`），完美還原專業防偽票券印刷特徵。

---

## 後果 (Consequences)

### 正面影響 (Positive)
1. **工藝細節大幅飛躍**：鋸齒和紙膠帶、微縮防偽線與雙色票身相輔相成，單據卡片完全脫離了一般「網頁表格」的呆板框線感，晉升為具有溫度與收藏價值的官方演唱會實體紀念特等席門票。
2. **純淨視覺焦點**：移除多餘朱印戳章干擾，版面焦點完全保留於樂團品牌、巡演資訊與曲目演出清單。
3. **無損人體工學與效能**：所有擬物細節均採用原生 CSS（clip-path, repeating-linear-gradient）實作，完全零額外圖片資源負擔。
