---
name: novel-slop
description: >-
  中文网文 AI 味 / 低质特征本地自查。对齐起点、番茄、晋江、七猫、纵横、书旗及反洗稿公约等多平台公开口径。
  用户说「查 AI 味」「按起点/番茄/晋江检测」「novel-slop」「开源网文 lint」时使用。
  不代写正文，不做润色洗稿，不宣称可过官方检测。
---

# novel-slop

本地启发式检测器：把各大文学网站**已公开**的 AI/低质治理表述，映射成可解释规则。

## 硬性边界

- **不是**任何平台的官方检测器，不能证明「非 AI」，不能保证过审。
- **禁止**用本 skill 指导「如何骗过检测」或代写/精修将投往禁 AI 平台的正文。
- 命中 = 自查提示；未命中 ≠ 允许违规使用 AI。

## 何时使用

- 用户要按某站口径自查章节（起点 / 番茄 / 晋江 / 七猫 / 纵横 / 书旗 / 公约…）
- 用户维护 `novel-slop` 规则或平台目录
- 用户要在 Cursor/VS Code 里看诊断

## 操作步骤

1. 确认仓库或全局已 build：`npm run build`（工作区含 `novel-slop` 时）。
2. 解析用户目标平台 → `--platform <id|别名>`（支持中文别名如「起点」「番茄」「晋江」）。
3. 运行：

```bash
node dist/cli.js <章节文件> --platform <id>
# 或
npx novel-slop <章节文件> --platform <id>
```

4. 列出全平台：`node dist/cli.js --list-platforms`（可加 `--json`）。
5. 向用户报告：score、error/warn、按 category 分组的命中；附带 disclaimer。
6. 只给**改稿方向**（删鉴定句、拆提纲体、去提示词残留…），**不提供整段替换正文**（尤其目标为起点等禁 AI 参与的站点时）。

## 平台目录

权威数据：`rules/platforms.json`（公约 16 家 + 常见站）。新增平台只改 JSON，勿写死在 skill 里。

常用 id：`qidian` `fanqie` `jjwxc` `qimao` `yuewen` `zongheng` `shuqi` `industry` `generic`

## 扩展开发

- 规则：`rules/zh-cn-webnovel.json`
- 结构检测：`src/structural.ts`
- IDE 插件：`editors/vscode` → `npm run ext:package`
- 说明：`docs/PLATFORMS.md`

## 开源协作

- 许可 MIT；贡献见 `CONTRIBUTING.md`
- PR 新增平台须附**公开来源链接**与 disclaimer，禁止声称逆向官方模型
