import { getPlatform } from "./platforms.js";
import { STRUCTURAL_DETECTORS } from "./structural.js";
import type {
  AnalyzeOptions,
  AnalyzeResult,
  Finding,
  IssueCategory,
  PlatformId,
  RuleDefinition,
  RulePack,
  Severity,
} from "./types.js";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  error: 3,
  warn: 1.5,
  info: 0.5,
};

const SEVERITY_RANK: Record<Severity, number> = {
  error: 3,
  warn: 2,
  info: 1,
};

function lineColumnAt(text: string, index: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function excerptAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 16);
  const end = Math.min(text.length, index + length + 16);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function elevateSeverity(
  base: Severity,
  category: IssueCategory,
  elevate?: Partial<Record<IssueCategory, Severity>>,
): Severity {
  const target = elevate?.[category];
  if (!target) return base;
  return SEVERITY_RANK[target] > SEVERITY_RANK[base] ? target : base;
}

function ruleEnabled(rule: RuleDefinition, platform: PlatformId, focus?: readonly IssueCategory[]): boolean {
  if (rule.platforms && !rule.platforms.includes(platform) && !rule.platforms.includes("generic")) {
    return false;
  }
  if (focus && !focus.includes(rule.category)) return false;
  return true;
}

function runPatternRule(text: string, rule: RuleDefinition, severity: Severity): Finding[] {
  const findings: Finding[] = [];
  for (const pattern of rule.patterns ?? []) {
    const regex = new RegExp(pattern, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const value = match[0] ?? "";
      if (!value) {
        regex.lastIndex += 1;
        continue;
      }
      const { line, column } = lineColumnAt(text, match.index);
      findings.push({
        ruleId: rule.id,
        severity,
        title: rule.title,
        message: rule.message,
        category: rule.category,
        match: value,
        line,
        column,
        excerpt: excerptAround(text, match.index, value.length),
      });
      if (regex.lastIndex === match.index) regex.lastIndex += 1;
    }
  }
  return findings;
}

export function analyzeText(
  text: string,
  rulePack: RulePack,
  options: AnalyzeOptions = {},
): AnalyzeResult {
  const profile = getPlatform(options.platform);
  const platform = profile.id;
  const allow = new Set<Severity>(options.includeSeverities ?? ["error", "warn", "info"]);
  const findings: Finding[] = [];

  for (const rule of rulePack.rules) {
    if (!ruleEnabled(rule, platform, profile.focusCategories)) continue;
    const severity = elevateSeverity(rule.severity, rule.category, profile.elevateCategories);
    if (!allow.has(severity)) continue;

    if (rule.structural) {
      const detector = STRUCTURAL_DETECTORS[rule.structural];
      if (!detector) continue;
      for (const item of detector(text, rule)) {
        findings.push({ ...item, severity });
      }
      continue;
    }

    findings.push(...runPatternRule(text, rule, severity));
  }

  findings.sort((a, b) => a.line - b.line || a.column - b.column);

  const categoryCounts: Record<string, number> = {};
  for (const f of findings) {
    categoryCounts[f.category] = (categoryCounts[f.category] ?? 0) + 1;
  }

  const summary = {
    error: findings.filter((f) => f.severity === "error").length,
    warn: findings.filter((f) => f.severity === "warn").length,
    info: findings.filter((f) => f.severity === "info").length,
    score: 0,
  };

  const weighted = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  const perThousand = text.length > 0 ? (weighted / text.length) * 1000 : 0;
  summary.score = Math.min(
    100,
    Math.round(perThousand * 12 + summary.error * 4 + summary.warn * 2),
  );

  return {
    platform,
    platformName: profile.name,
    charCount: [...text].length,
    lineCount: text.length === 0 ? 0 : text.split(/\r?\n/).length,
    findings,
    categoryCounts,
    summary,
    disclaimer: profile.disclaimer,
  };
}
