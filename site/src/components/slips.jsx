import {
  KIND_TAB,
  SETLIST_ITEM,
  CUE_NO,
  TRACK_NOTE,
  SLIP_ARTICLE,
  SLIP_TAPE,
} from "../lib/constants.js";
import {
  getKindArray,
  primaryKind,
  kindTabs,
  visibleBadges,
  slipClassFor,
  cueColorFor,
  songWeightFor,
  tabColorFor,
} from "../lib/kind.js";
import { songTitle, songUnreleased, showDate } from "../lib/domain.js";
import { trackKey, trackRoute, routeHash } from "../lib/track.js";
import { assignCues } from "../lib/resolve.js";

export function ShowSlip({ ud, showId, onSelectSong }) {
  if (!ud) return null;
  const s = ud.unit.shows.find((x) => x.id === showId);
  if (!s) return null;

  const items = ud.full.get(showId);
  const rawMain = [];
  const rawEnc = [];
  for (const i of items) (i.encore ? rawEnc : rawMain).push(i);
  const main = assignCues(rawMain, "M");
  const enc = assignCues(rawEnc, "EN");

  const unrel = (i) => songUnreleased.has(i.songId);
  const primaryOf = (i) => primaryKind(getKindArray(i.kind), unrel(i));

  const cueColor = (i) => cueColorFor(primaryOf(i));

  const songWeight = (i) => songWeightFor(primaryOf(i));

  const cardClass = (i) => slipClassFor(primaryOf(i));

  const cardTabs = (i) => kindTabs(getKindArray(i.kind), unrel(i));

  const runKey = (i) => {
    const k = getKindArray(i.kind);
    return i.songId && k.length > 0 ? `${primaryOf(i)}::${k.join(",")}` : null;
  };

  const groupRuns = (list) => {
    const runs = [];
    for (const p of list) {
      const key = runKey(p.item);
      const last = runs[runs.length - 1];
      if (key && last && last.key === key) last.items.push(p);
      else runs.push({ key, items: [p] });
    }
    return runs;
  };

  const renderRun = (g, prefix) => {
    const first = g.items[0].item;
    if (!first.songId && !first.title) {
      return (
        <li
          key={prefix}
          className={`${SETLIST_ITEM} text-[13px] text-muted [&_.cue-no]:text-line`}
        >
          <span className="cue-no min-w-[42px] text-right font-mono text-[12px] text-line">
            —
          </span>
          <span>{first.note ?? ""}</span>
        </li>
      );
    }
    const multi = g.key && g.items.length > 1;
    const slipClass = cardClass(first);
    const tabs = cardTabs(first);
    const songLine = (it) => {
      const title = it.title ?? songTitle[it.songId];
      if (!it.songId) {
        return <span className="font-medium text-ink">{title}</span>;
      }
      const link = trackRoute(it, songWeight(it));
      return (
        <a
          className={link.cls}
          href={link.hash}
          onClick={(e) => {
            e.preventDefault();
            onSelectSong(it.songId);
          }}
        >
          {title}
        </a>
      );
    };
    const tabBar =
      tabs.length > 0 ? (
        <span className="absolute left-[14px] top-[-11px] z-[1] flex gap-[6px]">
          {tabs.map((k) => (
            <span
              key={k}
              className={`px-2 py-[1px] font-mono text-[10px] font-semibold leading-[1.4] tracking-[0.2em] text-white ${tabColorFor(
                k
              )}`}
            >
              {KIND_TAB[k]}
            </span>
          ))}
        </span>
      ) : null;
    if (multi) {
      return (
        <li key={prefix} className={`${SETLIST_ITEM} ${slipClass}`}>
          {tabBar}
          <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
            {g.items.map((p) => (
              <span
                key={p.item.order}
                className="flex min-w-0 items-baseline gap-3"
              >
                <span className={`${CUE_NO} ${cueColor(p.item)}`}>{p.cue}</span>
                <span>
                  {songLine(p.item)}
                  {p.item.note && (
                    <span className={TRACK_NOTE}> {p.item.note}</span>
                  )}
                </span>
              </span>
            ))}
          </span>
        </li>
      );
    }
    return (
      <li key={prefix} className={`${SETLIST_ITEM} ${slipClass}`}>
        {tabBar}
        <span className={`${CUE_NO} ${cueColor(first)}`}>{g.items[0].cue}</span>
        <span>
          {songLine(first)}
          {first.note && <span className={TRACK_NOTE}> {first.note}</span>}
        </span>
      </li>
    );
  };

  const songCount = items.filter((i) => i.songId || i.title).length;

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="場次曲目清單"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-[6px] border-b-2 border-ink pb-3">
        <h3 className="m-0 flex flex-col gap-[2px] font-display text-[23px] font-extrabold leading-[1.3]">
          <span className="font-mono text-[15px] font-semibold text-muted">
            {showDate(s)}
          </span>
          <span className="text-[24px] font-extrabold text-ink">{s.venue}</span>
          <span className="text-[16px] font-medium text-muted">
            （{s.city}）
          </span>
        </h3>
        <p className="mt-[6px] text-[13px] text-muted [&_a]:text-pool [&_a]:underline-offset-[3px]">
          {s.opensAt ? `${s.opensAt} 開演・` : ""}
          {ud.unit.type}・{songCount > 0 ? `共 ${songCount} 首演出曲目` : "尚無曲目紀錄"}
          {s.sourceUrls?.[0] && (
            <>
              ・{" "}
              <a href={s.sourceUrls[0]} target="_blank" rel="noreferrer">
                livefans 來源
              </a>
            </>
          )}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="my-8 rounded-[3px] border border-dashed border-line bg-paper px-6 py-8 text-center">
          <p className="m-0 text-[16px] font-bold text-ink">🔍 歌單情報未明</p>
          <p className="m-0 mt-2 text-[13px] text-muted">
            本場演出目前尚無公開曲目紀錄
          </p>
        </div>
      ) : (
        <>
          <ol className="m-0 list-none p-0">
            {groupRuns(main).map((g, idx) => renderRun(g, `m-${idx}`))}
          </ol>
          {enc.length > 0 && (
            <>
              <div
                className="encore-cut mb-[6px] mt-[18px] flex items-center gap-[10px] font-mono text-[12px] font-semibold tracking-[0.24em] text-ink before:h-[10px] before:w-[10px] before:border-[1.5px] before:border-ink before:bg-tape after:flex-1 after:border-t-[1.5px] after:border-dashed after:border-ink"
                aria-hidden="true"
              >
                ENCORE
              </div>
              <ol className="m-0 list-none p-0">
                {groupRuns(enc).map((g, idx) => renderRun(g, `e-${idx}`))}
              </ol>
            </>
          )}
        </>
      )}
    </article>
  );
}

export function SongSlip({ songId, trackShows, showById, onSelectShow }) {
  if (!songId) {
    return (
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          選一首歌曲，看它在全檔案庫哪幾場出現過。
        </p>
      </div>
    );
  }

  const appearances = trackShows.get(trackKey("song", songId)) ?? [];

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="歌曲全域出現場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-[6px] border-b-2 border-ink pb-3">
        <p className="m-0 mb-1 font-mono text-[12px] tracking-[0.18em] text-muted">
          ALL TOURS → SONG SHOWS
        </p>
        <h3 className="m-0 font-display text-[23px] font-extrabold leading-[1.3]">
          {songTitle[songId]}
          {songUnreleased.has(songId) && (
            <span className="ml-1 align-baseline text-[0.8em] font-normal tracking-[0.02em] text-muted">
              （未發行）
            </span>
          )}
        </h3>
        <p className="mt-[6px] font-mono text-[13px] text-muted [&_a]:text-pool">
          全檔案庫共出現於 {appearances.length} 場演出
        </p>
      </div>
      <ul className="m-0 mt-3 list-none p-0">
        {appearances.map(({ showId, unitTitle, unitType, item }) => {
          const s = showById.get(showId);
          return (
            <li
              key={showId}
              className="flex items-start gap-3 border-b border-line-soft px-1 py-[10px] last:border-b-0"
            >
              <span className="mt-[2px] whitespace-nowrap rounded-[3px] border border-[rgba(30,46,74,0.25)] bg-[rgba(232,180,40,0.38)] px-[6px] py-[2px] font-mono text-[11px] font-semibold text-ink">
                {unitTitle}
                {unitType !== "專場" && (
                  <span className="ml-[7px] rounded-full border border-current px-[6px] py-[1px] align-middle font-mono text-[0.72em] font-semibold tracking-[0.04em] opacity-85">
                    {unitType}
                  </span>
                )}
              </span>
              <a
                className="flex flex-col leading-[1.45] text-ink no-underline transition-colors hover:text-request focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none [&_.show-link-venue]:hover:text-pool [&_.show-link-venue]:hover:underline"
                href={routeHash.show(showId)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectShow(showId);
                }}
              >
                <span className="font-mono text-[12px] text-muted">
                  {showDate(s)}
                </span>
                <span className="show-link-venue text-[14px] font-bold">
                  {s.venue}
                </span>
                <span className="show-link-city text-[13px] text-muted">
                  （{s.city}）
                </span>
              </a>
              {visibleBadges(item.kind).map(({ key, label, cls }) => (
                <span
                  key={key}
                  className={`ml-2 inline-block rounded-[3px] px-[7px] py-[3px] align-middle font-mono text-[0.72em] font-semibold leading-none tracking-[0.06em] before:content-['♪_'] ${cls}`}
                >
                  {label}
                </span>
              ))}
              {item.note && (
                <span className="text-[13px] text-muted"> {item.note}</span>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}



export function VenueSlip({ venueName, globalVenueShows, onSelectShow }) {
  if (!venueName) {
    return (
      <div className={SLIP_ARTICLE}>
        <span aria-hidden="true" className={SLIP_TAPE} />
        <p className="m-0 px-1 py-[18px] text-[14px] text-muted">
          選一個場地，看在該場地舉行過哪些場次。
        </p>
      </div>
    );
  }

  const venueShows = globalVenueShows.get(venueName) ?? [];
  const firstCity = venueShows[0]?.show.city ?? "";

  return (
    <article
      className={SLIP_ARTICLE}
      aria-label="場地全域場次"
    >
      <span aria-hidden="true" className={SLIP_TAPE} />
      <div className="mb-[6px] border-b-2 border-ink pb-3">
        <p className="m-0 mb-1 font-mono text-[12px] tracking-[0.18em] text-muted">
          ALL TOURS → VENUE SHOWS
        </p>
        <h3 className="m-0 font-display text-[23px] font-extrabold leading-[1.3]">
          {venueName}{" "}
          <span className="text-[16px] font-normal text-muted">
            （{firstCity}）
          </span>
        </h3>
        <p className="mt-[6px] font-mono text-[13px] text-muted [&_a]:text-pool">
          全檔案庫共舉辦過 {venueShows.length} 場演出
        </p>
      </div>
      <ul className="m-0 mt-3 list-none p-0">
        {venueShows.map(({ showId, unitTitle, unitType, show }) => (
          <li
            key={showId}
            className="flex items-start gap-3 border-b border-line-soft px-1 py-[10px] last:border-b-0"
          >
            <span className="mt-[2px] whitespace-nowrap rounded-[3px] border border-[rgba(30,46,74,0.25)] bg-[rgba(232,180,40,0.38)] px-[6px] py-[2px] font-mono text-[11px] font-semibold text-ink">
              {unitTitle}
              {unitType !== "專場" && (
                <span className="ml-[7px] rounded-full border border-current px-[6px] py-[1px] align-middle font-mono text-[0.72em] font-semibold tracking-[0.04em] opacity-85">
                  {unitType}
                </span>
              )}
            </span>
            <a
              className="flex flex-col leading-[1.45] text-ink no-underline transition-colors hover:text-request focus-visible:outline-[3px] focus-visible:outline-pool focus-visible:outline-offset-2 motion-reduce:transition-none [&_.show-link-venue]:hover:text-pool [&_.show-link-venue]:hover:underline"
              href={routeHash.show(showId)}
              onClick={(e) => {
                e.preventDefault();
                onSelectShow(showId);
              }}
            >
              <span className="font-mono text-[12px] text-muted">
                {showDate(show)}
              </span>
              <span className="show-link-venue text-[14px] font-bold">
                {show.venue}
              </span>
              <span className="show-link-city text-[13px] text-muted">
                （{show.city}）
              </span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
