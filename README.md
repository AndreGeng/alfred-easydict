# EasyDict

**中文** · [English](README.en.md)

在 Alfred 和 Vicinae 中查词、联想单词、翻译多种语言。两个插件共用查询和结果模型，各自保留原生交互方式。

- [Alfred：安装、截图和使用说明](apps/alfred/README.md)
- [Vicinae：安装和使用说明](apps/vicinae/README.md)

## 仓库结构

```text
apps/
  alfred/                 Alfred CLI、结果 JSON 适配、启动脚本和打包工具
  vicinae/                Vicinae React 界面、查询会话、朗读和安装构建
packages/
  core/                   语言处理、服务接口、查询状态、缓存工具和通用结果模型
test/                     TypeScript 回归测试和 Python 打包测试
docs/                     截图等共享文档资源
```

使用 npm workspaces，依赖版本统一记录在根目录 `package-lock.json`。
应用通过 `@easydict/core` 包导入共享能力，不跨目录读取另一个应用的源码。
`core` 不依赖 Alfred 或 Vicinae SDK；Alfred 的 JSON 协议和快捷键字段由 `apps/alfred` 生成。

## 开发

需要 Node.js 22.6+、npm 和 Python 3（Alfred 打包）。所有 Node 源码、构建辅助脚本和测试均使用 TypeScript，并开启 strict 类型检查。

```sh
npm ci
npm run typecheck  # TypeScript + Python (Pyright)
npm test
npm run build:alfred
npm run build:vicinae
```

- `npm run build:alfred`：先编译共享包和 Alfred CLI，再生成 `dist/Alfred-Easydict-0.1.6.alfredworkflow`。不会导入或覆盖已安装的 Alfred Workflow。
- `npm run build:vicinae`：先编译共享包，再构建并安装到当前用户的 Vicinae 扩展目录。
- `npm run build`：依次构建两个应用；其中 Vicinae 构建会执行本地安装。
- `npm test`：编译测试需要的运行时代码，执行 TypeScript 测试和 Alfred 打包检查。

TypeScript 编译产物位于各包的 `dist/`，不提交到 Git。Alfred 安装包包含编译后的 JavaScript 和本地共享包，无需用户安装 TypeScript 或执行 npm install，运行时仍支持 Node.js 18+。
Vicinae 将共享代码打包进扩展，运行时不依赖仓库路径。Linux/XFCE 桌面交互尚未实机验证。

## 许可与来源

MIT。上游协议和代码来源见 [THIRD_PARTY.md](THIRD_PARTY.md)。
