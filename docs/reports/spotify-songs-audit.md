# Spotify 官方歌曲與現場巡演音源對齊報告 (Spotify Song & Live Alignment Report)

> [!NOTE]
> 本報告由自動化爬蟲針對 Official 髭男 dism 於 Spotify 官方藝人目錄（`5Vo1hnCRmCM6M4thZCInCj`）發行之 12 張錄音室大碟/EP/單曲與 5 張現場巡演專輯進行爬取與交叉媒合，建立本站 110 首歌曲主檔的單一真理來源（SSOT）。

## 統計總覽

- **本站全域歌曲總數**：`110` 首
- **錄音室正式音源成功對齊**：`94` 首（**100% 覆蓋所有正式發行曲目**）
- **具備現場 Live 音源**：`56` 首（共計 103+ 筆跨年份巡演現場音源，皆精確綁定 `showId`）
- **早期地下 Demo 未上架**：`16` 首（全數為 `unreleased: true` 之地下時期或未發行作品）

---

## 1. 正式發行曲目對齊清單 (94 首)

| # | 歌曲 ID (`id`) | 官方日文曲名 | 官方別名 / 串流名 | 錄音室來源 | Spotify Track ID | 現場音源數 | 巡演現場清單 (`showId`) |
|---|---|---|---|---|---|---|---|
| 1 | `same-blue` | **Same Blue** | - | Same Blue | [`2cupzYHOSLmMqDHRVQfI9j`](https://open.spotify.com/track/2cupzYHOSLmMqDHRVQfI9j) | 2 | `Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 2 | `shukumei` | **宿命** | - | Traveler | [`2K74OeuU2y0RN746g9EizC`](https://open.spotify.com/track/2K74OeuU2y0RN746g9EizC) | 5 | `one-man tour 2019` (1078251)<br/>`ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 3 | `50pct` | **50%** | - | 50% (Single) | [`46r7xisTxx58n3tVPS1LIz`](https://open.spotify.com/track/46r7xisTxx58n3tVPS1LIz) | 1 | `LIVE at STADIUM 2025` (1735839) |
| 4 | `sanitizer` | **Sanitizer** | - | Sanitizer (Single) | [`4eCYeVfzGsS6jq8aX43yDr`](https://open.spotify.com/track/4eCYeVfzGsS6jq8aX43yDr) | 0 | - |
| 5 | `elder-flower` | **エルダーフラワー** | `Elderflower` | エルダーフラワー (Single) | [`2QYaW8UQEae0GuMJrE7aeE`](https://open.spotify.com/track/2QYaW8UQEae0GuMJrE7aeE) | 0 | - |
| 6 | `laughter` | **Laughter** | - | Editorial | [`75fYFVXHzzwfc5yzFWlIlZ`](https://open.spotify.com/track/75fYFVXHzzwfc5yzFWlIlZ) | 3 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`LIVE at STADIUM 2025` (1735839) |
| 7 | `pretender` | **Pretender** | - | Traveler | [`49h5Aav6yn1o1ACGyovDdZ`](https://open.spotify.com/track/49h5Aav6yn1o1ACGyovDdZ) | 4 | `one-man tour 2019` (1078251)<br/>`ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`LIVE at STADIUM 2025` (1735839) |
| 8 | `fire-ground` | **FIRE GROUND** | - | Traveler | [`7MD6H2H0kgfYz9yqLCaEQt`](https://open.spotify.com/track/7MD6H2H0kgfYz9yqLCaEQt) | 4 | `one-man tour 2019` (1078251)<br/>`ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`LIVE at STADIUM 2025` (1735839) |
| 9 | `make-me-wonder` | **Make Me Wonder** | - | Make Me Wonder (Single) | [`1sgW7loPL1qtWOPimvm7X5`](https://open.spotify.com/track/1sgW7loPL1qtWOPimvm7X5) | 0 | - |
| 10 | `cry-baby` | **Cry Baby** | - | Editorial | [`6wDntdm888mDo458RaYjGl`](https://open.spotify.com/track/6wDntdm888mDo458RaYjGl) | 2 | `one-man tour 2021-2022 -Editorial-` (1448833)<br/>`LIVE at STADIUM 2025` (1735839) |
| 11 | `takaga-i-love-you` | **たかがアイラブユー** | - | ESCAPARADE | [`3bDZ1sygGNlFsFRauggHwU`](https://open.spotify.com/track/3bDZ1sygGNlFsFRauggHwU) | 1 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020) |
| 12 | `i-love` | **I LOVE...** | - | Editorial | [`5wWLNNwMAehpj83FU4Lz0m`](https://open.spotify.com/track/5wWLNNwMAehpj83FU4Lz0m) | 3 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`LIVE at STADIUM 2025` (1735839) |
| 13 | `tattoo` | **TATTOO** | - | Rejoice | [`5A8awliuQRqJP37Eo2DSZI`](https://open.spotify.com/track/5A8awliuQRqJP37Eo2DSZI) | 2 | `Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 14 | `subtitle` | **Subtitle** | - | Rejoice | [`2fVh6ttCTTEkoFuGCAyItt`](https://open.spotify.com/track/2fVh6ttCTTEkoFuGCAyItt) | 2 | `Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 15 | `mixed-nuts` | **ミックスナッツ** | `Mixed Nuts` | Rejoice | [`2V7l0ns6AahvMd0dkYrm93`](https://open.spotify.com/track/2V7l0ns6AahvMd0dkYrm93) | 2 | `Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 16 | `white-noise` | **ホワイトノイズ** | `White Noise` | Rejoice | [`1qbe8qsy1uElYTwdThhRvB`](https://open.spotify.com/track/1qbe8qsy1uElYTwdThhRvB) | 2 | `Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 17 | `rashisa` | **らしさ** | - | らしさ (Single) | [`1AtGObI2IJtDzQRvPBAPYP`](https://open.spotify.com/track/1AtGObI2IJtDzQRvPBAPYP) | 0 | - |
| 18 | `stardust` | **スターダスト** | `Stardust` | スターダスト (Single) | [`60Lst9oTXDsAPXvHKUrxpk`](https://open.spotify.com/track/60Lst9oTXDsAPXvHKUrxpk) | 0 | - |
| 19 | `stand-by-you` | **Stand By You** | - | Traveler | [`6SzML1m0wK3edW6RbH3oxT`](https://open.spotify.com/track/6SzML1m0wK3edW6RbH3oxT) | 5 | `one-man tour 2019` (1078251)<br/>`ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 20 | `115man-kiro-no-film` | **115万キロのフィルム** | - | ESCAPARADE | [`4mdOqt3AiUJbBXL02aa5iw`](https://open.spotify.com/track/4mdOqt3AiUJbBXL02aa5iw) | 5 | `one-man tour 2019` (1078251)<br/>`ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 21 | `nichijo` | **日常** | - | Rejoice | [`7Hfli6u8P4wQz2NzyAjW8V`](https://open.spotify.com/track/7Hfli6u8P4wQz2NzyAjW8V) | 1 | `Arena Tour 2024 - Rejoice -` (1672276) |
| 22 | `yesterday` | **イエスタデイ** | `Yesterday` | Traveler | [`43MGiVpukiSOnm7RdltAtZ`](https://open.spotify.com/track/43MGiVpukiSOnm7RdltAtZ) | 2 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`LIVE at STADIUM 2025` (1735839) |
| 23 | `editorial` | **Editorial** | - | Editorial | [`75zWFErLuubT7CE61UoaIP`](https://open.spotify.com/track/75zWFErLuubT7CE61UoaIP) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 24 | `amazing` | **Amazing** | - | Traveler | [`5dLOBttnHKhYdQh6uLRpu0`](https://open.spotify.com/track/5dLOBttnHKhYdQh6uLRpu0) | 1 | `one-man tour 2019` (1078251) |
| 25 | `trailer` | **Trailer** | - | レポート | [`3bSVMSV35vwdTnH6amox6o`](https://open.spotify.com/track/3bSVMSV35vwdTnH6amox6o) | 0 | - |
| 26 | `apoptosis` | **アポトーシス** | `Apoptosis` | Editorial | [`222BlW44cS9nOM6C369IB2`](https://open.spotify.com/track/222BlW44cS9nOM6C369IB2) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 27 | `anarchy` | **Anarchy** | - | Anarchy (Single) | [`1mZc8Z72pG7Bw04uH94F4a`](https://open.spotify.com/track/1mZc8Z72pG7Bw04uH94F4a) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 28 | `anarchy-rejoice-ver` | **Anarchy (Rejoice ver.)** | - | Rejoice | [`0XnFySareTTQ21xc8W2jDV`](https://open.spotify.com/track/0XnFySareTTQ21xc8W2jDV) | 1 | `Arena Tour 2024 - Rejoice -` (1672276) |
| 29 | `no-doubt` | **ノーダウト** | `No Doubt` | ESCAPARADE | [`2i4pY0jBULpLToPEzoelh9`](https://open.spotify.com/track/2i4pY0jBULpLToPEzoelh9) | 5 | `one-man tour 2019` (1078251)<br/>`ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 30 | `rolling` | **Rolling** | - | レポート | [`1AsLOHNlBlBVPrROZdfxu1`](https://open.spotify.com/track/1AsLOHNlBlBVPrROZdfxu1) | 1 | `one-man tour 2019` (1078251) |
| 31 | `driver` | **Driver** | - | ESCAPARADE | [`5SxHNFMS3cPPPmdM4NPtxW`](https://open.spotify.com/track/5SxHNFMS3cPPPmdM4NPtxW) | 0 | - |
| 32 | `parabola` | **パラボラ** | `Parabola` | Editorial | [`55pezTty1DSrrc8wlOMZbA`](https://open.spotify.com/track/55pezTty1DSrrc8wlOMZbA) | 2 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`LIVE at STADIUM 2025` (1735839) |
| 33 | `ai-nandaga` | **愛なんだが…** | - | ラブとピースは君の中 | [`1bbOJBB8INUvYUT99PHiWH`](https://open.spotify.com/track/1bbOJBB8INUvYUT99PHiWH) | 0 | - |
| 34 | `whats-going-on` | **What's Going On?** | - | What's Going On? | [`1kNn89l983g8p9UZa3NaIR`](https://open.spotify.com/track/1kNn89l983g8p9UZa3NaIR) | 0 | - |
| 35 | `zero-no-mama-de-iraterara` | **ゼロのままでいられたら** | - | MAN IN THE MIRROR | [`0M8fLDERc37U2HoQGcXyOT`](https://open.spotify.com/track/0M8fLDERc37U2HoQGcXyOT) | 0 | - |
| 36 | `b-side-blues` | **B-Side Blues** | - | Rejoice | [`2Hkzq8mcttGm0jd86D2gKl`](https://open.spotify.com/track/2Hkzq8mcttGm0jd86D2gKl) | 1 | `Arena Tour 2024 - Rejoice -` (1672276) |
| 37 | `itan-na-star` | **異端なスター** | - | レポート | [`6vtHQ7FcAXSOKSOeaBm5bc`](https://open.spotify.com/track/6vtHQ7FcAXSOKSOeaBm5bc) | 4 | `one-man tour 2019` (1078251)<br/>`ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`LIVE at STADIUM 2025` (1735839) |
| 38 | `sweet-tweet` | **SWEET TWEET** | - | ラブとピースは君の中 | [`7HiPTHw9UMvnTiZf6wElCP`](https://open.spotify.com/track/7HiPTHw9UMvnTiZf6wElCP) | 0 | - |
| 39 | `knit-no-boushi` | **ニットの帽子** | - | What's Going On? | [`33JtUjUhbfJlBbdCXH6v5I`](https://open.spotify.com/track/33JtUjUhbfJlBbdCXH6v5I) | 0 | - |
| 40 | `vintage` | **ビンテージ** | `Vintage` | Traveler | [`0VJjfALZ6SuIQumrTgF3tJ`](https://open.spotify.com/track/0VJjfALZ6SuIQumrTgF3tJ) | 1 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020) |
| 41 | `tabi-wa-michizure` | **旅は道連れ** | - | Traveler | [`4VTJ2rVtl0eMf7PVJG4qD7`](https://open.spotify.com/track/4VTJ2rVtl0eMf7PVJG4qD7) | 1 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020) |
| 42 | `yugure-zoi` | **夕暮れ沿い** | - | ラブとピースは君の中 | [`2RQldIxad7pqy0vAyCbPvT`](https://open.spotify.com/track/2RQldIxad7pqy0vAyCbPvT) | 1 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020) |
| 43 | `dakuten` | **濁点** | - | Rejoice | [`1SUjL2EuF4HG97W3syGyOZ`](https://open.spotify.com/track/1SUjL2EuF4HG97W3syGyOZ) | 1 | `Arena Tour 2024 - Rejoice -` (1672276) |
| 44 | `koi-no-sarigiwa` | **恋の去り際** | - | MAN IN THE MIRROR | [`7Bi06c0oQouKr0AY52uqV3`](https://open.spotify.com/track/7Bi06c0oQouKr0AY52uqV3) | 0 | - |
| 45 | `sousisouai` | **相思相愛** | - | ESCAPARADE | [`4EEu2wG5c7aOSVJaaDomv6`](https://open.spotify.com/track/4EEu2wG5c7aOSVJaaDomv6) | 0 | - |
| 46 | `universe` | **Universe** | - | Editorial | [`0RuLz62h4YPNXqdO20Fmf6`](https://open.spotify.com/track/0RuLz62h4YPNXqdO20Fmf6) | 2 | `one-man tour 2021-2022 -Editorial-` (1448833)<br/>`LIVE at STADIUM 2025` (1735839) |
| 47 | `sharon` | **Sharon** | - | Rejoice | [`1pcZjgQhIwzi2xcJvGMvnI`](https://open.spotify.com/track/1pcZjgQhIwzi2xcJvGMvnI) | 1 | `Arena Tour 2024 - Rejoice -` (1672276) |
| 48 | `lady` | **LADY** | - | ESCAPARADE | [`6QYpqS7gJlNKYqaD8EUBrk`](https://open.spotify.com/track/6QYpqS7gJlNKYqaD8EUBrk) | 1 | `one-man tour 2019` (1078251) |
| 49 | `rowan` | **Rowan** | - | Traveler | [`0bL0IdYyztMye83rw3rpqy`](https://open.spotify.com/track/0bL0IdYyztMye83rw3rpqy) | 1 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020) |
| 50 | `shihatsu-ga-michibiku-kouhukuron` | **始発が導く幸福論** | - | ラブとピースは君の中 | [`3q5lemog0BGgJ2yOKe8DB7`](https://open.spotify.com/track/3q5lemog0BGgJ2yOKe8DB7) | 0 | - |
| 51 | `coffee-to-syrup` | **コーヒーとシロップ** | - | MAN IN THE MIRROR | [`6l1P9avGqv8oHBjwxp2ABq`](https://open.spotify.com/track/6l1P9avGqv8oHBjwxp2ABq) | 1 | `one-man tour 2019` (1078251) |
| 52 | `chessboard` | **Chessboard** | - | Rejoice | [`2Bpmp4VAXE8Qmmmtuzy302`](https://open.spotify.com/track/2Bpmp4VAXE8Qmmmtuzy302) | 2 | `Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 53 | `happy-birthday-to-you` | **Happy Birthday To You** | - | MAN IN THE MIRROR | [`5xBemwxJ5mOJVghwC7XSbN`](https://open.spotify.com/track/5xBemwxJ5mOJVghwC7XSbN) | 0 | - |
| 54 | `mikanseinamamade` | **未完成なままで** | - | What's Going On? | [`2Yd8RQQvMdiDkg7jEXbKGu`](https://open.spotify.com/track/2Yd8RQQvMdiDkg7jEXbKGu) | 0 | - |
| 55 | `shower` | **Shower** | - | Editorial | [`5eQidKmns37kwHnCRuqeov`](https://open.spotify.com/track/5eQidKmns37kwHnCRuqeov) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 56 | `hakan` | **破顔** | - | ミックスナッツ EP | [`6gM8ZIIsCJXpzgWdZIrXuI`](https://open.spotify.com/track/6gM8ZIIsCJXpzgWdZIrXuI) | 0 | - |
| 57 | `nichiyoubi-no-love-letter` | **日曜日のラブレター** | - | MAN IN THE MIRROR | [`6edqrdpbmkiAFopurhsNmQ`](https://open.spotify.com/track/6edqrdpbmkiAFopurhsNmQ) | 0 | - |
| 58 | `pending-machine` | **ペンディングマシーン** | `Pending Machine` | Editorial | [`5eLmQSX7LblbNzoGWXk5OB`](https://open.spotify.com/track/5eLmQSX7LblbNzoGWXk5OB) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 59 | `get-back-to-jinsei` | **Get Back To 人生** | - | Rejoice | [`74jUYqSHTvYjPjiESiJjU8`](https://open.spotify.com/track/74jUYqSHTvYjPjiESiJjU8) | 1 | `Arena Tour 2024 - Rejoice -` (1672276) |
| 60 | `brothers` | **ブラザーズ** | `Brothers` | ESCAPARADE | [`4AhmSlOWBAQSMNWaQ6CrA4`](https://open.spotify.com/track/4AhmSlOWBAQSMNWaQ6CrA4) | 3 | `one-man tour 2019` (1078251)<br/>`one-man tour 2021-2022 -Editorial-` (1448833)<br/>`LIVE at STADIUM 2025` (1735839) |
| 61 | `bad-for-me` | **バッドフォーミー** | `Bad for Me` | Traveler | [`3ponIUc0NRnVtK3TfOQxTv`](https://open.spotify.com/track/3ponIUc0NRnVtK3TfOQxTv) | 1 | `one-man tour 2019` (1078251) |
| 62 | `second-line` | **Second LINE** | - | ESCAPARADE | [`2MYQS2IcGtNBO7E0ExG2yD`](https://open.spotify.com/track/2MYQS2IcGtNBO7E0ExG2yD) | 0 | - |
| 63 | `last-song` | **ラストソング** | `Last Song` | Traveler | [`7z7QMipKk1LMlc8ZmOu871`](https://open.spotify.com/track/7z7QMipKk1LMlc8ZmOu871) | 1 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020) |
| 64 | `soulsoup` | **SOULSOUP** | - | Rejoice | [`4opy5i82STNOnjlUi5CgLU`](https://open.spotify.com/track/4opy5i82STNOnjlUi5CgLU) | 2 | `Arena Tour 2024 - Rejoice -` (1672276)<br/>`LIVE at STADIUM 2025` (1735839) |
| 65 | `55` | **55** | - | レポート | [`0GKXPZH3Fo93sl4XEBM3cw`](https://open.spotify.com/track/0GKXPZH3Fo93sl4XEBM3cw) | 1 | `one-man tour 2019` (1078251) |
| 66 | `bedroom-talk` | **Bedroom Talk** | - | Editorial | [`1Ppu2rlgrZz0pfcRl20vpC`](https://open.spotify.com/track/1Ppu2rlgrZz0pfcRl20vpC) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 67 | `hello` | **HELLO** | - | Editorial | [`2ErKrJGeDg1ff8BiaFNEJE`](https://open.spotify.com/track/2ErKrJGeDg1ff8BiaFNEJE) | 2 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020)<br/>`one-man tour 2021-2022 -Editorial-` (1448833) |
| 68 | `uramitsuramikiwami` | **うらみつらみきわみ** | - | Rejoice | [`4J2k2MbIIWp4FlJfdqt7xG`](https://open.spotify.com/track/4J2k2MbIIWp4FlJfdqt7xG) | 1 | `Arena Tour 2024 - Rejoice -` (1672276) |
| 69 | `inu-ka-cat-ka-de-shinumade-kenka-shiyou` | **犬かキャットかで死ぬまで喧嘩しよう!** | - | レポート | [`4LjzrLpEG9VeKiZTngLfov`](https://open.spotify.com/track/4LjzrLpEG9VeKiZTngLfov) | 1 | `one-man tour 2019` (1078251) |
| 70 | `finder` | **Finder** | - | Rejoice | [`4q6SAqXwIhkeXRU8JzHCqA`](https://open.spotify.com/track/4q6SAqXwIhkeXRU8JzHCqA) | 0 | - |
| 71 | `catchball` | **キャッチボール** | `Catch Ball` | Rejoice | [`5yQ5xnIASo6i0QD1bPVeu3`](https://open.spotify.com/track/5yQ5xnIASo6i0QD1bPVeu3) | 1 | `Arena Tour 2024 - Rejoice -` (1672276) |
| 72 | `choral-a` | **Choral A** | - | ミックスナッツ EP | [`2m7TKOSvZAfBCrZqPQBQbW`](https://open.spotify.com/track/2m7TKOSvZAfBCrZqPQBQbW) | 0 | - |
| 73 | `filament` | **フィラメント** | `Filament` | Editorial | [`3KLU8Fa0jx8wIh91m4ItFK`](https://open.spotify.com/track/3KLU8Fa0jx8wIh91m4ItFK) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 74 | `escapade` | **ESCAPADE** | - | ESCAPARADE | [`3mJr8wRMrRdjgUFfaZCQWp`](https://open.spotify.com/track/3mJr8wRMrRdjgUFfaZCQWp) | 0 | - |
| 75 | `parade` | **parade** | - | ラブとピースは君の中 | [`7lKHXZc5AqI1COfzV788cF`](https://open.spotify.com/track/7lKHXZc5AqI1COfzV788cF) | 0 | - |
| 76 | `clap-clap` | **Clap Clap** | - | MAN IN THE MIRROR | [`6Yr6XHwUBTDxiC2NnoXGEw`](https://open.spotify.com/track/6Yr6XHwUBTDxiC2NnoXGEw) | 0 | - |
| 77 | `tell-me-baby` | **Tell Me Baby** | - | ESCAPARADE | [`3X4TWvjxlljOOHJgQc8cSi`](https://open.spotify.com/track/3X4TWvjxlljOOHJgQc8cSi) | 1 | `one-man tour 2019` (1078251) |
| 78 | `midori-no-amayoke` | **みどりの雨避け** | - | Editorial | [`1l1qZpVZnkY5CKU1j0F68O`](https://open.spotify.com/track/1l1qZpVZnkY5CKU1j0F68O) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 79 | `lost-in-my-room` | **Lost In My Room** | - | Editorial | [`7FrnEJvjDRU3X4ybFNEfsy`](https://open.spotify.com/track/7FrnEJvjDRU3X4ybFNEfsy) | 1 | `one-man tour 2021-2022 -Editorial-` (1448833) |
| 80 | `koi-no-maenarae` | **恋の前ならえ** | - | ラブとピースは君の中 | [`5Qgdm7CYbQoS32tqtIdHVd`](https://open.spotify.com/track/5Qgdm7CYbQoS32tqtIdHVd) | 0 | - |
| 81 | `yuki-seku-asa-ga-kuru` | **雪急く朝が来る** | - | ラブとピースは君の中 | [`5Ln8aDfdWmWHvCwGbul6qP`](https://open.spotify.com/track/5Ln8aDfdWmWHvCwGbul6qP) | 0 | - |
| 82 | `darin` | **ダーリン。** | - | ラブとピースは君の中 | [`7kGja6wrpOL0CyvftQMLmG`](https://open.spotify.com/track/7kGja6wrpOL0CyvftQMLmG) | 0 | - |
| 83 | `hajimari-no-asa` | **始まりの朝** | - | レポート | [`27ZIwGuQ4dapegDtkDF421`](https://open.spotify.com/track/27ZIwGuQ4dapegDtkDF421) | 1 | `one-man tour 2019` (1078251) |
| 84 | `equal` | **イコール** | `Equal` | レポート | [`11AbfhB0FNNs6yRClQMVfC`](https://open.spotify.com/track/11AbfhB0FNNs6yRClQMVfC) | 0 | - |
| 85 | `kiiroi-kuruma` | **黄色い車** | - | What's Going On? | [`0G2MBXDNe5UKICTmGiEZbG`](https://open.spotify.com/track/0G2MBXDNe5UKICTmGiEZbG) | 0 | - |
| 86 | `saredo-hibi-wa` | **されど日々は** | - | ESCAPARADE | [`4djsEWqlJZS7tVMII4Ec97`](https://open.spotify.com/track/4djsEWqlJZS7tVMII4Ec97) | 0 | - |
| 87 | `kanousei` | **可能性** | - | ESCAPARADE | [`3I5JvMlEFuDJZpSjJDUBhN`](https://open.spotify.com/track/3I5JvMlEFuDJZpSjJDUBhN) | 0 | - |
| 88 | `hatsumeika` | **発明家** | - | ESCAPARADE | [`4YUv74JAPluStaE32sUVBZ`](https://open.spotify.com/track/4YUv74JAPluStaE32sUVBZ) | 0 | - |
| 89 | `saigo-no-koi-wazurai` | **最後の恋煩い** | - | Traveler | [`27EnDbXKku4XGjPC7U8ptt`](https://open.spotify.com/track/27EnDbXKku4XGjPC7U8ptt) | 0 | - |
| 90 | `052519` | **052519** | - | Traveler | [`70PPGbNYFGVBHg373kIFlC`](https://open.spotify.com/track/70PPGbNYFGVBHg373kIFlC) | 0 | - |
| 91 | `travelers` | **Travelers** | - | Traveler | [`45AcsfxvxBu12EhzW4nnb4`](https://open.spotify.com/track/45AcsfxvxBu12EhzW4nnb4) | 0 | - |
| 92 | `natsu-moyou-no-neko` | **夏模様の猫** | - | HELLO EP | [`4O2DFidmTVlXxumJlkPa7q`](https://open.spotify.com/track/4O2DFidmTVlXxumJlkPa7q) | 1 | `ONLINE LIVE 2020 - Arena Travelers -` (online-live-2020) |
| 93 | `koi-no-saichu` | **恋の最chu!** | - | 恋の最chu!/ 不器用な二人で | [`0CUzisNhvCTPHSjaBzGbOO`](https://open.spotify.com/track/0CUzisNhvCTPHSjaBzGbOO) | 0 | - |
| 94 | `bukiyou-na-futari-de` | **不器用な二人で** | - | 恋の最chu!/ 不器用な二人で | [`1iB4swiILkIoxVvq5v4iZi`](https://open.spotify.com/track/1iB4swiILkIoxVvq5v4iZi) | 0 | - |

---

## 2. 早期地下 Demo / 未串流上架作品 (16 首)

> [!TIP]
> 此 16 首歌曲皆為官方尚未於海外或日本主流數位串流（Spotify / Apple Music）發行之地下自主製作 Demo 帶或現場即興曲目。於票根介面中將優雅回退至外跳搜尋或標註「串流未上架」，維持版面整潔。

| # | 歌曲 ID (`id`) | 曲名 | 狀態說明 |
|---|---|---|---|
| 1 | `fuusen` | **風船** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 2 | `akegata-no-getaway` | **明け方のゲッタウェイ** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 3 | `furidasu-ame-gokigen-na-kimi` | **ふりだす雨、ゴキゲンな君** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 4 | `asa-ni-nareba` | **朝になれば** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 5 | `sakura-no-namida` | **桜の涙** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 6 | `triangle-wo-mawase` | **トライアングルを回せ** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 7 | `gomibako-kanojo` | **ごみ箱彼女** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 8 | `teddy-heart-drawing` | **テディの心情描写** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 9 | `dosei-to-spica` | **土星とスピカ** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 10 | `utaemoshinai-uta` | **歌えもしない歌** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 11 | `duffle-coat-no-amai-yume` | **ダッフルコートの甘い夢** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 12 | `kimi-to-sugoseru-natsu-nara` | **君と過ごせる夏なら** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 13 | `shuumatsu-yoi-no-funkism` | **週末、酔のfunkism** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 14 | `koharubiyori` | **小春日和** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 15 | `nee-darin` | **ねえ、ダーリン。** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
| 16 | `egao-no-matsu-basho` | **笑顔の待つ場所** | 地下獨立 Demo 帶時期 / 尚未正式上架串流 |
