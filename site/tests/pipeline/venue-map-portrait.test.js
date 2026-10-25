import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PORTRAIT_MAP_VIEWBOX,
  MAIN_PORTRAIT_OFFSET,
  OVERSEAS_PORTRAIT_OFFSET,
  OKINAWA_PORTRAIT_OFFSET,
  projectPointToLayout,
} from "../../src/lib/venue-map.js";
import {
  getZoomViewBox,
  PORTRAIT_OVERSEAS_INSET_VIEWBOX,
  PORTRAIT_OKINAWA_INSET_VIEWBOX,
} from "../../src/lib/japan-map-paths.js";
import { computeFollowCamViewBox } from "../../src/lib/journey-playback.js";

describe("ADR-0126: Responsive Triptych Portrait Venue Map Projection & Geometry Engine", () => {
  it("exports calibrated portrait dimensions (540x930) and zone offsets", () => {
    assert.equal(PORTRAIT_MAP_VIEWBOX.width, 540);
    assert.equal(PORTRAIT_MAP_VIEWBOX.height, 930);
    assert.equal(PORTRAIT_MAP_VIEWBOX.str, "0 0 540 930");

    assert.deepEqual(MAIN_PORTRAIT_OFFSET, { x: -212, y: 260 });
    assert.deepEqual(OVERSEAS_PORTRAIT_OFFSET, { x: 137, y: 0 });
    assert.deepEqual(OKINAWA_PORTRAIT_OFFSET, { x: -423, y: 390 });
  });

  it("projectPointToLayout correctly maps points across zones in portrait mode", () => {
    // 1. Overseas point (Taipei)
    const overseasPt = { x: 195.4, y: 90.8, zone: "overseas", anchorX: 195.4, anchorY: 90.8 };
    const mappedOverseas = projectPointToLayout(overseasPt, "portrait");
    assert.equal(mappedOverseas.x, Number((195.4 + 137).toFixed(2))); // 332.4
    assert.equal(mappedOverseas.y, Number((90.8 + 0).toFixed(2)));     // 90.8
    assert.equal(mappedOverseas.anchorX, mappedOverseas.x);

    // 2. Okinawa point (Naha)
    const okinawaPt = { x: 703.5, y: 492.4, zone: "okinawa" };
    const mappedOkinawa = projectPointToLayout(okinawaPt, "portrait");
    assert.equal(mappedOkinawa.x, Number((703.5 - 423).toFixed(2))); // 280.5
    assert.equal(mappedOkinawa.y, Number((492.4 + 390).toFixed(2))); // 882.4

    // 3. Mainland point (Tokyo)
    const mainlandPt = { x: 489.3, y: 337.8, zone: "main" };
    const mappedMainland = projectPointToLayout(mainlandPt, "portrait");
    assert.equal(mappedMainland.x, Number((489.3 - 212).toFixed(2))); // 277.3
    assert.equal(mappedMainland.y, Number((337.8 + 260).toFixed(2))); // 597.8

    // 4. In landscape mode, points remain unchanged
    const unmapped = projectPointToLayout(overseasPt, "landscape");
    assert.deepEqual(unmapped, overseasPt);
  });

  it("getZoomViewBox computes precise portrait viewBoxes for overview, insets, and prefectures", () => {
    // Macro overview
    assert.equal(getZoomViewBox(null, "portrait"), "0 0 540 930");
    assert.equal(getZoomViewBox(null, "landscape"), "0 0 800 560");

    // Overseas
    assert.equal(getZoomViewBox("海外", "portrait"), PORTRAIT_OVERSEAS_INSET_VIEWBOX);
    assert.equal(getZoomViewBox("overseas", "portrait"), PORTRAIT_OVERSEAS_INSET_VIEWBOX);
    assert.equal(getZoomViewBox("海外", "landscape"), "0 0 300 210");

    // Okinawa
    assert.equal(getZoomViewBox("沖繩縣", "portrait"), PORTRAIT_OKINAWA_INSET_VIEWBOX);
    assert.equal(getZoomViewBox("沖繩縣", "landscape"), "580 410 220 154");

    // Tokyo (landscape: "478 326 115 81" -> portrait: x-212, y+260 = "266 586 115 81")
    assert.equal(getZoomViewBox("東京都", "portrait"), "266 586 115 81");
    assert.equal(getZoomViewBox("東京都", "landscape"), "478 326 115 81");

    // Osaka (landscape: "361 349 115 81" -> portrait: x-212, y+260 = "149 609 115 81")
    assert.equal(getZoomViewBox("大阪府", "portrait"), "149 609 115 81");

    // Hokkaido (landscape: "451 0 349 245" -> portrait: x-212, y+260 = "239 260 349 245")
    assert.equal(getZoomViewBox("北海道", "portrait"), "239 260 349 245");
  });

  it("computeFollowCamViewBox supports portrait layout in Tour Journey playback", () => {
    // Overview fallback in portrait
    const overviewBox = computeFollowCamViewBox(null, { layout: "portrait" });
    assert.equal(overviewBox, "0 0 540 930");

    // Overseas in portrait
    const overseasFollow = computeFollowCamViewBox({ x: 332, y: 90, zone: "overseas" }, { layout: "portrait" });
    assert.equal(overseasFollow, PORTRAIT_OVERSEAS_INSET_VIEWBOX);

    // Okinawa in portrait
    const okinawaFollow = computeFollowCamViewBox({ x: 280, y: 882, zone: "okinawa" }, { layout: "portrait" });
    assert.equal(okinawaFollow, PORTRAIT_OKINAWA_INSET_VIEWBOX);
  });
});
