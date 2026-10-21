import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

describe("27. Crowdsourced Lead Drop Protocol (Seam 1: Payload & Validation)", () => {
  it("validates evidence URL strictly rejecting non-HTTP/HTTPS and malformed strings", async () => {
    const { validateEvidenceUrl } = await loadModule("src/lib/feedback.js");

    // Valid URLs
    assert.strictEqual(validateEvidenceUrl("https://x.com/officialhige/status/123"), true);
    assert.strictEqual(validateEvidenceUrl("https://twitter.com/user/status/456"), true);
    assert.strictEqual(validateEvidenceUrl("http://livefans.jp/events/789"), true);
    assert.strictEqual(validateEvidenceUrl("https://www.instagram.com/p/abc"), true);
    assert.strictEqual(validateEvidenceUrl("  https://note.com/post/1  "), true, "Must trim whitespace");

    // Invalid inputs
    assert.strictEqual(validateEvidenceUrl(""), false);
    assert.strictEqual(validateEvidenceUrl("   "), false);
    assert.strictEqual(validateEvidenceUrl(null), false);
    assert.strictEqual(validateEvidenceUrl(undefined), false);
    assert.strictEqual(validateEvidenceUrl("not-a-url"), false);
    assert.strictEqual(validateEvidenceUrl("ftp://files.example.com"), false, "Must require http or https");
    assert.strictEqual(validateEvidenceUrl("javascript:alert(1)"), false, "Must reject javascript pseudo-protocol");
  });

  it("builds structured submission payload for Web3Forms", async () => {
    const { buildLeadSubmissionPayload } = await loadModule("src/lib/feedback.js");

    const mockShow = {
      id: "2012-07-07-matsue-aztic-canova",
      date: "2012-07-07",
      venue: "松江 AZTiC canova",
    };
    const unitTitle = "第7回 松江だんだん祭り";

    // Setlist lead payload
    const payload = buildLeadSubmissionPayload({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      notes: "推文第 2 張照片有紙本歌單",
      questType: "setlist",
      locale: "zh-TW",
    });

    assert.strictEqual(payload.show_id, "2012-07-07-matsue-aztic-canova");
    assert.strictEqual(payload.show_date, "2012-07-07");
    assert.strictEqual(payload.show_title, "第7回 松江だんだん祭り");
    assert.strictEqual(payload.show_venue, "松江 AZTiC canova");
    assert.strictEqual(payload.quest_type, "setlist");
    assert.strictEqual(payload.evidence_url, "https://x.com/fan/status/12345");
    assert.strictEqual(payload.notes, "推文第 2 張照片有紙本歌單");
    assert.strictEqual(
      payload.subject,
      "[Official髭男dism 現場情報線索] 2012-07-07 第7回 松江だんだん祭り @ 松江 AZTiC canova"
    );
    assert.ok(payload.message.includes("https://x.com/fan/status/12345"));
    assert.ok(payload.message.includes("2012-07-07-matsue-aztic-canova"));
    assert.strictEqual(payload.from_name, "HIGEDAN Live Archive Lead Drop");

    // Time lead payload
    const timePayload = buildLeadSubmissionPayload({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://livefans.jp/events/123",
      questType: "time",
      locale: "zh-TW",
    });
    assert.strictEqual(
      timePayload.subject,
      "[Official髭男dism 開演時間線索] 2012-07-07 第7回 松江だんだん祭り @ 松江 AZTiC canova"
    );
    assert.strictEqual(timePayload.quest_type, "time");
  });

  it("builds clean fallback text for one-click clipboard copying", async () => {
    const { buildLeadFallbackText, ARCHIVE_FEEDBACK_EMAIL } = await loadModule("src/lib/feedback.js");

    const mockShow = {
      id: "2012-07-07-matsue-aztic-canova",
      date: "2012-07-07",
      venue: "松江 AZTiC canova",
    };
    const unitTitle = "第7回 松江だんだん祭り";

    const fallbackText = buildLeadFallbackText({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      notes: "第 2 張照片有紙本",
      questType: "setlist",
      locale: "zh-TW",
    });

    assert.ok(fallbackText.includes(ARCHIVE_FEEDBACK_EMAIL));
    assert.ok(fallbackText.includes("2012-07-07-matsue-aztic-canova"));
    assert.ok(fallbackText.includes("https://x.com/fan/status/12345"));
    assert.ok(fallbackText.includes("第 2 張照片有紙本"));
  });
});
