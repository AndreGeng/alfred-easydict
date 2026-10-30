# EasyDict

[中文](README.md) · **English**

Dictionary lookup, prefix suggestions, and multilingual translation for Alfred and Vicinae. Both apps share the query engine and result model while keeping their native interactions.

- [Alfred installation, screenshots, and usage](apps/alfred/README.en.md)
- [Vicinae installation and usage](apps/vicinae/README.en.md)

## Structure

```text
apps/
  alfred/                 CLI, Alfred JSON adapter, launcher, and packaging
  vicinae/                React UI, query sessions, speech, and extension build
packages/
  core/                   Languages, providers, query state, cache utilities, result model
test/                     TypeScript regressions and Python packaging tests
docs/                     Shared documentation assets
```

npm workspaces manages dependencies with one root `package-lock.json`. Apps import `@easydict/core` rather than another app's source files. The core has no Alfred or Vicinae SDK dependency; Alfred JSON and modifier fields belong to the Alfred adapter.

## Development

Requires Node.js 22.6+, npm, and Python 3 for Alfred packaging. All Node source, helper scripts, and tests use TypeScript with strict type checking.

```sh
npm ci
npm run typecheck  # TypeScript + Python (Pyright)
npm test
npm run build:alfred
npm run build:vicinae
```

- `build:alfred` compiles core and CLI, then produces `dist/Alfred-Easydict-0.1.6.alfredworkflow`. It does not import or replace your installed workflow.
- `build:vicinae` compiles core, then builds and installs the extension into your local Vicinae directory.
- `build` builds both apps, including the local Vicinae installation.
- `test` compiles runtime code, runs TypeScript tests, and checks Alfred packaging.

Generated `dist/` files are not committed. The Alfred archive includes compiled JavaScript and a local copy of the shared package; users need no TypeScript or npm install. Its runtime still supports Node.js 18+.
Vicinae bundles shared code and does not depend on the checkout at runtime. Linux/XFCE desktop interaction has not been tested on a physical Linux installation.

## License and attribution

MIT. See [THIRD_PARTY.md](THIRD_PARTY.md) for upstream protocol and source attribution.
