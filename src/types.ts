export type Severity = "error" | "warn" | "info";

/** 对齐各站公开治理口径的问题大类（非平台私有模型标签） */
export type IssueCategory =
  | "ai-crude"
  | "format-chaos"
  | "structure-fail"
  | "hollow-water"
  | "prompt-leak"
  | "template-voice"
  | "policy-note";

/** 平台 id：见 rules/platforms.json，可扩展 */
export type PlatformId = string;

export type PolicyId =
  | "balanced"
  | "strict-ai"
  | "ban-ai-core"
  | "low-quality-four"
  | "assist-whitelist";

export interface RuleDefinition {
  readonly id: string;
  readonly severity: Severity;
  readonly title: string;
  readonly message: string;
  readonly category: IssueCategory;
  readonly patterns?: readonly string[];
  readonly structural?: string;
  readonly platforms?: readonly PlatformId[];
}

export interface RulePack {
  readonly id: string;
  readonly name: string;
  readonly language: string;
  readonly version: number;
  readonly rules: readonly RuleDefinition[];
}

export interface PlatformProfile {
  readonly id: PlatformId;
  readonly name: string;
  readonly family?: string;
  readonly summary: string;
  readonly aliases?: readonly string[];
  readonly sources: readonly string[];
  readonly policy: PolicyId;
  readonly elevateCategories?: Partial<Record<IssueCategory, Severity>>;
  readonly focusCategories?: readonly IssueCategory[];
  readonly disclaimer: string;
}

export interface PolicyDefinition {
  readonly elevateCategories?: Partial<Record<IssueCategory, Severity>>;
  readonly focusCategories?: readonly IssueCategory[];
}

export interface PlatformsCatalog {
  readonly version: number;
  readonly updated: string;
  readonly note: string;
  readonly profiles: readonly Omit<PlatformProfile, "elevateCategories" | "focusCategories">[];
  readonly policies: Readonly<Record<string, PolicyDefinition>>;
}

export interface Finding {
  readonly ruleId: string;
  readonly severity: Severity;
  readonly title: string;
  readonly message: string;
  readonly category: IssueCategory;
  readonly match: string;
  readonly line: number;
  readonly column: number;
  readonly excerpt: string;
}

export interface AnalyzeOptions {
  readonly platform?: PlatformId;
  readonly includeSeverities?: readonly Severity[];
}

export interface AnalyzeResult {
  readonly filePath?: string;
  readonly platform: PlatformId;
  readonly platformName: string;
  readonly charCount: number;
  readonly lineCount: number;
  readonly findings: readonly Finding[];
  readonly categoryCounts: Readonly<Record<string, number>>;
  readonly summary: {
    readonly error: number;
    readonly warn: number;
    readonly info: number;
    readonly score: number;
  };
  readonly disclaimer: string;
}
