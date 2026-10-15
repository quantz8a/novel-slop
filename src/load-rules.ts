import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RulePack } from "./types.js";

const HERE = dirname(fileURLToPath(import.meta.url));

export async function loadDefaultRulePack(): Promise<RulePack> {
  const candidates = [
    join(HERE, "../rules/zh-cn-webnovel.json"),
    join(process.cwd(), "rules/zh-cn-webnovel.json"),
  ];
  for (const path of candidates) {
    try {
      const raw = await readFile(path, "utf8");
      return JSON.parse(raw) as RulePack;
    } catch {
      // try next
    }
  }
  throw new Error("Cannot find rules/zh-cn-webnovel.json");
}

export async function loadRulePack(path: string): Promise<RulePack> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as RulePack;
}
