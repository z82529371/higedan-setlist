import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeContrastRatio, isValidEraTheme } from "../../src/lib/tour-theme.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "..", "..", "..", "data");

function loadAllUnits() {
  const units = [];
  for (const sub of ["tours", "events"]) {
    const dir = path.join(dataDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const fullPath = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      units.push({ file: `${sub}/${file}`, data });
    }
  }
  return units;
}

describe("Tour Era Accent & Official URL Data Invariants (ADR-0149)", () => {
  const units = loadAllUnits();

  it("ensures every declared theme has valid hex codes, source provenance, and >= 4.5:1 WCAG AA contrast", () => {
    const themed = units.filter((u) => u.data.theme !== undefined);
    assert.ok(themed.length >= 10, `Expected at least 10 themed tours/events, got ${themed.length}`);

    for (const { file, data } of themed) {
      const { theme } = data;
      assert.ok(
        isValidEraTheme(theme),
        `${file}: invalid theme ${JSON.stringify(theme)} (light=${computeContrastRatio(
          theme?.light,
          theme?.lightInk
        ).toFixed(2)}, dark=${computeContrastRatio(theme?.dark, theme?.darkInk).toFixed(2)})`
      );
      assert.ok(
        typeof theme.source === "string" && theme.source.trim().length > 0,
        `${file}: theme.source must document verified official provenance`
      );
    }
  });

  it("ensures every declared officialUrl is a valid https:// URL", () => {
    const withOfficialUrl = units.filter((u) => u.data.officialUrl !== undefined);
    assert.ok(withOfficialUrl.length >= 6, `Expected at least 6 officialUrl entries, got ${withOfficialUrl.length}`);

    for (const { file, data } of withOfficialUrl) {
      assert.match(
        data.officialUrl,
        /^https:\/\/[^\s]+$/,
        `${file}: officialUrl must be a valid https:// URL, got "${data.officialUrl}"`
      );
    }
  });

  it("ensures every discography release with id and coverUrl has a valid WCAG AA Release Accent theme (ADR-0150)", () => {
    const disco = JSON.parse(fs.readFileSync(path.join(dataDir, "discography.json"), "utf8"));
    const releases = [
      ...(disco.physicalSingles || []),
      ...(disco.digitalSingles || []),
      ...(disco.collaborationSingles || []),
      ...(disco.eps || []),
      ...(disco.albums?.fullAlbums || []),
      ...(disco.albums?.miniAlbums || []),
      ...(disco.albums?.digitalAlbums || []),
    ].filter((r) => r.id && r.coverUrl);

    assert.ok(releases.length >= 40, `Expected at least 40 cover-backed releases, got ${releases.length}`);
    for (const rel of releases) {
      assert.ok(
        isValidEraTheme(rel.theme),
        `discography.json (${rel.id}): invalid theme ${JSON.stringify(rel.theme)} (light=${computeContrastRatio(
          rel.theme?.light,
          rel.theme?.lightInk
        ).toFixed(2)}, dark=${computeContrastRatio(rel.theme?.dark, rel.theme?.darkInk).toFixed(2)})`
      );
      assert.ok(
        typeof rel.theme?.source === "string" && rel.theme.source.trim().length > 0,
        `discography.json (${rel.id}): theme.source must be non-empty`
      );
      for (const tr of rel.tracks || []) {
        if (tr?.theme !== undefined) {
          assert.ok(
            isValidEraTheme(tr.theme),
            `discography.json (${rel.id} / ${tr.songId}): invalid track theme ${JSON.stringify(tr.theme)}`
          );
        }
      }
    }
  });
});
