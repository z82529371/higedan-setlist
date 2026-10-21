#!/usr/bin/env node
/**
 * generate-icons.mjs — Deterministic PWA & Web App Icon Generator.
 *
 * Generates standard and maskable PNG icons across required resolutions
 * (192x192, 512x512) directly from canonical site/public/favicon.svg.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "..");
const publicDir = path.resolve(siteRoot, "public");
const svgPath = path.resolve(publicDir, "favicon.svg");

if (!fs.existsSync(svgPath)) {
  console.error("❌ favicon.svg not found at:", svgPath);
  process.exit(1);
}

const svgRaw = fs.readFileSync(svgPath, "utf8");
const pathMatch = svgRaw.match(/<path\s+d="([^"]+)"\s+fill="([^"]+)"/);
if (!pathMatch) {
  console.error("❌ Could not extract path from favicon.svg");
  process.exit(1);
}

const pathD = pathMatch[1];
const pathFill = pathMatch[2] || "#141414";

// Locate browser binary (Edge or Chrome)
function findBrowser() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const browserPath = findBrowser();
if (!browserPath) {
  console.error("❌ No supported headless browser (Edge/Chrome) found to rasterize icons.");
  process.exit(1);
}

// 1. Standard SVG (rounded rect rx="28")
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <rect width="128" height="128" rx="28" fill="#d19f00" />
  <path d="${pathD}" fill="${pathFill}" />
</svg>`;

// 2. Maskable SVG (full-bleed rect no rx, mustache logo scaled 0.8 within safe zone)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <rect width="128" height="128" fill="#d19f00" />
  <g transform="translate(64, 64) scale(0.8) translate(-64, -64)">
    <path d="${pathD}" fill="${pathFill}" />
  </g>
</svg>`;

function renderIcon(svgMarkup, size, filename) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
  svg { width: ${size}px; height: ${size}px; display: block; }
</style>
</head>
<body>
${svgMarkup}
</body>
</html>`;

  const tmpHtml = path.resolve(os.tmpdir(), `higedan-icon-${size}-${Date.now()}.html`);
  const outPath = path.resolve(publicDir, filename);

  try {
    fs.writeFileSync(tmpHtml, html, "utf8");
    execSync(
      `"${browserPath}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=${size},${size} --default-background-color=00000000 --screenshot="${outPath}" "file:///${tmpHtml.replace(/\\/g, "/")}"`
    );
    const stat = fs.statSync(outPath);
    console.log(`✓ Generated ${filename} (${size}x${size}, ${stat.size} bytes)`);
  } finally {
    if (fs.existsSync(tmpHtml)) {
      fs.unlinkSync(tmpHtml);
    }
  }
}

console.log("Generating PWA icons from favicon.svg...");
renderIcon(standardSvg, 192, "icon-192.png");
renderIcon(standardSvg, 512, "icon-512.png");
renderIcon(maskableSvg, 192, "icon-maskable-192.png");
renderIcon(maskableSvg, 512, "icon-maskable-512.png");
console.log("All PWA icons generated successfully.");
