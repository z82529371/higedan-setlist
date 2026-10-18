import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("10. Workspace Topology & Runtime Version Invariants (ADR-0103)", () => {
  const repoRoot = path.resolve(import.meta.dirname, "../../..");

  it("ensures root pnpm-workspace.yaml exists with site package and no rogue workspace configs in subdirectories", () => {
    // 1. Root workspace file exists and declares site package
    const rootWorkspacePath = path.join(repoRoot, "pnpm-workspace.yaml");
    assert.ok(
      fs.existsSync(rootWorkspacePath),
      "Root pnpm-workspace.yaml must exist"
    );
    const rootWorkspaceContent = fs.readFileSync(rootWorkspacePath, "utf8");
    assert.ok(
      /packages:\s*\n\s*-\s*['"]site['"]/.test(rootWorkspaceContent),
      "Root pnpm-workspace.yaml must declare packages with 'site'"
    );

    // 2. Subdirectories must NOT contain rogue pnpm-workspace.yaml
    const siteWorkspacePath = path.join(repoRoot, "site", "pnpm-workspace.yaml");
    assert.ok(
      !fs.existsSync(siteWorkspacePath),
      "site/pnpm-workspace.yaml must not exist (rogue workspace file prevents CI execution)"
    );
  });

  it("verifies .nvmrc and package.json engines align with pnpm 11 requirements (>= Node 22)", () => {
    // Check .nvmrc
    const nvmrcPath = path.join(repoRoot, ".nvmrc");
    assert.ok(fs.existsSync(nvmrcPath), ".nvmrc must exist in repository root");
    const nvmVersionStr = fs.readFileSync(nvmrcPath, "utf8").trim();
    const nvmMajor = parseInt(nvmVersionStr, 10);
    assert.ok(
      !isNaN(nvmMajor) && nvmMajor >= 22,
      `.nvmrc must specify Node.js version >= 22 for pnpm 11 compatibility (got: ${nvmVersionStr})`
    );

    // Check package.json engines & packageManager
    const rootPkgPath = path.join(repoRoot, "package.json");
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
    assert.ok(
      rootPkg.packageManager && rootPkg.packageManager.startsWith("pnpm@11"),
      "root package.json must declare packageManager for pnpm@11"
    );
    assert.ok(
      rootPkg.engines && rootPkg.engines.node && />=\s*22/.test(rootPkg.engines.node),
      "root package.json engines.node must require >=22"
    );
  });

  it("guarantees site/src/data/songs.json is synced from data/ before tests run", () => {
    const rootSongsPath = path.resolve(repoRoot, "data", "songs.json");
    const siteSongsPath = path.resolve(import.meta.dirname, "../../src/data/songs.json");

    assert.ok(
      fs.existsSync(siteSongsPath),
      "site/src/data/songs.json must exist (run 'pnpm sync' before running tests)"
    );
    assert.ok(
      fs.existsSync(rootSongsPath),
      "data/songs.json must exist"
    );

    const rootContent = fs.readFileSync(rootSongsPath, "utf8");
    const siteContent = fs.readFileSync(siteSongsPath, "utf8");
    assert.equal(
      siteContent,
      rootContent,
      "site/src/data/songs.json must be byte-identical to data/songs.json (run 'pnpm sync')"
    );
  });

  it("guarantees all ADR documents in docs/adr/ are indexed in docs/adr/README.md", () => {
    const adrDir = path.resolve(repoRoot, "docs", "adr");
    const readmePath = path.resolve(adrDir, "README.md");

    assert.ok(fs.existsSync(readmePath), "docs/adr/README.md must exist");
    const readmeContent = fs.readFileSync(readmePath, "utf8");

    const adrFiles = fs
      .readdirSync(adrDir)
      .filter((f) => /^0\d{3}-.*\.md$/.test(f));

    const missing = adrFiles.filter((f) => !readmeContent.includes(f));
    assert.deepEqual(
      missing,
      [],
      `The following ADR files are missing from docs/adr/README.md index:\n${missing.join("\n")}`
    );
  });
});
