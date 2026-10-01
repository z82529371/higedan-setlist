import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lookupVenue } from "./lib/venue.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const dataDir = path.resolve(root, "data");

const venuesPath = path.resolve(dataDir, "venues.json");
const venueData = JSON.parse(fs.readFileSync(venuesPath, "utf-8"));

const citySlugMap = {
  東京: "tokyo",
  大阪: "osaka",
  橫濱: "yokohama",
  名古屋: "nagoya",
  福岡: "fukuoka",
  札幌: "sapporo",
  仙台: "sendai",
  廣島: "hiroshima",
  金澤: "kanazawa",
  新潟: "niigata",
  高松: "takamatsu",
  熊本: "kumamoto",
  靜岡: "shizuoka",
  埼玉: "saitama",
  福井: "fukui",
  長崎: "nagasaki",
  山形: "yamagata",
  秋田: "akita",
  愛媛: "ehime",
  高知: "kochi",
  大分: "oita",
};

function unitFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const unit = JSON.parse(fs.readFileSync(path.resolve(dir, f), "utf-8"));
      return { dir, file: f, unit };
    });
}

const units = [
  ...unitFiles(path.resolve(dataDir, "tours")),
  ...unitFiles(path.resolve(dataDir, "events")),
];

for (const { dir, file, unit } of units) {
  for (const s of unit.shows) {
    const venueHit = lookupVenue(s.venue, venueData);
    if (venueHit) {
      s.venue = venueHit.venue;
    }
    // Standardize IDs for shows that had generic 'show' slug
    if (s.id.includes("-show-")) {
      const monthDay = s.id.split("-show-")[1];
      const cSlug = citySlugMap[s.city] ?? "venue";
      s.id = `${unit.id}-${cSlug}-${monthDay}`;
    }
  }

  // Sort chronologically
  unit.shows.sort((a, b) =>
    a.date > b.date ? -1 : a.date < b.date ? 1 : a.id.localeCompare(b.id),
  );

  fs.writeFileSync(
    path.resolve(dir, file),
    JSON.stringify(unit, null, 2) + "\n",
    "utf-8",
  );
}

console.log(
  `Standardized venue names / fixed show IDs across ${units.length} unit files.`,
);