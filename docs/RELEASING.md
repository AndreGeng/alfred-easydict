# Release workflow / 发布流程

Build requirements: macOS or Linux with Node.js 22.22.2+, npm, Python 3, zip and unzip. CI uses macOS. Local packaging never installs or replaces a launcher plugin.

```sh
npm ci
npm run typecheck
npm test
npm run package:release
npm run test:release
```

Output: `dist/release/<version>/` contains an Alfred workflow, Vicinae precompiled ZIP, Raycast `.rayext`, Raycast independently installable source ZIP, and SHA256SUMS. The source ZIP preserves the workspace layout and lockfile, so installation does not depend on this checkout. No node_modules, local caches, or credentials are included.

Before tagging, update the root/core/Alfred package versions and workspace dependency versions together, update examples and docs/RELEASE.md, then regenerate package-lock.json. Test source-ZIP installation from a separate directory; verify actual macOS launcher behavior. Linux desktop interaction and direct Raycast .rayext import remain unverified and must stay labelled accordingly.

Push a matching `v<version>` tag to run `.github/workflows/release.yml`. The workflow checks the tag, types, tests, archives and checksums, then creates a **draft** GitHub Release with all five files. Review the attachments and installation notes before publishing. Manual workflow dispatch builds downloadable Actions artifacts without publishing a Release.

发布前更新版本、锁文件和说明；推送匹配的版本标签后，CI 会检查并生成含全部附件的 Release 草稿，审核附件与安装说明后再发布。手动运行 workflow 只生成 Actions 产物。勿覆盖旧版 Release 附件；需要修复时发布新版本。

Rollback: reinstall the previous version's package. Vicinae users should back up the single extension folder outside the extensions directory before replacement. Do not remove user preferences or caches. Preserve previous Releases and tags.
