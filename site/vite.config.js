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

      const swDistPath = path.resolve(options.dir || "dist", "sw.js");
      if (fs.existsSync(swDistPath)) {
        let swContent = fs.readFileSync(swDistPath, "utf-8");
        swContent = swContent.replace(
          "/* __VITE_ASSETS_INJECTION__ */",
          assetPaths.map((p) => `  ${JSON.stringify(p)},`).join("\n")
        );
        fs.writeFileSync(swDistPath, swContent, "utf-8");
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pwaPrecachePlugin()],
  esbuild: {
    jsx: "automatic",
  },
});
