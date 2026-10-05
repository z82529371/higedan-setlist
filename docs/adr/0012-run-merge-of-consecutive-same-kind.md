# 相連同 kind 卡片合併為一段渲染（run）

> **部分 Superseded**：§7 中關於「unreleased 不參與合併」之限制，已由 [0074](0074-unreleased-song-run-merge.md) 推翻。連續未發行歌曲亦依相同 primaryKind 及 cardTabs 併段為單一 UNRELEASED 紙籤卡片。

連續數首演出曲目若具有相同的卡片級 kind（premiere、satoshi-solo、request），前端以「一段」單一紙籤卡片渲染：卡內**逐行**列出各曲，每行自帶各自的 cue 號（如 M9、M10），不採用「M9–M10」範圍記法。資料層仍逐首標 kind——源頭不變，合併純是呈現層決策。

理由：diff（skip／insert／note）以 order 為錨定單位；若在資料層把多首併成一個區塊節點，錨定與曲目順序的簿記會變複雜，且「歌曲全史」檢視需逐首正確帶標籤。

合併條件：**相同 kind 陣列**（不限單一 tag，如 `["request","satoshi-solo"]`）連續不中斷即併段；但每首的主 kind 須一致，主 kind 不同的相連曲目仍切段。interlude（過場，無 songId）與 unreleased（由歌曲資料推得，非 kind）不參與合併。

同一筆掛多個 kind 時，卡片**頂部以雙（多）標籤條呈現所有 kind**（如「SATOSHI SOLO＋REQUEST」並排的 slip-tab，各按 kind 配色），不再以卡內小徽章補示；卡片主視覺仍以優先序（premiere → unreleased → satoshi-solo → request）決定紙籤底色。歌曲全史檢視維持以小徽章標示 新歌／自彈自唱／點歌。