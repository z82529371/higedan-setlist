import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

describe("11. Song Canonical Title & Alias System Invariants", () => {
  it("exports songAlias with expected official dual-language aliases", async () => {
    const { songAlias, songTitle } = await loadModule("src/lib/domain.js");

    // Verify canonical Japanese titles
    assert.equal(songTitle["no-doubt"], "ノーダウト");
    assert.equal(songTitle["yesterday"], "イエスタデイ");
    assert.equal(songTitle["mixed-nuts"], "ミックスナッツ");
    assert.equal(songTitle["stardust"], "スターダスト");
    assert.equal(songTitle["elder-flower"], "エルダーフラワー");
    assert.equal(songTitle["sweet-tweet"], "SWEET TWEET");

    // Verify official aliases
    assert.equal(songAlias["no-doubt"], "No Doubt");
    assert.equal(songAlias["yesterday"], "Yesterday");
    assert.equal(songAlias["mixed-nuts"], "Mixed Nuts");
    assert.equal(songAlias["white-noise"], "White Noise");
    assert.equal(songAlias["apoptosis"], "Apoptosis");
    assert.equal(songAlias["parabola"], "Parabola");
    assert.equal(songAlias["pending-machine"], "Pending Machine");
    assert.equal(songAlias["brothers"], "Brothers");
    assert.equal(songAlias["bad-for-me"], "Bad for Me");
    assert.equal(songAlias["vintage"], "Vintage");
    assert.equal(songAlias["last-song"], "Last Song");
    assert.equal(songAlias["catchball"], "Catch Ball");
    assert.equal(songAlias["elder-flower"], "Elderflower");
    assert.equal(songAlias["stardust"], "Stardust");
    assert.equal(songAlias["filament"], "Filament");
    assert.equal(songAlias["equal"], "Equal");

    // Verify songs without alias
    assert.equal(songAlias["sweet-tweet"], undefined);
    assert.equal(songAlias["ai-nandaga"], undefined);
    assert.equal(songAlias["pretender"], undefined);
  });

  it("renders SongSlip with alias subtitle below headline", async () => {
    const { SongSlip } = await loadModule("src/components/slips/SongSlip.jsx");
    const { buildIndex } = await loadModule("src/lib/domain.js");
    const { React, renderToStaticMarkup } = await getReactAndRenderer();
    const { trackShows, showById, unitData } = buildIndex();

    const html = renderToStaticMarkup(
      React.createElement(SongSlip, {
        songId: "stardust",
        trackShows,
        showById,
        unitData,
        onSelectShow: () => {},
        onSelectVenue: () => {},
      })
    );

    assert.ok(html.includes("スターダスト"), "must render Japanese canonical title");
    assert.ok(html.includes("別名：Stardust"), "must render alias subtitle");
  });
});
