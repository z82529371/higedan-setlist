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

describe("13. i18n Foundation, Hash Route Query Parameter Seam, and Header Switcher (#16)", () => {
    it("parses hash routes with optional ?lang= query param while preserving naked route backwards compatibility", async () => {
      const routesMod = await loadModule("/src/lib/routes.js");
      const trackMod = await loadModule("/src/lib/track.js");

      // Backward compatibility for naked hash routes
      assert.deepEqual(routesMod.parseRoute("#/song/pretender"), { kind: "song", value: "pretender" });
      assert.deepEqual(routesMod.parseRoute("#/show/1672276"), { kind: "show", value: "1672276" });
      assert.deepEqual(routesMod.parseRoute("#/venue/%E6%97%A5%E6%9C%AC%E6%AD%A6%E9%81%93%E9%A4%A8"), { kind: "venue", value: "日本武道館" });
      assert.deepEqual(routesMod.parseRoute("#/tour/arena-tour-2024-rejoice"), { kind: "tour", value: "arena-tour-2024-rejoice" });

      // Extraction of ?lang= query param
      assert.deepEqual(routesMod.parseRoute("#/song/pretender?lang=ja"), { kind: "song", value: "pretender", lang: "ja" });
      assert.deepEqual(routesMod.parseRoute("#/show/1672276?lang=en"), { kind: "show", value: "1672276", lang: "en" });
      assert.deepEqual(routesMod.parseRoute("#/venue/%E6%97%A5%E6%9C%AC%E6%AD%A6%E9%81%93%E9%A4%A8?lang=ko"), { kind: "venue", value: "日本武道館", lang: "ko" });
      assert.deepEqual(routesMod.parseRoute("#/tour/arena-tour-2024-rejoice?lang=zh-TW"), { kind: "tour", value: "arena-tour-2024-rejoice", lang: "zh-TW" });

      // Case insensitivity & normalization for query param
      assert.deepEqual(routesMod.parseRoute("#/song/pretender?lang=JA"), { kind: "song", value: "pretender", lang: "ja" });
      assert.deepEqual(routesMod.parseRoute("#/song/pretender?lang=en-US"), { kind: "song", value: "pretender", lang: "en" });

      // Unknown or unsupported lang is ignored
      assert.deepEqual(routesMod.parseRoute("#/song/pretender?lang=fr"), { kind: "song", value: "pretender" });

      // Route builder generates ?lang= when requested
      assert.equal(routesMod.routeHash.song("pretender", { lang: "en" }), "#/song/pretender?lang=en");
      assert.equal(routesMod.routeHash.song("pretender", "ja"), "#/song/pretender?lang=ja");
      assert.equal(routesMod.routeHash.song("pretender", { lang: "zh-TW" }), "#/song/pretender");
      assert.equal(routesMod.routeHash.song("pretender"), "#/song/pretender");

      // Backwards compatibility via track.js re-export
      assert.equal(trackMod.parseRoute, routesMod.parseRoute);
      assert.equal(trackMod.routeHash, routesMod.routeHash);
    });

    it("resolves initial locale following priority waterfall (URL param > localStorage > navigator.language > default zh-TW)", async () => {
      const { resolveInitialLocale, DEFAULT_LOCALE } = await loadModule("/src/lib/i18n.jsx");

      // 1. URL hash query param takes precedence
      assert.equal(
        resolveInitialLocale({
          window: { location: { hash: "#/song/pretender?lang=ja" } },
          localStorage: { getItem: () => "en" },
          navigator: { language: "ko-KR" },
        }),
        "ja"
      );

      // 2. localStorage takes precedence when no hash param
      assert.equal(
        resolveInitialLocale({
          window: { location: { hash: "#/song/pretender" } },
          localStorage: { getItem: (k) => (k === "hg_locale" ? "en" : null) },
          navigator: { language: "ko-KR" },
        }),
        "en"
      );

      // 3. navigator.language takes precedence when no localStorage
      assert.equal(
        resolveInitialLocale({
          window: { location: { hash: "" } },
          localStorage: { getItem: () => null },
          navigator: { language: "ko-KR" },
        }),
        "ko"
      );

      // 4. Default fallback to zh-TW
      assert.equal(
        resolveInitialLocale({
          window: { location: { hash: "" } },
          localStorage: { getItem: () => null },
          navigator: { language: "fr-FR" },
        }),
        DEFAULT_LOCALE
      );

      assert.equal(
        resolveInitialLocale({}),
        DEFAULT_LOCALE
      );
    });

    it("provides complete dictionaries and translation lookup via I18nProvider and useI18n across all 4 locales", async () => {
      const i18nMod = await loadModule("/src/lib/i18n.jsx");
      const { I18nProvider, useI18n, SUPPORTED_LOCALES, DICTIONARIES } = i18nMod;

      assert.deepEqual(SUPPORTED_LOCALES, ["zh-TW", "ja", "en", "ko"]);
      assert.ok(DICTIONARIES, "DICTIONARIES table must be exported");

      // Verify all 4 locales have required dictionary sections
      const sections = ["nav", "header", "categories", "badges", "regions", "tiers", "actions", "landing"];
      for (const loc of SUPPORTED_LOCALES) {
        const dict = DICTIONARIES[loc];
        assert.ok(dict, `Dictionary for ${loc} must exist`);
        for (const sec of sections) {
          assert.ok(dict[sec], `Dictionary for ${loc} must contain section '${sec}'`);
        }

        // Check landing keys
        assert.ok(dict.landing.hotExploration, `landing.hotExploration must exist in ${loc}`);
        assert.ok(dict.landing.hotPrompts?.rejoiceTour, `landing.hotPrompts.rejoiceTour must exist in ${loc}`);
        assert.ok(dict.landing.hotPrompts?.taipeiShow, `landing.hotPrompts.taipeiShow must exist in ${loc}`);
        assert.ok(dict.landing.hotPrompts?.songRanking, `landing.hotPrompts.songRanking must exist in ${loc}`);
        assert.ok(dict.landing.features?.bidirectionalTitle, `landing.features.bidirectionalTitle must exist in ${loc}`);
        assert.ok(dict.landing.features?.bidirectionalDesc, `landing.features.bidirectionalDesc must exist in ${loc}`);
        assert.ok(dict.landing.features?.bidirectionalAction, `landing.features.bidirectionalAction must exist in ${loc}`);
        assert.ok(dict.landing.features?.ticketStubTitle, `landing.features.ticketStubTitle must exist in ${loc}`);
        assert.ok(dict.landing.features?.ticketStubDesc, `landing.features.ticketStubDesc must exist in ${loc}`);
        assert.ok(dict.landing.features?.ticketStubAction, `landing.features.ticketStubAction must exist in ${loc}`);
        assert.ok(dict.landing.features?.provenanceTitle, `landing.features.provenanceTitle must exist in ${loc}`);
        assert.ok(dict.landing.features?.provenanceDesc, `landing.features.provenanceDesc must exist in ${loc}`);
        assert.ok(dict.landing.features?.provenanceAction, `landing.features.provenanceAction must exist in ${loc}`);
        assert.ok(dict.landing.primaryCta, `landing.primaryCta must exist in ${loc}`);
        assert.ok(dict.landing.primaryCtaSubtitle, `landing.primaryCtaSubtitle must exist in ${loc}`);
        assert.ok(dict.landing.footerDisclaimer, `landing.footerDisclaimer must exist in ${loc}`);

        // Check 8 categories
        const expectedCategories = [
          "巡演專場", "特別專場", "聯合專場", "店家活動",
          "音樂祭", "學園祭", "電視演出", "線上直播"
        ];
        for (const cat of expectedCategories) {
          assert.ok(dict.categories[cat], `categories.${cat} must exist in ${loc}`);
        }

        // Check 4 badges
        for (const badge of ["premiere", "satoshi-solo", "request", "unreleased"]) {
          assert.ok(dict.badges[badge], `badges.${badge} must exist in ${loc}`);
        }
      }

      // Verify SSR rendering with I18nProvider
      function Consumer() {
        const { locale, t } = useI18n();
        return React.createElement(
          "div",
          { id: "test-consumer" },
          `${locale}:${t("nav.shows")}:${t("categories.巡演專場")}:${t("non.existent", "Fallback")}`
        );
      }

      for (const loc of SUPPORTED_LOCALES) {
        const expectedShows = loc === "zh-TW" ? "場次" : loc === "ja" ? "公演" : loc === "en" ? "Shows" : "공연";
        const expectedTour = loc === "zh-TW" ? "巡演專場" : loc === "ja" ? "ツアー" : loc === "en" ? "Tour" : "투어";
        const html = renderToStaticMarkup(
          React.createElement(
            I18nProvider,
            { initialLocale: loc },
            React.createElement(Consumer)
          )
        );
        assert.ok(html.includes(`${loc}:${expectedShows}:${expectedTour}:Fallback`), `SSR markup for ${loc} must match`);
      }
    });

    it("renders ticket-styled LanguageSwitcher in LandingHero and ArchiveHeader with localized chrome labels", async () => {
      const { LanguageSwitcher } = await loadModule("/src/components/LanguageSwitcher.jsx");
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ArchiveHeader } = await loadModule("/src/components/layout/ArchiveHeader.jsx");
      const LandingHeroMod = await loadModule("/src/components/LandingHero.jsx");
      const LandingHero = LandingHeroMod.default;

      // 1. LanguageSwitcher standalone ticket aesthetic tokens & ARIA
      const swHtmlZh = renderToStaticMarkup(
        React.createElement(I18nProvider, { initialLocale: "zh-TW" }, React.createElement(LanguageSwitcher))
      );
      assert.ok(swHtmlZh.includes("繁中"), "must render active locale label '繁中'");
      assert.ok(swHtmlZh.includes("🌐"), "must contain globe icon");
      assert.ok(swHtmlZh.includes("border-[1.5px]"), "must adhere to ticket border-1.5px token");
      assert.ok(swHtmlZh.includes("bg-card"), "must use card background token");
      assert.ok(swHtmlZh.includes("touch-stamp"), "must apply mobile touch-stamp class");
      assert.ok(swHtmlZh.includes('aria-haspopup="true"'), "must have aria-haspopup");

      const swHtmlJa = renderToStaticMarkup(
        React.createElement(I18nProvider, { initialLocale: "ja" }, React.createElement(LanguageSwitcher))
      );
      assert.ok(swHtmlJa.includes("日本語"), "must render active locale label '日本語'");

      // 2. Integration into LandingHero
      const landingHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(LandingHero, {
            totalAllShows: 100,
            allUsedSongs: [{ id: "pretender", title: "Pretender" }],
            allVenues: [{ name: "Budokan" }],
            allUnits: [],
            q: "",
            setQ: () => {},
          })
        )
      );
      assert.ok(landingHtml.includes("EN"), "LandingHero must render LanguageSwitcher with EN active");
      assert.ok(landingHtml.includes("Public Shows"), "LandingHero stats must be localized in EN");

      // 3. Integration into ArchiveHeader across locales
      const archiveProps = {
        totalAllShows: 150,
        allUsedSongs: new Array(50).fill({ id: "x" }),
        allVenues: new Array(20).fill({ name: "v" }),
        categoriesCount: 8,
        tab: "show",
        setTab: () => {},
        setQ: () => {},
        setIsFilterDrawerOpen: () => {},
      };

      const archiveHtmlJa = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(ArchiveHeader, archiveProps)
        )
      );
      assert.ok(archiveHtmlJa.includes("日本語"), "ArchiveHeader must render LanguageSwitcher with 日本語 active");
      assert.ok(archiveHtmlJa.includes("公演"), "ArchiveHeader tab must render 公演 for shows in ja");
      assert.ok(archiveHtmlJa.includes("楽曲"), "ArchiveHeader tab must render 楽曲 for songs in ja");
      assert.ok(archiveHtmlJa.includes("会場"), "ArchiveHeader tab must render 会場 for venues in ja");
      assert.ok(archiveHtmlJa.includes("セットリスト図鑑"), "ArchiveHeader brandTitle must be localized in ja");

      const archiveHtmlKo = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(ArchiveHeader, archiveProps)
        )
      );
      assert.ok(archiveHtmlKo.includes("한국어"), "ArchiveHeader must render LanguageSwitcher with 한국어 active");
      assert.ok(archiveHtmlKo.includes("공연"), "ArchiveHeader tab must render 공연 for shows in ko");
      assert.ok(archiveHtmlKo.includes("곡"), "ArchiveHeader tab must render 곡 for songs in ko");
      assert.ok(archiveHtmlKo.includes("셋리스트 아카이브"), "ArchiveHeader brandTitle must be localized in ko");

      // 4. Responsive Switcher Dichotomy & Affordance Invariant (ADR-0107)
      // LandingHero MUST render LanguageSwitcher in static header bar and NEVER as a fixed floating FAB on mobile
      assert.ok(!landingHtml.includes("fixed bottom-"), "LandingHero must NOT contain fixed bottom floating FAB");
      assert.ok(landingHtml.includes("w-full flex justify-end items-center"), "LandingHero must place LanguageSwitcher in top utility bar");

      // ArchiveHeader MUST hide LanguageSwitcher on small screens to yield space for mobile chrome
      assert.ok(archiveHtmlJa.includes("hidden sm:inline-block"), "ArchiveHeader must hide switcher on mobile via hidden sm:inline-block");
      // Anti-regression: LanguageSwitcher root element must NOT contain unconditional inline-block when hidden is passed
      assert.ok(
        !archiveHtmlJa.includes('class="relative inline-block text-left select-none font-mono hidden sm:inline-block'),
        "ArchiveHeader LanguageSwitcher must NOT have conflicting inline-block preceding hidden"
      );
      assert.ok(
        archiveHtmlJa.includes('class="relative text-left select-none font-mono hidden sm:inline-block shrink-0"'),
        "ArchiveHeader LanguageSwitcher must render clean display classes without conflicting inline-block"
      );

      // Verify standalone LanguageSwitcher fallback vs override behavior
      const defaultSwitcherHtml = renderToStaticMarkup(
        React.createElement(I18nProvider, { initialLocale: "ja" }, React.createElement(LanguageSwitcher))
      );
      assert.ok(
        defaultSwitcherHtml.includes('class="relative inline-block text-left select-none font-mono"'),
        "Default LanguageSwitcher without custom display class must include inline-block"
      );

      // Mechanical guardrail: verify zero display class collisions (e.g. inline-block coexisting with hidden)
      function assertNoConflictingDisplayClasses(html, label) {
        for (const m of html.matchAll(/class="([^"]+)"/g)) {
          const list = m[1].split(/\s+/);
          const hasHidden = list.includes("hidden");
          const hasUnqualifiedDisplay = list.some((c) =>
            ["block", "inline-block", "inline", "flex", "inline-flex", "grid"].includes(c)
          );
          assert.ok(
            !(hasHidden && hasUnqualifiedDisplay),
            `${label}: detected conflicting display classes on same element: "${m[1]}"`
          );
        }
      }
      assertNoConflictingDisplayClasses(archiveHtmlJa, "ArchiveHeader (ja)");
      assertNoConflictingDisplayClasses(archiveHtmlKo, "ArchiveHeader (ko)");
      assertNoConflictingDisplayClasses(landingHtml, "LandingHero");

      // MobileFloatingControls MUST render LanguageSwitcher as a round floating FAB on mobile
      const { MobileFloatingControls } = await loadModule("/src/components/layout/MobileFloatingControls.jsx");
      const mobileControlsHtml = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(MobileFloatingControls, {
            tab: "show",
            onOpenSearch: () => {},
            onOpenDrawer: () => {},
            onReturnHome: () => {},
          })
        )
      );
      assert.ok(mobileControlsHtml.includes('data-testid="language-switcher"'), "MobileFloatingControls must render LanguageSwitcher");
      assert.ok(mobileControlsHtml.includes("rounded-full"), "MobileFloatingControls LanguageSwitcher must render round FAB");
      assert.ok(mobileControlsHtml.includes("🌐"), "MobileFloatingControls LanguageSwitcher must display globe icon");
    });

    it("renders LandingHero with full localized content, dynamic venueCount, and preserved tokens across all 4 locales", async () => {
      const LandingHeroMod = await loadModule("/src/components/LandingHero.jsx");
      const LandingHero = LandingHeroMod.default;
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");

      const props = {
        totalAllShows: 100,
        allUsedSongs: [{ id: "pretender", title: "Pretender" }],
        allVenues: new Array(194).fill({ name: "Venue" }),
        allUnits: [
          { id: "arena-tour-2024-rejoice", title: "Arena Tour 2024 - Rejoice -" },
          { id: "taipei-show", shows: [{ id: "taipei-1", venue: { name: "台北小巨蛋" } }] },
        ],
        q: "",
        setQ: () => {},
        onEnterArchive: () => {},
        onSelectSong: () => {},
        onSelectUnit: () => {},
        onSelectVenue: () => {},
        onSelectShow: () => {},
        onOpenCalendar: () => {},
        onSelectTab: () => {},
      };

      // 1. Japanese (ja)
      const htmlJa = renderToStaticMarkup(
        React.createElement(I18nProvider, { initialLocale: "ja" }, React.createElement(LandingHero, props))
      );
      assert.ok(htmlJa.includes("双方向ディープ検索"), "ja must render 双方向ディープ検索");
      assert.ok(htmlJa.includes("人気の探索："), "ja must render 人気の探索：");
      assert.ok(htmlJa.includes("2024 Rejoice ツアー"), "ja must render 2024 Rejoice ツアー");
      assert.ok(htmlJa.includes("台北アリーナ公演"), "ja must render 台北アリーナ公演");
      assert.ok(htmlJa.includes("演奏回数ランキング"), "ja must render 演奏回数ランキング");
      assert.ok(htmlJa.includes("実物チケット＆ステージRun-Sheet"), "ja must render ticket stub title");
      assert.ok(htmlJa.includes("2012–2026 全軌跡"), "ja must render provenance title");
      assert.ok(htmlJa.includes("194"), "ja must interpolate dynamic venueCount");
      assert.ok(htmlJa.includes("アーカイブを探索する"), "ja must render primary CTA");
      assert.ok(htmlJa.includes("Official髭男dism ファンによる非公式・非営利のライブ履歴アーカイブ"), "ja must render localized footer");

      // 2. English (en)
      const htmlEn = renderToStaticMarkup(
        React.createElement(I18nProvider, { initialLocale: "en" }, React.createElement(LandingHero, props))
      );
      assert.ok(htmlEn.includes("Bi-Directional Archive"), "en must render Bi-Directional Archive");
      assert.ok(htmlEn.includes("Trending:"), "en must render Trending:");
      assert.ok(htmlEn.includes("2024 Rejoice Tour"), "en must render 2024 Rejoice Tour");
      assert.ok(htmlEn.includes("Taipei Arena Show"), "en must render Taipei Arena Show");
      assert.ok(htmlEn.includes("Top Performed Songs"), "en must render Top Performed Songs");
      assert.ok(htmlEn.includes("Authentic Ticket Stubs"), "en must render ticket stub title");
      assert.ok(htmlEn.includes("2012–2026 Provenance"), "en must render provenance title");
      assert.ok(htmlEn.includes("Explore Full Archive"), "en must render primary CTA");
      assert.ok(htmlEn.includes("Unofficial non-profit Official HIGEDAN Dism"), "en must render localized footer");

      // 3. Korean (ko)
      const htmlKo = renderToStaticMarkup(
        React.createElement(I18nProvider, { initialLocale: "ko" }, React.createElement(LandingHero, props))
      );
      assert.ok(htmlKo.includes("양방향 심층 아카이브"), "ko must render 양방향 심층 아카이브");
      assert.ok(htmlKo.includes("인기 탐색:"), "ko must render 인기 탐색:");
      assert.ok(htmlKo.includes("2024 Rejoice 투어"), "ko must render 2024 Rejoice 투어");
      assert.ok(htmlKo.includes("타이베이 아레나 공연"), "ko must render 타이베이 아레나 공연");
      assert.ok(htmlKo.includes("곡 연주 랭킹"), "ko must render 곡 연주 랭킹");
      assert.ok(htmlKo.includes("실물 티켓") && htmlKo.includes("무대 전표"), "ko must render ticket stub title");
      assert.ok(htmlKo.includes("2012–2026 전체 족적"), "ko must render provenance title");
      assert.ok(htmlKo.includes("전체 아카이브 탐색하기"), "ko must render primary CTA");
      assert.ok(htmlKo.includes("Official 히게단 dism 팬 비공식"), "ko must render localized footer");

      // 4. Preserved Design Tokens across all locales
      for (const html of [htmlJa, htmlEn, htmlKo]) {
        assert.ok(html.includes("BI-DIRECTIONAL"), "must preserve BI-DIRECTIONAL token");
        assert.ok(html.includes("TICKET STUB"), "must preserve TICKET STUB token");
        assert.ok(html.includes("PROVENANCE"), "must preserve PROVENANCE token");
        assert.ok(html.includes("Pretender"), "must preserve official song name Pretender");
      }
    });
  });
