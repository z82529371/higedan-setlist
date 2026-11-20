/**
 * Shared editorial page header matching LandingHero's two-line typographic hierarchy:
 * Line 1: `Official髭男dism` in display weight
 * Line 2: Era-accent bar + wide-tracked uppercase monospace sub-brand identifier
 */
export function BrandPageHeader({
  subBrand,
  sectionLabel = "",
  subtitle = "",
  align = "center",
}) {
  const isCentered = align === "center";

  return (
    <div className={isCentered ? "flex flex-col items-center text-center" : "text-left"}>
      <h1 className="m-0 max-w-full font-display text-ink text-balance">
        <span className="block text-[clamp(24px,4.5vw,38px)] font-black leading-[1.08] tracking-[0.04em]">
          Official髭男dism
        </span>
        <span
          className={`mt-2 sm:mt-2.5 inline-flex items-center gap-2.5 sm:gap-3 font-mono text-[clamp(13px,2vw,17px)] font-bold leading-none tracking-[0.26em] uppercase text-ink/85 ${
            isCentered ? "justify-center" : ""
          }`}
        >
          <span
            aria-hidden="true"
            className="inline-block w-6 sm:w-8 h-[3px] rounded-full transition-colors duration-300 shrink-0"
            style={{ backgroundColor: "var(--era-accent, var(--color-band))" }}
          />
          <span>{subBrand}</span>
        </span>
      </h1>

      {(sectionLabel || subtitle) && (
        <p
          className={`mt-2.5 mb-0 text-[12px] sm:text-[14px] text-muted leading-relaxed ${
            isCentered ? "max-w-[560px]" : ""
          }`}
        >
          {sectionLabel && <strong className="font-bold text-ink">{sectionLabel}</strong>}
          {sectionLabel && subtitle && <span className="hidden sm:inline"> — </span>}
          {subtitle && (
            <span className={sectionLabel ? "hidden sm:inline" : ""}>{subtitle}</span>
          )}
        </p>
      )}
    </div>
  );
}
