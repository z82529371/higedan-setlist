/**
 * ArchivalIcons — Uniform monochrome ink-stroke SVG icon set.
 * Replaces OS emojis in UI chrome to maintain consistent physical print aesthetics
 * across all platforms (DESIGN.md: Domain Symbol vs. UI Chrome Rule).
 */

const ICON_PROPS = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

export function TicketIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 17 6.5v2a1.5 1.5 0 0 0 0 3v2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5v-2a1.5 1.5 0 0 0 0-3v-2Z" />
      <path d="M11.5 5v10" strokeDasharray="2 2" />
    </svg>
  );
}

export function MusicNoteIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M8 14.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
      <path d="M16 12.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
      <path d="M8 14.5V5.5l8-2v9" />
    </svg>
  );
}

export function VenuePinIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M10 17s5-4.4 5-8.5a5 5 0 1 0-10 0C5 12.6 10 17 10 17Z" />
      <circle cx="10" cy="8.5" r="1.8" />
    </svg>
  );
}

export function RouteIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="5" cy="14.5" r="2" />
      <circle cx="15" cy="5.5" r="2" />
      <path d="M7 14.5h3.5a2.5 2.5 0 0 0 0-5h-1a2.5 2.5 0 0 1 0-5H13" />
    </svg>
  );
}

export function ChartBarsIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3.5 16.5h13" />
      <rect x="4.5" y="10" width="3" height="6.5" />
      <rect x="8.5" y="5.5" width="3" height="11" />
      <rect x="12.5" y="8" width="3" height="8.5" />
    </svg>
  );
}

export function DiscIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="2.2" />
      <path d="M10 5.2a4.8 4.8 0 0 1 4.2 2.5" />
    </svg>
  );
}

export function SearchIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3.3 3.3" />
    </svg>
  );
}

export function HomeIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3.5 9.5 10 4l6.5 5.5" />
      <path d="M5.5 8.5V16h9V8.5" />
    </svg>
  );
}

export function ArchiveBoxIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3" y="4" width="14" height="3.5" rx="0.5" />
      <path d="M4.5 7.5v8.5h11V7.5" />
      <path d="M8.5 10.5h3" />
    </svg>
  );
}

export function FilterIcon({ className = "w-4 h-4" }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3.5 5.5h13M6 10h8M8.5 14.5h3" />
    </svg>
  );
}
