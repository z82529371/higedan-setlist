import { useEffect } from "react";
import { ERA_THEME_CSS_PROPS, buildThemeCssVars } from "../lib/tour-theme.js";

/**
 * Dynamically applies Tour Era Accent CSS custom properties onto <html>
 * and stays in sync with Light/Dark mode toggles (ADR-0149).
 */
export function useEraTheme(eraTheme) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!root) return;

    const applyVars = () => {
      const isDark = root.getAttribute("data-theme") === "dark";
      const vars = buildThemeCssVars(eraTheme, isDark);
      const keys = Object.keys(vars);

      if (keys.length === 0) {
        for (const prop of ERA_THEME_CSS_PROPS) {
          root.style.removeProperty(prop);
        }
        root.removeAttribute("data-era-theme");
        root.removeAttribute("data-era-gradient");
        return;
      }

      for (const prop of ERA_THEME_CSS_PROPS) {
        if (vars[prop]) {
          root.style.setProperty(prop, vars[prop]);
        } else {
          root.style.removeProperty(prop);
        }
      }
      root.setAttribute("data-era-theme", "active");
      if (vars["--color-tape-gradient"]) {
        root.setAttribute("data-era-gradient", "active");
      } else {
        root.removeAttribute("data-era-gradient");
      }
    };

    applyVars();

    if (typeof MutationObserver === "undefined") {
      return () => {
        for (const prop of ERA_THEME_CSS_PROPS) {
          root.style.removeProperty(prop);
        }
        root.removeAttribute("data-era-theme");
        root.removeAttribute("data-era-gradient");
      };
    }

    const observer = new MutationObserver(() => {
      applyVars();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
      for (const prop of ERA_THEME_CSS_PROPS) {
        root.style.removeProperty(prop);
      }
      root.removeAttribute("data-era-theme");
      root.removeAttribute("data-era-gradient");
    };
  }, [eraTheme]);
}
