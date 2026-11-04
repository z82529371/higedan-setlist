import test from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

test("Studio Discography Pipeline Seam (ADR-0144)", async (t) => {
  const { buildDiscographyIndex, formatDiscographyTypeLabel } = await loadModule(
    "src/lib/discography.js"
  );
  const mockDiscographyData = {
    physicalSingles: [
      {
        id: "single-pretender",
        index: 2,
        title: "Pretender",
        releaseDate: "2019-05-15",
        label: "ポニーキャニオン",
        album: "Traveler",
        chartRankOricon: 9,
        coverUrl: "https://image-cdn.spotify.com/pretender",
        editions: [
          {
            name: "初回限定盤",
            format: "cd_dvd",
            catalogNumber: "PCCA-04784",
          },
          {
            name: "通常盤",
            format: "cd",
            catalogNumber: "PCCA-04785",
          },
        ],
        tracks: [
          { trackNumber: 1, title: "Pretender", songId: "pretender" },
          { trackNumber: 2, title: "Amazing", songId: "amazing" },
          { trackNumber: 3, title: "Pretender (Instrumental)", songId: null },
        ],
      },
    ],
    digitalSingles: [
      {
        id: "digital-subtitle",
        index: 8,
        title: "Subtitle",
        releaseDate: "2022-10-12",
        label: "IRORI Records",
        album: "Rejoice",
        coverUrl: "https://image-cdn.spotify.com/subtitle",
        tracks: [{ trackNumber: 1, title: "Subtitle", songId: "subtitle" }],
      },
    ],
    eps: [
      {
        id: "ep-mixed-nuts",
        index: 4,
        title: "ミックスナッツ EP",
        releaseDate: "2022-06-22",
        label: "IRORI Records",
        coverUrl: "https://image-cdn.spotify.com/mixed-nuts-ep",
        tracks: [
          { trackNumber: 1, title: "ミックスナッツ", songId: "mixed-nuts" },
          { trackNumber: 2, title: "Anarchy", songId: "anarchy" },
          { trackNumber: 3, title: "クロニクル", songId: null },
          { trackNumber: 4, title: "破顔", songId: "hakan" },
        ],
      },
    ],
    albums: {
      fullAlbums: [
        {
          id: "album-traveler",
          index: 1,
          title: "Traveler",
          releaseDate: "2019-10-09",
          label: "ポニーキャニオン",
          chartRankOricon: 1,
          coverUrl: "https://image-cdn.spotify.com/traveler",
          tracks: [
            { trackNumber: 1, title: "イエスタデイ", songId: "yesterday" },
            { trackNumber: 2, title: "宿命", songId: "shukumei" },
          ],
        },
      ],
      miniAlbums: [
        {
          id: "album-report",
          index: 3,
          title: "レポート",
          releaseDate: "2017-04-19",
          label: "ラストラム・ミュージックエンタテインメント",
          coverUrl: "https://image-cdn.spotify.com/report",
          tracks: [
            { trackNumber: 1, title: "始まりの朝", songId: "hajimari-no-asa" },
          ],
        },
      ],
      digitalAlbums: [],
    },
  };

  await t.test("flattens and sorts all studio releases reverse chronologically", () => {
    const index = buildDiscographyIndex(mockDiscographyData);
    const all = index.getAllReleases();
    assert.equal(all.length, 5);
    // Newest to oldest: Subtitle (2022-10-12) -> ミックスナッツ EP (2022-06-22) -> Traveler (2019-10-09) -> Pretender (2019-05-15) -> レポート (2017-04-19)
    assert.equal(all[0].id, "digital-subtitle");
    assert.equal(all[1].id, "ep-mixed-nuts");
    assert.equal(all[2].id, "album-traveler");
    assert.equal(all[3].id, "single-pretender");
    assert.equal(all[4].id, "album-report");
  });

  await t.test("looks up release by unique id", () => {
    const index = buildDiscographyIndex(mockDiscographyData);
    const pretender = index.getReleaseById("single-pretender");
    assert.ok(pretender);
    assert.equal(pretender.title, "Pretender");
    assert.equal(pretender.category, "physical_single");
    assert.equal(pretender.tracks.length, 3);
    assert.equal(pretender.tracks[0].songId, "pretender");
    assert.equal(pretender.tracks[2].songId, null);
  });

  await t.test("filters releases by sub-category pills", () => {
    const index = buildDiscographyIndex(mockDiscographyData);
    assert.equal(index.getReleasesByCategory("all").length, 5);
    assert.equal(index.getReleasesByCategory("physical_single").length, 1);
    assert.equal(index.getReleasesByCategory("digital_single").length, 1);
    assert.equal(index.getReleasesByCategory("ep").length, 1);
    assert.equal(index.getReleasesByCategory("album").length, 2);
  });

  await t.test("finds primary release for a given songId", () => {
    const index = buildDiscographyIndex(mockDiscographyData);
    // Pretender is on single-pretender as track 1
    const relPretender = index.findReleaseForSong("pretender");
    assert.ok(relPretender);
    assert.equal(relPretender.id, "single-pretender");

    // Amazing is also on single-pretender as track 2
    const relAmazing = index.findReleaseForSong("amazing");
    assert.ok(relAmazing);
    assert.equal(relAmazing.id, "single-pretender");

    // Yesterday is on album-traveler
    const relYesterday = index.findReleaseForSong("yesterday");
    assert.ok(relYesterday);
    assert.equal(relYesterday.id, "album-traveler");
  });

  await t.test("localizes category labels across 4 locales", () => {
    assert.equal(formatDiscographyTypeLabel("physical_single", "zh-TW"), "實體單曲");
    assert.equal(formatDiscographyTypeLabel("physical_single", "ja"), "CDシングル");
    assert.equal(formatDiscographyTypeLabel("digital_single", "en"), "Digital Single");
    assert.equal(formatDiscographyTypeLabel("collaboration_single", "zh-TW"), "合作單曲");
    assert.equal(formatDiscographyTypeLabel("album", "ko"), "정규/미니 앨범");
  });

  await t.test("indexes production data/discography.json with complete covers and tracks", async () => {
    const fs = await import("node:fs");
    const realData = JSON.parse(
      fs.readFileSync(new URL("../../src/data/discography.json", import.meta.url), "utf8")
    );
    const index = buildDiscographyIndex(realData);
    const all = index.getAllReleases();
    assert.ok(all.length >= 38);

    const pretender = index.getReleaseById("single-pretender");
    assert.ok(pretender);
    assert.equal(pretender.coverUrl.length > 10, true);
    assert.equal(pretender.tracks.length, 3);
    assert.equal(pretender.tracks[0].songId, "pretender");
    assert.equal(pretender.tracks[1].songId, "amazing");

    const collab = index.getReleaseById("single-koi-no-saichu");
    assert.ok(collab);
    assert.equal(collab.category, "collaboration_single");
    assert.equal(collab.tracks.length, 2);
    assert.equal(collab.tracks[0].songId, "koi-no-saichu");

    const rejoice = index.getReleaseById("album-rejoice");
    assert.ok(rejoice);
    assert.equal(rejoice.tracks.length, 16);
    assert.equal(rejoice.tracks.find(tr => tr.title.includes("Sharon"))?.songId, "sharon");
  });

  await t.test("verifies dedicated single covers for no-doubt, laughter, cry-baby, bad-for-me, anarchy, and nichijo", async () => {
    const fs = await import("node:fs");
    const realData = JSON.parse(
      fs.readFileSync(new URL("../../src/data/discography.json", import.meta.url), "utf8")
    );
    const index = buildDiscographyIndex(realData);

    const noDoubt = index.getReleaseById("single-no-doubt");
    assert.ok(noDoubt);
    assert.equal(noDoubt.coverUrl, "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d48defab6cc1de5f4564782c");

    const badForMe = index.getReleaseById("digital-bad-for-me");
    assert.ok(badForMe);
    assert.equal(badForMe.coverUrl, "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e022ec10b28c9b10b86b8ce2e02");

    const laughter = index.getReleaseById("digital-laughter");
    assert.ok(laughter);
    assert.equal(laughter.coverUrl, "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0278417c2071e3fae684515f23");

    const cryBaby = index.getReleaseById("digital-cry-baby");
    assert.ok(cryBaby);
    assert.equal(cryBaby.coverUrl, "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0242e1509019364ad3370d4101");

    const anarchy = index.getReleaseById("digital-anarchy");
    assert.ok(anarchy);
    assert.equal(anarchy.coverUrl, "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0267ec5fe2f317073d6ccfa436");

    const nichijo = index.getReleaseById("digital-nichijo");
    assert.ok(nichijo);
    assert.equal(nichijo.coverUrl, "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a162174c1f36250c19210290");
  });
});
