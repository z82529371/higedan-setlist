import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const dataDir = path.resolve(root, "data");

const venueMap = {
  "Kアリーナ横浜": "K-Arena Yokohama",
  "K-Arena": "K-Arena Yokohama",
  "K-Arena Yokohama": "K-Arena Yokohama",
  "Ｋ－Ａｒｅｎａ　YOKOHAMA": "K-Arena Yokohama",
  "SGC HALL ARIAKE": "SGC HALL ARIAKE",
  大阪城ホール: "Osaka-Jo Hall",
  "Osaka-Jo Hall": "Osaka-Jo Hall",
  "Niterra日本特殊陶業市民会館 フォレストホール": "Forest Hall",
  札幌文化芸術劇場hitaru: "Sapporo Cultural Arts Theater hitaru",
  "コーチャンフォー釧路文化ホール": "Kushiro Cultural Hall",
  帯広市民文化ホール: "Obihiro Civic Cultural Hall",
  "広島文化学園HBGホール": "Hiroshima Bunka Gakuen HBG Hall",
  "あきた芸術劇場ミルハス 大ホール": "Akita Arts Theater Milhas Main Hall",
  やまぎん県民ホール: "Yamagin Prefectural Hall",
  "アルカスSASEBO 大ホール": "ARKAS SASEBO Main Hall",
  "iichiko総合文化センター グランシアタ": "iichiko Grand Theater",
  新潟県民会館 大ホール: "Niigata Prefectural Civic Center Main Hall",
  愛媛県県民文化会館 メインホール: "Ehime Prefectural Cultural Hall Main Hall",
  高知県立県民文化ホール オレンジホール: "Kochi Prefectural Culture Hall Orange Hall",
  福岡サンパレス: "Fukuoka Sunpalace",
  "仙台サンプラザ ホール": "Sendai Sunplaza Hall",
  "Taipei Arena": "Taipei Arena",
  "UOB LIVE": "UOB LIVE",
  "THE STAR THEATRE": "THE STAR THEATRE",
  "KSPO DOME": "KSPO DOME",
};

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
    if (venueMap[s.venue]) {
      s.venue = venueMap[s.venue];
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