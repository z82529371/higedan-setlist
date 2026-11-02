import React from "react";
import { useI18n } from "../../lib/i18n.jsx";
import {
  formatReleaseTypeLabel,
  formatReleaseFormatLabel,
  formatCoverageLabel,
} from "../../lib/live-releases.js";
import { routeHash } from "../../lib/routes.js";

/**
 * LiveReleaseSection Component (ADR-0142)
 * Renders metallic ticket style release cards when a show is filmed or audio-recorded.
 * Returns null if no releases exist (Zero DOM Pollution).
 */
export function LiveReleaseSection({ releases = [], showId = null }) {
  const { t, locale } = useI18n();

  if (!releases || releases.length === 0) {
    return null;
  }

  return (
    <section id="show-releases" className="mt-5 border-t border-ink/10 pt-4" aria-label={t("live_releases_title", "官方映像化與發行載體")}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base select-none" aria-hidden="true">🎬</span>
        <h3 className="text-xs uppercase tracking-wider font-bold text-ink">
          {t("live_releases_title", "官方映像化與發行載體")}
        </h3>
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-[3px] bg-paper-light border border-ink/20 text-ink font-semibold">
          {releases.length}
        </span>
      </div>

      <div className="space-y-3">
        {releases.map((rel) => {
          const typeBadge = formatReleaseTypeLabel(rel.releaseType, locale);
          const matchedRec = rel.recordings?.find((r) => !showId || String(r.showId) === String(showId));
          const coverageBadge = matchedRec?.coverage ? formatCoverageLabel(matchedRec.coverage, locale) : null;
          return (
            <div
              key={rel.id}
              className="p-3 rounded-[3px] bg-paper-light border border-ink/15 shadow-xs dark:shadow-none text-left"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[3px] bg-ink/5 border border-ink/20 text-ink">
                    {typeBadge}
                  </span>
                  {coverageBadge && (
                    <span
                      data-testid="release-coverage-badge"
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border ${
                        matchedRec?.coverage === "full"
                          ? "bg-tape-tint text-ink border-tape-line"
                          : "bg-paper text-ink-muted border-ink/20"
                      }`}
                    >
                      {coverageBadge}
                    </span>
                  )}
                </div>
                {rel.releaseDate && (
                  <span className="text-[11px] font-mono text-ink-muted">
                    {rel.releaseDate}
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-ink mb-1 leading-snug">
                {rel.shortTitle || rel.title}
              </div>

              {rel.parentRelease && (
                <div className="text-xs text-ink-muted mb-2">
                  <span className="font-medium text-ink">{t("bonus_included_in", "收錄於")}：</span>
                  {rel.parentRelease.title}
                </div>
              )}

              {/* Formats and Catalog Numbers */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-ink/10">
                {rel.formats?.map((fmt) => (
                  <span
                    key={fmt}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] bg-paper border border-ink/20 text-ink"
                  >
                    {formatReleaseFormatLabel(fmt)}
                  </span>
                ))}
                {rel.catalogNumbers?.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] font-mono text-ink-muted ml-auto"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* External Spotify Album Link if available */}
              {rel.streaming?.spotifyAlbumId && (
                <div className="mt-2 text-right">
                  <a
                    href={`https://open.spotify.com/album/${rel.streaming.spotifyAlbumId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-ink hover:underline"
                  >
                    <span>Spotify Live ↗</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-right">
        <a
          href={routeHash.releases()}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-ink hover:underline"
        >
          <span>{t("view_all_releases", "瀏覽歷年現場影音發行")} →</span>
        </a>
      </div>
    </section>
  );
}
