# 贡献指南

感谢参与 **novel-slop**（中文网文 AI 味 / 多平台公开口径自查）。

## 原则

1. 只映射**公开**公告与行业公约表述，不逆向、不冒充官方检测。
2. 规则要可解释：有 `id`、中文说明、category、示例。
3. 新增平台必须写入 `rules/platforms.json`，并附来源与 disclaimer。
4. 不接受「如何降低检测分数以骗过平台」类贡献。

## 开发

```bash
npm install
npm run build
npm test
node dist/cli.js --list-platforms
node dist/cli.js fixtures/ai-flavored.md --platform 起点
```

插件：

```bash
npm install --prefix editors/vscode
npm run ext:package
```

## 新增平台

编辑 `rules/platforms.json`：

- `id`：小写英文短 id  
- `aliases`：中文名、域名习惯叫法  
- `policy`：复用已有策略（`ban-ai-core` / `low-quality-four` / `assist-whitelist` / `strict-ai` / `balanced`）  
- `sources`：公开链接或可核验出处  
- `disclaimer`：非官方声明  

然后：`npm test` + 更新 `docs/PLATFORMS.md` 表格行。

## 新增规则

编辑 `rules/zh-cn-webnovel.json`，或在 `src/structural.ts` 增加结构检测并在规则里挂 `structural` 字段。  
请附一条 `fixtures/` 正例或反例。

## 许可

MIT。提交即视为同意以 MIT 发布你的贡献。
