import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { resolve, assignCues, encoreStartOrderOf } from "../../src/lib/resolve.js";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

const { React, renderToStaticMarkup } = await getReactAndRenderer();

if (!globalThis.window) {
  globalThis.window = {
    location: { hash: "", pathname: "/" },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    innerHeight: 800,
  };
}
if (!globalThis.document) {
  globalThis.document = {
    body: { style: {} },
  };
}

describe("15. Localized Search Invariants in SearchBox (Issue #18)", () => {
    let SearchBox;
    let I18nProvider;
    let buildIndex;
    let allUnits;
    let index;

    before(async () => {
      const searchBoxMod = await loadModule("/src/components/SearchBox.jsx");
      SearchBox = searchBoxMod.default;

      const i18nMod = await loadModule("/src/lib/i18n.jsx");
      I18nProvider = i18nMod.I18nProvider;

      const domainMod = await loadModule("/src/lib/domain.js");
      buildIndex = domainMod.buildIndex;
      allUnits = domainMod.allUnits;
      index = buildIndex();
    });

    it("matches Japanese taxonomy keywords (フェス, 対バン, ツアー) and renders localized category badges in ja", () => {
      // 1. Search "フェス" (Festival)
      const htmlFesJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "フェス",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlFesJa.includes("ROCK IN JAPAN") || htmlFesJa.includes("SUMMER SONIC"), "Must include rock fest events");
      assert.ok(htmlFesJa.includes("フェス"), "Must render localized category badge 'フェス' in candidate");

      // 2. Search "対バン" (Joint Gig)
      const htmlJointJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "対バン",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlJointJa.includes("対バン"), "Must render localized category badge '対バン'");

      // 3. Search "ツアー" (Tour)
      const htmlTourJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "ツアー",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlTourJa.includes("ツアー"), "Must render localized category badge 'ツアー'");
      assert.ok(htmlTourJa.includes("Rejoice") || htmlTourJa.includes("Editorial"), "Must match headline tours");
    });

    it("matches English taxonomy keywords (Festival, Joint Gig, Tour) and renders localized category badges in en", () => {
      // 1. Search "Festival"
      const htmlFesEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Festival",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlFesEn.includes("Festival"), "Must render localized category badge 'Festival' in en");
      assert.ok(htmlFesEn.includes("ROCK IN JAPAN") || htmlFesEn.includes("SUMMER SONIC"), "Must match festival units");

      // 2. Search "Joint Gig"
      const htmlJointEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Joint Gig",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlJointEn.includes("Joint Gig"), "Must render localized category badge 'Joint Gig' in en");

      // 3. Search "Tour"
      const htmlTourEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Tour",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlTourEn.includes("Tour"), "Must render localized category badge 'Tour' in en");
      assert.ok(htmlTourEn.includes("Rejoice") || htmlTourEn.includes("Editorial"), "Must match tour units");
    });

    it("searches localized arrangement badge keywords (弾き語り, Satoshi Solo, リクエスト, Request, 新曲, New Song)", () => {
      // 1. Search "弾き語り" in Japanese
      const htmlSoloJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "弾き語り",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlSoloJa.includes("無相符的日期、歌曲、演出或場地"), "Must match satoshi-solo arrangements");
      assert.ok(htmlSoloJa.includes("弾き語り"), "Candidate must display localized solo badge or subtitle");

      // 2. Search "Satoshi Solo" in English
      const htmlSoloEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Satoshi Solo",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlSoloEn.includes("無相符的日期、歌曲、演出或場地"), "Must match satoshi-solo in en");
      assert.ok(htmlSoloEn.includes("Satoshi Solo"), "Candidate must display localized Satoshi Solo label in en");

      // 3. Search "リクエスト" in Japanese
      const htmlReqJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "リクエスト",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlReqJa.includes("無相符的日期、歌曲、演出或場地"), "Must match request arrangements");
      assert.ok(htmlReqJa.includes("リクエスト"), "Candidate must display localized request badge");

      // 4. Search "Request" in English
      const htmlReqEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "Request",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlReqEn.includes("無相符的日期、歌曲、演出或場地"), "Must match request in en");
      assert.ok(htmlReqEn.includes("Request"), "Candidate must display Request badge");

      // 5. Search "新曲" in Japanese
      const htmlNewJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "新曲",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlNewJa.includes("無相符的日期、歌曲、演出或場地"), "Must match premiere arrangements");
      assert.ok(htmlNewJa.includes("新曲"), "Candidate must display localized 新曲 badge");

      // 6. Search "New Song" in English
      const htmlNewEn = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "New Song",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(!htmlNewEn.includes("無相符的日期、歌曲、演出或場地"), "Must match premiere in en");
      assert.ok(htmlNewEn.includes("New Song"), "Candidate must display New Song badge");
    });

    it("maintains ADR-0105 dual-language song title and official English alias indexing intact", () => {
      // 1. Search canonical English title "Pretender"
      const htmlPretender = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "Pretender",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlPretender.includes("Pretender"), "Must match Pretender");

      // 2. Search Japanese title "ノーダウト"
      const htmlNoDoubt = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(SearchBox, {
            q: "ノーダウト",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlNoDoubt.includes("ノーダウト"), "Must match ノーダウト");

      // 3. Search official English alias "Mixed Nuts"
      const htmlMixedNuts = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "Mixed Nuts",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlMixedNuts.includes("ミックスナッツ"), "Must match ミックスナッツ via alias");
      assert.ok(htmlMixedNuts.includes("Mixed Nuts"), "Must render alias Mixed Nuts");

      // 4. Search official English alias "No Doubt"
      const htmlNoDoubtAlias = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(SearchBox, {
            q: "No Doubt",
            setQ: () => {},
            allUsedSongs: index.allUsedSongs,
            allUnits: allUnits,
            allVenues: index.allVenues,
            isMobileModal: true,
          })
        )
      );
      assert.ok(htmlNoDoubtAlias.includes("ノーダウト"), "Must match ノーダウト via alias");
      assert.ok(htmlNoDoubtAlias.includes("No Doubt"), "Must render alias No Doubt");
    });
  });
