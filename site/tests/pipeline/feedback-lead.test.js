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

  it("exposes official Instagram contact and builds lead subject/body without any backend", async () => {
    const {
      buildLeadSubject,
      buildLeadBody,
      ARCHIVE_AUTHOR_INSTAGRAM,
      ARCHIVE_AUTHOR_INSTAGRAM_URL,
    } = await loadModule("src/lib/feedback.js");

    assert.strictEqual(ARCHIVE_AUTHOR_INSTAGRAM, "higedan_live");
    assert.strictEqual(ARCHIVE_AUTHOR_INSTAGRAM_URL, "https://www.instagram.com/higedan_live/");

    const mockShow = {
      id: "2012-07-07-matsue-aztic-canova",
      date: "2012-07-07",
      venue: "松江 AZTiC canova",
    };
    const unitTitle = "第7回 松江だんだん祭り";

    const subject = buildLeadSubject({ show: mockShow, unitTitle, questType: "setlist" });
    assert.ok(subject.includes("2012-07-07"));
    assert.ok(subject.includes("第7回 松江だんだん祭り"));

    const body = buildLeadBody({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      notes: "推文第 2 張照片有紙本歌單",
      questType: "setlist",
      locale: "zh-TW",
    });
    assert.ok(body.includes("https://x.com/fan/status/12345"));
    assert.ok(body.includes("2012-07-07-matsue-aztic-canova"));
  });

  it("builds concise IG DM clipboard text without email boilerplate", async () => {
    const { buildLeadFallbackText } = await loadModule("src/lib/feedback.js");

    const mockShow = {
      id: "2012-07-07-matsue-aztic-canova",
      date: "2012-07-07",
      venue: "松江 AZTiC canova",
    };
    const unitTitle = "第7回 松江だんだん祭り";

    const textWithNotes = buildLeadFallbackText({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      notes: "第 2 張照片有紙本",
      questType: "setlist",
      locale: "zh-TW",
    });
    assert.ok(!textWithNotes.includes("hgdnlive@gmail.com"));
    assert.ok(!textWithNotes.includes("主旨:"));
    assert.ok(!textWithNotes.includes("提交時間:"));
    assert.ok(!textWithNotes.includes("回報語系:"));
    assert.ok(textWithNotes.includes("[曲目情報] 2012-07-07 第7回 松江だんだん祭り @ 松江 AZTiC canova (ID: 2012-07-07-matsue-aztic-canova)"));
    assert.ok(textWithNotes.includes("佐證：https://x.com/fan/status/12345"));
    assert.ok(textWithNotes.includes("備註：第 2 張照片有紙本"));

    const textNoNotes = buildLeadFallbackText({
      show: mockShow,
      unitTitle,
      evidenceUrl: "https://x.com/fan/status/12345",
      questType: "time",
      locale: "ja",
    });
    assert.ok(textNoNotes.includes("[開演時間]"));
    assert.ok(!textNoNotes.includes("備註"));
  });
});
