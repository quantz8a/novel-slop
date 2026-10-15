# 平台公开口径对齐说明

> **硬性声明**  
> `novel-slop` **不是**任何文学网站的官方检测器。  
> 只把**已公开**的治理表述映射为本地启发式规则。  
> 命中 ≠ 官方认定；未命中 ≠ 允许违规使用 AI。

权威目录：[`rules/platforms.json`](../rules/platforms.json)（当前全量预设以该文件为准）。

```bash
node dist/cli.js --list-platforms
node dist/cli.js --list-platforms --json
```

## 覆盖范围

### 元预设

| id | 说明 |
|---|---|
| `generic` | 综合自查 |
| `industry` | 《网络文学行业反洗稿自律公约》倡议向 |

### 公约公开名单相关（16 家联合倡议）

阅文/起点、咪咕、番茄、晋江、掌阅、点众、中文在线、七猫、纵横、沃悦读、磨铁、盐言、趣阅、连尚、长江中文、书旗等 —— 均在 `platforms.json` 中有对应 id（细则少的站走 `strict-ai` 策略）。

### 其他常见投稿站

`feilu` 飞卢 · `heiyan` 黑岩 · `ciweimao` 刺猬猫 · `lofter` LOFTER 等。

## 策略策略（policy）

| policy | 用途 |
|---|---|
| `ban-ai-core` | 起点/阅文向：拒自动化核心产出 |
| `low-quality-four` | 番茄向：四类低质 |
| `assist-whitelist` | 晋江向：辅助白名单外从严 |
| `strict-ai` | 公约站默认从严 |
| `balanced` | 通用 |

## 别名

支持中文别名，例如：`--platform 起点`、`--platform 番茄`、`--platform 晋江`。

## 错误用法

- 宣称「已通过 novel-slop = 平台认可」
- 指导规避检测
- 把分数当司法/签约鉴定
