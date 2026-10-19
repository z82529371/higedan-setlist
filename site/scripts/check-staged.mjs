import { execSync } from "node:child_process";

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
  }

  console.log(`✓ Staged files hygiene check passed (${staged.length} file${staged.length === 1 ? "" : "s"} staged):`);
  for (const file of staged) {
    console.log(`  • ${file}`);
  }
} catch (err) {
  console.error("Failed to check staged files:", err.message);
  process.exit(1);
}
