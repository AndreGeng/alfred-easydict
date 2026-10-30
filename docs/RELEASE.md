FelixDict now includes Alfred, Vicinae and Raycast editions, with dictionary lookup, phonetics, prefix suggestions and multilingual translation. This release also introduces the FelixDict name and `fd` keyword, plus language-aware speech for translated results.

## Downloads / 下载

| Asset | Installation / 安装 |
| --- | --- |
| `Alfred-FelixDict-*.alfredworkflow` | macOS: double-click to import into Alfred 5 Powerpack; Node.js 18+ required. / 双击导入 Alfred。 |
| `FelixDict-Vicinae-*.zip` | macOS / Linux: extract and follow INSTALL.md to copy the precompiled extension; no build required. / 解压后按 INSTALL.md 复制预编译扩展目录。 |
| `FelixDict-Raycast-source-*.zip` | macOS: extract, run `npm ci` then `npm run dev:raycast`; Node.js 22.22.2+ required. / 无需克隆仓库，解压后执行上述命令。 |
| `FelixDict-Raycast-*.rayext` | Official precompiled bundle; direct import not verified on Raycast 1.104.31. Use the source ZIP above for the tested installation route. / 官方预编译包，当前验证的安装路径为上面的源码 ZIP。 |
| `SHA256SUMS` | SHA-256 checksums for the four downloads. / 四个下载包的校验值。 |

macOS desktop behavior has been tested. Linux/XFCE desktop interaction remains unverified; Linux speech needs Speech Dispatcher (`spd-say`). FelixDict does not support Windows yet, even though Raycast and Vicinae themselves offer Windows versions.

macOS 已实机验证；Linux/XFCE 桌面交互尚未实机验证，朗读需配置 `spd-say`。目前没有 Windows 版 FelixDict。

Download the named assets above, rather than GitHub's automatically generated Source code archives. These extensions are not yet listed in the Vicinae or Raycast stores.

请下载上表中的附件；GitHub 自动生成的 Source code 归档不是预编译安装包。尚未上架 Vicinae 或 Raycast 商店。

To roll back, reinstall an older release. For Vicinae, keep a backup of the previous extension folder outside the extensions directory. Preferences and caches do not need to be deleted.
