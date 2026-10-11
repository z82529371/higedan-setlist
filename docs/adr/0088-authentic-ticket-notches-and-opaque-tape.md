# ADR-0088: 實體演唱會門票擬物工藝：不透明封箱膠帶、雙側撕票缺口與典藏條碼 (Authentic Concert Ticket Notches, Opaque Gaffer Tape, and Vintage Barcode)

## 狀態
部分已被替代 (Partially Superseded by [ADR-0089](0089-washi-tape-and-concert-stub-craftsmanship.md)：膠帶部分升級為日系手撕鋸齒和紙膠帶；沖孔缺口、撕票虛線與條碼底欄依然有效)

## 背景 (Context)
在先前版本中，單據卡片（Ticket Slip：`ShowSlip`、`SongSlip`、`VenueSlip`）存在兩項視覺與質感問題：
1. **膠帶半透明穿透 (See-Through Tape)**：原 `SLIP_TAPE` 使用了 `bg-tape-soft`（約 45% 透明度）與 `backdrop-blur-[0.5px]`，導致卡片頂部的黑色邊框與底下的字樣會從膠帶內部直接穿透透射出來，像廉價玻璃紙而非真正的演唱會後台控台大力膠／封箱膠帶（Gaffer Tape）。
2. **缺乏實體票券質感與儀式感 (Lack of Tactile Ticket Cues)**：單據頂部票根與下方曲目清單之間僅有簡單分隔線，整體形態偏向網頁資料表，缺乏實體演唱會門票、入場票根（Ticket Stub）、沖孔齒孔撕線（Perforated Tear Line）以及雷射／防偽條碼等實體票券的核心特徵。

使用者明確要求：「讓票 更像票一點 有質感一點 ，另外膠帶 怎麼看的到後面」。

---

## 決策 (Decision)

### 1. 100% 實心不透明官方品牌膠帶 (`SLIP_TAPE`)
- 將 `SLIP_TAPE` 背景改為 100% 實心不透明的 Official 髭男 dism 芥末黃 (`bg-band` / `#d19f00`)。
- 賦予 `z-20` 高層級，完全覆蓋並隱藏底下卡片的 1.5px 黑色上邊框與任何文字，杜絕看透穿景現象。
- 兩側保留細緻虛線切口（`border-x-[2px] border-dashed border-ink/40`）與逼真微立體投影（`shadow-[0_2px_5px_rgba(0,0,0,0.22)]`），完美還原工作人員撕下貼在紙上的實體封箱膠帶質感。

### 2. 雙側內凹半圓沖孔與虛線撕票齒線 (`TicketPerforationDivider`)
- 在所有票券（`ShowSlip`、`SongSlip`、`VenueSlip`）的「票根資訊抬頭（Stub）」與「詳細清單本體」交界處，插入擬物撕票分隔組件 `<TicketPerforationDivider />`：
  - **負邊界通欄**：使用 `-mx-[26px] max-sm:-mx-4` 跨越內縮邊距，精確銜接卡片左右兩側邊框。
  - **左右內凹沖孔**：左右兩側各設置 `h-[22px] w-[13px]` 內凹半圓咬口，以 `bg-paper` 完全遮擋該段卡片外框，並以 `border-r-[1.5px] border-y-[1.5px] border-ink`（左側）及 `border-l-[1.5px] border-y-[1.5px] border-ink`（右側）向內弧度包邊，形成真實打孔切除的票券缺口。
  - **中央虛線齒痕**：中央貫穿 `border-t-[2px] border-dashed border-ink/40`，模擬票券撕除線（Perforation line）。
- 同步移除票根抬頭原本生硬的 `border-b-2 border-ink pb-4`，改由齒孔分隔線自然承接轉折。

### 3. 官方典藏序號與老式票券條碼底欄 (`TicketBarcodeFooter`)
- 統一在三種單據底部替換為 `<TicketBarcodeFooter serial={...} label={...} />`：
  - **專屬流水號 (Serial Number)**：
    - 場次單：`SN: HG-YYYYMMDD-XXXX`（依場次日期與代碼合成）。
    - 歌曲單：`TRACK: SONGID // PERF-XXX`（依曲目 ID 與累計演唱場數合成）。
    - 場地單：`VENUE: VENUENAME // PASS-XXX`（依場館名與歷史演出場次合成）。
  - **老式條碼裝飾 (Vintage Barcode)**：運用不同寬度與高度的條紋組合（`span className="w-[2px] h-full bg-ink"` 等），營造真實演出門票底部的復古條碼視覺。

---

## 後果 (Consequences)

### 正面影響 (Positive)
1. **徹底解決膠帶透底問題**：實心芥末黃膠帶不再透出背後邊框，乾淨且具備沉穩扎實的手作手感。
2. **實體門票儀式感大幅躍升**：左右咬口沖孔與穿孔齒線打破了一般網頁單調方框的既視感，讓每一張場次、歌曲與場地單據都宛如一張可以撕開的真實演唱會特等席門票／工程執行清單。
3. **全域一致性**：無論切換到場次、歌曲或場地，皆維持統一且精緻的票券美學體系。
