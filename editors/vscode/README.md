# 网文 AI 味检测 · IDE 插件

兼容：

- **Cursor**
- **VS Code**
- 基于 VS Code 的国产环境（例如装了**通义灵码 / Qoder CN** 的 VS Code）

本地启发式检测中文网文常见 AI 味 / 套话，在问题面板标红标黄。  
**不是**平台鉴伪，也不能证明「非 AI 创作」。

## 安装（Cursor / VS Code）

### 方式 A：本地 VSIX（推荐开发期）

在仓库根目录：

```bash
npm run ext:package
```

生成：`dist-vsix/novel-slop-0.1.0.vsix`

然后：

- **Cursor / VS Code**：`Cmd+Shift+P` → `Extensions: Install from VSIX…` → 选该文件  
- 或命令行：`cursor --install-extension dist-vsix/novel-slop-0.1.0.vsix`

### 方式 B：开发调试

```bash
cd editors/vscode
npm install
npm run build
```

用 Cursor/VS Code 打开本目录，按 `F5` 启动「扩展开发宿主」。

## 使用

1. 打开 `.md` / 纯文本章节  
2. 保存（默认）或命令面板执行 **「网文 AI 味：检查当前文件」**  
3. 在「问题」面板查看命中；点击可跳到原文  

设置项（`novelSlop.*`）：

| 配置 | 说明 |
|---|---|
| `novelSlop.enable` | 总开关 |
| `novelSlop.runOn` | `save` / `change` / `manual` |
| `novelSlop.minSeverity` | `error` / `warn` / `info` |
| `novelSlop.platform` | `qidian` / `fanqie` / `jjwxc` / `qimao` / `industry` / `generic` |

平台预设对齐的是各站**公开治理口径**，不是官方检测器。说明见仓库 `docs/PLATFORMS.md`。

## 说明

通义灵码本身是另一款 AI 编程插件；本扩展与它**并列安装**在 VS Code 即可，互不替代。  
规则来自仓库 `rules/zh-cn-webnovel.json`。
