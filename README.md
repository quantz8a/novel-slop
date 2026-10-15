# novel-slop

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

中文网文 **AI 味 / 低质特征** 本地自查工具 + Cursor Skill + VS Code/Cursor 插件。

按**各大文学网站公开治理口径**做启发式映射（起点、番茄、晋江、七猫、纵横、书旗、反洗稿公约 16 家及相关站点）。

| 能力 | 有没有 |
|---|---|
| 多平台预设（`rules/platforms.json` 全量） | ✅ |
| Cursor Agent Skill（`skills/novel-slop`） | ✅ |
| IDE 诊断插件 | ✅ |
| 官方检测器 / 过审保证 / 教你规避 | ❌ |

## 安装（CLI）

```bash
git clone https://github.com/quantz8a/novel-slop.git
cd novel-slop
npm install
npm run build
node dist/cli.js --list-platforms
```

## 用法

```bash
# 中文别名也行
node dist/cli.js chapter.md --platform 起点
node dist/cli.js chapter.md --platform 番茄
node dist/cli.js chapter.md --platform 晋江

node dist/cli.js chapter.md --platform qidian
node dist/cli.js --list-platforms --json
```

## Cursor Skill

仓库内：[`skills/novel-slop/SKILL.md`](./skills/novel-slop/SKILL.md)

复制到个人技能目录即可全局用：

```bash
mkdir -p ~/.cursor/skills
cp -R skills/novel-slop ~/.cursor/skills/
```

Agent 在用户提到「按起点/番茄查 AI 味」时应加载该 skill：只跑检测与改稿方向，不代写禁发正文。

## IDE 插件

```bash
npm install --prefix editors/vscode
npm run ext:package
# dist-vsix/novel-slop-0.1.0.vsix
# Cursor: Cmd+Shift+P → Install from VSIX
```

状态栏可切换全平台预设。

## 文档

- [`docs/PLATFORMS.md`](./docs/PLATFORMS.md) — 平台与声明  
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — 如何加平台/规则  

## 许可

MIT
