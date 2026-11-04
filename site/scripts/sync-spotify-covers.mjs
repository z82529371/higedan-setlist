#!/usr/bin/env node
/**
 * sync-spotify-covers.mjs (ADR-0143)
 * Fetches official 300x300 album jacket thumbnail URLs from Spotify oEmbed API
 * and writes them into `data/songs.json` under `spotify.coverUrl`.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");
const songsPath = resolve(rootDir, "data/songs.json");

const OEMBED_BASE = "https://open.spotify.com/oembed?url=https://open.spotify.com/track/";

async function fetchCoverForTrack(trackId) {
  const url = `${OEMBED_BASE}${encodeURIComponent(trackId)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "OfficialHigeDandismConcertArchive/1.0"
      }
    });
    if (!res.ok) {
      console.warn(`[WARN] HTTP ${res.status} for track ${trackId}`);
      return null;
    }
    const data = await res.json();
    return data.thumbnail_url || null;
  } catch (err) {
    console.error(`[ERROR] Failed to fetch cover for track ${trackId}:`, err.message);
    return null;
  }
}

async function main() {
  const force = process.argv.includes("--force");
  console.log(`[sync-spotify-covers] Loading songs from ${songsPath}... (force: ${force})`);
  const raw = readFileSync(songsPath, "utf8");
  const data = JSON.parse(raw);

  const songsToFetch = data.songs.filter((s) => {
    if (!s.spotify?.trackId) return false;
    if (force) return true;
    return !s.spotify.coverUrl;
  });

  console.log(`[sync-spotify-covers] Found ${songsToFetch.length} songs needing cover fetch (out of ${data.songs.length} total songs).`);

  if (songsToFetch.length === 0) {
    console.log("[sync-spotify-covers] All Spotify songs already have coverUrl. Nothing to do.");
    return;
  }

  // Concurrent worker pool
  const CONCURRENCY = 6;
  let completed = 0;
  let updated = 0;

  async function worker(queue) {
    while (queue.length > 0) {
      const song = queue.shift();
      const trackId = song.spotify.trackId;
      const coverUrl = await fetchCoverForTrack(trackId);
      if (coverUrl) {
        song.spotify.coverUrl = coverUrl;
        updated++;
      }
      completed++;
      if (completed % 10 === 0 || completed === songsToFetch.length) {
        console.log(`[sync-spotify-covers] Progress: ${completed}/${songsToFetch.length} (${Math.round((completed / songsToFetch.length) * 100)}%)`);
      }
      // Small pause to avoid aggressive throttling
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  const queue = [...songsToFetch];
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
  await Promise.all(workers);

  console.log(`[sync-spotify-covers] Finished fetching. Updated ${updated} songs.`);
  writeFileSync(songsPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`[sync-spotify-covers] Successfully wrote updated covers to ${songsPath}`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
