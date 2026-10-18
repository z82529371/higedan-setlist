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

  console.log(`✓ Staged files hygiene check passed (${staged.length} file${staged.length === 1 ? "" : "s"} staged):`);
  for (const file of staged) {
    console.log(`  • ${file}`);
  }
} catch (err) {
  console.error("Failed to check staged files:", err.message);
  process.exit(1);
}
