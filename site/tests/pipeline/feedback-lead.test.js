import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "../helpers/vite-server.js";

describe("27. Crowdsourced Lead Drop Protocol (Seam 1: Pure Frontend Lead Builders)", () => {
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

  it("builds Web Gmail compose URL directly targeting hgdnlive@gmail.com without any backend", async () => {
    const { buildGmailWebComposeUrl, ARCHIVE_FEEDBACK_EMAIL } = await loadModule("src/lib/feedback.js");

    const mockShow = {
      id: "2012-07-07-matsue-aztic-canova",
      date: "2012-07-07",
      venue: "松江 AZTiC canova",
    };
    const unitTitle = "第7回 松江だんだん祭り";

    const gmailUrl = buildGmailWebComposeUrl({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      notes: "推文第 2 張照片有紙本歌單",
      questType: "setlist",
      locale: "zh-TW",
    });

    assert.ok(gmailUrl.startsWith("https://mail.google.com/mail/?view=cm&fs=1"), "Must open Gmail web compose");
    assert.ok(gmailUrl.includes(`to=${encodeURIComponent(ARCHIVE_FEEDBACK_EMAIL)}`));
    assert.ok(gmailUrl.includes("su="));
    assert.ok(gmailUrl.includes("body="));
    assert.ok(gmailUrl.includes(encodeURIComponent("https://x.com/fan/status/12345")));
    assert.ok(gmailUrl.includes(encodeURIComponent("2012-07-07-matsue-aztic-canova")));
  });

  it("builds clean native mailto URL and fallback clipboard text across locales", async () => {
    const { buildLeadMailtoUrl, buildLeadFallbackText, ARCHIVE_FEEDBACK_EMAIL } = await loadModule("src/lib/feedback.js");

    const mockShow = {
      id: "2012-07-07-matsue-aztic-canova",
      date: "2012-07-07",
      venue: "松江 AZTiC canova",
    };
    const unitTitle = "第7回 松江だんだん祭り";

    // 1. Mailto URL
    const mailtoUrl = buildLeadMailtoUrl({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      notes: "第 2 張照片有紙本",
      questType: "setlist",
      locale: "zh-TW",
    });
    assert.ok(mailtoUrl.startsWith(`mailto:${ARCHIVE_FEEDBACK_EMAIL}?`));
    assert.ok(mailtoUrl.includes("%0D%0A"), "Must use RFC 6068 CRLF line breaks");

    // 2. Fallback Clipboard Text
    const fallbackZh = buildLeadFallbackText({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      notes: "第 2 張照片有紙本",
      questType: "setlist",
      locale: "zh-TW",
    });
    assert.ok(fallbackZh.includes(ARCHIVE_FEEDBACK_EMAIL));
    assert.ok(fallbackZh.includes("2012-07-07-matsue-aztic-canova"));
    assert.ok(fallbackZh.includes("https://x.com/fan/status/12345"));
    assert.ok(fallbackZh.includes("收件者:"));

    const fallbackJa = buildLeadFallbackText({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      questType: "time",
      locale: "ja",
    });
    assert.ok(fallbackJa.includes("宛先:"));
    assert.ok(fallbackJa.includes("件名:"));
  });
});
