import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolve, assignCues, encoreStartOrderOf } from "../../src/lib/resolve.js";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

let React;
let renderToStaticMarkup;

  describe("8. Tour Statistics Engine & Core TourSlip Presentation (Ticket 1 / ADR-0102)", () => {
    let computeTourStatistics;
    let getTourFrequencyTier;
    let FREQUENCY_TIER_CONFIG;
    let TourSlip;
    let ShowSlip;
    let DualModeCapsuleToggle;
    let ArchiveLayout;
    let useArchiveFilter;
    let useArchiveRoute;
    let parseRoute;
    let routeHash;
    let allUnits;
    let index;
    let I18nProvider;

    it("loads tour statistics engine and TourSlip component from Vite SSR", async () => {
      globalThis.window = {
        location: { hash: "", pathname: "/" },
        addEventListener: () => {},
        removeEventListener: () => {},
        scrollTo: () => {},
        innerHeight: 800,
      };
      globalThis.document = {
        body: { style: {} },
      };
      const rr = await getReactAndRenderer();
      React = rr.React;
      renderToStaticMarkup = rr.renderToStaticMarkup;
      const domainMod = await loadModule("./src/lib/domain.js");
      computeTourStatistics = domainMod.computeTourStatistics;
      getTourFrequencyTier = domainMod.getTourFrequencyTier;
      FREQUENCY_TIER_CONFIG = domainMod.FREQUENCY_TIER_CONFIG;
      allUnits = domainMod.allUnits;
      index = domainMod.buildIndex();

      const trackMod = await loadModule("./src/lib/track.js");
      parseRoute = trackMod.parseRoute;
      routeHash = trackMod.routeHash;

      const i18nMod = await loadModule("./src/lib/i18n.jsx");
      I18nProvider = i18nMod.I18nProvider;

      const slipMod = await loadModule(
        "./src/components/slips/TourSlip.jsx"
      );
      TourSlip = slipMod.TourSlip;

      const showSlipMod = await loadModule(
        "./src/components/slips/ShowSlip.jsx"
      );
      ShowSlip = showSlipMod.ShowSlip;

      const ticketCommonMod = await loadModule(
        "./src/components/slips/TicketCommon.jsx"
      );
      DualModeCapsuleToggle = ticketCommonMod.DualModeCapsuleToggle;

      const layoutMod = await loadModule(
        "./src/components/layout/ArchiveLayout.jsx"
      );
      ArchiveLayout = layoutMod.ArchiveLayout;

      const filterMod = await loadModule(
        "./src/hooks/useArchiveFilter.js"
      );
      useArchiveFilter = filterMod.useArchiveFilter;

      const routeMod = await loadModule(
        "./src/hooks/useArchiveRoute.js"
      );
      useArchiveRoute = routeMod.useArchiveRoute;

      assert.ok(computeTourStatistics);
      assert.ok(getTourFrequencyTier);
      assert.ok(FREQUENCY_TIER_CONFIG);
      assert.ok(TourSlip);
      assert.ok(ShowSlip);
      assert.ok(DualModeCapsuleToggle);
      assert.ok(ArchiveLayout);
      assert.ok(useArchiveFilter);
      assert.ok(useArchiveRoute);
      assert.ok(parseRoute);
      assert.ok(routeHash);
      assert.ok(I18nProvider);
    });

    it("accurately calculates consensus statistics across all 16 headline tours", () => {
      const headlineTours = allUnits.filter(
        (u) => u.templateSetlist && u.type !== "店家活動"
      );
      assert.ok(
        headlineTours.length >= 16,
        `Expected at least 16 headline tours, found ${headlineTours.length}`
      );

      for (const tour of headlineTours) {
        const stats = computeTourStatistics(tour);
        assert.equal(stats.totalShows, tour.shows.length);
        assert.equal(stats.consensusTracks.length, tour.templateSetlist.length);

        for (const track of stats.consensusTracks) {
          assert.ok(track.count >= 0 && track.count <= stats.totalShows);
          assert.ok(track.ratio >= 0 && track.ratio <= 1);
          assert.equal(track.percentage, Math.round(track.ratio * 100));

          if (track.count === stats.totalShows && stats.totalShows > 0) {
            assert.equal(track.tier, "core");
            assert.equal(track.tierLabel, "核心全勤");
            assert.equal(track.tierBadgeLabel, "核心全勤 100%");
          } else if (track.ratio >= 0.7) {
            assert.equal(track.tier, "regular");
            assert.equal(track.tierLabel, "巡演定番");
          } else if (track.ratio >= 0.3 && !(stats.totalShows <= 4 && track.count === 1)) {
            assert.equal(track.tier, "rotating");
            assert.equal(track.tierLabel, "雙日輪替");
          } else {
            assert.equal(track.tier, "surprise");
            assert.equal(track.tierLabel, "場次限定");
          }

          assert.ok(track.badgeClass);
          assert.ok(track.pillClass);
        }
      }
    });

    it("verifies Rejoice Arena Tour 2024 exact frequency classification", () => {
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const stats = computeTourStatistics(rejoiceTour);
      assert.equal(stats.totalShows, 10);
      assert.equal(stats.coreTracks.length, 18);
      assert.equal(stats.regularTracks.length, 1);
      // In consensus template: 2 rotating tracks (fire-ground & no-doubt)
      assert.equal(stats.consensusTracks.filter((t) => t.tier === "rotating").length, 2);
      // Total rotating tracks (including non-template pretender & i-love): 4
      assert.equal(stats.rotatingTracks.length, 4);

      // Check specific regular track: 115萬キロのフィルム was skipped in 1 show
      const filmTrack = stats.consensusTracks.find(
        (t) => t.songId === "115man-kiro-no-film"
      );
      assert.ok(filmTrack);
      assert.equal(filmTrack.count, 9);
      assert.equal(filmTrack.tier, "regular");
      assert.equal(filmTrack.tierLabel, "巡演定番");

      // Check A/B rotating tracks: fire-ground & no-doubt
      const fireGround = stats.consensusTracks.find(
        (t) => t.songId === "fire-ground"
      );
      assert.ok(fireGround);
      assert.equal(fireGround.count, 5);
      assert.equal(fireGround.tier, "rotating");
      assert.equal(fireGround.tierLabel, "雙日輪替");

      const noDoubt = stats.consensusTracks.find((t) => t.songId === "no-doubt");
      assert.ok(noDoubt);
      assert.equal(noDoubt.count, 5);
      assert.equal(noDoubt.tier, "rotating");
      assert.equal(noDoubt.tierLabel, "雙日輪替");
    });

    it("verifies Shocking Nuts Tour 2022-2023 exact rotating classification", () => {
      const shockingNuts = allUnits.find(
        (u) => u.id === "shocking-nuts-tour-2022-2023"
      );
      assert.ok(shockingNuts);

      const stats = computeTourStatistics(shockingNuts);
      assert.equal(stats.totalShows, 21);
      assert.equal(stats.coreTracks.length, 13);
      // In consensus template: 7 rotating tracks (A-set)
      assert.equal(stats.consensusTracks.filter((t) => t.tier === "rotating").length, 7);
      // Non-template inserts: 7 rotating tracks (B-set alternate songs)
      assert.equal(stats.nonTemplateRotatingTracks.length, 7);
      // Total rotating tracks across tour: 14 songs
      assert.equal(stats.rotatingTracks.length, 14);
      // True surprise tracks: 4 songs (< 30%: escapade, parabola, fire-ground, white-noise)
      assert.equal(stats.surpriseTracks.length, 4);
      assert.equal(stats.regularTracks.length, 0);
    });

    it("gracefully handles null or empty input without mutating parameters", () => {
      const emptyResult = computeTourStatistics(null);
      assert.equal(emptyResult.totalShows, 0);
      assert.equal(emptyResult.consensusTracks.length, 0);

      const dummyTour = Object.freeze({
        id: "dummy-tour",
        title: "Dummy Tour",
        templateSetlist: Object.freeze([
          Object.freeze({ order: 1, songId: "pretender", encore: false }),
        ]),
        shows: Object.freeze([
          Object.freeze({
            id: "dummy-1",
            date: "2024-01-01",
            venue: "Dummy Hall",
            diff: Object.freeze({ skip: [], insert: [] }),
          }),
        ]),
      });

      // Pure invocation on frozen object must succeed without attempting mutation
      const pureResult = computeTourStatistics(dummyTour);
      assert.equal(pureResult.totalShows, 1);
      assert.equal(pureResult.consensusTracks.length, 1);
      assert.equal(pureResult.consensusTracks[0].count, 1);
      assert.equal(pureResult.consensusTracks[0].tier, "core");
    });

    it("renders TourSlip component with complete SSR markup invariants", () => {
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const html = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: rejoiceTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      // Invariants check
      assert.ok(html.length > 0);
      assert.ok(html.includes("Arena Tour 2024 - Rejoice -"));
      assert.ok(html.includes("CONSENSUS TEMPLATE // 巡演定番歌單"));
      assert.ok(html.includes("全 10 場次"));
      assert.ok(html.includes("核心全勤 100%"));
      assert.ok(html.includes("巡演定番 90%"));
      assert.ok(html.includes("雙日輪替 50%"));
      assert.ok(html.includes("max-w-[960px] mx-auto"));
      // Perforation divider & barcode footer presence
      assert.ok(html.includes("OFFICIAL HIGEDAN DISM STAGE ARCHIVE"));
      assert.ok(html.includes("SN: TOUR-"));
      assert.ok(html.includes("TOUR CONSENSUS MASTER SHEET"));
    });

    it("accurately identifies surprise inserts (< 30% play rate) and associates them with show IDs (Ticket 2)", () => {
      const travelersTour = allUnits.find(
        (u) => u.id === "tour-19-20-hall-travelers"
      );
      assert.ok(travelersTour);

      const stats = computeTourStatistics(travelersTour);
      assert.equal(stats.totalShows, 29);
      assert.ok(stats.surpriseTracks.length > 0);

      // All non-template surprise tracks must strictly have ratio < 0.7
      for (const track of stats.surpriseTracks) {
        assert.ok(
          track.ratio < 0.7,
          `Track ${track.title} ratio ${track.ratio} must be < 0.7`
        );
        assert.equal(track.tier, "surprise");
        assert.equal(track.tierLabel, "場次限定");
        assert.ok(track.appearances.length > 0);
        assert.equal(track.appearances.length, track.count);
        assert.equal(track.shows.length, track.count);
        for (const show of track.shows) {
          assert.ok(show.id);
          assert.ok(show.venue);
        }
      }

      // Check specific surprise track Sweet Tweet (6/29 = 21%)
      const sweetTweet = stats.surpriseTracks.find(
        (t) => t.songId === "sweet-tweet"
      );
      assert.ok(sweetTweet);
      assert.equal(sweetTweet.count, 6);
      assert.equal(sweetTweet.percentage, 21);
      assert.deepEqual(sweetTweet.appearances, [
        "1150086",
        "1150087",
        "1150094",
        "1150099",
        "1150102",
        "1150104",
      ]);

      // Check specific surprise track I LOVE... (6/29 = 21%)
      const iLove = stats.surpriseTracks.find((t) => t.songId === "i-love");
      assert.ok(iLove);
      assert.equal(iLove.count, 6);

      // Check non-songId cover title track Don't Stop Me Now [Queen] (1/29)
      const queenCover = stats.surpriseTracks.find(
        (t) => t.title === "Don't Stop Me Now [Queen]"
      );
      assert.ok(queenCover);
      assert.equal(queenCover.count, 1);
      assert.equal(queenCover.songId, null);
      assert.deepEqual(queenCover.appearances, ["1150092"]);
      // uniqueSongsCount must include cover song (21 template + 8 surprise = 29)
      assert.equal(stats.stats.uniqueSongsCount, 29);

      // Check request variations attached to surprise track
      const ladyTrack = stats.surpriseTracks.find((t) => t.songId === "lady");
      assert.ok(ladyTrack);
      assert.ok(
        ladyTrack.variations.some((v) => v.includes("会場リクエスト"))
      );
    });

    it("properly filters and numbers interludes with dash (—) without counting towards formal songs (Ticket 2)", () => {
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const stats = computeTourStatistics(rejoiceTour);
      assert.equal(stats.interludes.length, 4);

      for (const interlude of stats.interludes) {
        assert.equal(interlude.cue, "—");
        assert.ok(interlude.showId);
        assert.ok(interlude.item.note);
        // Interludes must have type: "interlude"
        assert.equal(interlude.item.type, "interlude");
      }

      // Check specific interlude notes in Rejoice
      const mcInterlude = stats.interludes.find(
        (it) => it.item.note === "ピアノ弾きMC"
      );
      assert.ok(mcInterlude);
      assert.equal(mcInterlude.showId, "1672276");

      const coverInterlude = stats.interludes.find(
        (it) => it.item.note === "Supernova (ELLEGARDEN) 大輔ボーカル"
      );
      assert.ok(coverInterlude);
      assert.equal(coverInterlude.showId, "1672278");

      // Verify assignCues gives null cue to interludes
      const rawWithInterlude = [
        { songId: "pretender", title: "Pretender" },
        { type: "interlude", note: "メンバーソロ" },
        { songId: "subtitle", title: "Subtitle" },
      ];
      const assigned = assignCues(rawWithInterlude, "M");
      assert.equal(assigned[0].cue, "M1");
      assert.equal(assigned[1].cue, null);
      assert.equal(assigned[2].cue, "M2");
    });

    it("merges version variations and satoshi-solo into master tracks without splitting (Ticket 2)", () => {
      // 1. In Editorial Tour (49 shows), mixed-nuts was inserted in 4 shows with solo & premiere notes
      const editorialTour = allUnits.find(
        (u) => u.id === "one-man-tour-2021-2022-editorial"
      );
      assert.ok(editorialTour);

      const editorialStats = computeTourStatistics(editorialTour);
      const mixedNutsEntries = editorialStats.surpriseTracks.filter(
        (t) => t.songId === "mixed-nuts"
      );
      // Must not split into multiple entries
      assert.equal(mixedNutsEntries.length, 1);
      const mixedNuts = mixedNutsEntries[0];
      assert.equal(mixedNuts.count, 4);
      assert.equal(mixedNuts.totalShows, 49);
      assert.ok(mixedNuts.ratio < 0.3);
      // Both notes must be captured in variations
      assert.ok(
        mixedNuts.variations.some((v) => v.includes("藤原聡/弾き語り"))
      );
      assert.ok(mixedNuts.variations.some((v) => v.includes("新曲")));

      // 2. In Shocking Nuts Tour, template track Subtitle had satoshi-solo & premiere versions
      const shockingNuts = allUnits.find(
        (u) => u.id === "shocking-nuts-tour-2022-2023"
      );
      assert.ok(shockingNuts);
      const shockingStats = computeTourStatistics(shockingNuts);
      const subtitleEntries = shockingStats.consensusTracks.filter(
        (t) => t.songId === "subtitle"
      );
      assert.equal(subtitleEntries.length, 1);
      const subtitle = subtitleEntries[0];
      assert.equal(subtitle.count, 21);
      assert.equal(subtitle.tier, "core");
      assert.ok(
        subtitle.variations.some((v) => v.includes("ピアノ弾き語り"))
      );
      assert.ok(subtitle.variations.some((v) => v.includes("新曲")));
      // But because Subtitle in Shocking Nuts was only solo in 1 of 21 shows, badges must NOT have solo!
      assert.ok(!subtitle.badges.some((b) => b.type === "solo"));

      // 3. 100% Monolithic Arrangement Rule: Four-re-ism tour (all 5 shows solo)
      const fourReIsm = allUnits.find((u) => u.id === "four-re-ism-2025-2026");
      if (fourReIsm) {
        const fcStats = computeTourStatistics(fourReIsm);
        const fcSubtitle = fcStats.consensusTracks.find((t) => t.songId === "subtitle");
        if (fcSubtitle) {
          assert.ok(fcSubtitle.badges.some((b) => b.type === "solo" && b.label === "自彈自唱"));
        }
      }

      // 4. Asia Tour 2026 Taipei surprise: 1/1 show was requested
      const asia2026 = allUnits.find((u) => u.id === "asia-tour-2026");
      if (asia2026) {
        const asiaStats = computeTourStatistics(asia2026);
        const film = asiaStats.surpriseTracks.find((t) => t.songId === "115man-kiro-no-film");
        if (film) {
          assert.ok(film.badges.some((b) => b.type === "request" && b.label === "點歌"));
        }
        // Itinerary highlight must carry tagLabel '點歌'
        const tpeStop = asiaStats.itinerary.find((s) => s.city === "台北");
        if (tpeStop) {
          assert.ok(tpeStop.surpriseHighlights.some((h) => h.tagLabel === "點歌"));
        }
      }
    });

    it("renders TourSlip component with complete Surprise Inserts and Interludes SSR markup", () => {
      // Test 1: Hall Travelers Tour has Surprise Inserts
      const travelersTour = allUnits.find(
        (u) => u.id === "tour-19-20-hall-travelers"
      );
      assert.ok(travelersTour);

      const travelersHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: travelersTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(travelersHtml.includes("SPECIAL INSERTS // 巡演場次限定曲"));
      assert.ok(travelersHtml.includes("id=\"surprise-inserts-section\""));
      assert.ok(travelersHtml.includes("id=\"consensus-template-section\""));
      assert.ok(travelersHtml.includes("SWEET TWEET"));
      assert.ok(travelersHtml.includes("I LOVE..."));
      assert.ok(travelersHtml.includes("愛なんだが…"));
      // Direct ticket links for shows with cue numbers
      assert.ok(travelersHtml.includes("#/show/1150086"));
      assert.ok(travelersHtml.includes("🎫"));
      assert.ok(travelersHtml.includes("(EN"));

      // Test 2: Rejoice Arena Tour has Interludes
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const rejoiceHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: rejoiceTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(
        rejoiceHtml.includes("INTERLUDES // 特別彈唱與過場（不計入正式曲目）")
      );
      assert.ok(rejoiceHtml.includes("ピアノ弾きMC"));
      assert.ok(rejoiceHtml.includes("Supernova (ELLEGARDEN) 大輔ボーカル"));
      assert.ok(rejoiceHtml.includes("#/show/1672276"));
    });

    it("accurately outputs chronological itinerary timeline with all required fields (Ticket 3)", () => {
      // 1. Long tour: Hall Travelers (29 shows)
      const travelersTour = allUnits.find(
        (u) => u.id === "tour-19-20-hall-travelers"
      );
      assert.ok(travelersTour);
      const travelersStats = computeTourStatistics(travelersTour);
      assert.equal(travelersStats.itinerary.length, 29);

      // Verify strictly chronological ordering
      for (let i = 0; i < travelersStats.itinerary.length - 1; i++) {
        const curr = travelersStats.itinerary[i];
        const next = travelersStats.itinerary[i + 1];
        assert.ok(
          curr.date <= next.date,
          `Itinerary must be sorted chronologically: ${curr.date} <= ${next.date}`
        );
        assert.equal(curr.index, i + 1);
      }

      // Verify first and last milestones
      assert.equal(travelersStats.itinerary[0].isFirst, true);
      assert.equal(travelersStats.itinerary[0].isFinal, false);
      assert.equal(travelersStats.itinerary[0].index, 1);
      assert.equal(travelersStats.itinerary[0].id, "1150083");
      assert.equal(travelersStats.itinerary[0].date, "2019-10-26");
      assert.equal(travelersStats.itinerary[0].city, "市川");
      assert.equal(travelersStats.itinerary[0].venue, "市川市文化會館 大會堂");
      assert.ok(travelersStats.itinerary[0].time); // e.g. "18:00 開演"
      assert.ok(typeof travelersStats.itinerary[0].totalSongs === "number");
      assert.ok(typeof travelersStats.itinerary[0].isStandard === "boolean");
      assert.ok(Array.isArray(travelersStats.itinerary[0].surpriseHighlights));

      const lastTraveler = travelersStats.itinerary[28];
      assert.equal(lastTraveler.isFirst, false);
      assert.equal(lastTraveler.isFinal, true);
      assert.equal(lastTraveler.index, 29);

      // 2. Exact 10-show tour: Rejoice Arena Tour
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);
      const rejoiceStats = computeTourStatistics(rejoiceTour);
      assert.equal(rejoiceStats.itinerary.length, 10);
      assert.equal(rejoiceStats.itinerary[0].isFirst, true);
      assert.equal(rejoiceStats.itinerary[9].isFinal, true);
      assert.equal(rejoiceStats.itinerary[0].city, "福岡");
      assert.equal(rejoiceStats.itinerary[0].venue, "福岡海洋展覽館 A館");
      assert.equal(rejoiceStats.itinerary[0].time, "19:00 開演");

      // 3. Short tour: Asia Tour 2024 (3 shows)
      const asiaTour = allUnits.find((u) => u.id === "asia-tour-2024");
      assert.ok(asiaTour);
      const asiaStats = computeTourStatistics(asiaTour);
      assert.equal(asiaStats.itinerary.length, 3);
      assert.equal(asiaStats.itinerary[0].city, "高陽");
      assert.equal(asiaStats.itinerary[2].city, "台北");
    });

    it("renders TourSlip with Itinerary, collapsing long tours (>10 shows) and expanding on demand (Ticket 3)", () => {
      const travelersTour = allUnits.find(
        (u) => u.id === "tour-19-20-hall-travelers"
      );
      assert.ok(travelersTour);

      // Collapsed render (default): shows first 10, contains expand button
      const collapsedHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: travelersTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(collapsedHtml.includes("TOUR ITINERARY // 全國巡演日程足跡"));
      assert.ok(collapsedHtml.includes("id=\"tour-itinerary-section\""));
      assert.ok(collapsedHtml.includes("29 STOPS"));
      assert.ok(collapsedHtml.includes("#01"));
      assert.ok(collapsedHtml.includes("#10"));
      // In collapsed mode, #11 must NOT be rendered in itinerary
      assert.ok(!collapsedHtml.includes("#11"));
      // Expand button present
      assert.ok(collapsedHtml.includes("展開全部日程"));
      assert.ok(collapsedHtml.includes("全 29 場"));
      // First show has 初日 badge
      assert.ok(collapsedHtml.includes("初日"));
      // View ticket stub shortcut
      assert.ok(collapsedHtml.includes("查看票根"));
      assert.ok(collapsedHtml.includes("#/show/1150083"));
      // Cross-show diff profile line
      assert.ok(collapsedHtml.includes("定番歌單場") || collapsedHtml.includes("限定："));

      // Expanded render: shows all 29, contains collapse button
      const expandedHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: travelersTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
          initialItineraryExpanded: true,
        })
      );

      assert.ok(expandedHtml.includes("#01"));
      assert.ok(expandedHtml.includes("#10"));
      assert.ok(expandedHtml.includes("#11"));
      assert.ok(expandedHtml.includes("#29"));
      assert.ok(expandedHtml.includes("千秋樂"));
      assert.ok(expandedHtml.includes("收合巡演日程"));
      assert.ok(!expandedHtml.includes("展開全部日程"));
    });

    it("renders TourSlip with full itinerary without collapse button for tours <= 10 shows (Ticket 3)", () => {
      // 1. Exactly 10 shows: Rejoice Arena Tour
      const rejoiceTour = allUnits.find(
        (u) => u.id === "arena-tour-2024-rejoice"
      );
      assert.ok(rejoiceTour);

      const rejoiceHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: rejoiceTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(rejoiceHtml.includes("TOUR ITINERARY // 全國巡演日程足跡"));
      assert.ok(rejoiceHtml.includes("10 STOPS"));
      assert.ok(rejoiceHtml.includes("#01"));
      assert.ok(rejoiceHtml.includes("#10"));
      assert.ok(rejoiceHtml.includes("初日"));
      assert.ok(rejoiceHtml.includes("千秋樂"));
      // Must NOT contain expand/collapse toggle
      assert.ok(!rejoiceHtml.includes("展開全部日程"));
      assert.ok(!rejoiceHtml.includes("收合巡演日程"));

      // 2. Short tour (3 shows): Asia Tour 2024
      const asiaTour = allUnits.find((u) => u.id === "asia-tour-2024");
      assert.ok(asiaTour);

      const asiaHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: asiaTour,
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );

      assert.ok(asiaHtml.includes("3 STOPS"));
      assert.ok(asiaHtml.includes("#01"));
      assert.ok(asiaHtml.includes("#02"));
      assert.ok(asiaHtml.includes("#03"));
      assert.ok(!asiaHtml.includes("#04"));
      assert.ok(!asiaHtml.includes("展開全部日程"));
      assert.ok(!asiaHtml.includes("收合巡演日程"));
    });

    it("parses and generates #/tour/:unitId route hashes bidirectionally (Ticket 4)", () => {
      // 1. parseRoute
      const parsed1 = parseRoute("#/tour/arena-tour-2024-rejoice");
      assert.deepEqual(parsed1, {
        kind: "tour",
        value: "arena-tour-2024-rejoice",
      });

      const parsed2 = parseRoute("/tour/one-man-tour-2021-2022-editorial");
      assert.deepEqual(parsed2, {
        kind: "tour",
        value: "one-man-tour-2021-2022-editorial",
      });

      // 2. routeHash.tour
      assert.equal(
        routeHash.tour("arena-tour-2024-rejoice"),
        "#/tour/arena-tour-2024-rejoice"
      );
    });

    it("penetrates direct deep link for tours (#/tour/:unitId) with showSubMode 'tour' and category/year sync (Ticket 4)", () => {
      const runProbeWithRoute = (hash = "") => {
        globalThis.window.location.hash = hash;
        let capturedFilter = null;
        let capturedRoute = null;

        function ProbeComponent() {
          const filterState = useArchiveFilter({
            unitData: index.unitData,
            trackShows: index.trackShows,
            globalVenueShows: index.globalVenueShows,
            allUsedSongs: index.allUsedSongs,
            allVenues: index.allVenues,
            initialUnitId: allUnits[0]?.id ?? null,
            initialSongId: index.allUsedSongs[0]?.id ?? null,
            initialVenueName: index.allVenues[0]?.name ?? null,
          });
          const routeState = useArchiveRoute({
            unitData: index.unitData,
            allUsedSongs: index.allUsedSongs,
            allVenues: index.allVenues,
            unitIdByShowId: index.unitIdByShowId,
            filterState,
          });
          capturedFilter = filterState;
          capturedRoute = routeState;
          return null;
        }

        renderToStaticMarkup(React.createElement(ProbeComponent));
        return { filter: capturedFilter, route: capturedRoute };
      };

      // Test 1: Rejoice Arena Tour
      const { route: r1, filter: f1 } = runProbeWithRoute(
        "#/tour/arena-tour-2024-rejoice"
      );
      assert.equal(r1.viewMode, "archive");
      assert.equal(r1.tab, "show");
      assert.equal(r1.showSubMode, "tour");
      assert.equal(r1.selUnitId, "arena-tour-2024-rejoice");
      assert.ok(f1.selCategory);
      assert.ok(f1.selYear);

      // Test 2: Show direct deep link (#/show/:id) maintains showSubMode "show"
      const { route: r2 } = runProbeWithRoute("#/show/1672276");
      assert.equal(r2.viewMode, "archive");
      assert.equal(r2.tab, "show");
      assert.equal(r2.showSubMode, "show");
      assert.equal(r2.selShow, "1672276");
      assert.equal(r2.selUnitId, "arena-tour-2024-rejoice");

      // Test 3: Gracefully falls back to landing on invalid tour ID
      const { route: r3 } = runProbeWithRoute("#/tour/invalid-tour-non-existent-xyz");
      assert.equal(r3.viewMode, "landing");

      // Test 4: Single event accessed via #/tour/:unitId safely redirects to show mode
      const singleEvent = allUnits.find((u) => !u.templateSetlist);
      assert.ok(singleEvent);
      const { route: r4 } = runProbeWithRoute(`#/tour/${singleEvent.id}`);
      assert.equal(r4.viewMode, "archive");
      assert.equal(r4.tab, "show");
      assert.equal(r4.showSubMode, "show");
      assert.equal(r4.selUnitId, singleEvent.id);
      assert.equal(r4.selShow, singleEvent.shows[0]?.id);
    });

    it("verifies mobile drawer draftState supports tour slip staging, cancel rollback, and commit (Ticket 4)", () => {
      const runProbeWithDraft = (hash = "#/show/1672276", initialDraft = null, locale = null) => {
        globalThis.window.location.hash = hash;
        let capturedRoute = null;

        function ProbeComponent() {
          const filterState = useArchiveFilter({
            unitData: index.unitData,
            trackShows: index.trackShows,
            globalVenueShows: index.globalVenueShows,
            allUsedSongs: index.allUsedSongs,
            allVenues: index.allVenues,
            initialUnitId: allUnits[0]?.id ?? null,
            initialSongId: index.allUsedSongs[0]?.id ?? null,
            initialVenueName: index.allVenues[0]?.name ?? null,
          });
          const routeState = useArchiveRoute({
            unitData: index.unitData,
            allUsedSongs: index.allUsedSongs,
            allVenues: index.allVenues,
            unitIdByShowId: index.unitIdByShowId,
            filterState,
            initialDraftState: initialDraft,
          });
          capturedRoute = routeState;
          return null;
        }

        const tree = locale
          ? React.createElement(I18nProvider, { initialLocale: locale }, React.createElement(ProbeComponent))
          : React.createElement(ProbeComponent);

        renderToStaticMarkup(tree);
        return capturedRoute;
      };

      // 1. Default route without draftState
      const defaultRoute = runProbeWithDraft("#/show/1672276", null);
      assert.equal(defaultRoute.showSubMode, "show");
      assert.equal(defaultRoute.draftState, null);
      assert.equal(defaultRoute.confirmButtonLabel, "確認套用");

      // 2. Staged tour selection in draftState
      const stagedTourRoute = runProbeWithDraft("#/show/1672276", {
        category: "巡演專場",
        year: "2024",
        unitId: "arena-tour-2024-rejoice",
        showId: "1672276",
        showSubMode: "tour",
      });
      assert.ok(stagedTourRoute.draftState);
      assert.equal(stagedTourRoute.draftState.showSubMode, "tour");
      assert.ok(stagedTourRoute.confirmButtonLabel.includes("巡演總覽"));

      // 3. Staged show selection in draftState
      const stagedShowRoute = runProbeWithDraft("#/tour/arena-tour-2024-rejoice", {
        category: "巡演專場",
        year: "2024",
        unitId: "arena-tour-2024-rejoice",
        showId: "1672276",
        showSubMode: "show",
      });
      assert.ok(stagedShowRoute.draftState);
      assert.equal(stagedShowRoute.draftState.showSubMode, "show");
      assert.ok(stagedShowRoute.confirmButtonLabel.includes("確認套用："));

      // 4. Staged selection across all 4 locales (ja, en, ko, zh-TW)
      const localeCases = [
        { loc: "zh-TW", stagedPrefix: "確認套用：", defaultLabel: "確認套用" },
        { loc: "ja", stagedPrefix: "適用確定：", defaultLabel: "適用を確定" },
        { loc: "en", stagedPrefix: "Apply:", defaultLabel: "Apply" },
        { loc: "ko", stagedPrefix: "적용 확정:", defaultLabel: "적용 확정" },
      ];

      for (const { loc, stagedPrefix, defaultLabel } of localeCases) {
        const stagedRoute = runProbeWithDraft("#/show/1672276", stagedShowRoute.draftState, loc);
        assert.ok(
          stagedRoute.confirmButtonLabel.startsWith(stagedPrefix),
          `${loc} staged route must start with '${stagedPrefix}', got: '${stagedRoute.confirmButtonLabel}'`
        );

        const defaultRouteForLoc = runProbeWithDraft("#/show/1672276", null, loc);
        assert.strictEqual(
          defaultRouteForLoc.confirmButtonLabel,
          defaultLabel,
          `${loc} default route must match '${defaultLabel}', got: '${defaultRouteForLoc.confirmButtonLabel}'`
        );
      }
    });

    it("renders ArchiveLayout conditionally: TourSlip when showSubMode === 'tour' and isTour === true, else ShowSlip (Ticket 4)", () => {
      const rejoiceTour = index.unitData.get("arena-tour-2024-rejoice");
      assert.ok(rejoiceTour);

      // Render 1: showSubMode === "tour" -> renders TourSlip
      const tourLayoutHtml = renderToStaticMarkup(
        React.createElement(ArchiveLayout, {
          filterState: {
            selCategory: "巡演專場",
            selYear: "2024",
            setSelYear: () => {},
            unitPage: 0,
            setUnitPage: () => {},
            showPage: 0,
            setShowPage: () => {},
            unitsByCategory: { "巡演專場": [rejoiceTour.unit] },
            categoryStats: {},
            availableYears: ["2024"],
            yearStats: new Map(),
            filteredUnits: [rejoiceTour.unit],
            pagedUnits: [rejoiceTour.unit],
            totalAllShows: 10,
            handleCategoryClick: () => {},
          },
          routeState: {
            tab: "show",
            setTab: () => {},
            showSubMode: "tour",
            setShowSubMode: () => {},
            selUnitId: "arena-tour-2024-rejoice",
            selShow: "1672276",
            selSong: "",
            selVenue: "",
            q: "",
            setQ: () => {},
            isDesktopNavOpen: false,
            toggleDesktopNav: () => {},
            isFilterDrawerOpen: false,
            setIsFilterDrawerOpen: () => {},
            isMobileSearchOpen: false,
            setIsMobileSearchOpen: () => {},
            isCalendarOpen: false,
            setIsCalendarOpen: () => {},
            draftState: null,
            setDraftState: () => {},
            openFilterDrawer: () => {},
            handleCancelDrawer: () => {},
            handleCommitDrawer: () => {},
            confirmButtonLabel: "確認套用",
            slipRef: { current: null },
            handleSelectShow: () => {},
            handleSelectSong: () => {},
            handleSelectVenue: () => {},
            handleSelectUnit: () => {},
            handleReturnHome: () => {},
            handleSelectTourMode: () => {},
            handleSelectShowMode: () => {},
            handleToggleSubMode: () => {},
            visualViewportStyle: { height: "100dvh", top: 0 },
          },
          unitData: index.unitData,
          trackShows: index.trackShows,
          globalVenueShows: index.globalVenueShows,
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          allUnits: allUnits,
          showById: new Map(),
        })
      );

      // Must render TourSlip markup
      assert.ok(tourLayoutHtml.includes("TOUR CONSENSUS MASTER SHEET"));
      assert.ok(tourLayoutHtml.includes("CONSENSUS TEMPLATE // 巡演定番歌單"));
      assert.ok(tourLayoutHtml.includes("巡演總覽"));
      assert.ok(tourLayoutHtml.includes("查看票根"));

      // Render 2: showSubMode === "show" -> renders ShowSlip
      const showLayoutHtml = renderToStaticMarkup(
        React.createElement(ArchiveLayout, {
          filterState: {
            selCategory: "巡演專場",
            selYear: "2024",
            setSelYear: () => {},
            unitPage: 0,
            setUnitPage: () => {},
            showPage: 0,
            setShowPage: () => {},
            unitsByCategory: { "巡演專場": [rejoiceTour.unit] },
            categoryStats: {},
            availableYears: ["2024"],
            yearStats: new Map(),
            filteredUnits: [rejoiceTour.unit],
            pagedUnits: [rejoiceTour.unit],
            totalAllShows: 10,
            handleCategoryClick: () => {},
          },
          routeState: {
            tab: "show",
            setTab: () => {},
            showSubMode: "show",
            setShowSubMode: () => {},
            selUnitId: "arena-tour-2024-rejoice",
            selShow: "1672276",
            selSong: "",
            selVenue: "",
            q: "",
            setQ: () => {},
            isDesktopNavOpen: false,
            toggleDesktopNav: () => {},
            isFilterDrawerOpen: false,
            setIsFilterDrawerOpen: () => {},
            isMobileSearchOpen: false,
            setIsMobileSearchOpen: () => {},
            isCalendarOpen: false,
            setIsCalendarOpen: () => {},
            draftState: null,
            setDraftState: () => {},
            openFilterDrawer: () => {},
            handleCancelDrawer: () => {},
            handleCommitDrawer: () => {},
            confirmButtonLabel: "確認套用",
            slipRef: { current: null },
            handleSelectShow: () => {},
            handleSelectSong: () => {},
            handleSelectVenue: () => {},
            handleSelectUnit: () => {},
            handleReturnHome: () => {},
            handleSelectTourMode: () => {},
            handleSelectShowMode: () => {},
            handleToggleSubMode: () => {},
            visualViewportStyle: { height: "100dvh", top: 0 },
          },
          unitData: index.unitData,
          trackShows: index.trackShows,
          globalVenueShows: index.globalVenueShows,
          allUsedSongs: index.allUsedSongs,
          allVenues: index.allVenues,
          allUnits: allUnits,
          showById: new Map(),
        })
      );

      // Must render ShowSlip markup
      assert.ok(showLayoutHtml.includes("STAGE SETLIST RUN SHEET"));
      assert.ok(showLayoutHtml.includes("MAIN SETLIST // 本篇演奏曲目"));
      assert.ok(showLayoutHtml.includes("橫濱K-Arena"));
    });

    it("preserves pure ticket aesthetics without internal mode switchers inside TourSlip and ShowSlip (ADR-0102)", () => {
      // 1. TourSlip contains pure ticket header without internal toggle
      const rejoiceTour = allUnits.find((u) => u.id === "arena-tour-2024-rejoice");
      assert.ok(rejoiceTour);
      const tourHtml = renderToStaticMarkup(
        React.createElement(TourSlip, {
          tourUnitData: rejoiceTour,
          showSubMode: "tour",
          onSelectSong: () => {},
          onSelectShow: () => {},
        })
      );
      assert.ok(tourHtml.includes("TOUR CONSENSUS MASTER SHEET"));
      assert.ok(tourHtml.includes("CONSENSUS TEMPLATE // 巡演定番歌單"));
      // Pure ticket: NO internal capsule toggle inside the paper slip
      assert.ok(!tourHtml.includes("⟷"));

      // 2. ShowSlip for tour contains pure ticket header without internal toggle
      const rejoiceUd = index.unitData.get("arena-tour-2024-rejoice");
      const showHtml = renderToStaticMarkup(
        React.createElement(ShowSlip, {
          ud: rejoiceUd,
          showId: "1672276",
          showSubMode: "show",
          onSelectSong: () => {},
          onSelectShow: () => {},
          onSelectVenue: () => {},
        })
      );
      assert.ok(showHtml.includes("STAGE SETLIST RUN SHEET"));
      assert.ok(showHtml.includes("MAIN SETLIST // 本篇演奏曲目"));
      // Pure ticket: NO internal capsule toggle inside the paper slip
      assert.ok(!showHtml.includes("⟷"));
      assert.ok(!showHtml.includes("單場即時票根"));

      // 3. DualModeCapsuleToggle component standalone isolation
      const standaloneToggleHtml = renderToStaticMarkup(
        React.createElement(DualModeCapsuleToggle, {
          isTour: true,
          mode: "show",
          unitId: "arena-tour-2024-rejoice",
          showId: "1672276",
          onToggleMode: () => {},
          onSelectTour: () => {},
          onSelectShow: () => {},
        })
      );
      assert.ok(standaloneToggleHtml.includes("巡演總覽"));
      assert.ok(standaloneToggleHtml.includes("單場即時票根"));
      assert.ok(standaloneToggleHtml.includes("⟷"));
    });
  });

