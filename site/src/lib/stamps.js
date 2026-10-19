/**
 * stamps.js — Commemorative Stamp Registry for Concert Passport & Memorial Cards
 *
 * Defines the available commemorative stamp designs for concert cards (Issue #36).
 */

export const COMMEMORATIVE_STAMPS = [
  {
    id: "default",
    nameKey: "memorial.stampDefault",
    stampTextKey: "memorial.stampTextDefault",
    headerText: "HIGEDAN",
    subText: "ARCHIVE",
    shape: "circle",
    rotationClass: "rotate-[-8deg]",
  },
  {
    id: "stamp-attended",
    nameKey: "memorial.stampAttended",
    stampTextKey: "memorial.stampTextAttended",
    headerText: "HIGEDAN",
    subText: "VERIFIED",
    shape: "pass",
    rotationClass: "rotate-[-6deg]",
  },
  {
    id: "stamp-rejoice",
    nameKey: "memorial.stampRejoice",
    stampTextKey: "memorial.stampTextRejoice",
    headerText: "★ HIGEDAN ★",
    subText: "MEMORIAL",
    shape: "star",
    rotationClass: "rotate-[6deg]",
  },
  {
    id: "stamp-special",
    nameKey: "memorial.stampSpecial",
    stampTextKey: "memorial.stampTextSpecial",
    headerText: "HIGEDAN",
    subText: "LIVE",
    shape: "box",
    rotationClass: "rotate-[-4deg]",
  },
];

export function getStampById(stampId) {
  return COMMEMORATIVE_STAMPS.find((s) => s.id === stampId) || COMMEMORATIVE_STAMPS[0];
}
