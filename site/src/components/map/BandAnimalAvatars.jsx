import React from "react";
import { useI18n } from "../../lib/i18n.jsx";

/**
 * Pure Emoji Band Animal Avatars for Official HIGE DANdism (ADR-0129, Issue #55).
 * Four band members' cultural animal emojis riding together:
 * - 🦍 楢﨑誠 (Makoto Narazaki - Ba/Sax): Gorilla / Driver (日本右駕司機)
 * - 🐨 藤原聡 (Satoshi Fujihara - Vo/Pf): Koala / Front Passenger (前座副駕)
 * - 🐱 小笹大輔 (Daisuke Ozasa - Gt): Cat / Rear Row (後座)
 * - 🐻 松浦匡希 (Masaki Matsuura / ちゃんまつ - Drs): Bear / Rear Row (後座)
 *
 * Clean, lightweight, zero complex instrument artwork, 100% PWA offline compatible.
 */

export const BAND_MEMBERS = [
  { id: "narazaki", role: "driver", animal: "gorilla", emoji: "🦍" },
  { id: "fujihara", role: "copilot", animal: "koala", emoji: "🐨" },
  { id: "ozasa", role: "rear", animal: "cat", emoji: "🐱" },
  { id: "matsuura", role: "rear", animal: "bear", emoji: "🐻" },
];

export function KoalaAvatar({ size = 26, className = "", ...props }) {
  const { t } = useI18n();
  return (
    <span
      role="img"
      aria-label={t("venueMap.bandMemberFujihara", "🐨 藤原聡 (Vo/Pf)")}
      data-member="koala"
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
      {...props}
    >
      🐨
    </span>
  );
}

export function CatAvatar({ size = 26, className = "", ...props }) {
  const { t } = useI18n();
  return (
    <span
      role="img"
      aria-label={t("venueMap.bandMemberOzasa", "🐱 小笹大輔 (Gt)")}
      data-member="cat"
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
      {...props}
    >
      🐱
    </span>
  );
}

export function GorillaAvatar({ size = 26, className = "", ...props }) {
  const { t } = useI18n();
  return (
    <span
      role="img"
      aria-label={t("venueMap.bandMemberNarazaki", "🦍 楢﨑誠 (Ba/Sax)")}
      data-member="gorilla"
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
      {...props}
    >
      🦍
    </span>
  );
}

export function BearAvatar({ size = 26, className = "", ...props }) {
  const { t } = useI18n();
  return (
    <span
      role="img"
      aria-label={t("venueMap.bandMemberMatsuura", "🐻 松浦匡希 (Drs)")}
      data-member="bear"
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
      {...props}
    >
      🐻
    </span>
  );
}

export function BandMemberAvatar({ member, size = 26, className = "", ...props }) {
  const norm = String(member || "").toLowerCase();
  if (norm === "koala" || norm === "fujihara") return <KoalaAvatar size={size} className={className} {...props} />;
  if (norm === "cat" || norm === "ozasa") return <CatAvatar size={size} className={className} {...props} />;
  if (norm === "gorilla" || norm === "narazaki") return <GorillaAvatar size={size} className={className} {...props} />;
  if (norm === "bear" || norm === "matsuura") return <BearAvatar size={size} className={className} {...props} />;
  return <GorillaAvatar size={size} className={className} {...props} />;
}

/**
 * 4 Emoji Riders atop the Spacious Touring Van (TourVan3D open-top cabin deck).
 * Facing forward towards the vehicle's heading (+x):
 * - Driver (Japanese Right-Hand Drive, +y): 🦍 楢﨑誠
 * - Front Passenger (-y): 🐨 藤原聡
 * - Rear Left (-y): 🐱 小笹大輔
 * - Rear Right (+y): 🐻 松浦匡希
 *
 * Each emoji is rotated 90° so its head and line of sight face forward toward the road ahead.
 */
export function TourVanEmojiRiders() {
  return (
    <g data-testid="van-band-emoji-riders" style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))" }}>
      {/* Front Row (Driver: 🦍 Right-Hand Drive at y=+6.2; Copilot: 🐨 at y=-6.2) */}
      <g transform="translate(4, 6.2) rotate(-90)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          data-member="gorilla"
          style={{ userSelect: "none" }}
        >
          🦍
        </text>
      </g>
      <g transform="translate(4, -6.2) rotate(-90)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          data-member="koala"
          style={{ userSelect: "none" }}
        >
          🐨
        </text>
      </g>

      {/* Rear Row (🐱 Left at y=-6.2; 🐻 Right at y=+6.2) */}
      <g transform="translate(-9, -6.2) rotate(-90)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          data-member="cat"
          style={{ userSelect: "none" }}
        >
          🐱
        </text>
      </g>
      <g transform="translate(-9, 6.2) rotate(-90)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          data-member="bear"
          style={{ userSelect: "none" }}
        >
          🐻
        </text>
      </g>
    </g>
  );
}

/**
 * 4 Emoji Riders atop the Touring Airplane (TourAirplane3D upper deck).
 * Streamlined 1×4 longitudinal layout, rotated -90° to face the flight heading (+x).
 */
export function TourAirplaneEmojiRiders() {
  return (
    <g data-testid="airplane-cabin-windows" style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))" }}>
      <g data-member-silhouette="true">
        <g transform="translate(13.5, 0) rotate(-90)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            data-member="gorilla"
            style={{ userSelect: "none" }}
          >
            🦍
          </text>
        </g>
        <g transform="translate(4.5, 0) rotate(-90)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            data-member="koala"
            style={{ userSelect: "none" }}
          >
            🐨
          </text>
        </g>
        <g transform="translate(-4.5, 0) rotate(-90)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            data-member="cat"
            style={{ userSelect: "none" }}
          >
            🐱
          </text>
        </g>
        <g transform="translate(-13.5, 0) rotate(-90)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            data-member="bear"
            style={{ userSelect: "none" }}
          >
            🐻
          </text>
        </g>
      </g>
    </g>
  );
}

/**
 * Solo Fan Rider wearing cool sunglasses (😎) for Personal Concert Footprint Map (TicketBookFootprintMap).
 * Sitting in the Japanese Right-Hand Drive driver's seat (x: 4, y: 6.2), rotated -90° to face forward towards the road.
 */
export function PersonalFanRider() {
  return (
    <g data-testid="van-personal-fan-rider" style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))" }}>
      <g transform="translate(4, 6.2) rotate(-90)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11.5"
          data-rider="fan-sunglasses"
          style={{ userSelect: "none" }}
        >
          😎
        </text>
      </g>
    </g>
  );
}

/**
 * Solo Fan Rider wearing cool sunglasses (😎) for Personal Concert Flight.
 * Sitting in the front captain / pilot cockpit seat (x: 13.5, y: 0), rotated -90° to face forward along the flight path.
 */
export function PersonalAirplaneFanRider() {
  return (
    <g data-testid="airplane-personal-fan-rider" style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))" }}>
      <g transform="translate(13.5, 0) rotate(-90)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          data-rider="fan-sunglasses"
          style={{ userSelect: "none" }}
        >
          😎
        </text>
      </g>
    </g>
  );
}

/**
 * Touring State Machine Ensemble HUD Badge (ADR-0129, pure Emoji).
 * Pure 🦍 🐨 🐱 🐻 lineup for band tours, or solo 😎 for personal concert footprints.
 * - moving: On tour / expedition status.
 * - stay: Multi-day residency relaxation mode with ☕.
 * - arrived: Gathered; if isFinal, golden ribbons & thank you banner!
 */
export function BandEnsembleHUD({ state = "arrived", isFinal = false, isPersonal = false, className = "" }) {
  const { t } = useI18n();

  return (
    <div
      data-testid="journey-band-ensemble"
      data-state={state}
      data-is-final={String(isFinal)}
      data-is-personal={String(isPersonal)}
      className={`rounded-[3px] border-[1.5px] border-ink bg-card p-2 sm:p-2.5 shadow-sm select-none transition-all ${className}`}
    >
      {/* 1. Final Show Tour Finale Streamers */}
      {isFinal && state === "arrived" && (
        <div
          data-testid="journey-finale-streamers"
          className="mb-1.5 flex items-center justify-between gap-1.5 rounded-[2px] bg-band px-2 py-1 font-mono text-[10px] sm:text-[11px] font-extrabold text-band-ink shadow-2xs"
        >
          <span className="flex items-center gap-1">
            <span aria-hidden="true">🎉</span>
            <span>{t("venueMap.hudFinaleThanks", "巡演千秋樂 · 感謝有你！")}</span>
          </span>
          <span className="shrink-0 tracking-wider font-mono text-[9px] uppercase opacity-85">
            FINAL
          </span>
        </div>
      )}

      {/* 2. Multi-Day Residency Stay Recharge */}
      {state === "stay" && (
        <div
          data-testid="journey-stay-recharge"
          className="mb-1.5 flex items-center gap-1.5 rounded-[2px] bg-tape-tint px-2 py-1 font-mono text-[10px] sm:text-[11px] font-bold text-ink"
        >
          <span className="text-base" aria-hidden="true">☕</span>
          <span>{t("venueMap.hudStayRelax", "同館休整充電中 ☕")}</span>
        </div>
      )}

      {/* 3. Lineup: Solo Sunglasses Fan (😎) if personal career, else 4 Band Emojis (🦍 🐨 🐱 🐻) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-lg sm:text-xl">
          {isPersonal ? (
            <span
              role="img"
              aria-label={t("ticketBook.fanRiderLabel", "😎 參戰歌迷")}
              data-rider="fan-sunglasses"
              className="text-2xl select-none inline-flex items-center"
            >
              😎
            </span>
          ) : (
            <>
              <GorillaAvatar size={24} />
              <KoalaAvatar size={24} />
              <CatAvatar size={24} />
              <BearAvatar size={24} />
            </>
          )}
        </div>

        {/* State Badge */}
        <div className="shrink-0 text-right">
          {isPersonal ? (
            state === "arrived" ? (
              <span className="inline-flex items-center gap-1 rounded-[2px] bg-band px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-extrabold text-band-ink">
                <span aria-hidden="true">🎫</span>
                <span>ATTENDED</span>
              </span>
            ) : state === "stay" ? (
              <span className="inline-flex items-center gap-1 rounded-[2px] bg-muted/20 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-muted">
                <span>STAY</span>
              </span>
            ) : (
              <span
                data-testid="journey-moving-indicator"
                className="inline-flex items-center gap-1 rounded-[2px] bg-solo px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-solo-ink"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                <span>EXPEDITION</span>
              </span>
            )
          ) : state === "arrived" ? (
            <span className="inline-flex items-center gap-1 rounded-[2px] bg-band px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-extrabold text-band-ink">
              <span aria-hidden="true">🎸</span>
              <span>LIVE</span>
            </span>
          ) : state === "stay" ? (
            <span className="inline-flex items-center gap-1 rounded-[2px] bg-muted/20 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-muted">
              <span>STAY</span>
            </span>
          ) : (
            <span
              data-testid="journey-moving-indicator"
              className="inline-flex items-center gap-1 rounded-[2px] bg-solo px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-solo-ink"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
              <span>ON TOUR</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
