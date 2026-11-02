import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLiveReleaseIndex,
  formatReleaseTypeLabel,
  formatReleaseFormatLabel,
  formatCoverageLabel,
} from "../../src/lib/live-releases.js";

test("Live Releases Pipeline Seam (ADR-0142)", async (t) => {
  const mockReleasesData = {
    releases: [
      {
        id: "editorial-saitama-2022",
        title: "Official髭男dism one-man tour 2021-2022 -Editorial- @ SAITAMA SUPER ARENA",
        shortTitle: "Editorial 埼玉超級競技場",
        releaseDate: "2022-10-05",
        releaseType: "standalone",
        formats: ["bluray", "dvd", "streaming_audio"],
        catalogNumbers: ["PCXP-50896", "PCBP-54456"],
        recordings: [
          {
            showId: "1353361",
            coverage: "full",
          },
        ],
        streaming: {
          spotifyAlbumId: "0G9M787GjA51s23e98wX0T",
        },
      },
      {
        id: "shocking-nuts-budokan-2023",
        title: "OFFICIAL HIGEDAN DISM SHOCKING NUTS TOUR selected from NIPPON BUDOKAN",
        shortTitle: "SHOCKING NUTS 日本武道館",
        releaseDate: "2024-07-24",
        releaseType: "bonus_video",
        parentRelease: {
          title: "Rejoice (初回限定盤)",
          albumId: "rejoice",
          type: "album",
        },
        formats: ["bluray", "dvd"],
        catalogNumbers: ["PCCA-06302 (CD+BD)"],
        recordings: [
          {
            showId: "1499381",
            coverage: "full",
          },
        ],
      },
    ],
  };

  const mockShowsIndex = {
    "1353361": { id: "1353361", tourId: "one-man-tour-2021-2022-editorial" },
    "1499381": { id: "1499381", tourId: "shocking-nuts-tour-2022-2023" },
  };

  await t.test("indexes releases and provides lookup by showId and releaseId", () => {
    const index = buildLiveReleaseIndex(mockReleasesData, mockShowsIndex);
    assert.equal(index.getAllReleases().length, 2);
    // Guarantees reverse chronological order (newest release first)
    assert.equal(index.getAllReleases()[0].id, "shocking-nuts-budokan-2023");
    assert.equal(index.getAllReleases()[1].id, "editorial-saitama-2022");

    const editorial = index.getReleaseById("editorial-saitama-2022");
    assert.ok(editorial);
    assert.equal(editorial.releaseType, "standalone");

    const forSaitama = index.getReleasesForShow("1353361");
    assert.equal(forSaitama.length, 1);
    assert.equal(forSaitama[0].id, "editorial-saitama-2022");

    const forBudokan = index.getReleasesForShow("1499381");
    assert.equal(forBudokan.length, 1);
    assert.equal(forBudokan[0].id, "shocking-nuts-budokan-2023");
    assert.equal(forBudokan[0].parentRelease.albumId, "rejoice");

    const nonExistent = index.getReleasesForShow("9999999");
    assert.deepEqual(nonExistent, []);
  });

  await t.test("provides lookup of released shows for a tour", () => {
    const index = buildLiveReleaseIndex(mockReleasesData, mockShowsIndex);
    const tourReleases = index.getReleasesForTour("one-man-tour-2021-2022-editorial");
    assert.equal(tourReleases.length, 1);
    assert.equal(tourReleases[0].id, "editorial-saitama-2022");
  });

  await t.test("filters releases by releaseType", () => {
    const index = buildLiveReleaseIndex(mockReleasesData, mockShowsIndex);
    const standalone = index.getReleasesByType("standalone");
    assert.equal(standalone.length, 1);
    assert.equal(standalone[0].id, "editorial-saitama-2022");

    const bonus = index.getReleasesByType("bonus_video");
    assert.equal(bonus.length, 1);
    assert.equal(bonus[0].id, "shocking-nuts-budokan-2023");
  });

  await t.test("formats release types across 4 locales symmetrically", () => {
    assert.equal(formatReleaseTypeLabel("standalone", "zh-TW"), "獨立影音發行");
    assert.equal(formatReleaseTypeLabel("standalone", "ja"), "単独映像作品");
    assert.equal(formatReleaseTypeLabel("standalone", "en"), "Standalone Video");
    assert.equal(formatReleaseTypeLabel("standalone", "ko"), "단독 영상 발매");

    assert.equal(formatReleaseTypeLabel("bonus_video", "zh-TW"), "影音限定盤 / 特典映像");
    assert.equal(formatReleaseTypeLabel("bonus_video", "ja"), "映像付き盤 / 特典映像");
    assert.equal(formatReleaseTypeLabel("bonus_video", "en"), "Video Edition / Bonus Disc");
    assert.equal(formatReleaseTypeLabel("bonus_video", "ko"), "영상 수록반 / 특전 영상");

    assert.equal(formatReleaseTypeLabel("digital_only", "zh-TW"), "串流現場專輯");
    assert.equal(formatReleaseTypeLabel("digital_only", "ja"), "配信限定ライブ音源");
    assert.equal(formatReleaseTypeLabel("digital_only", "en"), "Digital Streaming Album");
    assert.equal(formatReleaseTypeLabel("digital_only", "ko"), "스트리밍 라이브 앨범");
  });

  await t.test("formats release formats into standard display pills", () => {
    assert.equal(formatReleaseFormatLabel("bluray"), "Blu-ray");
    assert.equal(formatReleaseFormatLabel("dvd"), "DVD");
    assert.equal(formatReleaseFormatLabel("streaming_audio"), "Spotify / Apple Music");
    assert.equal(formatReleaseFormatLabel("streaming_video"), "Streaming Video");
  });

  await t.test("formats recording coverage across 4 locales symmetrically", () => {
    assert.equal(formatCoverageLabel("full", "zh-TW"), "全場收錄");
    assert.equal(formatCoverageLabel("full", "ja"), "完全収録");
    assert.equal(formatCoverageLabel("full", "en"), "Full Concert");
    assert.equal(formatCoverageLabel("full", "ko"), "전곡 수록");

    assert.equal(formatCoverageLabel("selected", "zh-TW"), "精選節錄");
    assert.equal(formatCoverageLabel("selected", "ja"), "厳選収録");
    assert.equal(formatCoverageLabel("selected", "en"), "Selected Highlights");
    assert.equal(formatCoverageLabel("selected", "ko"), "선별 수록");
  });
});
