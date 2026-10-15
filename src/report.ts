import type { AnalyzeResult } from "./types.js";

export function formatTextReport(result: AnalyzeResult, filePath?: string): string {
  const header = filePath ? `file: ${filePath}` : "stdin";
  const cats = Object.entries(result.categoryCounts)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  const lines = [
    `novel-slop · ${header}`,
    `platform: ${result.platform} (${result.platformName})`,
    `chars: ${result.charCount}  lines: ${result.lineCount}  score: ${result.summary.score}/100`,
    `findings: error=${result.summary.error} warn=${result.summary.warn} info=${result.summary.info}`,
    cats ? `categories: ${cats}` : "categories: (none)",
    "",
  ];

  if (result.findings.length === 0) {
    lines.push("✓ 当前规则包未命中可疑模式。");
    lines.push("");
    lines.push(`说明：${result.disclaimer}`);
    return lines.join("\n");
  }

  for (const finding of result.findings) {
    lines.push(
      `[${finding.severity}] ${finding.category}/${finding.ruleId} @ ${finding.line}:${finding.column}`,
    );
    lines.push(`  ${finding.title}: ${finding.message}`);
    lines.push(`  match: 「${finding.match}」`);
    lines.push(`  … ${finding.excerpt}`);
    lines.push("");
  }

  lines.push(`说明：${result.disclaimer}`);
  return lines.join("\n");
}

export function formatJsonReport(result: AnalyzeResult, filePath?: string): string {
  return `${JSON.stringify({ filePath, ...result }, null, 2)}\n`;
}
