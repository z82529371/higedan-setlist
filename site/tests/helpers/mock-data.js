/**
 * mock-data.js — Shared test fixtures and dictionary mocks.
 */

export const mockMaps = {
  livefansIdToId: {
    "1001": "pretender",
    "1002": "宿命",
    "1003": "subtitle",
    "1004": "white-noise",
    "1005": "laughter",
  },
  titleToId: {
    pretender: "pretender",
    宿命: "宿命",
    subtitle: "subtitle",
    whitenoise: "white-noise",
    laughter: "laughter",
  },
  validSongIds: new Set([
    "pretender",
    "宿命",
    "subtitle",
    "white-noise",
    "laughter",
  ]),
};
