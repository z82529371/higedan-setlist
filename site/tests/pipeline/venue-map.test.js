import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import {
  projectLatLngToSvg,
  buildPrefectureMapStats,
  computeSpiderfyOffsets,
  buildJourneySequence,
  haversineDistanceKm,
} from "../../src/lib/venue-map.js";
import {
  PLAYBACK_SPEEDS,
  DEFAULT_PLAYBACK_SPEED,
  BASE_LEGS_PER_SECOND,
  buildTransitPath,
  pointOnTransit,
  tangentAngleOnTransit,
  computeHeadingUpRotation,
  getPlaybackFrame,
  advanceProgress,
  computeFollowCamViewBox,
} from "../../src/lib/journey-playback.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const dataDir = path.resolve(root, "data");

function loadArchiveFixtures() {
  const venueProfiles = JSON.parse(
    fs.readFileSync(path.resolve(dataDir, "venue-profiles.json"), "utf8")
  ).venues;
  const venueProfilesMap = new Map(venueProfiles.map((v) => [v.canonical, v]));

  const globalVenueShows = new Map();
  const allShows = [];

  for (const sub of ["tours", "events"]) {
    const dir = path.resolve(dataDir, sub);
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const unit = JSON.parse(fs.readFileSync(path.resolve(dir, file), "utf8"));
      const unitType =
        unit.type === "專場"
          ? unit.templateSetlist || unit.isTour
            ? "巡演專場"
            : "特別專場"
          : unit.templateSetlist || unit.isTour
            ? "巡演專場"
            : unit.type || "其他";

      for (const s of unit.shows ?? []) {
        const enriched = {
          ...s,
          unitId: unit.id,
          unitTitle: unit.shortTitle || unit.title,
          unitType,
        };
        allShows.push(enriched);
        if (!globalVenueShows.has(s.venue)) globalVenueShows.set(s.venue, []);
        globalVenueShows.get(s.venue).push({
          showId: s.id,
          unitId: unit.id,
          unitType,
          show: s,
        });
      }
    }
  }

  return { venueProfiles, venueProfilesMap, globalVenueShows, allShows };
}

describe("Venue Map Pure Domain Engine (ADR-0124)", () => {
  describe("1. projectLatLngToSvg — Piecewise Equirectangular & Dual Inset Projection", () => {
    it("projects Japan main islands (Hokkaido, Honshu, Shikoku, Kyushu) into main canvas within 800x560 viewBox", () => {
      // Tokyo (Nippon Budokan)
      const tokyo = projectLatLngToSvg(35.6933, 139.7497, { prefecture: "東京都", region: "關東" });
      // Matsue (San'in sanctuary)
      const matsue = projectLatLngToSvg(35.4644, 133.0592, { prefecture: "島根縣", region: "中國" });
      // Sapporo (Hokkaido)
      const sapporo = projectLatLngToSvg(43.0631, 141.3564, { prefecture: "北海道", region: "北海道" });
      // Fukuoka (Kyushu)
      const fukuoka = projectLatLngToSvg(33.6039, 130.4050, { prefecture: "福岡縣", region: "九州" });

      for (const pt of [tokyo, matsue, sapporo, fukuoka]) {
        assert.ok(pt, "Projected point must not be null");
        assert.strictEqual(pt.zone, "main");
        assert.ok(pt.x >= 200 && pt.x <= 790, `Main island x=${pt.x} must be inside main canvas [200, 790]`);
        assert.ok(pt.y >= 15 && pt.y <= 545, `Main island y=${pt.y} must be inside main canvas [15, 545]`);
      }

      // Geographic relative ordering: Fukuoka is west of Matsue, Matsue is west of Tokyo, Tokyo is west of Sapporo
      assert.ok(fukuoka.x < matsue.x, "Fukuoka must be west (smaller x) of Matsue");
      assert.ok(matsue.x < tokyo.x, "Matsue must be west (smaller x) of Tokyo");
      assert.ok(tokyo.x < sapporo.x, "Tokyo must be west (smaller x) of Sapporo");

      // Latitude ordering: Sapporo is north (smaller y) of Tokyo, Fukuoka is south (larger y) of Matsue
      assert.ok(sapporo.y < tokyo.y, "Sapporo must be north (smaller y) of Tokyo");
      assert.ok(fukuoka.y > matsue.y, "Fukuoka must be south (larger y) of Matsue");
    });

    it("projects Overseas Asia venues (Seoul, Goyang, Taipei, Bangkok, Singapore) into top-left overseas inset", () => {
      const seoul = projectLatLngToSvg(37.5192, 127.1274, { prefecture: "韓國", city: "首爾", region: "海外" });
      const goyang = projectLatLngToSvg(37.6690, 126.7458, { prefecture: "韓國", city: "高陽", region: "海外" });
      const taipei = projectLatLngToSvg(25.0510, 121.5500, { prefecture: "台灣", city: "台北", region: "海外" });
      const bangkok = projectLatLngToSvg(13.7314, 100.5689, { prefecture: "泰國", city: "曼谷", region: "海外" });
      const singapore = projectLatLngToSvg(1.3068, 103.7884, { prefecture: "新加坡", city: "新加坡", region: "海外" });

      for (const pt of [seoul, goyang, taipei, bangkok, singapore]) {
        assert.ok(pt, "Overseas projected point must not be null");
        assert.strictEqual(pt.zone, "overseas");
        // Top-left Overseas Asia Inset bounds: x in [16, 266], y in [16, 211]
        assert.ok(pt.x >= 16 && pt.x <= 266, `Overseas x=${pt.x} must fall within top-left inset [16, 266]`);
        assert.ok(pt.y >= 16 && pt.y <= 211, `Overseas y=${pt.y} must fall within top-left inset [16, 211]`);
      }

      // Okinawa Convention Center -> bottom-right Okinawa inset
      const okinawa = projectLatLngToSvg(26.2789, 127.7336, { prefecture: "沖繩縣", city: "沖繩", region: "九州" });
      assert.ok(okinawa);
      assert.strictEqual(okinawa.zone, "okinawa");
      assert.ok(okinawa.x >= 610 && okinawa.x <= 784, `Okinawa x=${okinawa.x} must fall within bottom-right inset [610, 784]`);
      assert.ok(okinawa.y >= 410 && okinawa.y <= 544, `Okinawa y=${okinawa.y} must fall within bottom-right inset [410, 544]`);

      // Null coordinates (virtual livestream) return null
      assert.strictEqual(projectLatLngToSvg(null, null), null);
    });
  });

  describe("2. buildPrefectureMapStats — 43/47 Prefecture Coverage & Three-Tier Heat Classification", () => {
    it("computes 43/47 visited Japan prefectures, 4 unvisited prefectures, 4 overseas countries, and 3-tier classification", () => {
      const { venueProfiles, globalVenueShows } = loadArchiveFixtures();
      const stats = buildPrefectureMapStats(venueProfiles, globalVenueShows);

      assert.strictEqual(stats.totalJapanPrefectures, 47);
      assert.strictEqual(stats.visitedJapanPrefectureCount, 43);
      assert.strictEqual(stats.unvisitedJapanPrefectureCount, 4);
      assert.deepStrictEqual(
        [...stats.unvisitedJapanPrefectures].sort(),
        ["三重縣", "和歌山縣", "宮崎縣", "岩手縣"].sort()
      );
      assert.strictEqual(stats.overseasCountryCount, 4);

      // Unvisited prefectures have tier === "unvisited" and 0 shows
      for (const unvisited of ["岩手縣", "三重縣", "和歌山縣", "宮崎縣"]) {
        const prefStat = stats.byPrefecture[unvisited];
        assert.ok(prefStat, `Missing stat entry for ${unvisited}`);
        assert.strictEqual(prefStat.showCount, 0);
        assert.strictEqual(prefStat.tier, "unvisited");
      }

      // General visited prefectures (1–15 shows, not San'in) have tier === "visited"
      const okinawaStat = stats.byPrefecture["沖繩縣"];
      assert.ok(okinawaStat.showCount >= 1 && okinawaStat.showCount <= 15);
      assert.strictEqual(okinawaStat.tier, "visited");

      // High-frequency hubs (>= 16 shows) and San'in Sanctuary (島根縣, 鳥取縣) have tier === "sanctuary_or_hub"
      const tokyoStat = stats.byPrefecture["東京都"];
      assert.ok(tokyoStat.showCount >= 16);
      assert.strictEqual(tokyoStat.tier, "sanctuary_or_hub");

      const shimaneStat = stats.byPrefecture["島根縣"];
      assert.strictEqual(shimaneStat.isSaninSanctuary, true);
      assert.strictEqual(shimaneStat.tier, "sanctuary_or_hub");

      const tottoriStat = stats.byPrefecture["鳥取縣"];
      assert.strictEqual(tottoriStat.isSaninSanctuary, true);
      assert.strictEqual(tottoriStat.tier, "sanctuary_or_hub");

      // Even if a San'in prefecture has < 16 shows in a filtered subset, it remains sanctuary_or_hub when showCount > 0
      const customStats = buildPrefectureMapStats(
        [{ canonical: "米子AZTiC laughs", prefecture: "鳥取縣", city: "米子", region: "中國", lat: 35.4294, lng: 133.3328 }],
        new Map([["米子AZTiC laughs", [{ showId: "1" }]]])
      );
      assert.strictEqual(customStats.byPrefecture["鳥取縣"].tier, "sanctuary_or_hub");
    });
  });

  describe("3. computeSpiderfyOffsets — Deterministic Radial Offset for Same-Complex Venues (< 200m)", () => {
    it("radially separates Makuhari Messe multi-hall venues and Kotodai Park stages (< 0.002°) while preserving raw lat/lng", () => {
      const { venueProfiles } = loadArchiveFixtures();
      const chibaVenues = venueProfiles.filter((v) => v.prefecture === "千葉縣" && v.city === "千葉");

      const spiderfied = computeSpiderfyOffsets(chibaVenues);
      assert.strictEqual(spiderfied.length, chibaVenues.length);

      // Makuhari Messe venues (6 entries within < 0.002°) must be spiderfied into distinct display coordinates
      const makuhari = spiderfied.filter((v) => v.canonical.startsWith("幕張展覽館"));
      assert.strictEqual(makuhari.length, 6);

      const distinctDisplayCoords = new Set(
        makuhari.map((v) => `${v.displayLat.toFixed(5)},${v.displayLng.toFixed(5)}`)
      );
      assert.strictEqual(
        distinctDisplayCoords.size,
        6,
        "All 6 Makuhari Messe hall/stage entries must receive distinct spiderfied display coordinates"
      );

      for (const m of makuhari) {
        assert.strictEqual(m.isSpiderfied, true);
        assert.strictEqual(m.clusterSize, 6);
        assert.ok(m.dx !== 0 || m.dy !== 0, "Spiderfied venue must have non-zero SVG radial offset (dx, dy)");
        // Original lat/lng must remain untouched
        const orig = chibaVenues.find((v) => v.id === m.id);
        assert.strictEqual(m.lat, orig.lat);
        assert.strictEqual(m.lng, orig.lng);
      }

      // Isolated venue (e.g. 千葉市蘇我體育公園 LOTUS STAGE) must NOT be spiderfied
      const soga = spiderfied.find((v) => v.id === "千葉市蘇我體育公園-lotus-stage");
      assert.ok(soga);
      assert.strictEqual(soga.isSpiderfied, false);
      assert.strictEqual(soga.clusterSize, 1);
      assert.strictEqual(soga.dx, 0);
      assert.strictEqual(soga.dy, 0);
      assert.strictEqual(soga.displayLat, soga.lat);
      assert.strictEqual(soga.displayLng, soga.lng);

      // Determinism: reversing input order produces identical offsets for each venue ID
      const reversedSpiderfied = computeSpiderfyOffsets([...chibaVenues].reverse());
      for (const item of spiderfied) {
        const revItem = reversedSpiderfied.find((r) => r.id === item.id);
        assert.strictEqual(revItem.dx, item.dx);
        assert.strictEqual(revItem.dy, item.dy);
        assert.strictEqual(revItem.displayLat, item.displayLat);
        assert.strictEqual(revItem.displayLng, item.displayLng);
      }

      // Sendai Kotodai Park stages (NORTH STAGE & WEST STAGE) are also spiderfied
      const sendaiVenues = venueProfiles.filter((v) => v.prefecture === "宮城縣" && v.city === "仙台");
      const sendaiSpiderfied = computeSpiderfyOffsets(sendaiVenues);
      const kotodai = sendaiSpiderfied.filter((v) => v.canonical.startsWith("勾當台公園"));
      assert.strictEqual(kotodai.length, 2);
      assert.strictEqual(kotodai[0].isSpiderfied, true);
      assert.strictEqual(kotodai[1].isSpiderfied, true);
      assert.notStrictEqual(
        `${kotodai[0].displayLat},${kotodai[0].displayLng}`,
        `${kotodai[1].displayLat},${kotodai[1].displayLng}`
      );
    });
  });

  describe("4. buildJourneySequence — Virtual Filtering, TV Broadcast Toggle, Stub Retention & Transit Mode Rules", () => {
    it("filters 2022-05-01 virtual finale from Editorial tour (one-man-tour-2021-2022-editorial.json) into virtualShows so physical route ends at 2022-04-17 Matsue", () => {
      const { venueProfilesMap } = loadArchiveFixtures();
      const editorialTour = JSON.parse(
        fs.readFileSync(path.resolve(dataDir, "tours", "one-man-tour-2021-2022-editorial.json"), "utf8")
      );
      assert.strictEqual(editorialTour.shows.length, 49);

      const journey = buildJourneySequence(editorialTour.shows, venueProfilesMap);

      assert.strictEqual(journey.stops.length, 48, "Editorial tour must have 48 physical stops");
      assert.strictEqual(journey.virtualShows.length, 1, "Editorial tour must isolate 1 virtual livestream show");
      assert.strictEqual(journey.virtualShows[0].date, "2022-05-01");
      assert.strictEqual(journey.virtualShows[0].venue, "線上直播");

      const firstStop = journey.stops[0];
      const finalStop = journey.stops.at(-1);
      assert.strictEqual(firstStop.isFirst, true);
      assert.strictEqual(firstStop.date, "2021-09-04");
      assert.strictEqual(finalStop.isFinal, true);
      assert.strictEqual(finalStop.date, "2022-04-17");
      assert.strictEqual(finalStop.city, "松江");
      assert.strictEqual(finalStop.prefecture, "島根縣");
      assert.strictEqual(finalStop.venue, "松江市綜合體育館");
    });

    it("supports includeTvBroadcasts option (523 default vs 547 with TV) and retains 100% of stub shows", () => {
      const { allShows, venueProfilesMap } = loadArchiveFixtures();

      const defaultJourney = buildJourneySequence(allShows, venueProfilesMap);
      assert.strictEqual(defaultJourney.virtualShows.length, 8);
      assert.strictEqual(defaultJourney.excludedTvCount, 24);
      assert.strictEqual(defaultJourney.stops.length, 523);
      assert.strictEqual(defaultJourney.transitions.length, 522);

      // Verify stub shows (0 setlist items) are 100% retained in physical stops
      const stubStops = defaultJourney.stops.filter((s) => s.isStub);
      assert.ok(stubStops.length >= 80, `Expected >= 80 stub shows retained in journey, found ${stubStops.length}`);

      const withTvJourney = buildJourneySequence(allShows, venueProfilesMap, {
        includeTvBroadcasts: true,
      });
      assert.strictEqual(withTvJourney.virtualShows.length, 8);
      assert.strictEqual(withTvJourney.excludedTvCount, 0);
      assert.strictEqual(withTvJourney.stops.length, 547);
      assert.strictEqual(withTvJourney.transitions.length, 546);
    });

    it("accurately classifies stay, van (interconnected Honshu/Shikoku/Kyushu road network & intra-Hokkaido), and flight (overseas, Okinawa, cross-strait Hokkaido)", () => {
      const { venueProfilesMap } = loadArchiveFixtures();

      // Verify Haversine distance calculation
      const distTokyoFukuoka = haversineDistanceKm(35.6933, 139.7497, 33.6039, 130.4050);
      assert.ok(distTokyoFukuoka > 850 && distTokyoFukuoka < 920, `Tokyo-Fukuoka distance=${distTokyoFukuoka}km`);

      const distOsakaFukuoka = haversineDistanceKm(34.6894, 135.5319, 33.6039, 130.4050);
      assert.ok(distOsakaFukuoka > 450 && distOsakaFukuoka < 520, `Osaka-Fukuoka distance=${distOsakaFukuoka}km`);

      const mockShows = [
        // 1 -> 2: Same venue consecutive days -> stay
        { id: "s1", date: "2024-01-01", venue: "松江AZTiC canova", city: "松江", prefecture: "島根縣", region: "中國" },
        { id: "s2", date: "2024-01-02", venue: "松江AZTiC canova", city: "松江", prefecture: "島根縣", region: "中國" },
        // 2 -> 3: Matsue -> Osaka (~240 km overland) -> van
        { id: "s3", date: "2024-01-05", venue: "大阪城會館", city: "大阪", prefecture: "大阪府", region: "關西" },
        // 3 -> 4: Osaka -> Fukuoka (across Kanmon Strait via expressway tunnel/bridge) -> van
        { id: "s4", date: "2024-01-08", venue: "福岡太陽宮殿會館", city: "福岡", prefecture: "福岡縣", region: "九州" },
        // 4 -> 5: Fukuoka -> Tokyo (interconnected Honshu/Kyushu expressway network) -> van
        { id: "s5", date: "2024-01-12", venue: "日本武道館", city: "東京", prefecture: "東京都", region: "關東" },
        // 5 -> 6: Tokyo -> Sapporo (cross-strait to Hokkaido) -> flight
        { id: "s6", date: "2024-01-15", venue: "Zepp Sapporo", city: "札幌", prefecture: "北海道", region: "北海道" },
        // 6 -> 7: Sapporo -> Obihiro (intra-Hokkaido overland) -> van
        { id: "s7", date: "2024-01-17", venue: "帶廣市民文化會館", city: "帶廣", prefecture: "北海道", region: "北海道" },
        // 7 -> 8: Obihiro -> Asahikawa (intra-Hokkaido overland) -> van
        { id: "s8", date: "2024-01-19", venue: "旭川市民文化會館", city: "旭川", prefecture: "北海道", region: "北海道" },
        // 8 -> 9: Asahikawa -> Nagoya (leaving Hokkaido) -> flight
        { id: "s9", date: "2024-01-22", venue: "Zepp Nagoya", city: "名古屋", prefecture: "愛知縣", region: "中部" },
        // 9 -> 10: Nagoya -> Okinawa (Okinawa island flight) -> flight
        { id: "s10", date: "2024-01-25", venue: "沖繩會議中心展覽館", city: "沖繩", prefecture: "沖繩縣", region: "九州" },
        // 10 -> 11: Okinawa -> Taipei (Overseas flight) -> flight
        { id: "s11", date: "2024-01-28", venue: "台北小巨蛋", city: "台北", prefecture: "台灣", region: "海外" },
      ];

      const seq = buildJourneySequence(mockShows, venueProfilesMap);
      assert.strictEqual(seq.stops.length, 11);
      assert.strictEqual(seq.transitions.length, 10);

      const modes = seq.transitions.map((t) => t.transitMode);
      assert.deepStrictEqual(modes, [
        "stay",   // 1->2: Matsue -> Matsue (same venue)
        "van",    // 2->3: Matsue -> Osaka (Honshu road)
        "van",    // 3->4: Osaka -> Fukuoka (Honshu to Kyushu via Kanmon Tunnel/Bridge)
        "van",    // 4->5: Fukuoka -> Tokyo (Kyushu to Honshu interconnected expressway)
        "flight", // 5->6: Tokyo -> Sapporo (crossing Tsugaru Strait into Hokkaido)
        "van",    // 6->7: Sapporo -> Obihiro (intra-Hokkaido road)
        "van",    // 7->8: Obihiro -> Asahikawa (intra-Hokkaido road)
        "flight", // 8->9: Asahikawa -> Nagoya (crossing Tsugaru Strait out of Hokkaido)
        "flight", // 9->10: Nagoya -> Okinawa (island crossing)
        "flight", // 10->11: Okinawa -> Taipei (Overseas)
      ]);

      assert.strictEqual(seq.summary.stayCount, 1);
      assert.strictEqual(seq.summary.vanCount, 5);
      assert.strictEqual(seq.summary.flightCount, 4);
    });

    it("defaults journey playback to the 2× transport speed", () => {
      assert.strictEqual(DEFAULT_PLAYBACK_SPEED, 2);
      assert.ok(PLAYBACK_SPEEDS.includes(DEFAULT_PLAYBACK_SPEED), "Default speed must be offered in the transport");
    });

    it("builds quadratic transit curves and samples cursor positions along them via journey-playback.js", () => {
      const a = { x: 100, y: 100 };
      const b = { x: 300, y: 200 };
      assert.strictEqual(buildTransitPath(a, a, "van"), "", "Zero-length legs produce no path");
      const d = buildTransitPath(a, b, "flight");
      assert.ok(d.startsWith("M100,100 Q") && d.endsWith("300,200"));

      const p0 = pointOnTransit(a, b, "van", 0);
      const p1 = pointOnTransit(a, b, "van", 1);
      assert.deepStrictEqual([p0.x, p0.y], [100, 100]);
      assert.deepStrictEqual([p1.x, p1.y], [300, 200]);
      const mid = pointOnTransit(a, b, "van", 0.5);
      assert.ok(mid.x > 100 && mid.x < 300 && mid.y > 100 && mid.y < 200 + 80);

      // Tangent heading angle for vehicle steering in 2.5D third-person view
      const angle0 = tangentAngleOnTransit(a, b, "van", 0);
      const angle1 = tangentAngleOnTransit(a, b, "van", 1);
      assert.strictEqual(typeof angle0, "number");
      assert.strictEqual(typeof angle1, "number");
      assert.ok(!Number.isNaN(angle0) && !Number.isNaN(angle1));
      assert.strictEqual(tangentAngleOnTransit(a, a, "van", 0), 0);

      // Heading-Up world rotation angles (rotates world so vehicle drives straight forward)
      assert.strictEqual(computeHeadingUpRotation(0), -90); // East -> -90° (upwards)
      assert.strictEqual(computeHeadingUpRotation(-90), 0); // North -> 0° (upwards)
      assert.strictEqual(computeHeadingUpRotation(90), -180); // South -> -180° (upwards)
    });

    it("maps playback progress to sequential frames (completed legs, current leg, leg fraction) and clamps", () => {
      const legs = [{ index: 0 }, { index: 1 }, { index: 2 }];

      const start = getPlaybackFrame(legs, 0);
      assert.strictEqual(start.completedLegs, 0);
      assert.strictEqual(start.currentLeg, legs[0]);
      assert.strictEqual(start.legT, 0);
      assert.strictEqual(start.isComplete, false);

      const mid = getPlaybackFrame(legs, 1.25);
      assert.strictEqual(mid.completedLegs, 1);
      assert.strictEqual(mid.currentLeg, legs[1]);
      assert.strictEqual(mid.legT, 0.25);
      assert.strictEqual(mid.arrivedStopIndex, 1);

      const end = getPlaybackFrame(legs, 99);
      assert.strictEqual(end.completedLegs, 3);
      assert.strictEqual(end.currentLeg, null);
      assert.strictEqual(end.legT, 1);
      assert.strictEqual(end.isComplete, true);
      assert.strictEqual(end.arrivedStopIndex, 3);

      assert.strictEqual(getPlaybackFrame(legs, -5).progress, 0);
      assert.strictEqual(getPlaybackFrame([], 3).isComplete, true);
    });

    it("advances progress by elapsed time scaled by speed and never exceeds the leg count", () => {
      assert.deepStrictEqual(PLAYBACK_SPEEDS, [1, 2, 4]);
      const one = advanceProgress(0, 1000, 1, 100);
      assert.ok(Math.abs(one - BASE_LEGS_PER_SECOND) < 1e-9);
      const fast = advanceProgress(0, 1000, 4, 100);
      assert.ok(Math.abs(fast - BASE_LEGS_PER_SECOND * 4) < 1e-9);
      assert.strictEqual(advanceProgress(99.9, 5000, 4, 100), 100);
    });

    it("computes follow cam viewBox smoothly tracking focus point across main islands, insets, and overview mode", () => {
      // 1. Follow camera mode (default) centers a 280x196 window on focus point, clamped inside 800x560
      const centerBox = computeFollowCamViewBox({ x: 400, y: 280, zone: "main" });
      assert.strictEqual(centerBox, "260 182 280 196");

      // Boundary clamping near top-left (e.g. x=50, y=50 in main island)
      const topLeftBox = computeFollowCamViewBox({ x: 50, y: 50, zone: "main" });
      assert.strictEqual(topLeftBox, "0 0 280 196");

      // Boundary clamping near bottom-right (e.g. x=780, y=540)
      const bottomRightBox = computeFollowCamViewBox({ x: 780, y: 540, zone: "main" });
      assert.strictEqual(bottomRightBox, "520 364 280 196");

      // 2. Overview camera mode always returns macro viewBox
      assert.strictEqual(
        computeFollowCamViewBox({ x: 300, y: 300, zone: "main" }, { cameraMode: "overview" }),
        "0 0 800 560"
      );

      // 3. Completed journey returns macro viewBox when isComplete is true
      assert.strictEqual(
        computeFollowCamViewBox({ x: 300, y: 300, zone: "main" }, { isComplete: true }),
        "0 0 800 560"
      );

      // 4. Overseas Asia Inset focus in follow mode
      const overseasBox = computeFollowCamViewBox({ x: 80, y: 90, zone: "overseas" });
      assert.strictEqual(overseasBox, "0 0 300 210");

      // 5. Okinawa Inset focus in follow mode
      const okinawaBox = computeFollowCamViewBox({ x: 700, y: 490, zone: "okinawa" });
      assert.strictEqual(okinawaBox, "580 410 220 154");
    });
  });

  describe("5. japan-map-paths.js — High-Resolution Coastline SVG Geometry, Callout Leader Anchors & Spotlight ViewBox", () => {
    it("provides high-resolution 47 Japan prefectures + 4 Overseas Asia paths (< 15 KB gzip), callout anchors, graticules, and zoom scale factor", async () => {
      const mapPathsMod = await import("../../src/lib/japan-map-paths.js");
      const {
        PREFECTURE_PATHS,
        PREFECTURE_MAP_BY_NAME,
        MAP_CALLOUT_ANCHORS,
        MAP_GRATICULE_PATHS,
        getZoomViewBox,
        getZoomScaleFactor,
      } = mapPathsMod;

      assert.ok(Array.isArray(PREFECTURE_PATHS), "PREFECTURE_PATHS must be an array");
      assert.strictEqual(PREFECTURE_PATHS.length, 51, "Must include 47 Japan prefectures + 4 Overseas countries");

      const rawPathFile = fs.readFileSync(
        path.resolve(here, "../../src/lib/japan-map-paths.js"),
        "utf8"
      );
      const gzipBytes = zlib.gzipSync(rawPathFile).length;
      assert.ok(
        gzipBytes < 15 * 1024,
        `japan-map-paths.js gzip size (${gzipBytes} B) must be under 15 KB (ADR-0124)`
      );

      let totalVertices = 0;
      for (const item of PREFECTURE_PATHS) {
        assert.ok(item.prefecture, "Each entry must have prefecture name");
        assert.ok(item.path && item.path.startsWith("M") && item.path.endsWith("Z"), `Invalid SVG path for ${item.prefecture}`);
        const vertexCount = (item.path.match(/[ML]/g) || []).length;
        assert.ok(
          vertexCount >= 10,
          `Prefecture ${item.prefecture} must have high-resolution coastline geometry (>= 10 vertices, got ${vertexCount})`
        );
        totalVertices += vertexCount;
        assert.strictEqual(typeof item.cx, "number");
        assert.strictEqual(typeof item.cy, "number");
        assert.ok(item.viewBox && item.viewBox.split(" ").length === 4, `Invalid viewBox for ${item.prefecture}`);
        assert.strictEqual(PREFECTURE_MAP_BY_NAME[item.prefecture], item);
      }
      assert.ok(totalVertices >= 900, `Total coastline vertices across 51 entries must be >= 900 (got ${totalVertices})`);

      // Verify Callout Leader Line anchors & Graticule paths
      assert.ok(Array.isArray(MAP_CALLOUT_ANCHORS) && MAP_CALLOUT_ANCHORS.length >= 7, "Must export MAP_CALLOUT_ANCHORS for ocean leader lines");
      assert.ok(Array.isArray(MAP_GRATICULE_PATHS) && MAP_GRATICULE_PATHS.length >= 6, "Must export MAP_GRATICULE_PATHS for ocean grid");
      assert.strictEqual(getZoomScaleFactor("0 0 800 560"), 1);
      assert.ok(getZoomScaleFactor(getZoomViewBox("東京都")) > 3, "Zoom scale factor for Tokyo must be > 3x");

      assert.strictEqual(getZoomViewBox(null), "0 0 800 560");
      const shimaneVb = getZoomViewBox("島根縣").split(" ").map(Number);
      assert.strictEqual(shimaneVb.length, 4);
      assert.ok(shimaneVb[2] < 800 && shimaneVb[3] < 560, "Spotlight zoom viewBox must zoom in closer than full 800x560");

      // Verify all 347 physical venues project inside their prefecture's Spotlight Zoom viewBox
      const { venueProfiles } = loadArchiveFixtures();
      for (const v of venueProfiles) {
        if (v.isVirtual) continue;
        const pt = projectLatLngToSvg(v.lat, v.lng, v);
        assert.ok(pt, `Projected point missing for ${v.canonical}`);
        const [vx, vy, vw, vh] = getZoomViewBox(v.prefecture).split(" ").map(Number);
        assert.ok(
          pt.x >= vx && pt.x <= vx + vw && pt.y >= vy && pt.y <= vy + vh,
          `Venue ${v.canonical} (${v.prefecture}) at (${pt.x}, ${pt.y}) must fall within prefecture zoom viewBox [${vx}, ${vy}, ${vw}, ${vh}]`
        );
      }
    });
  });
});
