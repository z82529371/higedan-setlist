import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseRoute, routeHash } from "../../src/lib/routes.js";
import * as trackMod from "../../src/lib/track.js";

describe("9. Design Token Invariants & Dedicated URL Routes Seam (DESIGN.md, ADR-0101)", () => {
  it("exports parseRoute and routeHash from dedicated routes.js module with full bidirectional parity", () => {
    assert.ok(typeof parseRoute === "function");
    assert.ok(typeof routeHash === "object");
    assert.equal(routeHash.song("pretender"), "#/song/pretender");
    assert.equal(routeHash.show("1672276"), "#/show/1672276");
    assert.equal(routeHash.venue("日本武道館"), "#/venue/%E6%97%A5%E6%9C%AC%E6%AD%A6%E9%81%93%E9%A4%A8");
    assert.equal(routeHash.tour("arena-tour-2024-rejoice"), "#/tour/arena-tour-2024-rejoice");

    assert.deepEqual(parseRoute("#/song/pretender"), { kind: "song", value: "pretender" });
    assert.deepEqual(parseRoute("#/show/1672276"), { kind: "show", value: "1672276" });
    assert.deepEqual(parseRoute("#/venue/%E6%97%A5%E6%9C%AC%E6%AD%A6%E9%81%93%E9%A4%A8"), { kind: "venue", value: "日本武道館" });
    assert.deepEqual(parseRoute("#/tour/arena-tour-2024-rejoice"), { kind: "tour", value: "arena-tour-2024-rejoice" });
    assert.equal(parseRoute(""), null);
    assert.equal(parseRoute("#/unknown/123"), null);
  });

  it("ensures track.js re-exports parseRoute and routeHash for backwards compatibility", () => {
    assert.equal(trackMod.parseRoute, parseRoute);
    assert.equal(trackMod.routeHash, routeHash);
  });

  it("verifies style.css defines zero-blur shadow tokens under @theme and dark theme", () => {
    const stylePath = path.resolve(import.meta.dirname, "../../src/style.css");
    const cssContent = fs.readFileSync(stylePath, "utf8");

    // Verify all shadow tokens are configured with 0 blur
    const shadowTokens = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];
    for (const token of shadowTokens) {
      const regex = new RegExp(`--shadow-${token}:\\s*\\d+(?:\\.\\d+)?px\\s+\\d+(?:\\.\\d+)?px\\s+0\\b`);
      assert.ok(
        regex.test(cssContent),
        `style.css must define zero-blur --shadow-${token} with 0 blur radius`
      );
    }
  });

  it("verifies all custom theme color tokens are declared in style.css under @theme and dark mode", () => {
    const stylePath = path.resolve(import.meta.dirname, "../../src/style.css");
    const cssContent = fs.readFileSync(stylePath, "utf8");

    // Extract tokens declared in @theme
    const themeBlockMatch = cssContent.match(/@theme\s*\{([^}]+)\}/s);
    assert.ok(themeBlockMatch, "style.css must contain @theme block");
    const themeBlock = themeBlockMatch[1];

    const declaredColors = new Set();
    for (const match of themeBlock.matchAll(/--color-([a-z0-9-]+):/g)) {
      declaredColors.add(match[1]);
    }

    // Extract tokens declared in dark mode html[data-theme="dark"]
    const darkBlockMatch = cssContent.match(/html\[data-theme=["']dark["']\]\s*\{([^}]+)\}/s);
    assert.ok(darkBlockMatch, "style.css must contain html[data-theme='dark'] block");
    const darkBlock = darkBlockMatch[1];

    const darkColors = new Set();
    for (const match of darkBlock.matchAll(/--color-([a-z0-9-]+):/g)) {
      darkColors.add(match[1]);
    }

    // Design system core tokens that must exist in both light and dark theme
    const requiredCoreTokens = [
      "paper",
      "card",
      "band",
      "band-ink",
      "ink",
      "muted",
      "line",
      "line-soft",
      "tape",
      "tape-tint",
      "tape-soft",
      "tape-edge",
      "request",
      "request-wash",
      "unreleased",
      "unreleased-wash",
      "premiere",
      "premiere-wash",
      "solo",
      "solo-wash",
      "pool",
      "pool-wash",
    ];

    for (const token of requiredCoreTokens) {
      assert.ok(
        declaredColors.has(token),
        `style.css @theme must declare --color-${token}`
      );
      assert.ok(
        darkColors.has(token),
        `style.css html[data-theme="dark"] must declare --color-${token}`
      );
    }
  });

  it("prohibits arbitrary unvetted hex color classes in UI components (DESIGN.md)", () => {
    const componentsDir = path.resolve(import.meta.dirname, "../../src/components");

    function findJsxFiles(dir) {
      let results = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(findJsxFiles(fullPath));
        } else if (entry.name.endsWith(".jsx")) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const files = findJsxFiles(componentsDir);
    const violations = [];
    const hexClassRegex = /\b(?:text|bg|border|ring|outline)-\[#[0-9a-fA-F]{3,8}\]/g;

    for (const file of files) {
      const basename = path.basename(file);
      // MemorialCardModal defines physical offscreen cardstock raster styles (ADR-0100), but its badges must strictly use design tokens
      if (basename === "MemorialCardModal.jsx") {
        const content = fs.readFileSync(file, "utf8");
        const badgeSection = content.slice(content.indexOf("tabs.map"), content.indexOf("return ("));
        const badgeHexMatches = badgeSection.match(hexClassRegex);
        if (badgeHexMatches) {
          violations.push(`${basename} (badges): ${badgeHexMatches.join(", ")}`);
        }
        continue;
      }

      const content = fs.readFileSync(file, "utf8");
      const matches = content.match(hexClassRegex);
      if (matches) {
        const relPath = path.relative(componentsDir, file).replace(/\\/g, "/");
        violations.push(`${relPath}: ${matches.join(", ")}`);
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Found unvetted arbitrary hex classes in UI components. Use semantic design tokens from DESIGN.md instead:\n${violations.join("\n")}`
    );
  });

  it("verifies multi-lingual typography stacks and The Cue Monospace Rule (ADR-0112)", () => {
    const stylePath = path.resolve(import.meta.dirname, "../../src/style.css");
    const indexPath = path.resolve(import.meta.dirname, "../../index.html");
    const styleContent = fs.readFileSync(stylePath, "utf8");
    const indexContent = fs.readFileSync(indexPath, "utf8");

    // The Cue Monospace Rule invariant
    assert.ok(
      styleContent.includes('--font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace'),
      "style.css must enforce universal IBM Plex Mono invariant"
    );

    // Locale-specific isolated font stacks
    const requiredLangs = [":lang(ja)", ":lang(zh-TW)", ":lang(ko)", ":lang(en)"];
    for (const lang of requiredLangs) {
      assert.ok(
        styleContent.includes(lang),
        `style.css must define dedicated font stack for ${lang}`
      );
    }

    assert.ok(styleContent.includes('"Zen Kaku Gothic New"'), "style.css must include Zen Kaku Gothic New");
    assert.ok(styleContent.includes('"Noto Sans TC"'), "style.css must include Noto Sans TC");
    assert.ok(styleContent.includes('"Noto Sans KR"'), "style.css must include Noto Sans KR");
    assert.ok(styleContent.includes('"Plus Jakarta Sans"'), "style.css must include Plus Jakarta Sans");

    // Google Fonts link in index.html must load all required font families
    assert.ok(indexContent.includes("family=IBM+Plex+Mono"), "index.html must load IBM Plex Mono");
    assert.ok(indexContent.includes("family=M+PLUS+Rounded+1c"), "index.html must load M PLUS Rounded 1c");
    assert.ok(indexContent.includes("family=Noto+Sans+KR"), "index.html must load Noto Sans KR");
    assert.ok(indexContent.includes("family=Noto+Sans+TC"), "index.html must load Noto Sans TC");
    assert.ok(indexContent.includes("family=Plus+Jakarta+Sans"), "index.html must load Plus Jakarta Sans");
    assert.ok(indexContent.includes("family=Zen+Kaku+Gothic+New"), "index.html must load Zen Kaku Gothic New");
  });

  it("verifies venue-native-subtitle adheres to The Cue Monospace Rule (no font-mono on subtitles)", () => {
    const venueSlipPath = path.resolve(import.meta.dirname, "../../src/components/slips/VenueSlip.jsx");
    const content = fs.readFileSync(venueSlipPath, "utf8");
    const subtitleMatch =
      content.match(/data-testid=["']venue-native-subtitle["'][^>]*className=["']([^"']*)["']/) ||
      content.match(/className=["']([^"']*)["'][^>]*data-testid=["']venue-native-subtitle["']/);
    assert.ok(subtitleMatch, "venue-native-subtitle element must exist");
    assert.ok(
      !subtitleMatch[1].includes("font-mono"),
      "venue-native-subtitle must not use font-mono (The Cue Monospace Rule, DESIGN.md)"
    );
  });

  it("verifies commemorative card custom seat, notes, and stamp ink tokens and contrast invariants (Issue #36)", () => {
    const memorialModalPath = path.resolve(import.meta.dirname, "../../src/components/MemorialCardModal.jsx");
    const content = fs.readFileSync(memorialModalPath, "utf8");

    // 1. Must define data-testid elements for seat, notes, and stamp
    assert.ok(content.includes('data-testid="ticket-seat-badge"'), "MemorialCardModal must define ticket-seat-badge");
    assert.ok(content.includes('data-testid="ticket-notes-memo"'), "MemorialCardModal must define ticket-notes-memo");
    assert.ok(content.includes('data-testid="ticket-stamp"'), "MemorialCardModal must define ticket-stamp");

    // 2. Verified ticket custom note cards must have radius < 8px
    const noteMemoMatch = content.match(/data-testid=["']ticket-notes-memo["'][\s\S]*?className=\{`([^`]+)`\}/);
    assert.ok(noteMemoMatch, "Must find ticket-notes-memo className");
    assert.ok(
      !noteMemoMatch[1].includes("rounded-xl") && !noteMemoMatch[1].includes("rounded-2xl") && !noteMemoMatch[1].includes("rounded-lg"),
      "ticket-notes-memo must adhere to DESIGN.md card radius < 8px"
    );

    // 3. High-contrast ink tokens: small seat text (<14px) must strictly use high-contrast ink
    const seatBadgeMatch = content.match(/data-testid=["']ticket-seat-badge["'][\s\S]*?className=\{`([^`]+)`\}/);
    assert.ok(seatBadgeMatch, "Must find ticket-seat-badge className");
    assert.ok(
      seatBadgeMatch[1].includes("text-[#78350f]") && seatBadgeMatch[1].includes("text-[#111827]"),
      "ticket-seat-badge must use AAA high-contrast ink tokens (>=7:1 contrast)"
    );
  });
});
