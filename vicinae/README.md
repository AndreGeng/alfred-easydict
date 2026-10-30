# Easydict for Vicinae

[English](README.en.md) · **中文**

与本仓库 Alfred Workflow 共用查词、拼写建议和翻译逻辑的 Vicinae 扩展。
它是独立的本地扩展，不是 Raycast 商店中的 Easy Dictionary。

## 安装

需要 Vicinae 0.29.2 或更新版本、用于构建的 Node.js 22+ 与 npm，以及运行时的 `/usr/bin/curl`。
从**完整仓库**构建，因为扩展会引用 `../src/` 的共享代码：

```sh
cd vicinae
npm ci
npm run build
```

构建会安装到当前用户的 Vicinae 扩展目录。搜索 **Easydict**，确认所属扩展为
**Easydict**。如果首次构建后未出现，退出并重新打开 Vicinae。
已构建的扩展包含共享代码，不依赖源仓库位置，也不需要运行 Alfred 或 Raycast。

这不会安装或更新 Alfred Workflow；Alfred 仍使用仓库根目录的原有构建命令。

## 使用

在 Vicinae 主搜索输入 `ed`、`查词` 或 `翻译`，即可搜索 **Easydict**；选中后回车进入查词。这些是搜索关键词，不是独占别名。


输入 `hello`、`trans`、`你好`、`:ja hello` 或句子。可以直接打开命令后输入，也可以在命令的可选参数中传入查询。

| 操作 | macOS | Linux | 行为 |
| --- | --- | --- | --- |
| 复制 | Enter | Enter | 复制当前释义；建议项复制完整单词，然后关闭窗口 |
| 朗读 | ⌘Enter | Ctrl+Enter | 朗读原查询；建议项朗读完整单词，保留列表 |
| 查看全文 | ⌘L | Ctrl+L | 打开可滚动详情页；Esc 返回列表 |
| 补全 | ⌘O | Ctrl+O | 选中建议项后补全单词并重新查询 |

也可从 Actions 菜单执行这些操作。全文查看使用 Vicinae 的详情页，而不是 Alfred Large Type。
普通释义的全文与 Alfred 相同；建议接口如果返回缩略释义，需用补全操作查询完整单词。

朗读在 macOS 使用系统 `say`；Linux 需要已配置可用的 Speech Dispatcher（`spd-say`）。
未安装时显示错误，不影响查询和复制。Linux 桌面交互尚未实机验收。

## 配置

在 Vicinae 设置中找到 **Easydict** 的扩展设置：

- **Preferred target language**：默认 `zh`。
- **Secondary language**：默认 `en`，原文语言与首选语言一致时使用，必须不同于首选语言。
- **Providers**：默认 `Youdao,Google`，可增加 `Bing`。
- **Cache hours**：默认 24，范围 0–168；0 禁用缓存。

支持 `zh/en/ja/ko/fr/de/es/it/pt/ru/ar`；`:语言 内容` 优先于默认设置。
有道词典和前缀建议仍以中英为范围。缓存保存在 Vicinae 的扩展专属目录，与 Alfred 完全分开，
按查询、服务和语言配置区分，最多 5 MB。查询会发送给启用的在线服务；缓存未加密。

## 开发与验证

```sh
# 仓库根目录：同时运行原有 Alfred 测试和 Vicinae 逻辑测试
npm test
# 扩展类型检查
npm run typecheck --prefix vicinae
# 构建并安装 Vicinae 扩展
npm run build --prefix vicinae
# 原有 Alfred 打包
npm run build
```

扩展只在自己的目录安装 SDK 和开发依赖，Alfred 运行仍然不需要 npm 依赖。
共享代码目前保留在 `src/`；Vicinae 将现有结果映射成原生列表，从而保持建议顺序、复制内容和朗读对象一致。
扩展使用自己的异步状态与有容量限制的缓存，不启动 Alfred worker，也不使用 Alfred 状态文件。
验证记录见 [VERIFICATION.md](VERIFICATION.md)。

Vicinae 0.29.2 的本机验证中，Tab 未触发扩展动作，因此补全使用 ⌘O（Linux 为 Ctrl+O）；Alfred 的 Tab 不变。

默认使用整宽列表，复用 Alfred 的结果内容和顺序，并在列表右侧显示音标，避免被长释义挤掉。选中联想词时自动补查音标；⌘L（Linux 为 Ctrl+L）查看全文。Vicinae 的标题和副标题为同行显示，与 Alfred 的双行布局不同。
