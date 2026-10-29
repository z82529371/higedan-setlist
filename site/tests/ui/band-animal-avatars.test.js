import { describe, it, before } from "node:test";
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

describe("25. Band Animal Emojis, Vehicle Upper Deck & Touring HUD State Machine (Issue #55, ADR-0129)", () => {
  let I18nProvider;
  let BandAnimalAvatarsMod;
  let KoalaAvatar;
  let CatAvatar;
  let GorillaAvatar;
  let BearAvatar;
  let BandMemberAvatar;
  let BandEnsembleHUD;
  let TourVan3D;
  let TourAirplane3D;
  let VenueMapCanvas;
  let TicketBookFootprintMap;

  before(async () => {
    const i18nMod = await loadModule("/src/lib/i18n.jsx");
    I18nProvider = i18nMod.I18nProvider;

    BandAnimalAvatarsMod = await loadModule("/src/components/map/BandAnimalAvatars.jsx");
    KoalaAvatar = BandAnimalAvatarsMod.KoalaAvatar;
    CatAvatar = BandAnimalAvatarsMod.CatAvatar;
    GorillaAvatar = BandAnimalAvatarsMod.GorillaAvatar;
    BearAvatar = BandAnimalAvatarsMod.BearAvatar;
    BandMemberAvatar = BandAnimalAvatarsMod.BandMemberAvatar;
    BandEnsembleHUD = BandAnimalAvatarsMod.BandEnsembleHUD;

    const mapCanvasMod = await loadModule("/src/components/VenueMapCanvas.jsx");
    TourVan3D = mapCanvasMod.TourVan3D;
    TourAirplane3D = mapCanvasMod.TourAirplane3D;
    VenueMapCanvas = mapCanvasMod.VenueMapCanvas;

    const footprintMapMod = await loadModule("/src/components/ticket-book/TicketBookFootprintMap.jsx");
    TicketBookFootprintMap = footprintMapMod.TicketBookFootprintMap;
  });

  it("renders pure adorable emojis for all 4 band members without complex instrument clutter", () => {
    // 🐨 Satoshi Fujihara (Vo/Pf)
    const koalaHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(KoalaAvatar, { size: 28 })
      )
    );
    assert.ok(koalaHtml.includes("🐨"), "KoalaAvatar must render 🐨 emoji");
    assert.ok(koalaHtml.includes('data-member="koala"'), "KoalaAvatar must have data-member='koala'");

    // 🐱 Daisuke Ozasa (Gt)
    const catHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(CatAvatar, { size: 28 })
      )
    );
    assert.ok(catHtml.includes("🐱"), "CatAvatar must render 🐱 emoji");
    assert.ok(catHtml.includes('data-member="cat"'), "CatAvatar must have data-member='cat'");

    // 🦍 Makoto Narazaki (Ba/Sax)
    const gorillaHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(GorillaAvatar, { size: 28 })
      )
    );
    assert.ok(gorillaHtml.includes("🦍"), "GorillaAvatar must render 🦍 emoji");
    assert.ok(gorillaHtml.includes('data-member="gorilla"'), "GorillaAvatar must have data-member='gorilla'");

    // 🐻 Masaki Matsuura (Drs)
    const bearHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(BearAvatar, { size: 28 })
      )
    );
    assert.ok(bearHtml.includes("🐻"), "BearAvatar must render 🐻 emoji");
    assert.ok(bearHtml.includes('data-member="bear"'), "BearAvatar must have data-member='bear'");
  });

  it("supports BandMemberAvatar unified dispatcher for all member identifiers", () => {
    const members = ["koala", "cat", "gorilla", "bear", "fujihara", "ozasa", "narazaki", "matsuura"];
    for (const m of members) {
      const html = renderToStaticMarkup(
        React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
          React.createElement(BandMemberAvatar, { member: m, size: 24 })
        )
      );
      assert.ok(html.includes("role=\"img\""), `BandMemberAvatar must render role="img" for ${m}`);
    }
  });

  it("places 4 emoji riders on TourVan3D upper deck with 🦍 driver (Right-Hand Drive), 🐨 copilot, 🐱 & 🐻 rear", () => {
    const vanHtml = renderToStaticMarkup(React.createElement(TourVan3D, { angle: 30, scale: 0.8 }));
    // Verify pure paint finishes remain intact
    assert.ok(vanHtml.includes("#dc2626"), "TourVan3D keeps crimson red paint finish");
    assert.ok(!vanHtml.includes('stroke="var(--color-ink)"'), "TourVan3D keeps borderless paint");
    // Verify 4 emoji riders on vehicle upper deck
    assert.ok(vanHtml.includes('data-testid="van-band-emoji-riders"'), "TourVan3D must have upper deck emoji riders group");
    assert.ok(vanHtml.includes("🦍"), "Driver seat must feature 🦍 (楢﨑誠 Right-Hand Drive)");
    assert.ok(vanHtml.includes("🐨"), "Passenger seat must feature 🐨 (藤原聡)");
    assert.ok(vanHtml.includes("🐱"), "Rear seat must feature 🐱 (小笹大輔)");
    assert.ok(vanHtml.includes("🐻"), "Rear seat must feature 🐻 (松浦匡希)");
  });

  it("places 4 emoji riders on TourAirplane3D upper deck", () => {
    const planeHtml = renderToStaticMarkup(React.createElement(TourAirplane3D, { angle: -45, scale: 0.72 }));
    assert.ok(planeHtml.includes("#f8fafc"), "TourAirplane3D keeps platinum silver fuselage");
    assert.ok(planeHtml.includes('data-testid="airplane-cabin-windows"'), "TourAirplane3D must have cabin riders group");
    assert.ok(planeHtml.includes("🦍"), "Plane must feature 🦍");
    assert.ok(planeHtml.includes("🐨"), "Plane must feature 🐨");
    assert.ok(planeHtml.includes("🐱"), "Plane must feature 🐱");
    assert.ok(planeHtml.includes("🐻"), "Plane must feature 🐻");
  });

  it("renders BandEnsembleHUD across the 3 touring states: moving, stay, arrived, and tour finale", () => {
    // 1. Arrived state (intermediate stop)
    const arrivedHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(BandEnsembleHUD, { state: "arrived", isFinal: false })
      )
    );
    assert.ok(arrivedHtml.includes('data-testid="journey-band-ensemble"'), "Must render ensemble container");
    assert.ok(arrivedHtml.includes('data-state="arrived"'), "Ensemble state must be 'arrived'");
    assert.ok(arrivedHtml.includes("🦍"), "Must include 🦍");
    assert.ok(arrivedHtml.includes("🐨"), "Must include 🐨");
    assert.ok(arrivedHtml.includes("🐱"), "Must include 🐱");
    assert.ok(arrivedHtml.includes("🐻"), "Must include 🐻");

    // 2. Final stop (千秋樂 / Tour Finale)
    const finaleHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(BandEnsembleHUD, { state: "arrived", isFinal: true })
      )
    );
    assert.ok(finaleHtml.includes('data-testid="journey-finale-streamers"'), "Final stop must show celebration streamers / ribbons");
    assert.ok(finaleHtml.includes('data-is-final="true"'), "Must have data-is-final='true'");

    // 3. Stay state (multi-day residency)
    const stayHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(BandEnsembleHUD, { state: "stay", isFinal: false })
      )
    );
    assert.ok(stayHtml.includes('data-state="stay"'), "Must have data-state='stay'");
    assert.ok(stayHtml.includes('data-testid="journey-stay-recharge"'), "Must feature stay recharge icon / copy");

    // 4. Moving state
    const movingHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(BandEnsembleHUD, { state: "moving", isFinal: false })
      )
    );
    assert.ok(movingHtml.includes('data-state="moving"'), "Must have data-state='moving'");
  });

  it("integrates BandEnsembleHUD into VenueMapCanvas journey HUD", () => {
    const journey = {
      tourId: "tour-1",
      tourTitle: "Official Tour 2024",
      stops: [
        {
          showId: "s1",
          date: "2024-05-10",
          venue: "日本武道館",
          prefecture: "tokyo",
          city: "千代田區",
          stopNumber: 1,
          isFirst: true,
          isFinal: false,
          svgPoint: { x: 500, y: 500 },
        },
        {
          showId: "s2",
          date: "2024-05-20",
          venue: "大阪城ホール",
          prefecture: "osaka",
          city: "大阪市",
          stopNumber: 2,
          isFirst: false,
          isFinal: true,
          svgPoint: { x: 400, y: 550 },
        },
      ],
      transitions: [
        {
          index: 0,
          fromIndex: 0,
          toIndex: 1,
          transitMode: "van",
          fromSvg: { x: 500, y: 500 },
          toSvg: { x: 400, y: 550 },
        },
      ],
    };

    const canvasHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(VenueMapCanvas, {
          mode: "journey",
          journey,
          playbackOptions: { initialProgress: "end" },
        })
      )
    );

    assert.ok(canvasHtml.includes('data-testid="journey-hud-card"'), "Must render journey HUD card");
    assert.ok(canvasHtml.includes('data-testid="journey-band-ensemble"'), "VenueMapCanvas HUD must include BandEnsembleHUD celebration");
  });

  it("strictly excludes band emojis and touring vehicles from TicketBookFootprintMap (ADR-0129 boundary)", () => {
    const book = {
      version: 1,
      holderName: "Higedan Fan",
      checkIns: [
        {
          showId: "s1",
          show: { date: "2024-05-10", venue: "日本武道館" },
          stampedAt: "2024-05-10T12:00:00Z",
        },
      ],
    };

    const footprintHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(TicketBookFootprintMap, {
          book,
          venues: [
            {
              id: "budokan",
              name: "日本武道館",
              prefecture: "tokyo",
              city: "千代田區",
              lat: 35.6933,
              lng: 139.75,
            },
          ],
        })
      )
    );

    // Strictly ensure no band animal emojis leak into personal ticket book
    assert.ok(!footprintHtml.includes('data-member="koala"'), "TicketBookFootprintMap must NOT contain Koala");
    assert.ok(!footprintHtml.includes('data-member="cat"'), "TicketBookFootprintMap must NOT contain Cat");
    assert.ok(!footprintHtml.includes('data-member="gorilla"'), "TicketBookFootprintMap must NOT contain Gorilla");
    assert.ok(!footprintHtml.includes('data-member="bear"'), "TicketBookFootprintMap must NOT contain Bear");
  });

  it("places solo sunglasses fan (😎) in Japanese driver seat on TourVan3D and pilot seat on TourAirplane3D when isPersonal is true", () => {
    // 1. TourVan3D with isPersonal: Sitting in Japanese Right-Hand Drive driver seat (x: 4, y: 6.2) facing forward
    const vanHtml = renderToStaticMarkup(React.createElement(TourVan3D, { angle: 0, isPersonal: true }));
    assert.ok(vanHtml.includes('data-testid="van-personal-fan-rider"'), "TourVan3D must render personal fan rider group");
    assert.ok(vanHtml.includes("translate(4, 6.2) rotate(-90)"), "Solo fan must sit in driver's seat (x: 4, y: 6.2) facing forward");
    assert.ok(vanHtml.includes("😎"), "TourVan3D must feature 😎 (sunglasses fan)");
    assert.ok(!vanHtml.includes("🦍"), "Personal van must NOT feature band emojis");
    assert.ok(!vanHtml.includes("🐨"), "Personal van must NOT feature band emojis");

    // 2. TourAirplane3D with isPersonal: Sitting in front cockpit pilot seat (x: 13.5, y: 0) facing forward
    const planeHtml = renderToStaticMarkup(React.createElement(TourAirplane3D, { angle: 0, isPersonal: true }));
    assert.ok(planeHtml.includes('data-testid="airplane-personal-fan-rider"'), "TourAirplane3D must render personal fan rider group");
    assert.ok(planeHtml.includes("translate(13.5, 0) rotate(-90)"), "Solo fan must sit in pilot seat (x: 13.5, y: 0) facing forward");
    assert.ok(planeHtml.includes("😎"), "TourAirplane3D must feature 😎 (sunglasses fan)");
    assert.ok(!planeHtml.includes("🦍"), "Personal airplane must NOT feature band emojis");
  });

  it("strictly omits BandEnsembleHUD in personal mode while retaining journey show slip HUD card", () => {
    const personalJourney = {
      isPersonal: true,
      tourId: "personal-fan-trajectory",
      stops: [
        {
          showId: "s1",
          date: "2024-05-10",
          venue: "日本武道館",
          prefecture: "tokyo",
          city: "千代田區",
          stopNumber: 1,
          isFirst: true,
          isFinal: false,
          svgPoint: { x: 500, y: 500 },
        },
        {
          showId: "s2",
          date: "2024-05-20",
          venue: "大阪城ホール",
          prefecture: "osaka",
          city: "大阪市",
          stopNumber: 2,
          isFirst: false,
          isFinal: true,
          svgPoint: { x: 400, y: 550 },
        },
      ],
      transitions: [
        {
          index: 0,
          fromIndex: 0,
          toIndex: 1,
          transitMode: "van",
          fromSvg: { x: 500, y: 500 },
          toSvg: { x: 400, y: 550 },
        },
      ],
    };

    const canvasHtml = renderToStaticMarkup(
      React.createElement(I18nProvider, { defaultLocale: "zh-TW" },
        React.createElement(VenueMapCanvas, {
          mode: "journey",
          journey: personalJourney,
          isPersonal: true,
          playbackOptions: { initialProgress: "end" },
        })
      )
    );

    // Personal mode has no redundant ensemble HUD card
    assert.ok(!canvasHtml.includes('data-testid="journey-band-ensemble"'), "Personal map must NOT render BandEnsembleHUD");
    // But keeps the helpful show slip HUD card to open setlists
    assert.ok(canvasHtml.includes('data-testid="journey-hud-card"'), "Personal map must retain show slip card");
  });
});
