import React from "react";
import { SETLIST_ITEM, SETLIST_SONG } from "../../lib/constants.js";
import { FREQUENCY_TIER_CONFIG } from "../../lib/domain.js";
import { routeHash } from "../../lib/track.js";

function TrackTitleAndBadges({ track, isClickable, locale, t, onSelectSong }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline gap-2">
        {isClickable ? (
          <a
            href={routeHash.song(track.songId, locale)}
            onClick={(e) => {
              e.preventDefault();
              onSelectSong?.(track.songId);
            }}
            className={SETLIST_SONG}
            title={t("tourExtra.viewSongFile", "查看歌曲檔案：《{title}》", { title: track.title })}
          >
            <span className="font-bold text-[14px] sm:text-[15px]">{track.title}</span>
          </a>
        ) : (
          <span className="font-bold text-[14px] sm:text-[15px] text-ink">{track.title}</span>
        )}

        {track.badges && track.badges.length > 0 && (
          <div className="inline-flex flex-wrap items-center gap-1.5 align-middle">
            {track.badges.map((b) => (
              <span
                key={b.type}
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-card text-ink border ${b.borderClass} shadow-2xs select-none`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${b.dotClass} mr-1`}
                  aria-hidden="true"
                />
                <span>{t(`badges.${b.type === "solo" ? "satoshi-solo" : b.type}`, b.label)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FrequencyPill({ track, totalShows, locale, t }) {
  const tierConfig =
    FREQUENCY_TIER_CONFIG[track.tier] || FREQUENCY_TIER_CONFIG.surprise;
  const tierLabel = t(`tiers.${track.tier}`, track.tierLabel);
  const tierBadgeLabel =
    track.tier === "core"
      ? (locale === "en" ? "Core 100%" : `${tierLabel} 100%`)
      : `${tierLabel} ${track.percentage}%`;

  return (
    <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 ml-auto">
      <span
        className={`inline-flex items-center gap-1 sm:gap-1.5 rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-mono select-none ${track.badgeClass}`}
        title={t("tourExtra.attendanceRate", "此巡演共登場 {count} 場（全 {total} 場 · 登場率 {rate}%）", { count: track.count, total: track.totalShows, rate: track.percentage })}
      >
        <span className={tierConfig.markerClass} aria-hidden="true">
          {tierConfig.marker}
        </span>
        <span>{tierBadgeLabel}</span>
      </span>

      <span className="font-mono text-[10px] sm:text-[11px] text-muted tabular-nums whitespace-nowrap">
        {track.count} / {totalShows} {t("navigators.showsUnit", "場")}
      </span>
    </div>
  );
}

export function TourTrackItem({
  track,
  cue,
  totalShows,
  locale,
  t,
  onSelectSong,
}) {
  const isClickable = !!(onSelectSong && track.songId);

  return (
    <li
      className={`${SETLIST_ITEM} flex-wrap sm:flex-nowrap items-baseline sm:items-center justify-between gap-x-2 gap-y-1.5 py-2.5 px-1 sm:px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors`}
    >
      <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2.5 flex-1">
        <span className="min-w-[28px] sm:min-w-[36px] text-right font-mono text-[12px] font-semibold text-muted tabular-nums shrink-0">
          {cue}
        </span>
        <TrackTitleAndBadges
          track={track}
          isClickable={isClickable}
          locale={locale}
          t={t}
          onSelectSong={onSelectSong}
        />
      </div>
      <FrequencyPill
        track={track}
        totalShows={totalShows}
        locale={locale}
        t={t}
      />
    </li>
  );
}

export function TourSurpriseTrackItem({
  track,
  totalShows,
  locale,
  t,
  onSelectSong,
  onSelectShow,
  localizeVenue,
  formatShowBadgeLabel,
}) {
  const isClickable = !!(onSelectSong && track.songId);

  return (
    <li
      className={`${SETLIST_ITEM} flex-col gap-2 py-3 px-1 sm:px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors`}
    >
      <div className="flex flex-wrap sm:flex-nowrap items-baseline sm:items-center justify-between gap-x-2 gap-y-1.5 w-full">
        <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2.5 flex-1">
          <span className="min-w-[28px] sm:min-w-[36px] text-right font-mono text-[12px] font-bold text-muted tabular-nums select-none shrink-0">
            ◆
          </span>
          <TrackTitleAndBadges
            track={track}
            isClickable={isClickable}
            locale={locale}
            t={t}
            onSelectSong={onSelectSong}
          />
        </div>
        <FrequencyPill
          track={track}
          totalShows={totalShows}
          locale={locale}
          t={t}
        />
      </div>

      {track.shows && track.shows.length > 0 && (
        <div className="pl-1 sm:pl-2 flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-muted select-none">
            {t("slips.tour.showsLabel", "演出場次：")}
          </span>
          {track.shows.map((s) => (
            <a
              key={s.id}
              href={routeHash.show(s.id, locale)}
              onClick={(e) => {
                if (onSelectShow) {
                  e.preventDefault();
                  onSelectShow(s.id);
                }
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono border border-line-soft bg-paper hover:border-ink hover:text-ink text-muted transition-colors touch-stamp"
              title={`${s.date} ${localizeVenue(s.venue)}${s.city ? `（${t("cities." + s.city, s.city)}）` : ""}`}
            >
              <span>🎫</span>
              <span>{formatShowBadgeLabel(s, t)}</span>
              {s.cue && (
                <span className="font-bold text-ink ml-0.5">({s.cue})</span>
              )}
            </a>
          ))}
        </div>
      )}
    </li>
  );
}
