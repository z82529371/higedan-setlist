import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

describe("32. Song Master Media & Twin-Track Linkage (Seam: song-media.js)", () => {
  it("parses diverse timestamp representations into integer seconds", async () => {
    const { parseTimestamp } = await loadModule("src/lib/song-media.js");

    // Standard integers / floats
    assert.strictEqual(parseTimestamp(135), 135);
    assert.strictEqual(parseTimestamp(135.8), 135);
    assert.strictEqual(parseTimestamp(0), 0);
    assert.strictEqual(parseTimestamp(-10), 0);

    // Numeric strings
    assert.strictEqual(parseTimestamp("135"), 135);
    assert.strictEqual(parseTimestamp("  85  "), 85);

    // MM:SS formats
    assert.strictEqual(parseTimestamp("02:15"), 135);
    assert.strictEqual(parseTimestamp("1:30"), 90);
    assert.strictEqual(parseTimestamp("00:45"), 45);
    assert.strictEqual(parseTimestamp(" 10:05 "), 605);

    // HH:MM:SS formats
    assert.strictEqual(parseTimestamp("01:02:15"), 3735);
    assert.strictEqual(parseTimestamp("1:00:00"), 3600);

    // Invalid / empty inputs
    assert.strictEqual(parseTimestamp(null), 0);
    assert.strictEqual(parseTimestamp(undefined), 0);
    assert.strictEqual(parseTimestamp(""), 0);
    assert.strictEqual(parseTimestamp("invalid"), 0);
    assert.strictEqual(parseTimestamp("abc:def"), 0);
  });

  it("builds privacy-friendly YouTube embed URLs and watch URLs with timestamp offsets and intervals", async () => {
    const { buildYouTubeEmbedUrl, buildYouTubeWatchUrl, formatTimestamp } = await loadModule("src/lib/song-media.js");

    // Format timestamp
    assert.strictEqual(formatTimestamp(135), "02:15");
    assert.strictEqual(formatTimestamp(45), "00:45");
    assert.strictEqual(formatTimestamp(3735), "01:02:15");

    // Embed without start
    assert.strictEqual(
      buildYouTubeEmbedUrl("bJXIYp2f0pc"),
      "https://www.youtube.com/embed/bJXIYp2f0pc?autoplay=1&rel=0&enablejsapi=1"
    );

    // Embed with start
    assert.strictEqual(
      buildYouTubeEmbedUrl("bJXIYp2f0pc", "02:15"),
      "https://www.youtube.com/embed/bJXIYp2f0pc?autoplay=1&rel=0&enablejsapi=1&start=135"
    );

    // Embed with start, autoplay=false, and end interval
    assert.strictEqual(
      buildYouTubeEmbedUrl("bJXIYp2f0pc", "02:15", false, "02:45"),
      "https://www.youtube.com/embed/bJXIYp2f0pc?autoplay=0&rel=0&enablejsapi=1&start=135&end=165"
    );

    // Embed with invalid end <= start defensively omits end
    assert.strictEqual(
      buildYouTubeEmbedUrl("bJXIYp2f0pc", "02:15", false, "01:00"),
      "https://www.youtube.com/embed/bJXIYp2f0pc?autoplay=0&rel=0&enablejsapi=1&start=135"
    );

    // Watch without start
    assert.strictEqual(
      buildYouTubeWatchUrl("TQ8WlA2GXbk"),
      "https://www.youtube.com/watch?v=TQ8WlA2GXbk"
    );

    // Watch with start
    assert.strictEqual(
      buildYouTubeWatchUrl("TQ8WlA2GXbk", 90),
      "https://www.youtube.com/watch?v=TQ8WlA2GXbk&t=90s"
    );

    // Empty checks
    assert.strictEqual(buildYouTubeEmbedUrl(""), "");
    assert.strictEqual(buildYouTubeWatchUrl(""), "");
  });

  it("extracts structured media and resolves twin-track precedence for songs", async () => {
    const { resolveSongMedia, getSongMedia } = await loadModule("src/lib/song-media.js");

    // 1. Song with both Live (with showId) and MV
    const pretenderMedia = resolveSongMedia({
      id: "pretender",
      title: "Pretender",
      mv: "TQ8WlA2GXbk",
      live: {
        youtubeId: "bJXIYp2f0pc",
        title: "one-man tour 2019 @ 日本武道館",
        showId: "1078251",
      },
    });
    assert.strictEqual(pretenderMedia.hasMedia, true);
    assert.strictEqual(pretenderMedia.hasLive, true);
    assert.strictEqual(pretenderMedia.hasMv, true);
    assert.strictEqual(pretenderMedia.defaultTrack, "live");
    assert.strictEqual(pretenderMedia.live.youtubeId, "bJXIYp2f0pc");
    assert.strictEqual(pretenderMedia.live.showId, "1078251");
    assert.strictEqual(pretenderMedia.mv.youtubeId, "TQ8WlA2GXbk");

    // 2. Song with Live and Pacifico Yokohama showId
    const shukumeiMedia = resolveSongMedia({
      id: "shukumei",
      title: "宿命",
      live: {
        youtubeId: "2gN8QjN4N5U",
        title: "Tour 19/20 @ パシフィコ横浜",
        showId: "1150110",
      },
    });
    assert.strictEqual(shukumeiMedia.hasMedia, true);
    assert.strictEqual(shukumeiMedia.hasLive, true);
    assert.strictEqual(shukumeiMedia.live.showId, "1150110");

    // 3. MV only, defaultTrack is "mv"
    const subtitleMedia = resolveSongMedia({
      id: "subtitle",
      title: "Subtitle",
      mv: "hN5MBlGv2Ac",
    });
    assert.strictEqual(subtitleMedia.hasMedia, true);
    assert.strictEqual(subtitleMedia.hasLive, false);
    assert.strictEqual(subtitleMedia.hasMv, true);
    assert.strictEqual(subtitleMedia.defaultTrack, "mv");
    assert.strictEqual(subtitleMedia.mv.youtubeId, "hN5MBlGv2Ac");

    // 4. Excerpt live track with start and end interval
    const excerptMedia = resolveSongMedia({
      id: "shukumei",
      title: "宿命",
      live: {
        youtubeId: "2gN8QjN4N5U",
        title: "Arena Tour Teaser",
        start: "03:15",
        end: "03:45",
      },
    });
    assert.strictEqual(excerptMedia.hasLive, true);
    assert.strictEqual(excerptMedia.live.isExcerpt, true);
    assert.strictEqual(excerptMedia.live.durationSeconds, 30);
    assert.strictEqual(excerptMedia.live.timeRangeText, "03:15 ~ 03:45");

    // 5. Multiple live concert recordings across different years
    const multiLiveMedia = resolveSongMedia({
      id: "pretender",
      title: "Pretender",
      live: [
        {
          youtubeId: "bJXIYp2f0pc",
          title: "one-man tour 2019 @ 日本武道館",
          shortTitle: "2019 武道館",
          showId: "1078251",
        },
        {
          youtubeId: "h8rZAMiRTTo",
          title: "LIVE at STADIUM 2025 @ 日産スタジアム",
          shortTitle: "2025 日產",
          showId: "1735839",
        },
      ],
    });
    assert.strictEqual(multiLiveMedia.hasLive, true);
    assert.strictEqual(multiLiveMedia.hasMultipleLives, true);
    assert.strictEqual(multiLiveMedia.lives.length, 2);
    assert.strictEqual(multiLiveMedia.lives[0].shortTitle, "2019 武道館");
    assert.strictEqual(multiLiveMedia.lives[1].shortTitle, "2025 日產");
    assert.strictEqual(multiLiveMedia.live.youtubeId, "bJXIYp2f0pc");

    // 6. Multiple MV versions (official band MV, anime collaboration MV, short film, etc.)
    const multiMvMedia = resolveSongMedia({
      id: "rashisa",
      title: "らしさ",
      mv: [
        {
          youtubeId: "keOnleW2eak",
          title: "Official髭男dism - らしさ [Official Video]",
          shortTitle: "官方 MV",
          subType: "mv",
        },
        {
          youtubeId: "CWZ0lTUs5Mk",
          title: "「らしさ」✕ 劇場アニメ「ひゃくえむ。」コラボレーション MV",
          shortTitle: "動畫版 MV",
          subType: "anime",
        },
      ],
    });
    assert.strictEqual(multiMvMedia.hasMv, true);
    assert.strictEqual(multiMvMedia.hasMultipleMvs, true);
    assert.strictEqual(multiMvMedia.mvs.length, 2);
    assert.strictEqual(multiMvMedia.mvs[0].shortTitle, "官方 MV");
    assert.strictEqual(multiMvMedia.mvs[1].shortTitle, "動畫版 MV");
    assert.strictEqual(multiMvMedia.mvs[1].subType, "anime");
    assert.strictEqual(multiMvMedia.mv.youtubeId, "keOnleW2eak");

    // 7. Unseeded or non-media song
    const nonMedia = getSongMedia("non-existent-or-empty");
    assert.strictEqual(nonMedia.hasMedia, false);
    assert.strictEqual(nonMedia.hasLive, false);
    assert.strictEqual(nonMedia.hasMv, false);
    assert.strictEqual(nonMedia.defaultTrack, null);
  });

  it("extracts and normalizes tour and event concert media digests (ADR-0136)", async () => {
    const { extractConcertMedia } = await loadModule("src/lib/song-media.js");

    // 1. Tour with digest object
    const tourWithDigest = {
      id: "tour-19-20-hall-travelers",
      title: "Official髭男dism Tour 19/20 -Hall Travelers-",
      media: {
        digest: {
          youtubeId: "y3L0pjZZqKo",
          title: "Official髭男dism Tour 19/20 -Hall Travelers- (2020.2.10 パシフィコ横浜)［Digest］",
        },
      },
    };
    const tourRes = extractConcertMedia(tourWithDigest);
    assert.notStrictEqual(tourRes, null);
    assert.strictEqual(tourRes.youtubeId, "y3L0pjZZqKo");
    assert.strictEqual(
      tourRes.title,
      "Official髭男dism Tour 19/20 -Hall Travelers- (2020.2.10 パシフィコ横浜)［Digest］"
    );
    assert.strictEqual(
      tourRes.embedUrl,
      "https://www.youtube.com/embed/y3L0pjZZqKo?autoplay=1&rel=0&enablejsapi=1"
    );

    // 2. Event unit wrapping
    const eventWithUnit = {
      unit: {
        title: "ONLINE LIVE 2020 - Arena Travelers -",
        media: {
          digest: {
            youtubeId: "8q4AkXgjdGg",
          },
        },
      },
    };
    const eventRes = extractConcertMedia(eventWithUnit);
    assert.notStrictEqual(eventRes, null);
    assert.strictEqual(eventRes.youtubeId, "8q4AkXgjdGg");
    assert.strictEqual(eventRes.title, "ONLINE LIVE 2020 - Arena Travelers -");

    // 3. Tour with string digest
    const simpleTour = {
      title: "Simple Tour",
      media: { digest: "LF-_THYGXe0" },
    };
    const simpleRes = extractConcertMedia(simpleTour);
    assert.notStrictEqual(simpleRes, null);
    assert.strictEqual(simpleRes.youtubeId, "LF-_THYGXe0");

    // 4. Tour without media returns null (Zero DOM Pollution)
    const tourWithoutMedia = {
      id: "free-live-tour-2015",
      title: "Free Live Tour 2015",
    };
    assert.strictEqual(extractConcertMedia(tourWithoutMedia), null);
    assert.strictEqual(extractConcertMedia(null), null);
  });
});
