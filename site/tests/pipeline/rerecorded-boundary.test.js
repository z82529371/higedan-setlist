import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

describe("12. Re-recorded Version Song Entity Boundary (ADR-0106)", () => {
  it("distinguishes Anarchy and Anarchy (Rejoice ver.) as separate song entities", async () => {
    const { songTitle, getSongAlbum } = await loadModule("src/lib/domain.js");
    assert.equal(songTitle["anarchy"], "Anarchy");
    assert.equal(songTitle["anarchy-rejoice-ver"], "Anarchy (Rejoice ver.)");

    assert.equal(getSongAlbum({ id: "anarchy" }), "EP / 單曲");
    assert.equal(getSongAlbum({ id: "anarchy-rejoice-ver" }), "Rejoice (2024)");
  });

  it("verifies Rejoice tour consensus templates and play count invariants", async () => {
    const { buildIndex, allUnits } = await loadModule("src/lib/domain.js");
    const { trackShows } = buildIndex();

    const rejoiceShows = trackShows.get("song:anarchy-rejoice-ver") ?? [];
    // 10 arena shows + 3 asia shows + 1 Zepp Haneda 2024-07-23 = 14 shows
    assert.equal(rejoiceShows.length, 14);

    const arenaTour = allUnits.find((u) => u.id === "arena-tour-2024-rejoice");
    assert.ok(arenaTour);
    const arenaTemplateItem = arenaTour.templateSetlist.find((s) => s.songId === "anarchy-rejoice-ver");
    assert.ok(arenaTemplateItem, "template must feature anarchy-rejoice-ver");
    assert.equal(arenaTemplateItem.order, 16);

    // Verify no redundant skip of 16 in any arena tour shows
    for (const show of arenaTour.shows) {
      assert.ok(!show.diff?.skip?.includes(16), `show ${show.date} should not skip 16`);
      const redundantInserts = (show.diff?.insert || []).filter(
        (i) => i.item?.songId === "anarchy" || i.item?.songId === "anarchy-rejoice-ver"
      );
      assert.equal(redundantInserts.length, 0, `show ${show.date} should have no diff inserts for anarchy`);
    }
  });
});
