import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

export function generateAuditReports() {
  const dirs = ['events', 'tours'];
  const allShows = [];

  for (const d of dirs) {
    const dirPath = resolve(root, 'data', d);
    if (!existsSync(dirPath)) continue;
    const files = readdirSync(dirPath).filter((f) => f.endsWith('.json'));

    for (const f of files) {
      const data = JSON.parse(readFileSync(resolve(dirPath, f), 'utf8'));
      for (const show of data.shows || []) {
        allShows.push({
          dir: d,
          file: f,
          unitTitle: data.title,
          unitType: data.type,
          templateSetlist: data.templateSetlist,
          show,
        });
      }
    }
  }

  allShows.sort((a, b) => {
    if (a.show.date !== b.show.date) return a.show.date.localeCompare(b.show.date);
    return (a.show.id || '').localeCompare(b.show.id || '');
  });

  // 1. Missing Setlists: Stub 0 songs or 100% placeholder tracks
  const missingSetlists = [];
  for (const item of allShows) {
    const { show, templateSetlist, dir, file, unitTitle, unitType } = item;
    let tracks = [];
    if (dir === 'tours' && templateSetlist) {
      tracks = templateSetlist;
    } else if (show.setlist) {
      tracks = show.setlist;
    }

    const isStub = tracks.length === 0;
    const isOnlyPlaceholder =
      tracks.length > 0 &&
      tracks.every(
        (t) =>
          t.title &&
          (t.title.includes('未詳') || t.title.includes('不明'))
      );

    if (isStub || isOnlyPlaceholder) {
      missingSetlists.push({
        date: show.date,
        type: unitType,
        title: show.title || unitTitle,
        venue: `${show.venue} (${show.city})`,
        file,
        dir,
        status: isStub ? '完全空白' : '僅具佔位符',
      });
    }
  }

  // 2. Missing Times: both opensAt and startsAt are missing
  const missingTimes = [];
  for (const item of allShows) {
    const { show, dir, file, unitTitle, unitType } = item;
    if (!show.opensAt && !show.startsAt) {
      missingTimes.push({
        date: show.date,
        type: unitType,
        title: show.title || unitTitle,
        venue: `${show.venue} (${show.city})`,
        file,
        dir,
      });
    }
  }

  const natureDescriptions = {
    '2012': '地下獨立樂團早期拼盤、LIVEHOUSE、學園祭',
    '2013': '地下獨立樂團早期拼盤、LIVEHOUSE、學園祭',
    '2014': '地下獨立樂團早期拼盤、LIVEHOUSE、學園祭',
    '2015': 'Free Live Tour、店鋪發片活動、小型拼盤',
    '2016': 'Free Live Tour、店鋪發片活動、小型拼盤',
    '2017': '迷你專輯發售 Free Live、電台公開錄音、音樂祭',
    '2018': '迷你專輯發售 Free Live、電台公開錄音、音樂祭',
    '2019': '特定對邦活動',
  };

  // Generate docs/reports/missing-setlists.md
  const setlistYearCounts = {};
  for (const s of missingSetlists) {
    const y = s.date.slice(0, 4);
    setlistYearCounts[y] = (setlistYearCounts[y] || 0) + 1;
  }

  let mdSetlists = `# Official髭男dism 未收錄歌單場次清單 (Missing Setlists Report)

> 本清單收錄全檔案庫中 **未收錄歌單（曲目完全空白或僅具佔位符）** 之歷史場次，共計 **${missingSetlists.length}** 場。

### 統計與年份分佈

| 年份 | 缺歌單場數 | 主要性質 |
|---|---|---|
`;

  for (const y of Object.keys(setlistYearCounts).sort()) {
    mdSetlists += `| ${y} | **${setlistYearCounts[y]} 場** | ${natureDescriptions[y] || '歷史活動'} |\n`;
  }

  mdSetlists += `
---

### 完整清單明細 (共 ${missingSetlists.length} 場)

| # | 日期 | 演出型態 | 巡演 / 活動名稱 | 場館 (城市) | 資料來源檔案 | 當前狀態 |
|---|---|---|---|---|---|---|
`;

  missingSetlists.forEach((s, idx) => {
    mdSetlists += `| ${idx + 1} | ${s.date} | ${s.type} | ${s.title} | ${s.venue} | [${s.file}](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/data/${s.dir}/${s.file}) | ${s.status} |\n`;
  });

  // Generate docs/reports/missing-times.md
  const timesYearCounts = {};
  for (const s of missingTimes) {
    const y = s.date.slice(0, 4);
    timesYearCounts[y] = (timesYearCounts[y] || 0) + 1;
  }

  let mdTimes = `# Official髭男dism 未記錄時間場次清單 (Missing Show Times Report)

> 本清單收錄全檔案庫中 **未記錄演出時間（opensAt 開場 與 startsAt 開演 皆缺）** 之場次，共計 **${missingTimes.length}** 場。

### 統計與年份分佈

| 年份 | 缺時間場數 |
|---|---|
`;

  for (const y of Object.keys(timesYearCounts).sort()) {
    mdTimes += `| ${y} | **${timesYearCounts[y]} 場** |\n`;
  }

  mdTimes += `
---

### 完整清單明細 (共 ${missingTimes.length} 場)

| # | 日期 | 演出型態 | 巡演 / 活動名稱 | 場館 (城市) | 資料來源檔案 |
|---|---|---|---|---|---|
`;

  missingTimes.forEach((s, idx) => {
    mdTimes += `| ${idx + 1} | ${s.date} | ${s.type} | ${s.title} | ${s.venue} | [${s.file}](file:///C:/Users/User/%E9%AB%AD%E7%94%B7%20%E6%BC%94%E5%94%B1%E6%9C%83/data/${s.dir}/${s.file}) |\n`;
  });

  const reportsDir = resolve(root, 'docs', 'reports');
  writeFileSync(resolve(reportsDir, 'missing-setlists.md'), mdSetlists);
  writeFileSync(resolve(reportsDir, 'missing-times.md'), mdTimes);

  console.log(
    `[Audit Reports] Synced docs/reports/missing-setlists.md (${missingSetlists.length} shows) and docs/reports/missing-times.md (${missingTimes.length} shows)`
  );

  return { missingSetlistsCount: missingSetlists.length, missingTimesCount: missingTimes.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAuditReports();
}
