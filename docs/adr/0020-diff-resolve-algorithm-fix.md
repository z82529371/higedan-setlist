# 0020 Diff 還原演算法與被跳過錨點保護規格

## 背景
原先前端 `App.jsx` 中的 `resolve(diff, tpl)` 演算法，在處理 `skip` 與 `insert` 時採用 `tpl.filter(i => !skip.has(i.order))` 先過濾再插值。當某首模板歌曲被 `skip` 時，掛在該歌曲 `order` 之後插入 (`after`) 的新歌會被連帶抹除，造成還原後曲數少於真實曲數。

## 決策
1. **修復 `resolve(diff, tpl)` 獨立插值演算法**：
   - 將 `skip` 的過濾與 `insert` 的插值完全解耦獨立。
   - 不論範本項是否被 `skip`，只要該 `order` 號碼下掛有 `insert` 歌曲（包含 `after: 0`），插入歌曲均 100% 完整還原並呈現在正確曲序中。
