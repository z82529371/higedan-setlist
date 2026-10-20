import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadModule, getReactAndRenderer } from "../helpers/vite-server.js";

const { React, renderToStaticMarkup } = await getReactAndRenderer();

if (!globalThis.window) {
  globalThis.window = {
    location: { hash: "", pathname: "/" },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    innerHeight: 800,
  };
}
if (!globalThis.document) {
  globalThis.document = {
    body: { style: {} },
  };
}

describe("22. ShowSlip Attendance Check-in & Resilient LocalStorage Persistence (#34)", () => {
  describe("Subtest 1: Resilient Storage Abstraction (getSafeStorage & MemoryStorageAdapter)", () => {
    it("provides full Storage API parity in MemoryStorageAdapter", async () => {
      const { MemoryStorageAdapter } = await loadModule("/src/lib/storage.js");
      const storage = new MemoryStorageAdapter();

      assert.strictEqual(storage.length, 0);
      assert.strictEqual(storage.getItem("nonexistent"), null);

      storage.setItem("showKey", "12345");
      assert.strictEqual(storage.length, 1);
      assert.strictEqual(storage.getItem("showKey"), "12345");
      assert.strictEqual(storage.key(0), "showKey");

      storage.setItem("anotherKey", "67890");
      assert.strictEqual(storage.length, 2);

      storage.removeItem("showKey");
      assert.strictEqual(storage.length, 1);
      assert.strictEqual(storage.getItem("showKey"), null);
      assert.strictEqual(storage.getItem("anotherKey"), "67890");

      storage.clear();
      assert.strictEqual(storage.length, 0);
      assert.strictEqual(storage.getItem("anotherKey"), null);
      assert.strictEqual(storage.key(0), null);
    });

    it("supports dependency injection and detects throwing storage (Safari Private mode)", async () => {
      const { getSafeStorage } = await loadModule("/src/lib/storage.js");

      // Mock Safari Private browsing where setItem throws SecurityError
      const throwingStorage = {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError: The quota has been exceeded (Safari Private Browsing)");
        },
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      };

      const safe = getSafeStorage({ storage: throwingStorage });
      assert.ok(safe, "getSafeStorage must return a fallback storage adapter");

      // Writing to safe storage should NOT throw and instead use memory adapter
      assert.doesNotThrow(() => {
        safe.setItem("testKey", "safari-value");
      });
      assert.strictEqual(safe.getItem("testKey"), "safari-value");
    });

    it("automatically degrades to memory storage if backend throws QuotaExceededError during runtime", async () => {
      const { SafeStorage, MemoryStorageAdapter } = await loadModule("/src/lib/storage.js");

      let callCount = 0;
      const fragileBackend = {
        data: new Map(),
        getItem(k) { return this.data.get(k) || null; },
        setItem(k, v) {
          callCount++;
          if (callCount > 1) {
            throw new Error("QuotaExceededError");
          }
          this.data.set(k, v);
        },
        removeItem(k) { this.data.delete(k); },
        clear() { this.data.clear(); },
        key(i) { return Array.from(this.data.keys())[i] || null; },
        get length() { return this.data.size; },
      };

      const safe = new SafeStorage(fragileBackend, new MemoryStorageAdapter());
      safe.setItem("key1", "val1");
      assert.strictEqual(safe.getItem("key1"), "val1");

      // Next setItem triggers QuotaExceededError, must degrade gracefully without throwing
      assert.doesNotThrow(() => {
        safe.setItem("key2", "val2");
      });
      assert.strictEqual(safe.getItem("key2"), "val2");
      assert.strictEqual(safe.isDegraded, true, "SafeStorage must be marked as degraded");
    });

    it("gracefully returns memory adapter in SSR environments when window is undefined", async () => {
      const { getSafeStorage } = await loadModule("/src/lib/storage.js");
      const storage = getSafeStorage({ window: undefined, localStorage: undefined });
      assert.ok(storage);
      storage.setItem("ssr-test", "ok");
      assert.strictEqual(storage.getItem("ssr-test"), "ok");
    });
  });

  describe("Subtest 2: TicketBook Storage Payload & Attendance Logic (ticket-book.js)", () => {
    it("initializes version 1 payload with attendedShows map when empty or corrupt", async () => {
      const { loadTicketBook, createEmptyTicketBook, MemoryStorageAdapter, TICKET_BOOK_STORAGE_KEY } =
        await loadModule("/src/lib/ticket-book.js");

      const storage = new MemoryStorageAdapter();

      // Empty storage
      const p1 = loadTicketBook(storage);
      assert.strictEqual(p1.version, 1);
      assert.deepStrictEqual(p1.attendedShows, {});
      assert.ok(p1.updatedAt);

      // Corrupted storage (not valid JSON)
      storage.setItem(TICKET_BOOK_STORAGE_KEY, "invalid-json{{{");
      const p2 = loadTicketBook(storage);
      assert.strictEqual(p2.version, 1);
      assert.deepStrictEqual(p2.attendedShows, {});

      // Corrupted schema (wrong version)
      storage.setItem(TICKET_BOOK_STORAGE_KEY, JSON.stringify({ version: 999 }));
      const p3 = loadTicketBook(storage);
      assert.strictEqual(p3.version, 1);
      assert.deepStrictEqual(p3.attendedShows, {});
    });

    it("atomically records, checks, and removes attendance conforming to TicketBookShowEntry schema", async () => {
      const {
        recordAttendance,
        removeAttendance,
        toggleAttendance,
        isAttended,
        getAttendedShow,
        getAllAttendedShows,
        loadTicketBook,
        MemoryStorageAdapter,
      } = await loadModule("/src/lib/ticket-book.js");

      const storage = new MemoryStorageAdapter();
      const showId = "1720174";

      assert.strictEqual(isAttended(showId, storage), false);
      assert.strictEqual(getAttendedShow(showId, storage), null);
      assert.strictEqual(getAllAttendedShows(storage).length, 0);

      // 1. Record attendance with metadata
      const res1 = recordAttendance(
        showId,
        {
          date: "2024-11-30",
          seat: "Arena A 12-34",
          notes: "Amazing live performance!",
          stampId: "stamp-rejoice",
          favorite: true,
        },
        storage
      );

      assert.strictEqual(res1.attended, true);
      assert.strictEqual(res1.entry.showKey, showId);
      assert.strictEqual(res1.entry.attendedAt, "2024-11-30");
      assert.strictEqual(res1.entry.seat, "Arena A 12-34");
      assert.strictEqual(res1.entry.notes, "Amazing live performance!");
      assert.strictEqual(res1.entry.stampId, "stamp-rejoice");
      assert.strictEqual(res1.entry.favorite, true);
      assert.strictEqual(res1.entry.includeSeat, true);
      assert.strictEqual(res1.entry.includeNotes, true);
      assert.strictEqual(res1.entry.isOrphaned, false);
      assert.ok(res1.entry.updatedAt);

      // 1b. Privacy controls (includeSeat: false, includeNotes: false)
      const resPrivacy = recordAttendance(
        showId,
        {
          includeSeat: false,
          includeNotes: false,
        },
        storage
      );
      assert.strictEqual(resPrivacy.entry.includeSeat, false);
      assert.strictEqual(resPrivacy.entry.includeNotes, false);
      assert.strictEqual(resPrivacy.entry.seat, "Arena A 12-34"); // preserves seat
      assert.strictEqual(resPrivacy.entry.notes, "Amazing live performance!"); // preserves notes

      assert.strictEqual(isAttended(showId, storage), true);
      assert.strictEqual(getAttendedShow(showId, storage)?.showKey, showId);
      assert.strictEqual(getAllAttendedShows(storage).length, 1);

      // 2. Character truncation limits (seat <= 50, notes <= 300)
      const longSeat = "A".repeat(80);
      const longNotes = "N".repeat(500);
      const res2 = recordAttendance(
        "show-2",
        {
          date: "2024-12-01",
          seat: longSeat,
          notes: longNotes,
        },
        storage
      );
      assert.strictEqual(res2.entry.seat.length, 50);
      assert.strictEqual(res2.entry.notes.length, 300);

      // 3. Toggle attendance (removes existing)
      const resToggleOff = toggleAttendance(showId, {}, storage);
      assert.strictEqual(resToggleOff.attended, false);
      assert.strictEqual(isAttended(showId, storage), false);
      assert.strictEqual(getAttendedShow(showId, storage), null);

      // 4. Toggle attendance (adds back)
      const resToggleOn = toggleAttendance(showId, { date: "2024-11-30" }, storage);
      assert.strictEqual(resToggleOn.attended, true);
      assert.strictEqual(isAttended(showId, storage), true);

      // 5. Remove attendance
      const resRemove = removeAttendance(showId, storage);
      assert.strictEqual(resRemove.attended, false);
      assert.strictEqual(isAttended(showId, storage), false);
    });

    it("dispatches hg:ticket-book-updated event when saving ticket-book data", async () => {
      const { saveTicketBook, createEmptyTicketBook, MemoryStorageAdapter, TICKET_BOOK_EVENT_UPDATED } =
        await loadModule("/src/lib/ticket-book.js");

      const storage = new MemoryStorageAdapter();
      let eventDispatched = false;
      let eventPayload = null;

      const originalDispatch = globalThis.window.dispatchEvent;
      globalThis.window.dispatchEvent = (evt) => {
        if (evt.type === TICKET_BOOK_EVENT_UPDATED) {
          eventDispatched = true;
          eventPayload = evt.detail.payload;
        }
        return true;
      };

      try {
        const payload = createEmptyTicketBook();
        payload.attendedShows["test-show"] = { showKey: "test-show", attendedAt: "2024-11-12" };
        saveTicketBook(payload, storage);

        assert.strictEqual(eventDispatched, true);
        assert.ok(eventPayload?.attendedShows["test-show"]);
      } finally {
        globalThis.window.dispatchEvent = originalDispatch;
      }
    });

    it("gets, sets, and persists global fan holderName across ticket-book sessions", async () => {
      const {
        loadTicketBook,
        getTicketBookHolderName,
        setTicketBookHolderName,
        MemoryStorageAdapter,
      } = await loadModule("/src/lib/ticket-book.js");

      const storage = new MemoryStorageAdapter();

      // Empty holderName by default
      assert.strictEqual(getTicketBookHolderName(storage), "");

      // Sets and returns trimmed holder name
      const saved = setTicketBookHolderName("  @higedan_fan_01  ", storage);
      assert.strictEqual(saved, "@higedan_fan_01");
      assert.strictEqual(getTicketBookHolderName(storage), "@higedan_fan_01");

      // Validates persistence in underlying payload
      const payload = loadTicketBook(storage);
      assert.strictEqual(payload.holderName, "@higedan_fan_01");
    });
  });

  describe("Subtest 3: Headless React SSR Presentation & ShowSlip Integration", () => {
    const mockShow = {
      id: "1720174",
      date: "2024-11-30",
      city: "高陽",
      venue: "KINTEX Hall 5",
      region: "海外",
      prefecture: "韓國",
      title: "Official髭男dism Asia Tour 2024 - Rejoice -",
      opensAt: "19:00",
    };

    const mockTourUnit = {
      id: "asia-tour-2024",
      title: "Official髭男dism Asia Tour 2024 - Rejoice -",
      type: "巡演專場",
      shows: [mockShow],
    };

    const mockUnitData = {
      unit: mockTourUnit,
      full: new Map([[mockShow.id, []]]),
      isTour: true,
    };

    it("renders ShowSlip with ticket-book check-in button in un-attended state by default", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { MemoryStorageAdapter, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      // Ensure storage is clean
      const storage = getSafeStorage();
      storage.clear();

      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, {
            ud: mockUnitData,
            showId: mockShow.id,
          })
        )
      );

      assert.ok(htmlZh.includes('data-testid="ticket-book-toggle-btn"'), "Must render ticket-book-toggle-btn");
      assert.ok(htmlZh.includes('data-attended="false"'), "Must have data-attended='false'");
      assert.ok(htmlZh.includes('aria-pressed="false"'), "Must have aria-pressed='false'");
      assert.ok(htmlZh.includes("我參加過"), "zh-TW must display '我參加過'");
      assert.ok(htmlZh.includes("🎟️"), "Must display ticket icon");
    });

    it("renders ShowSlip in attended state when show attendance is pre-recorded in storage", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      recordAttendance(mockShow.id, { date: mockShow.date }, storage);

      const htmlZh = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, {
            ud: mockUnitData,
            showId: mockShow.id,
          })
        )
      );

      assert.ok(htmlZh.includes('data-testid="ticket-book-toggle-btn"'), "Must render ticket-book-toggle-btn");
      assert.ok(htmlZh.includes('data-attended="true"'), "Must have data-attended='true'");
      assert.ok(htmlZh.includes('aria-pressed="true"'), "Must have aria-pressed='true'");
      assert.ok(htmlZh.includes("已收進票夾"), "zh-TW must display '已收進票夾'");
      assert.ok(htmlZh.includes("bg-tape"), "Must use bg-tape design token for active ticket attendance");

      // Clean up
      storage.clear();
    });

    it("renders ShowSlip attendance toggle button accurately across all 4 locales (ja, en, ko, zh-TW)", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { recordAttendance, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();

      // 1. Japanese (ja) - Unattended then Attended
      storage.clear();
      const htmlJaUnattended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(ShowSlip, {
            ud: mockUnitData,
            showId: mockShow.id,
          })
        )
      );
      assert.ok(htmlJaUnattended.includes("チケットブックに追加"), "ja must display 'チケットブックに追加' when unattended");

      recordAttendance(mockShow.id, { date: mockShow.date }, storage);
      const htmlJaAttended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ja" },
          React.createElement(ShowSlip, {
            ud: mockUnitData,
            showId: mockShow.id,
          })
        )
      );
      assert.ok(htmlJaAttended.includes("チケットブック追加済み"), "ja must display 'チケットブック追加済み' when attended");

      // 2. English (en) - Unattended then Attended
      storage.clear();
      const htmlEnUnattended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(ShowSlip, {
            ud: mockUnitData,
            showId: mockShow.id,
          })
        )
      );
      assert.ok(htmlEnUnattended.includes("Add to Ticket Book"), "en must display 'Add to Ticket Book' when unattended");

      recordAttendance(mockShow.id, { date: mockShow.date }, storage);
      const htmlEnAttended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "en" },
          React.createElement(ShowSlip, {
            ud: mockUnitData,
            showId: mockShow.id,
          })
        )
      );
      assert.ok(htmlEnAttended.includes("In Ticket Book"), "en must display 'In Ticket Book' when attended");

      // 3. Korean (ko) - Unattended then Attended
      storage.clear();
      const htmlKoUnattended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(ShowSlip, {
            ud: mockUnitData,
            showId: mockShow.id,
          })
        )
      );
      assert.ok(htmlKoUnattended.includes("티켓북에 담기"), "ko must display '티켓북에 담기' when unattended");

      recordAttendance(mockShow.id, { date: mockShow.date }, storage);
      const htmlKoAttended = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "ko" },
          React.createElement(ShowSlip, {
            ud: mockUnitData,
            showId: mockShow.id,
          })
        )
      );
      assert.ok(htmlKoAttended.includes("티켓북 보관중"), "ko must display '티켓북 보관중' when attended");

      // Clean up
      storage.clear();
    });

    it("verifies interactive click toggle lifecycle and persistence across page transitions", async () => {
      const { I18nProvider } = await loadModule("/src/lib/i18n.jsx");
      const { ShowSlip } = await loadModule("/src/components/slips/ShowSlip.jsx");
      const { toggleAttendance, isAttended, getSafeStorage } = await loadModule("/src/lib/ticket-book.js");

      const storage = getSafeStorage();
      storage.clear();

      // State 1: Initially unattended
      assert.strictEqual(isAttended(mockShow.id, storage), false);
      let html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, { ud: mockUnitData, showId: mockShow.id })
        )
      );
      assert.ok(html.includes('data-attended="false"'));

      // Action: User clicks toggle button
      const toggleRes1 = toggleAttendance(mockShow.id, { date: mockShow.date }, storage);
      assert.strictEqual(toggleRes1.attended, true);
      assert.strictEqual(isAttended(mockShow.id, storage), true);

      // State 2: Attended state maintained and rendered
      html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, { ud: mockUnitData, showId: mockShow.id })
        )
      );
      assert.ok(html.includes('data-attended="true"'));
      assert.ok(html.includes("已收進票夾"));

      // Action: User clicks toggle button again to cancel
      const toggleRes2 = toggleAttendance(mockShow.id, {}, storage);
      assert.strictEqual(toggleRes2.attended, false);
      assert.strictEqual(isAttended(mockShow.id, storage), false);

      // State 3: Unattended state restored
      html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          { initialLocale: "zh-TW" },
          React.createElement(ShowSlip, { ud: mockUnitData, showId: mockShow.id })
        )
      );
      assert.ok(html.includes('data-attended="false"'));
      assert.ok(html.includes("我參加過"));

      storage.clear();
    });
  });
});
