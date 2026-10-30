# Easydict for Alfred


> **Vicinae 版本**：同仓库现已提供 [Easydict](vicinae/README.md)，共用查词和拼写建议逻辑，单独构建安装。下文为 Alfred 版说明。

**中文** · [English](README.en.md)

在 Alfred 里查词、联想单词、翻译多种语言。支持中英词典，以及日语、韩语、法语等语言的自动翻译。
无需启动 Easydict 或 Raycast，也无需配置翻译 API Key。

![在 Alfred 中查询 hello 的释义、音标与相关单词](docs/screenshots/dictionary.jpg)

## 功能

- **中英查词**：有道词典提供多词性释义、英美音标、词形变化和网络释义。
- **前缀联想**：只记得单词开头也能查，候选词附带中文释义，按 Tab 补全后继续查询。
- **多语言翻译**：默认启用 Google；自动识别源语言，可配置首选目标语言和第二语言；初始为中英互译，也可单次指定目标语言。
- **键盘操作**：回车复制、⌘Enter 朗读、⌘L 大字查看全文。
- **编程标识符**：自动拆分 `camelCase`、`HTTPServer` 和 `snake_case` 后查询。
- **渐进结果与缓存**：多个来源并行查询，先返回的先显示，一个来源失败不影响其他结果。

独立运行的 Alfred Workflow，支持中英词典和多语言翻译。目前不包含 OCR、生词本、AI 翻译或完整离线词典。

## 安装

需要 **macOS、Alfred 5 + Powerpack、Node.js 18+**。运行时没有 npm 依赖。

1. 在项目目录构建安装包：

   ```bash
   python3 scripts/build.py
   ```

2. 双击生成的 `dist/Alfred-Easydict-0.1.6.alfredworkflow`，在 Alfred 中导入或更新。
3. 呼出 Alfred，输入 `ed hello`。默认关键词为 `ed`。
4. 如果找不到 Node.js，在 **Workflows → Easydict for Alfred → Configure Workflow** 中设置 `node_path`。

启动脚本自动检查 `~/.local/bin/node`、`/opt/homebrew/bin/node`、`/usr/local/bin/node` 和 `PATH`。
构建需要 Python 3；使用已构建的安装包只需要 Node.js。无需运行 `npm install`。

## 使用

```text
ed hello
ed trans
ed look forward to
ed 你好
ed getHTTPServer
ed :ja hello
ed :fr 你好
ed The request was cancelled because a newer query was started.
```

### 多语言翻译

**自动翻译**：源语言自动识别，通常译成“首选目标语言”；原文已经是首选语言时，改译成“第二语言”。
初始设置为首选 `zh`（简体中文）、第二语言 `en`（英文），保留中文译英文、其他语言译简体中文的行为。

在 **Configure Workflow** 中设置 `target_language` 和 `secondary_language`，填写下表中的语言代码，两者须不同。
例如设为 `en` 和 `ja` 后，`ed 你好` 译成英文，`ed hello` 译成日文，`ed :fr hello` 仍译成法文。
单次 `:语言` 前缀优先于这两个设置。更改任一语言设置后会使用独立缓存，无需手动清理旧结果。

**指定目标**：使用 `ed :语言代码 内容`。冒号使用英文 `:`，语言代码与内容之间留一个空格。

```text
ed 今日はいい天気です
ed 안녕하세요
ed Bonjour, comment allez-vous ?
ed :ja 你好
ed :ko 你好
ed :fr 你好
ed :en 東京
ed :zh Bonjour
```

下面是几个查询示例，在线翻译结果可能变化：

| 输入 | 输出示例 |
| --- | --- |
| `ed 今日はいい天気です` | 今天天气很好 |
| `ed 안녕하세요` | 你好 |
| `ed :ja hello` | こんにちは |
| `ed :fr 你好` | Bonjour |
| `ed :de 谢谢` | Danke |

支持指定以下 11 种目标语言：

| 目标语言 | 代码 | 目标语言 | 代码 |
| --- | --- | --- | --- |
| 简体中文 | `zh` | 英语 | `en` |
| 日语 | `ja` | 韩语 | `ko` |
| 法语 | `fr` | 德语 | `de` |
| 西班牙语 | `es` | 意大利语 | `it` |
| 葡萄牙语 | `pt` | 俄语 | `ru` |
| 阿拉伯语 | `ar` | | |

需启用 Google 或 Bing；默认使用 Google。源语言由翻译服务自动识别，短词、纯汉字或混合语言可能有歧义，
可用 `:zh` / `:en` 等前缀固定目标。
指定目标语言时仅展示翻译结果；有道多词性释义、音标和前缀联想仍限于原有中英词典功能。
`⌘Enter` 朗读原文，不读语言前缀；发音效果取决于 macOS 当前语音对该语言的支持。

### 只记得单词开头

输入 **2–40 个英文字母**时自动联想，需要启用 Youdao。例如 `ed trans`：

![输入 trans 后显示 transfer、transition 等候选及中文释义](docs/screenshots/suggestions.jpg)

最多显示 6 个候选，保留当前查询的首条释义在顶部。用 ↑ / ↓ 选择候选，再按 **Tab** 补全并查询详细释义。
候选同样支持复制、朗读和大字查看。中文、句子和带符号的输入不触发联想，联想失败不影响普通查词。

### 快捷键

| 按键 | 普通查询结果 | 联想候选 |
| --- | --- | --- |
| `↑` / `↓` | 选择结果 | 选择候选 |
| `Enter` | 复制当前释义或译文 | 复制完整候选词 |
| `⌘Enter` | 朗读查询原文，保持窗口打开 | 朗读完整候选词，保持窗口打开 |
| `⌘L` | 大字查看当前结果全文 | 大字查看候选词及接口提供的释义 |
| `Tab` | — | 补全单词并查询 |
| `Esc` | 退出查询 | 退出查询 |

在大字视图中，第一次 Esc 返回结果列表，再按一次退出。朗读使用 macOS 本地语音。
联想接口本身可能返回截断的释义；要查详细词条，先按 Tab 查询完整单词。

### 短语与句子

![在 Alfred 中查询 look forward to 的短语释义](docs/screenshots/phrase.jpg)

也可以在其他应用中选中文字，通过 Alfred 的 **Universal Actions → Easydict 查词 / 翻译** 查询。
呼出 Alfred 和 Universal Actions 的全局快捷键由你在 Alfred 中设置，Workflow 不占用固定全局快捷键。

## 配置

入口：**Alfred Preferences → Workflows → Easydict for Alfred → Configure Workflow**。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `keyword` | `ed` | 查询关键词；可改为 `yd`，避免与已有 Workflow 重名 |
| `providers` | `Youdao,Google` | 逗号分隔，支持 `Youdao`、`Google`、`Bing` |
| `target_language` | `zh` | 首选目标语言，使用语言代码（如 `en`、`ja`） |
| `secondary_language` | `en` | 原文为首选目标语言时的翻译目标；须与首选语言不同 |
| `node_path` | 自动检测 | Node.js 可执行文件的绝对路径 |
| `cache_hours` | `24` | 0–168 小时；0 禁用长期缓存，但保留当前查询的短暂状态 |

语言设置仅作用于 Google / Bing 翻译。有道词典与前缀联想仍使用中英释义；不需要时可在 `providers` 中移除 `Youdao`。

有道提供词典和前缀联想，Google 提供翻译。Bing 为可选来源，在本次开发网络中请求失败，默认关闭。
这些来源使用网站查询接口，可用性可能随网络、限流及上游协议变化而改变。

`curl` 继承 `HTTPS_PROXY` 和 `ALL_PROXY`，不会自动读取 macOS 系统代理。
Google 不可达时可先将 `providers` 设为 `Youdao`，或在 Workflow 环境变量中配置代理。

## 常见问题

### 查不到结果，或提示找不到 Node.js

检查网络、启用的来源与 `node_path`。终端可用以下命令直接查询，返回 Alfred JSON：

```bash
node src/cli.mjs --wait hello
```

## 隐私与运行方式

查询文字只发送给已启用的有道、Google 或 Bing 服务；启用 Youdao 时，符合条件的英文输入也用于前缀联想。
没有额外遥测，不读取浏览器、账号、密钥或 Easydict / Raycast 设置，也不主动读取剪贴板。
复制仅在执行复制动作后发生，朗读仅在按 `⌘Enter` 后发生。

缓存包含查询原文和结果，文件权限为 `0600`，**不加密**。
Workflow 使用 Alfred 提供的 `alfred_workflow_cache` 目录；独立命令行默认使用 `~/Library/Caches/local.alfred-easydict`。
每次新查询清理过期缓存；没有后续查询时，过期文件可能仍留在磁盘上。
可使用 Alfred 的 Workflow 缓存清理功能删除缓存。

不同来源并行请求，每个来源总时限为 8 秒。查询期间 Alfred 每 0.3 秒读取本地状态，不重复发起同一个进行中的查询。
没有常驻服务；关闭 Alfred 后，已发出的请求可能继续运行至完成或超时。

## 开发

```bash
npm test
python3 scripts/build.py
```

测试使用 Node.js 自带的测试框架与 Python 标准库，覆盖响应解码、候选操作、错误隔离、渐进更新、缓存及安装包结构。
真实联网和 Alfred 界面验收记录见 [VERIFICATION.md](VERIFICATION.md)。

截图来自 macOS 上的 Alfred 5.8.1，展示当前中文界面；英文文档沿用同一组实际截图，在线结果可能变化。

## 来源与许可证

本项目基于 [Raycast Easydict](https://github.com/tisfeng/Raycast-Easydict) 的部分查询代码改写，独立实现 Alfred 展示、缓存和 Google HTTP 适配器。
不是 Easydict 官方产品，不依赖上游应用运行。代码来源与固定版本见 [THIRD_PARTY.md](THIRD_PARTY.md)。

[MIT License](LICENSE) · [上游 MIT License](licenses/Raycast-Easydict-MIT.txt)
