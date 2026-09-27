import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const dataDir = path.resolve(root, "data");

const venueMap = {
  "Kアリーナ横浜": "橫濱K-Arena",
  "K-Arena": "橫濱K-Arena",
  "K-Arena Yokohama": "橫濱K-Arena",
  "Ｋ－Ａｒｅｎａ　YOKOHAMA": "橫濱K-Arena",
  "SGC HALL ARIAKE": "有明SGC會館",
  "大阪城ホール": "大阪城會館",
  "Osaka-Jo Hall": "大阪城會館",
  "Niterra日本特殊陶業市民会館 フォレストホール": "森林會館",
  "札幌文化芸術劇場hitaru": "札幌文化藝術劇場 hitaru",
  "コーチャンフォー釧路文化ホール": "釧路市民文化會館",
  "帯広市民文化ホール": "帶廣市民文化會館",
  "広島文化学園HBGホール": "廣島文化學園HBG會館",
  "あきた芸術劇場ミルハス 大ホール": "秋田藝術劇場",
  "やまぎん県民ホール": "山形縣民會館",
  "アルカスSASEBO 大ホール": "ARKAS佐世保",
  "iichiko総合文化センター グランシアタ": "iichiko 大劇場",
  "新潟県民会館 大ホール": "新潟縣民會館",
  "愛媛県県民文化会館 メインホール": "愛媛縣縣民文化會館",
  "高知県立県民文化ホール オレンジホール": "高知縣立縣民文化會館 Orange Hall",
  "福岡サンパレス": "福岡太陽宮殿會館",
  "仙台サンプラザ ホール": "仙台太陽廣場會館",
  "Taipei Arena": "台北小巨蛋",
  "KSPO DOME": "高尺天空巨蛋",
  "THE STAR THEATRE": "星宇表演藝術中心",
  "UOB LIVE": "UOB LIVE",
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