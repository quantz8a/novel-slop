import * as vscode from "vscode";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeText } from "../../../src/analyze.ts";
import {
  getPlatform,
  listPlatforms,
  resolvePlatform,
  setRulesDirectory,
} from "../../../src/platforms.ts";
import type { Finding, RulePack, Severity } from "../../../src/types.ts";

const COLLECTION = "novelSlop";

let diagnostics: vscode.DiagnosticCollection;
let rulePack: RulePack;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let statusItem: vscode.StatusBarItem;

const SEVERITY_RANK: Record<Severity, number> = {
  error: 3,
  warn: 2,
  info: 1,
};

function loadPack(extensionPath: string): RulePack {
  const path = join(extensionPath, "rules", "zh-cn-webnovel.json");
  return JSON.parse(readFileSync(path, "utf8")) as RulePack;
}

function currentPlatformId(): string {
  return resolvePlatform(
    vscode.workspace.getConfiguration("novelSlop").get<string>("platform", "qidian"),
  );
}

function toVsSeverity(severity: Severity): vscode.DiagnosticSeverity {
  switch (severity) {
    case "error":
      return vscode.DiagnosticSeverity.Error;
    case "warn":
      return vscode.DiagnosticSeverity.Warning;
    default:
      return vscode.DiagnosticSeverity.Information;
  }
}

function minSeverityAllowed(): Severity {
  return (
    (vscode.workspace.getConfiguration("novelSlop").get<string>("minSeverity") as Severity) ??
    "info"
  );
}

function shouldInclude(severity: Severity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[minSeverityAllowed()];
}

function findingRange(doc: vscode.TextDocument, finding: Finding): vscode.Range {
  const line = Math.max(0, finding.line - 1);
  const lineText = doc.lineAt(Math.min(line, doc.lineCount - 1)).text;
  const col = Math.max(0, finding.column - 1);
  const matchLen = Math.max(1, finding.match.length);
  const end = Math.min(lineText.length, col + matchLen);
  return new vscode.Range(line, Math.min(col, lineText.length), line, end);
}

function updateStatus(platformId: string, score?: number, errors?: number): void {
  const profile = getPlatform(platformId);
  if (score === undefined) {
    statusItem.text = `$(search) AI味:${profile.id}`;
    statusItem.tooltip = `网文 AI 味 · ${profile.name}\n${profile.summary}\n点击切换平台`;
  } else {
    statusItem.text = `$(search) AI味:${profile.id} ${score}`;
    statusItem.tooltip = `${profile.name}\nscore ${score} · error ${errors ?? 0}\n点击切换平台`;
  }
}

function lintDocument(doc: vscode.TextDocument): void {
  if (doc.uri.scheme !== "file" && doc.uri.scheme !== "untitled") return;
  if (doc.languageId !== "markdown" && doc.languageId !== "plaintext") return;

  const enabled = vscode.workspace.getConfiguration("novelSlop").get<boolean>("enable", true);
  if (!enabled) {
    diagnostics.delete(doc.uri);
    return;
  }

  const platform = currentPlatformId();
  const result = analyzeText(doc.getText(), rulePack, { platform });
  const items: vscode.Diagnostic[] = [];
  for (const finding of result.findings) {
    if (!shouldInclude(finding.severity)) continue;
    const diag = new vscode.Diagnostic(
      findingRange(doc, finding),
      `[${finding.category}/${finding.ruleId}] ${finding.title}：${finding.message}`,
      toVsSeverity(finding.severity),
    );
    diag.source = "novel-slop";
    diag.code = finding.ruleId;
    items.push(diag);
  }
  diagnostics.set(doc.uri, items);
  updateStatus(platform, result.summary.score, result.summary.error);
}

function scheduleLint(doc: vscode.TextDocument): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => lintDocument(doc), 400);
}

async function pickPlatform(): Promise<void> {
  const items = listPlatforms().map((p) => ({
    label: p.id,
    description: p.name,
    detail: `${p.summary}${p.aliases?.length ? ` · 别名: ${p.aliases.join(", ")}` : ""}`,
  }));
  const picked = await vscode.window.showQuickPick(items, {
    title: "选择文学网站公开口径预设（全平台）",
    placeHolder: "支持起点/番茄/晋江/七猫/纵横/书旗/公约… 非官方检测器",
    matchOnDescription: true,
    matchOnDetail: true,
  });
  if (!picked) return;
  await vscode.workspace
    .getConfiguration("novelSlop")
    .update("platform", picked.label, vscode.ConfigurationTarget.Global);
  updateStatus(resolvePlatform(picked.label));
  const editor = vscode.window.activeTextEditor;
  if (editor) lintDocument(editor.document);
  void vscode.window.showInformationMessage(`已切换：${picked.label}（${picked.description}）`);
}

export function activate(context: vscode.ExtensionContext): void {
  setRulesDirectory(join(context.extensionPath, "rules"));
  rulePack = loadPack(context.extensionPath);
  diagnostics = vscode.languages.createDiagnosticCollection(COLLECTION);
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusItem.command = "novelSlop.pickPlatform";
  statusItem.show();
  updateStatus(currentPlatformId());

  context.subscriptions.push(
    diagnostics,
    statusItem,
    vscode.commands.registerCommand("novelSlop.checkFile", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        void vscode.window.showWarningMessage("没有打开的编辑器");
        return;
      }
      lintDocument(editor.document);
      void vscode.window.showInformationMessage("网文 AI 味检测完成（见问题面板）");
    }),
    vscode.commands.registerCommand("novelSlop.clearDiagnostics", () => {
      diagnostics.clear();
    }),
    vscode.commands.registerCommand("novelSlop.pickPlatform", () => pickPlatform()),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const runOn = vscode.workspace.getConfiguration("novelSlop").get<string>("runOn", "save");
      if (runOn === "save") lintDocument(doc);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      const runOn = vscode.workspace.getConfiguration("novelSlop").get<string>("runOn", "save");
      if (runOn === "change") scheduleLint(event.document);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) return;
      const runOn = vscode.workspace.getConfiguration("novelSlop").get<string>("runOn", "save");
      if (runOn !== "manual") lintDocument(editor.document);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("novelSlop")) return;
      updateStatus(currentPlatformId());
      const editor = vscode.window.activeTextEditor;
      if (editor) lintDocument(editor.document);
    }),
  );

  const active = vscode.window.activeTextEditor;
  if (active) lintDocument(active.document);
}

export function deactivate(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
}
