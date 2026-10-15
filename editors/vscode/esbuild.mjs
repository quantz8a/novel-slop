import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

mkdirSync(join(here, "out"), { recursive: true });
mkdirSync(join(here, "rules"), { recursive: true });
cpSync(
  join(here, "../../rules/zh-cn-webnovel.json"),
  join(here, "rules/zh-cn-webnovel.json"),
);
cpSync(
  join(here, "../../rules/platforms.json"),
  join(here, "rules/platforms.json"),
);

const ctx = await esbuild.context({
  entryPoints: [join(here, "src/extension.ts")],
  bundle: true,
  outfile: join(here, "out/extension.js"),
  platform: "node",
  format: "cjs",
  target: "node20",
  external: ["vscode"],
  sourcemap: true,
  logLevel: "info",
});

if (watch) {
  await ctx.watch();
  console.log("watching extension…");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("extension built → editors/vscode/out/extension.js");
}
