#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { analyzeText } from "./analyze.js";
import { loadDefaultRulePack, loadRulePack } from "./load-rules.js";
import { catalogMeta, listPlatforms, resolvePlatform } from "./platforms.js";
import { formatJsonReport, formatTextReport } from "./report.js";
import type { Severity } from "./types.js";

function printHelp(): void {
  const meta = catalogMeta();
  console.log(`novel-slop — 中文网文 AI 味 / 低质特征自查（多平台公开口径）

Usage:
  novel-slop <file> [--platform <id|别名>] [--json] [--rules <pack.json>]
  novel-slop --stdin [--platform <id>] [--json]
  novel-slop --list-platforms
  novel-slop --help

Platforms: ${meta.count} 个预设（rules/platforms.json，更新 ${meta.updated}）
  常用: qidian 起点 | fanqie 番茄 | jjwxc 晋江 | qimao 七猫 | industry 公约
  亦支持: yuewen 阅文 | zongheng 纵横 | shuqi 书旗 | lofter | feilu 飞卢 …
  完整列表: novel-slop --list-platforms

Exit: 0 无 error · 1 有 error · 2 用法/IO 错误

重要：启发式自查，非官方检测器；不能证明非 AI，不能规避平台禁令。
`);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--list-platforms")) {
    const json = args.includes("--json");
    const list = listPlatforms().map((p) => ({
      id: p.id,
      name: p.name,
      family: p.family,
      aliases: p.aliases ?? [],
      summary: p.summary,
      policy: p.policy,
    }));
    if (json) {
      console.log(JSON.stringify({ ...catalogMeta(), platforms: list }, null, 2));
    } else {
      console.log(`# novel-slop platforms (${catalogMeta().count})\n`);
      for (const p of list) {
        const alias = p.aliases.length ? `  aliases: ${p.aliases.join(", ")}` : "";
        console.log(`${p.id}\t${p.name}`);
        console.log(`  ${p.summary}`);
        if (alias) console.log(alias);
      }
    }
    process.exit(0);
  }
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    process.exit(args.length === 0 ? 2 : 0);
  }

  const json = args.includes("--json");
  const stdin = args.includes("--stdin");
  const rulesIdx = args.indexOf("--rules");
  const rulesPath = rulesIdx >= 0 ? args[rulesIdx + 1] : undefined;
  const platformIdx = args.indexOf("--platform");
  const platformArg = platformIdx >= 0 ? args[platformIdx + 1] : undefined;
  const platform = resolvePlatform(platformArg);
  const skip = new Set([rulesPath, platformArg].filter((x): x is string => Boolean(x)));
  const filePath = args.find((arg) => !arg.startsWith("--") && !skip.has(arg));

  const severities: Severity[] = ["error", "warn", "info"];
  const rulePack = rulesPath ? await loadRulePack(rulesPath) : await loadDefaultRulePack();

  let text: string;
  let label: string | undefined;
  if (stdin) {
    text = await readStdin();
    label = "stdin";
  } else if (filePath) {
    text = await readFile(filePath, "utf8");
    label = filePath;
  } else {
    printHelp();
    process.exit(2);
  }

  const result = analyzeText(text, rulePack, { platform, includeSeverities: severities });
  process.stdout.write(json ? formatJsonReport(result, label) : `${formatTextReport(result, label)}\n`);
  process.exit(result.summary.error > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
});
