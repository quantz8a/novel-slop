import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { analyzeText } from "./analyze.js";
import type { RulePack } from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function pack(): Promise<RulePack> {
  return JSON.parse(await readFile(join(ROOT, "rules/zh-cn-webnovel.json"), "utf8")) as RulePack;
}

test("flags height dump and appearance checklist", async () => {
  const text = "一百八十三的个子把灯压矮。她是冷白皮，肩宽腰窄。";
  const result = analyzeText(text, await pack());
  const ids = new Set(result.findings.map((f) => f.ruleId));
  assert.ok(ids.has("height-dump"));
  assert.ok(ids.has("appearance-checklist"));
  assert.ok(result.summary.error >= 2);
});

test("clean immersive prose scores low", async () => {
  const text = await readFile(join(ROOT, "fixtures/human-like.md"), "utf8");
  const result = analyzeText(text, await pack(), { platform: "generic" });
  assert.equal(result.summary.error, 0);
  assert.ok(result.summary.score < 30);
});

test("ai-flavored fixture trips multiple rules", async () => {
  const text = await readFile(join(ROOT, "fixtures/ai-flavored.md"), "utf8");
  const result = analyzeText(text, await pack(), { platform: "fanqie" });
  assert.ok(result.summary.error >= 1);
  assert.ok(result.findings.some((f) => f.ruleId === "mechanical-cliffhanger"));
  assert.equal(result.platform, "fanqie");
});

test("prompt leak elevated on jjwxc", async () => {
  const text = "当然可以！以下是为你续写的章节。作为一个AI我必须说明。";
  const result = analyzeText(text, await pack(), { platform: "jjwxc" });
  assert.ok(result.findings.some((f) => f.category === "prompt-leak"));
  assert.ok(result.findings.some((f) => f.severity === "error"));
});

test("outline style detected for fanqie structure-fail", async () => {
  const text = ["本章要点：", "1. 男主觉醒", "2. 女主出场", "3. 反派埋伏"].join("\n");
  const result = analyzeText(text, await pack(), { platform: "fanqie" });
  assert.ok(result.findings.some((f) => f.ruleId === "outline-style"));
});

test("chinese aliases resolve to platform ids", async () => {
  const { resolvePlatform, listPlatforms } = await import("./platforms.js");
  assert.equal(resolvePlatform("起点"), "qidian");
  assert.equal(resolvePlatform("番茄"), "fanqie");
  assert.equal(resolvePlatform("晋江"), "jjwxc");
  assert.ok(listPlatforms().length >= 20);
});
