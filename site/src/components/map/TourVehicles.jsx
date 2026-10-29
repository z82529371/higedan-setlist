import React from "react";
import {
  TourVanEmojiRiders,
  TourAirplaneEmojiRiders,
  PersonalFanRider,
  PersonalAirplaneFanRider,
} from "./BandAnimalAvatars.jsx";

/**
 * Handcrafted 3D Isometric Touring Spacious Red Tour Van (pure SVG vectors).
 * Pure crimson red paint finish without black borders ("旁邊不用黑邊框 保持全紅").
 * Features spacious open-top observation cabin deck where the 4 band members sit comfortably without crowding.
 * When isPersonal is true (fan's concert footprint map), seats the solo fan wearing sunglasses (😎).
 */
export function TourVan3D({ angle = 0, scale = 0.7, isPersonal = false }) {
  return (
    <g transform={`rotate(${angle}) scale(${scale})`}>
      {/* 1. Soft Ground Contact Shadow */}
      <ellipse cx="0" cy="3.5" rx="22" ry="12" fill="var(--color-ink)" opacity="0.25" />

      {/* 2. Front Headlight Beams illuminating the road forward */}
      <polygon points="18,-7.5 40,-15 40,-2 18,-4.5" fill="var(--color-band)" opacity="0.35" />
      <polygon points="18,4.5 40,2 40,15 18,7.5" fill="var(--color-band)" opacity="0.35" />
      <circle cx="18" cy="-6" r="1.6" fill="#fff" opacity="0.95" />
      <circle cx="18" cy="6" r="1.6" fill="#fff" opacity="0.95" />

      {/* 3. Four Rubber Tires with Silver Alloy Rims */}
      <rect x="8" y="-12.5" width="7" height="3" rx="1.5" fill="#18181b" />
      <circle cx="11.5" cy="-11" r="1.1" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
      <rect x="8" y="9.5" width="7" height="3" rx="1.5" fill="#18181b" />
      <circle cx="11.5" cy="11" r="1.1" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
      <rect x="-15" y="-12.5" width="7" height="3" rx="1.5" fill="#18181b" />
      <circle cx="-11.5" cy="-11" r="1.1" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
      <rect x="-15" y="9.5" width="7" height="3" rx="1.5" fill="#18181b" />
      <circle cx="-11.5" cy="11" r="1.1" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />

      {/* 4. Pure Crimson Red Spacious Tour Van Body (純粹熱血全紅烤漆，無黑邊框) */}
      <rect x="-18" y="-10" width="36" height="20" rx="4.5" fill="#dc2626" />
      {/* Sleek roof ridge highlight in vibrant scarlet */}
      <path d="M-17,-9 L17,-9 L17,-5.5 L-17,-5.5 Z" fill="#ef4444" opacity="0.85" />
      <path d="M-17,5.5 L17,5.5 L17,9 L-17,9 Z" fill="#b91c1c" opacity="0.4" />

      {/* 5. Silver Side Mirrors (純銀色後視鏡，無黑外框) */}
      <rect x="8" y="-12" width="2.8" height="2" rx="0.8" fill="#e2e8f0" />
      <rect x="8" y="10" width="2.8" height="2" rx="0.8" fill="#e2e8f0" />

      {/* 6. Tinted Front Windshield & Windows */}
      <path d="M7,-7.5 L14,-6 L14,6 L7,7.5 Z" fill="#0f172a" />
      <line x1="8.5" y1="-5" x2="12.5" y2="2" stroke="#94a3b8" strokeWidth="0.8" opacity="0.7" />

      {/* 7. Silver Metallic Open-Top Cabin Deck & Safety Rail (銀色金屬露天座艙護欄) */}
      <rect x="-15.5" y="-8.5" width="22" height="17" rx="3.5" fill="#0f172a" opacity="0.6" />
      <rect x="-16" y="-9" width="23" height="18" rx="4" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="-15" y1="0" x2="6" y2="0" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />

      {/* 7b. Upper Deck Riders: Solo Sunglasses Fan (😎) for personal footprints, or 4 Band Emojis */}
      {isPersonal ? <PersonalFanRider /> : <TourVanEmojiRiders />}

      {/* 8. Rear Tail Lights (紅寶石尾燈) */}
      <rect x="-18" y="-8" width="1.4" height="2.8" rx="0.6" fill="#ef4444" />
      <rect x="-18" y="5.2" width="1.4" height="2.8" rx="0.6" fill="#ef4444" />
    </g>
  );
}

/**
 * Handcrafted 3D Aerodynamic Touring Jet in Platinum Silver Metallic (pure SVG vectors).
 * Styled in pure paint finish matching the touring van (zero black border, deep tinted windows, forward headlights).
 * Features elongated fuselage accommodating the band emojis or solo fan emoji (😎).
 */
export function TourAirplane3D({ angle = 0, scale = 0.72, isPersonal = false }) {
  return (
    <g transform={`rotate(${angle}) scale(${scale})`}>
      {/* 1. Ground Shadow (gliding across islands and ocean below) */}
      <g transform="translate(-1, 12) scale(0.9)" opacity="0.22" fill="var(--color-ink)">
        <path d="M-20,0 L-6,-20 L4,-20 L0,-1.5 16,-1.5 22,0 L16,1.5 L0,1.5 L4,20 L-6,20 L-20,0 Z" />
      </g>

      {/* 2. Elevated Aircraft Body */}
      <g transform="translate(0, -5)">
        {/* Forward Headlight Beams illuminating the flight path */}
        <polygon points="18,-4 42,-12 42,-1 18,-2" fill="var(--color-band)" opacity="0.35" />
        <polygon points="18,2 42,1 42,12 18,4" fill="var(--color-band)" opacity="0.35" />
        <circle cx="18" cy="-2.5" r="1.3" fill="#fff" opacity="0.95" />
        <circle cx="18" cy="2.5" r="1.3" fill="#fff" opacity="0.95" />

        {/* Jet Exhaust Heat Contrails behind turbofans */}
        <polygon points="-6,-10 -24,-13 -24,-7 -6,-10" fill="var(--color-band)" opacity="0.25" />
        <polygon points="-6,10 -24,7 -24,13 -6,10" fill="var(--color-band)" opacity="0.25" />

        {/* Swept Main Wings in Platinum Silver Metallic (no black outline) */}
        <polygon points="-6,-22 4,-22 4,-3 0,-1.5 0,1.5 4,3 4,22 -6,22 -3,3 -3,-3" fill="#e2e8f0" />
        <polygon points="-2,-21 3.5,-21 3.5,-3 -2,-3" fill="#f8fafc" opacity="0.85" />
        <polygon points="-2,3 3.5,3 3.5,21 -2,21" fill="#f8fafc" opacity="0.85" />

        {/* Wingtip Navigation Lights (Port Red / Starboard Green) */}
        <circle cx="3" cy="-22" r="1.3" fill="var(--color-request)" />
        <circle cx="3" cy="22" r="1.3" fill="#22c55e" />

        {/* Twin Turbofan Jet Engines */}
        <rect x="-6" y="-11.2" width="9" height="3" rx="1.5" fill="#64748b" />
        <rect x="-6" y="8.2" width="9" height="3" rx="1.5" fill="#64748b" />
        <rect x="-5.5" y="-10.8" width="7" height="2.2" rx="1.1" fill="#cbd5e1" />
        <rect x="-5.5" y="8.6" width="7" height="2.2" rx="1.1" fill="#cbd5e1" />
        <ellipse cx="2.6" cy="-9.7" rx="0.6" ry="1.1" fill="#0f172a" />
        <ellipse cx="2.6" cy="9.7" rx="0.6" ry="1.1" fill="#0f172a" />

        {/* Aerodynamic Elongated Fuselage (Platinum Pearl White / Silver, no black border) */}
        <path d="M-22,0 C-22,-4.2 -6,-4.8 18,-2.6 C23,-1.2 26,0 26,0 C26,0 23,1.2 18,2.6 C-6,4.8 -22,4.2 -22,0 Z" fill="#f8fafc" />
        <path d="M-21,-0.6 C-21,-3.2 -5,-3.8 17,-1.8 C21,-0.8 24,0 24,0 C21,0.5 17,0.8 -21,-0.6 Z" fill="#ffffff" opacity="0.9" />
        <path d="M-21,0.6 C-5,3.8 17,1.8 24,0 C23,1 18,2.2 -5,3.8 Z" fill="#cbd5e1" opacity="0.5" />

        {/* Cockpit Canopy (Deep Tinted Window with Silver Glare Line) */}
        <path d="M17,-1.5 L23,-0.9 L23,0.9 L17,1.5 Z" fill="#0f172a" />
        <line x1="18" y1="-0.9" x2="22" y2="0.4" stroke="#94a3b8" strokeWidth="0.7" opacity="0.8" />

        {/* Passenger Cabin Privacy Windows */}
        <circle cx="16" cy="-2.5" r="0.5" fill="#0f172a" />
        <circle cx="16" cy="2.5" r="0.5" fill="#0f172a" />
        <circle cx="-16" cy="-2.5" r="0.5" fill="#0f172a" />
        <circle cx="-16" cy="2.5" r="0.5" fill="#0f172a" />

        {/* Upper Deck Riders: Solo Sunglasses Fan (😎) for personal footprints, or 4 Band Emojis */}
        {isPersonal ? <PersonalAirplaneFanRider /> : <TourAirplaneEmojiRiders />}

        {/* Horizontal Stabilizers & Tail Fin */}
        <polygon points="-24,-9 -18,-9 -15,0 -18,9 -24,9 -20,0" fill="#e2e8f0" />
        <polygon points="-22,0 -16,-0.7 -14,0 -16,0.7" fill="#cbd5e1" />
        {/* Official Band Gold Tail Fin Accent */}
        <rect x="-21" y="-0.5" width="4.5" height="1" fill="var(--color-band)" />
      </g>
    </g>
  );
}
