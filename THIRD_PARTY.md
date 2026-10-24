# Third-party provenance

Upstream: https://github.com/tisfeng/Raycast-Easydict

Reviewed revision: `5622245b27ba1d174434533e96e6aef2c9591c94`.

License: MIT. Copyright (c) 2022 Tisfeng; source file notices also credit
tisfeng and maxchang3 (2022–present). Full upstream license is included at
`licenses/Raycast-Easydict-MIT.txt` and shipped in the workflow package.

Adapted, rather than imported at runtime:

- `src/providers/dictionary/youdao/index.ts`: request URL and dictionary selection.
- `src/providers/dictionary/youdao/decode.ts`: English/Chinese explanations and forms.
- `src/providers/shared/bing-config.ts`: translator page configuration extraction.
- `src/providers/shared/bing-request.ts`: translation POST protocol.
- `src/providers/translation/bing.ts`: response extraction.

Local adaptations remove Raycast APIs, UI, logging and dependencies; use Node.js modules
and macOS curl; add safe error messages, deadline handling, Chinese/English direction
selection, incremental Alfred output and independent query caches.
The Google HTTP adapter is independently implemented; upstream uses
`google-translate-api-x`, which is not copied, bundled or installed here.
The icon, launch code and build manifest are original to this project.

Upstream is recorded at a fixed revision. Updates are manual: review the relevant
upstream files and license, adapt providers, update this record and run unit tests,
live provider smoke checks and Alfred acceptance before replacing a workflow package.
No upstream installer or update script runs automatically.
