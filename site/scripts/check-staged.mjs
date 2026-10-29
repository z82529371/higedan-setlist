import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Guardrail against staging concurrent agent files (data/events/ and docs/reports/)
try {
  const staged = execSync("git diff --name-only --cached", { encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim().replace(/\\/g, "/"))
    .filter(Boolean);

  if (staged.length === 0) {
    console.log("✓ No staged files.");
    process.exit(0);
  }

  const forbiddenPatterns = [
    /^data\/events\/.+\.json$/,
    /^docs\/reports\/.+\.md$/,
  ];

  const envAllowed = (process.env.STAGED_ALLOW_EVENTS || "")
    .split(",")
    .map((s) => s.trim().replace(/\\/g, "/"))
    .filter(Boolean);

  const allowedExceptions = new Set([
    "data/events/unofficial-2024.json",
    ...envAllowed,
  ]);

  const violations = staged.filter((file) =>
    !allowedExceptions.has(file) &&
    forbiddenPatterns.some((pattern) => pattern.test(file))
  );

  if (violations.length > 0) {
    console.error("\n❌ [Workspace Hygiene Guardrail Violation]");
    console.error("The following staged files conflict with concurrent data audit agents:");
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    console.error("\nRun: git reset -- <files> to unstage them before committing,");
    console.error("or specify STAGED_ALLOW_EVENTS=\"<file1>,<file2>\" if intentionally modifying them for this task.");
    process.exit(1);
  }

  // Guardrail: Normalize CRLF -> LF on staged text files in working tree (.gitattributes compliance)
  const textExtRegex = /\.(?:js|jsx|mjs|md|json|css|html|yaml|yml)$/i;
  for (const file of staged) {
    if (textExtRegex.test(file) && existsSync(file)) {
      try {
        const raw = readFileSync(file, "utf8");
        if (raw.includes("\r\n")) {
          writeFileSync(file, raw.replace(/\r\n/g, "\n"), "utf8");
          execSync(`git add -- "${file}"`);
        }
      } catch {
        // Ignore if file cannot be normalized
      }
    }
  }

  // Guardrail: If any docs/adr/0*.md is staged, docs/adr/README.md must be staged and contain it
  const stagedAdrs = staged.filter((file) => /^docs\/adr\/\d{4}-.+\.md$/.test(file));
  if (stagedAdrs.length > 0) {
    if (!staged.includes("docs/adr/README.md")) {
      console.error("\n❌ [ADR Indexing Guardrail Violation]");
      console.error("The following ADR files are staged, but docs/adr/README.md is NOT staged:");
      for (const adr of stagedAdrs) {
        console.error(`  - ${adr}`);
      }
      console.error("\nPlease update and stage docs/adr/README.md with the corresponding ADR entry.");
      process.exit(1);
    }

    try {
      const readmeContent = execSync("git show :docs/adr/README.md", { encoding: "utf8" });
      const missingIndex = stagedAdrs.filter((adr) => {
        const basename = adr.split("/").pop();
        return !readmeContent.includes(basename);
      });
      if (missingIndex.length > 0) {
        console.error("\n❌ [ADR Indexing Guardrail Violation]");
        console.error("The staged docs/adr/README.md does not index the following staged ADR files:");
        for (const adr of missingIndex) {
          console.error(`  - ${adr}`);
        }
        console.error("\nPlease index these files in docs/adr/README.md before committing.");
        process.exit(1);
      }
    } catch {
      // Ignore if git show fails
    }

    // Guardrail: ADR Number Collision Check (ADR-0120 retro)
    try {
      const existingAdrs = execSync("git ls-files docs/adr/0*.md", { encoding: "utf8" })
        .split(/\r?\n/)
        .map((s) => s.trim().replace(/\\/g, "/"))
        .filter(Boolean);

      for (const adr of stagedAdrs) {
        const match = adr.match(/^docs\/adr\/(\d{4})-(.+)\.md$/);
        if (!match) continue;
        const [, num] = match;
        const collisions = existingAdrs.filter(
          (existing) => existing !== adr && existing.startsWith(`docs/adr/${num}-`)
        );
        if (collisions.length > 0) {
          console.error("\n❌ [ADR Number Collision Guardrail Violation]");
          console.error(`Staged ADR '${adr}' collides with existing ADR '${collisions[0]}'.`);
          console.error("Please increment the 4-digit ADR prefix to prevent index collisions.");
          process.exit(1);
        }
      }
    } catch {
      // Ignore if git ls-files fails
    }
  }


  // Guardrail: Banned / Deprecated Domain Terms Guard (e.g. passport, #/passport, 遠征踏破, 540PX)
  const bannedPatterns = [
    { regex: /\bpassport\b/i, label: "passport (deprecated in ADR-0114, use ticket-book / Ticket Book)" },
    { regex: /#\/passport\b/i, label: "#/passport (deprecated in ADR-0114, use #/tickets)" },
    { regex: /\/\/\s*540PX\b/i, label: "// 540PX (internal layout dimension leaked into user-facing UI copy)", srcOnly: true },
    { regex: /\b540PX\b/, label: "540PX (technical layout dimension in UI; clean user-facing copy per CODING_STANDARDS.md)", srcOnly: true },
    { regex: /遠征踏破/, label: "遠征踏破 (awkward militaristic jargon; use authentic 參戰紀念 / LIVE MEMORIAL per GLOSSARY.md)", srcOnly: true },
  ];

  // Files exempted from banned terms check (ADR-0113 historical record and the guard script itself)
  const isBannedExempt = (file) =>
    file === "docs/adr/0113-personal-concert-passport-and-commemorative-card-architecture.md" ||
    file === "docs/adr/0114-concert-ticket-book-domain-refactoring-and-passport-deprecation.md" ||
    file === "site/scripts/check-staged.mjs";

  const codeFilesStaged = staged.filter((file) =>
    (file.startsWith("site/src/") || file.startsWith("site/tests/")) && !isBannedExempt(file)
  );

  const termViolations = [];
  for (const file of codeFilesStaged) {
    try {
      const content = execSync(`git show :"${file}"`, { encoding: "utf8" });
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        // Skip migration legacy key read in ticket-book.js
        if (file === "site/src/lib/ticket-book.js" && line.includes("LEGACY_PASSPORT_STORAGE_KEY")) return;
        if (file === "site/src/lib/ticket-book.js" && line.includes("hg_passport_v1")) return;

        for (const { regex, label, srcOnly } of bannedPatterns) {
          if (srcOnly && !file.startsWith("site/src/")) continue;
          if (regex.test(line)) {
            termViolations.push({
              file,
              lineNum: idx + 1,
              line: line.trim(),
              label,
            });
          }
        }
      });
    } catch {
      // Ignore if file show fails
    }
  }

  if (termViolations.length > 0) {
    console.error("\n❌ [Banned / Deprecated Domain Terms Violation]");
    console.error("The following staged files contain deprecated terms (superseded by ADR-0114):");
    for (const v of termViolations) {
      console.error(`  - ${v.file}:${v.lineNum} -> ${v.label}`);
      console.error(`    "${v.line}"`);
    }
    console.error("\nPlease replace all deprecated terminology before committing.");
    process.exit(1);
  }

  // Guardrail: Run venue-profiles invariant test whenever venue-profiles.json or geography.js is staged
  const venueFilesStaged = staged.some(
    (file) => file === "data/venue-profiles.json" || file === "site/src/lib/locales/geography.js"
  );
  if (venueFilesStaged) {
    execSync("node --test site/tests/invariants/venue-profiles.test.js", { stdio: "inherit" });
  }

  console.log(`✓ Staged files hygiene check passed (${staged.length} file${staged.length === 1 ? "" : "s"} staged):`);
  for (const file of staged) {
    console.log(`  • ${file}`);
  }
} catch (err) {
  console.error("Failed to check staged files:", err.message);
  process.exit(1);
}
