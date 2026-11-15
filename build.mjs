// Pragmatic UI build script — no magic, just esbuild.
// Produces: dist/pui.css, dist/pui.min.css, dist/pui.min.js, dist/pui.iife.js
import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

await copyFile("src/pui.css", "dist/pui.css");

await Promise.all([
  // ESM, minified — for bundlers and <script type=module>
  build({
    entryPoints: ["src/pui.js"],
    minify: true,
    format: "esm",
    outfile: "dist/pui.min.js",
    logLevel: "info",
  }),
  // IIFE global — for <script src="pui.iife.js"></script> (window.pui)
  build({
    entryPoints: ["src/pui.js"],
    minify: true,
    format: "iife",
    globalName: "pui",
    footer: { js: "window.pui = pui.default ?? pui;" },
    outfile: "dist/pui.iife.js",
    logLevel: "info",
  }),
  // CSS, minified
  build({
    entryPoints: ["src/pui.css"],
    minify: true,
    outfile: "dist/pui.min.css",
    logLevel: "info",
  }),
]);
