import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("11. Static SPA Architecture & Zero-Backend Invariants (ADR-0123)", () => {
  const repoRoot = path.resolve(import.meta.dirname, "../../..");
  const siteSrcDir = path.resolve(import.meta.dirname, "../../src");

  it("ensures .gitignore strictly ignores .env* to prevent secret token leakage", () => {
    const gitignorePath = path.join(repoRoot, ".gitignore");
    assert.ok(fs.existsSync(gitignorePath), ".gitignore must exist in repo root");
    const content = fs.readFileSync(gitignorePath, "utf8");
    assert.ok(
      /^\.env\*/m.test(content),
      ".gitignore must contain '.env*' to block environment secrets"
    );
  });

  it("ensures no server-side directories exist in site/ (zero backend runtime)", () => {
    const bannedDirs = ["functions", "server", "api"];
    for (const dir of bannedDirs) {
      const fullPath = path.join(repoRoot, "site", dir);
      assert.ok(
        !fs.existsSync(fullPath),
        `Directory site/${dir} must not exist; this project is a 100% pure static SPA`
      );
    }
  });

  it("ensures no external form processors or webhook endpoints are imported or referenced in site/src/", () => {
    const bannedEndpoints = [
      "api.web3forms.com",
      "formspree.io",
      "getform.io",
      "formkeep.com",
      "formsubmit.co",
      "airtable.com/api",
    ];

    function scanFiles(dir) {
      let results = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(scanFiles(fullPath));
        } else if (/\.(jsx?|tsx?|html)$/.test(entry.name)) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const sourceFiles = scanFiles(siteSrcDir);
    for (const filePath of sourceFiles) {
      const code = fs.readFileSync(filePath, "utf8");
      for (const endpoint of bannedEndpoints) {
        assert.ok(
          !code.includes(endpoint),
          `File ${path.relative(repoRoot, filePath)} must not reference banned external form endpoint: ${endpoint}`
        );
      }
    }
  });

  it("verifies site/src/lib/feedback.js adheres strictly to pure browser-native compose and clipboard primitives", () => {
    const feedbackPath = path.join(siteSrcDir, "lib", "feedback.js");
    assert.ok(fs.existsSync(feedbackPath), "site/src/lib/feedback.js must exist");
    const content = fs.readFileSync(feedbackPath, "utf8");

    // Must export pure helper functions without any network fetch / post calls
    assert.ok(
      content.includes("buildGmailWebComposeUrl"),
      "feedback.js must export buildGmailWebComposeUrl"
    );
    assert.ok(
      content.includes("buildLeadFallbackText"),
      "feedback.js must export buildLeadFallbackText"
    );
    assert.ok(
      content.includes("buildLeadMailtoUrl"),
      "feedback.js must export buildLeadMailtoUrl"
    );
    assert.ok(
      !content.includes("fetch("),
      "feedback.js must be pure client-side and not perform external fetch requests"
    );
  });
});
