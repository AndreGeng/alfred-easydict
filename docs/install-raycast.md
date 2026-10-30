# FelixDict for Raycast — 安装 / Installation

仅适用于 macOS。需要 Raycast、Node.js 22.22.2+ 和 npm。
macOS only. Requires Raycast, Node.js 22.22.2+ and npm.

## 源码 ZIP / Source ZIP

解压 `FelixDict-Raycast-source-<version>.zip`，在包含 package.json 的目录打开终端：
Extract `FelixDict-Raycast-source-<version>.zip` and open a terminal in the directory containing package.json:

```sh
npm ci
npm run dev:raycast
```

构建成功后按 Ctrl+C 结束，扩展会保留在 Raycast 中。搜索 `fd` 或 FelixDict，按 Enter 进入查词。ZIP 包含共享代码，无需克隆仓库。npm ci 需要联网下载构建依赖。

After a successful build, press Ctrl+C; the extension remains installed. Search for `fd` or FelixDict, then press Enter to look up words. Shared code is included; cloning the repository is unnecessary. npm ci requires network access to download build dependencies.

更新时使用新版本 ZIP 重复这些步骤。回退时使用旧版 ZIP 重新安装。已安装的扩展不依赖解压目录运行。
To update, repeat these steps with the new ZIP. To roll back, reinstall an older ZIP. The installed extension does not need the extracted directory at runtime.

## 查看版本 / Check version

从 v0.2.1 起，在插件内打开 Actions（⌘K），选择“关于 FelixDict / About FelixDict”，可查看版本号、Git 提交和构建类型。干净的对应版本 Git tag 构建标记为 Release；本地改动标记为 Development。Release 源码 ZIP 会保留打包时的版本信息；确认下载包来源仍应校验 SHA256SUMS。

Starting with v0.2.1, open Actions (⌘K) inside the extension and select “About FelixDict” to see the version, Git commit and build type. Clean builds at the matching version tag are marked Release; local changes are marked Development. Release source ZIPs preserve their original build metadata. Verify SHA256SUMS to confirm the downloaded artifact.

## .rayext 包 / .rayext archive

Release 同时提供官方 `ray bundle` 生成的预编译 `.rayext` ZIP。它不是 `.rayconfig` 配置备份。当前本机 Raycast 1.104.31 未提供已验证的直接导入流程，因此普通用户请使用上面的源码 ZIP；不要假设双击即可安装。

The release also includes a precompiled `.rayext` ZIP produced by the official `ray bundle` command. It is not a `.rayconfig` settings backup. Direct import has not been verified with the locally tested Raycast 1.104.31, so use the source ZIP above rather than assuming double-click installation works.

https://developers.raycast.com/information/developer-tools/cli
