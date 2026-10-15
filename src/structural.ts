import type { Finding, RuleDefinition } from "./types.js";

function excerpt(line: string): string {
  return line.replace(/\s+/g, " ").trim().slice(0, 80);
}

function finding(
  rule: RuleDefinition,
  lineNo: number,
  match: string,
  lineText: string,
): Finding {
  return {
    ruleId: rule.id,
    severity: rule.severity,
    title: rule.title,
    message: rule.message,
    category: rule.category,
    match,
    line: lineNo,
    column: 1,
    excerpt: excerpt(lineText),
  };
}

/** 提纲体 / 编号大纲句 */
export function detectOutlineStyle(text: string, rule: RuleDefinition): Finding[] {
  const out: Finding[] = [];
  const lines = text.split(/\r?\n/);
  const re =
    /^(?:#{1,6}\s*)?(?:第[一二三四五六七八九十百千\d]+[章节回]\s*[:：]|[（(]?[0-9１２３４５６７８９０]{1,2}[）).、．]|[一二三四五六七八九十]+[、.．]|大纲[:：]|剧情线[:：]|本章要点)/;
  let hits = 0;
  lines.forEach((line, idx) => {
    const t = line.trim();
    if (!t || t.length > 80) return;
    if (re.test(t)) {
      hits += 1;
      if (hits <= 8) out.push(finding(rule, idx + 1, t.slice(0, 40), t));
    }
  });
  return out;
}

/** 连续多句相同开头（模板堆砌） */
export function detectRepeatedOpeners(text: string, rule: RuleDefinition): Finding[] {
  const out: Finding[] = [];
  const paras = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 8);
  const window = 12;
  for (let i = 0; i < paras.length; i += 1) {
    const opener = paras[i]!.slice(0, 4);
    if (/^[「“【]/.test(opener)) continue;
    let streak = 1;
    for (let j = i + 1; j < Math.min(paras.length, i + window); j += 1) {
      if (paras[j]!.startsWith(opener)) streak += 1;
      else break;
    }
    if (streak >= 3) {
      out.push(
        finding(
          rule,
          i + 1,
          `开头「${opener}」连续×${streak}`,
          paras[i]!,
        ),
      );
      i += streak - 1;
    }
  }
  return out;
}

/** 流水账连接词密度 */
export function detectWaterConnectors(text: string, rule: RuleDefinition): Finding[] {
  const markers = [
    "就这样",
    "与此同时",
    "在这之后",
    "接下来",
    "然后他",
    "然后她",
    "顿时",
    "猛然发现",
  ];
  const out: Finding[] = [];
  const lines = text.split(/\r?\n/);
  let total = 0;
  lines.forEach((line, idx) => {
    for (const m of markers) {
      if (line.includes(m)) {
        total += 1;
        if (out.length < 10) out.push(finding(rule, idx + 1, m, line));
      }
    }
  });
  const perK = text.length > 0 ? (total / text.length) * 1000 : 0;
  if (perK < 1.2) {
    // 密度不够则只保留前 0 条（视为未达水文阈值）
    return [];
  }
  return out;
}

/** 异常空行 / 极碎分段 */
export function detectFormatFragmentation(text: string, rule: RuleDefinition): Finding[] {
  const lines = text.split(/\r?\n/);
  let blankRun = 0;
  let maxBlank = 0;
  let shortLines = 0;
  let contentLines = 0;
  lines.forEach((line) => {
    if (line.trim() === "") {
      blankRun += 1;
      maxBlank = Math.max(maxBlank, blankRun);
    } else {
      blankRun = 0;
      contentLines += 1;
      if ([...line.trim()].length <= 8) shortLines += 1;
    }
  });
  const out: Finding[] = [];
  if (maxBlank >= 4) {
    out.push(
      finding(rule, 1, `连续空行×${maxBlank}`, "排版空行过多，疑似格式混乱/粘贴痕迹"),
    );
  }
  if (contentLines >= 20 && shortLines / contentLines >= 0.55) {
    out.push(
      finding(
        rule,
        1,
        `短行占比${Math.round((shortLines / contentLines) * 100)}%`,
        "大量极短行，疑似碎裂排版或提纲体",
      ),
    );
  }
  return out;
}

/** 四字及以上短语在短文内反复出现（模板拼接密度） */
export function detectPhraseDensity(text: string, rule: RuleDefinition): Finding[] {
  const plain = text.replace(/[#>*`_\-\d\s]+/g, "");
  if ([...plain].length < 400) return [];
  const counts = new Map<string, number>();
  const chars = [...plain];
  const n = 4;
  for (let i = 0; i <= chars.length - n; i += 1) {
    const gram = chars.slice(i, i + n).join("");
    if (!/^[\u4e00-\u9fff]{4}$/.test(gram)) continue;
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  const hot = [...counts.entries()]
    .filter(([, c]) => c >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  return hot.map(([gram, c]) =>
    finding(rule, 1, `「${gram}」×${c}`, `高频四字块重复，疑似模板化拼接（密度自查）`),
  );
}

export const STRUCTURAL_DETECTORS: Record<
  string,
  (text: string, rule: RuleDefinition) => Finding[]
> = {
  "outline-style": detectOutlineStyle,
  "repeated-openers": detectRepeatedOpeners,
  "water-connectors": detectWaterConnectors,
  "format-fragmentation": detectFormatFragmentation,
  "phrase-density": detectPhraseDensity,
};
