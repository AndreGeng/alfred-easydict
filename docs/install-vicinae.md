# FelixDict for Vicinae — 安装 / Installation

适用 macOS 和 Linux；macOS 已实机验证，Linux 桌面交互尚未实机验证。不支持 Windows。
For macOS and Linux; tested on macOS, Linux desktop interaction remains unverified. Windows is not supported.

1. 安装 Vicinae 0.29.2+。Install Vicinae 0.29.2+.
2. 解压 ZIP，在包含 `easydict-companion` 的目录打开终端。
   Extract the ZIP and open a terminal in the directory containing `easydict-companion`.
3. 首次安装执行以下命令，无需 npm 或编译。For a first installation, run the following; no npm or compilation required.

macOS:
```sh
mkdir -p "$HOME/.local/share/vicinae/extensions"
cp -R ./easydict-companion "$HOME/.local/share/vicinae/extensions/"
```

Linux:
```sh
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/vicinae/extensions"
cp -R ./easydict-companion "${XDG_DATA_HOME:-$HOME/.local/share}/vicinae/extensions/"
```

更新：先退出 Vicinae，将旧的 `extensions/easydict-companion` 文件夹移到扩展目录外作为备份，再复制新文件夹。不要覆盖或移动整个 extensions 目录，设置与缓存无需删除。重新打开 Vicinae，搜索 FelixDict，进入后输入 `hello`。

Updating: quit Vicinae, move the old `extensions/easydict-companion` folder outside the extensions directory as a backup, then copy the new folder. Leave other extensions, preferences and caches intact. Reopen Vicinae, search for FelixDict, enter the command and type `hello`.

运行依赖 Vicinae 的扩展运行环境和 `/usr/bin/curl`。Linux 朗读还需要配置 `spd-say`。回退时退出 Vicinae，并恢复备份的单个扩展目录。
Requires Vicinae's extension runtime and `/usr/bin/curl`. Linux speech also needs configured `spd-say`. To roll back, quit Vicinae and restore the backed-up extension folder.
