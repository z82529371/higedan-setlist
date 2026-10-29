import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

function pwaPrecachePlugin() {
  return {
    name: "pwa-precache",
    apply: "build",
    writeBundle(options, bundle) {
      const assetPaths = Object.keys(bundle)
        .filter(
          (file) =>
            file.startsWith("assets/") &&
            (file.endsWith(".js") || file.endsWith(".css"))
        )
        .map((file) => `/${file}`);

      // Extract entry chunk hash for dynamic cache versioning (ADR-0134)
      const mainJsChunk = Object.keys(bundle).find(
        (file) => file.startsWith("assets/index-") && file.endsWith(".js")
      );
      const hashMatch = mainJsChunk ? mainJsChunk.match(/assets\/index-([a-zA-Z0-9_-]+)\.js/) : null;
      const buildHash = hashMatch ? hashMatch[1] : Date.now().toString(36);

      const swDistPath = path.resolve(options.dir || "dist", "sw.js");
      if (fs.existsSync(swDistPath)) {
        let swContent = fs.readFileSync(swDistPath, "utf-8");
        swContent = swContent.replace(
          "/* __VITE_ASSETS_INJECTION__ */",
          assetPaths.map((p) => `  ${JSON.stringify(p)},`).join("\n")
        );
        swContent = swContent.replace(
          /const CACHE_NAME = ["'][^"']+["'];\s*\/\* __CACHE_NAME_INJECTION__ \*\//,
          `const CACHE_NAME = "higedan-setlist-${buildHash}";`
        );
        fs.writeFileSync(swDistPath, swContent, "utf-8");
      }
    },
  };
}

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [react(), tailwindcss(), pwaPrecachePlugin()],
  esbuild: {
    jsx: "automatic",
  },
});
