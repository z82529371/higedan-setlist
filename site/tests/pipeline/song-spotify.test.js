import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModule } from '../helpers/vite-server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const songsPath = path.resolve(__dirname, '../../../data/songs.json');
const toursDir = path.resolve(__dirname, '../../../data/tours');
const eventsDir = path.resolve(__dirname, '../../../data/events');

describe('Song Spotify Domain Engine & Pipeline Gate (ADR-0138)', () => {
  describe('1. Pure Domain Logic & URL Builders', () => {
    it('safely resolves null/undefined song objects', async () => {
      const { resolveSongSpotify } = await loadModule('src/lib/song-spotify.js');
      const res = resolveSongSpotify(null);
      assert.equal(res.hasSpotify, false);
      assert.equal(res.hasStudio, false);
      assert.equal(res.hasLive, false);
      assert.equal(res.trackId, null);
      assert.deepEqual(res.lives, []);
    });

    it('resolves songs with studio track only', async () => {
      const { resolveSongSpotify } = await loadModule('src/lib/song-spotify.js');
      const song = {
        id: 'sanitizer',
        title: 'Sanitizer',
        spotify: {
          trackId: '4eCYeVfzGsS6jq8aX43yDr',
        },
      };
      const res = resolveSongSpotify(song);
      assert.equal(res.hasSpotify, true);
      assert.equal(res.hasStudio, true);
      assert.equal(res.hasLive, false);
      assert.equal(res.hasMultipleLives, false);
      assert.equal(res.trackId, '4eCYeVfzGsS6jq8aX43yDr');
      assert.equal(res.defaultTrack, 'studio');
    });

    it('resolves songs with studio track and multiple live tracks', async () => {
      const { resolveSongSpotify } = await loadModule('src/lib/song-spotify.js');
      const song = {
        id: 'pretender',
        title: 'Pretender',
        spotify: {
          trackId: '49h5Aav6yn1o1ACGyovDdZ',
          live: [
            {
              trackId: '2K74OeuU2y0RN746g9EizC',
              title: 'Budokan 2019',
              shortTitle: '2019 武道館',
              showId: '1078251',
            },
            {
              trackId: '43MGiVpukiSOnm7RdltAtZ',
              title: 'Saitama 2021',
              shortTitle: '2021 埼玉',
              showId: '1448833',
            },
          ],
        },
      };
      const res = resolveSongSpotify(song);
      assert.equal(res.hasSpotify, true);
      assert.equal(res.hasStudio, true);
      assert.equal(res.hasLive, true);
      assert.equal(res.hasMultipleLives, true);
      assert.equal(res.lives.length, 2);
      assert.equal(res.defaultTrack, 'studio');
    });

    it('builds standard Spotify embed URL and track URL', async () => {
      const { buildSpotifyEmbedUrl, buildSpotifyTrackUrl } = await loadModule('src/lib/song-spotify.js');
      const trackId = '49h5Aav6yn1o1ACGyovDdZ';
      assert.equal(
        buildSpotifyEmbedUrl(trackId),
        'https://open.spotify.com/embed/track/49h5Aav6yn1o1ACGyovDdZ?utm_source=generator'
      );
      assert.equal(
        buildSpotifyTrackUrl(trackId),
        'https://open.spotify.com/track/49h5Aav6yn1o1ACGyovDdZ'
      );
      assert.equal(buildSpotifyEmbedUrl(''), '');
      assert.equal(buildSpotifyTrackUrl(''), '');
    });
  });

  describe('2. Pipeline Data Integrity Gate across 110 Songs', () => {
    const raw = JSON.parse(fs.readFileSync(songsPath, 'utf8'));
    const allShows = new Set();

    for (const f of fs.readdirSync(toursDir)) {
      if (f.endsWith('.json')) {
        const t = JSON.parse(fs.readFileSync(path.join(toursDir, f), 'utf8'));
        t.shows?.forEach((s) => allShows.add(String(s.id)));
      }
    }
    for (const f of fs.readdirSync(eventsDir)) {
      if (f.endsWith('.json')) {
        const e = JSON.parse(fs.readFileSync(path.join(eventsDir, f), 'utf8'));
        if (e.id) allShows.add(String(e.id));
        e.shows?.forEach((s) => allShows.add(String(s.id)));
      }
    }

    const base62Regex = /^[a-zA-Z0-9]{22}$/;

    it('ensures exactly 94 officially released songs have valid 22-char Base62 studio trackId', () => {
      const released = raw.songs.filter((s) => !s.unreleased);
      assert.equal(released.length, 94);

      for (const s of released) {
        assert.ok(s.spotify, `Released song ${s.id} (${s.title}) must have spotify object`);
        assert.ok(
          base62Regex.test(s.spotify.trackId),
          `Song ${s.id} trackId "${s.spotify.trackId}" must be valid 22-char Base62`
        );
      }
    });

    it('ensures 16 unreleased demo songs do not have spotify object', () => {
      const unreleased = raw.songs.filter((s) => s.unreleased);
      assert.equal(unreleased.length, 16);
      for (const s of unreleased) {
        assert.equal(
          s.spotify,
          undefined,
          `Unreleased song ${s.id} must not have spotify object`
        );
      }
    });

    it('ensures every live track has valid 22-char Base62 trackId and existing showId', () => {
      let totalLiveTracks = 0;
      for (const s of raw.songs) {
        if (s.spotify?.live) {
          for (const l of s.spotify.live) {
            totalLiveTracks++;
            assert.ok(
              base62Regex.test(l.trackId),
              `Song ${s.id} live trackId "${l.trackId}" must be valid 22-char Base62`
            );
            assert.ok(l.shortTitle, `Song ${s.id} live track must have shortTitle`);
            if (l.showId) {
              assert.ok(
                allShows.has(String(l.showId)),
                `Song ${s.id} live showId "${l.showId}" must exist in tours or events`
              );
            }
          }
        }
      }
      assert.ok(totalLiveTracks >= 90, `Expected at least 90 live tracks, found ${totalLiveTracks}`);
    });

    it('getSongSpotify helper resolves real song from synced dataset', async () => {
      const { getSongSpotify } = await loadModule('src/lib/song-spotify.js');
      const pretender = getSongSpotify('pretender');
      assert.equal(pretender.hasSpotify, true);
      assert.equal(pretender.trackId, '49h5Aav6yn1o1ACGyovDdZ');
      assert.ok(pretender.lives.length >= 4);

      const unreleased = getSongSpotify('fuusen');
      assert.equal(unreleased.hasSpotify, false);
    });
  });
});
