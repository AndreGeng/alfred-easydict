# FelixDict

**中文** · [English](README.en.md)

FelixDict 是运行在 **Alfred、Vicinae 和 Raycast** 中的查词与翻译工具。输入单词查看释义和音标，只记得开头时通过联想找词，也可以翻译短语和句子、朗读结果。查询就在启动器里完成，无需另开词典应用。

## 功能

- **中英词典**：查看多词性释义、英美音标、词形变化和网络释义。
- **单词联想**：输入英文单词的前几个字母，查看完整候选和释义，再补全查询。
- **多语言翻译**：自动识别源语言，支持中、英、日、韩、法等 11 种目标语言，可设置默认目标或用 `:ja` 等前缀临时指定。
- **键盘操作**：复制结果、朗读单词或译文、查看全文，全程可用键盘完成。
- **渐进结果与缓存**：多个服务并行查询，结果陆续显示，重复查询可使用本地缓存。

默认使用有道词典和 Google 翻译，无需配置 API Key。词典和前缀联想以中英为范围；多语言查询使用翻译服务。查询需要联网，目前不包含 OCR、生词本、AI 翻译或完整离线词典。

## 选哪个版本？

Alfred、Vicinae 和 Raycast 都是用键盘呼出的应用启动器；FelixDict 是安装在其中的插件，需要先安装对应启动器。启动器支持某个系统，并不代表 FelixDict 已经适配该系统。

| 启动器 | 启动器支持的桌面系统 | FelixDict 当前支持与验证范围 | 安装说明 |
| --- | --- | --- | --- |
| Alfred | macOS | macOS，已实机验证；需要 Alfred 5 Powerpack 和 Node.js 18+ | [Alfred 版](apps/alfred/README.md) |
| Vicinae | Linux、macOS（Apple Silicon，Beta）、Windows（0.29.0 起） | macOS 已实机验证；Linux 已实现适配，桌面交互尚未实机验证；Windows 尚未适配 | [Vicinae 版](apps/vicinae/README.md) |
| Raycast | macOS、Windows | 目前仅支持 macOS，已实机验证；Windows 尚未适配 | [Raycast 版](apps/raycast/README.md) |

- **macOS**：已有上述启动器，就安装对应版本；使用 Alfred 版需要付费 Powerpack。
- **Linux / Arch / XFCE**：使用 Vicinae 版；目前仍需在你的桌面环境验证交互，朗读需要配置 Speech Dispatcher（`spd-say`）。
- **Windows**：FelixDict 暂无适配版本，即使已安装 Raycast 或 Vicinae，也不能直接使用本仓库的扩展。

启动器平台信息核对于 2026-10-30：[Alfred 官网](https://www.alfredapp.com/)、[Vicinae 平台说明](https://docs.vicinae.com/os-support)及 [Windows 安装说明](https://docs.vicinae.com/install/windows)、[Raycast Windows](https://www.raycast.com/windows)。Vicinae 的平台概览尚未更新 Windows 状态，此处以较新的 Windows 安装说明为准。

## Alfred

适用于 **macOS + Alfred 5 Powerpack**，运行需要 Node.js 18+。

呼出 Alfred，直接输入关键词和查询内容：

```text
fd hello
fd trans
fd :ja 你好
```

**单词释义与音标**

![Alfred 中的单词释义、音标与相关词](docs/screenshots/dictionary.jpg)

**前缀联想**：输入 `fd trans`，通过释义找到需要的完整单词。

![Alfred 中的前缀联想](docs/screenshots/suggestions.jpg)

**多语言翻译**：用 `fd :ja 你好` 指定译成日语。

![Alfred 中的日语翻译](docs/screenshots/translation.jpg)

Enter 复制，⌘Enter 朗读，⌘L 大字查看全文，Tab 补全候选词。

→ [Alfred 安装与详细使用说明](apps/alfred/README.md)

## Vicinae

在 Vicinae 主搜索输入 `fd`，选中 **FelixDict** 后按 Enter 进入查词页面，再输入 `hello`、`trans` 或 `:ja 你好`。输入时会实时查询和联想。

**命令入口**：搜索结果中显示 `fd` 别名和 FD 图标。

![Vicinae 中带 fd 别名的 FelixDict 命令](docs/screenshots/vicinae-entry.jpg)

**前缀联想**：候选词与释义在同一列表中展示。

![Vicinae 中 FelixDict 的前缀联想](docs/screenshots/vicinae-suggestions.jpg)

Enter 复制，⌘Enter 朗读，⌘L 打开可滚动的全文详情，⌘O 补全候选词；Linux 对应使用 Ctrl 修饰键。Vicinae 的标题和副标题在同一行显示，与 Alfred 的双行布局不同。

Vicinae 截图来自 macOS；Linux/XFCE 的桌面交互尚未实机验证。Linux 朗读需要配置 Speech Dispatcher（`spd-say`）。

→ [Vicinae 安装与详细使用说明](apps/vicinae/README.md)

## Raycast

适用于 **macOS + Raycast**。在主搜索输入 `fd` 或 `FelixDict`，按 Enter 进入命令，再输入单词或句子。可在 Raycast Settings → Extensions 中将命令的 Alias 设置为 `fd`。

**前缀联想与音标**

![Raycast 中的单词联想与音标](docs/screenshots/raycast-suggestions.jpg)

**多语言翻译**：输入 `:ja hello` 查看日语译文。

![Raycast 中的日语翻译](docs/screenshots/raycast-translation.jpg)

Enter 复制，⌘Enter 朗读并保留窗口，⌘L 查看全文，⌘O 补全候选词。与 Vicinae 一样，实时联想出现在进入命令后的查词页面。

目前通过源码安装，尚未发布到 Raycast Store：在仓库根目录执行 `npm ci` 和 `npm run dev:raycast`，构建成功后即可停止开发命令，扩展会保留在本机。

→ [Raycast 安装与详细使用说明](apps/raycast/README.md)

三个平台的截图均为实际查询结果，中英文文档共用中文界面截图；在线结果可能变化。词典项朗读查询词，翻译项朗读译文，建议项朗读完整候选词。

## 仓库结构

```text
apps/
  alfred/                 Alfred CLI、结果 JSON 适配、启动脚本和打包工具
  vicinae/                Vicinae React 界面和安装构建
  raycast/                Raycast React 界面和扩展构建
packages/
  core/                   语言处理、服务接口、查询状态、缓存工具和通用结果模型
test/                     TypeScript 回归测试和 Python 打包测试
docs/                     截图等共享文档资源
```

使用 npm workspaces，依赖版本统一记录在根目录 `package-lock.json`。
应用通过 `@easydict/core` 包导入共享能力，不跨目录读取另一个应用的源码。
`core` 不依赖任何启动器 SDK；Alfred 的 JSON 协议和快捷键字段由 `apps/alfred` 生成。

## 开发

需要 Node.js 22.22.2+、npm 和 Python 3（Alfred 打包）。所有 Node 源码、构建辅助脚本和测试均使用 TypeScript，并开启 strict 类型检查。

```sh
npm ci
npm run typecheck  # TypeScript + Python (Pyright)
npm test
npm run build:alfred
npm run build:vicinae
npm run build:raycast
```

- `npm run build:alfred`：先编译共享包和 Alfred CLI，再生成 `dist/Alfred-FelixDict-0.1.6.alfredworkflow`。不会导入或覆盖已安装的 Alfred Workflow。
- `npm run build:vicinae`：先编译共享包，再构建并安装到当前用户的 Vicinae 扩展目录。
- `npm run build:raycast`：编译并验证 Raycast 扩展，不导入本机；`npm run dev:raycast` 构建并导入本机 Raycast。
- `npm run build`：依次构建三个应用；其中 Vicinae 构建会执行本地安装。
- `npm test`：编译测试需要的运行时代码，执行 TypeScript 测试和 Alfred 打包检查。

TypeScript 编译产物位于各包的 `dist/`，不提交到 Git。Alfred 安装包包含编译后的 JavaScript 和本地共享包，无需用户安装 TypeScript 或执行 npm install，运行时仍支持 Node.js 18+。
Vicinae 将共享代码打包进扩展，运行时不依赖仓库路径。Linux/XFCE 桌面交互尚未实机验证。

## 许可与来源

MIT。上游协议和代码来源见 [THIRD_PARTY.md](THIRD_PARTY.md)。
