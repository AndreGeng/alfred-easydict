# Verification / 验证记录

Date: 2026-10-30. Host: Apple Silicon, macOS 26.5.1, Vicinae 0.29.2, Node.js 22.23.1.

## Passed / 已通过

- 30 Node tests (22 pre-existing Alfred/shared tests plus 8 new Vicinae regressions) and 4 Python Alfred packaging tests.
- Vicinae TypeScript check and production build; installed as `easydict-companion`.
- Live provider requests through the Vicinae model: `trans` returned six suggestions; `你好` returned English; `:ja hello` returned `こんにちは`.
- Explicit per-client settings `en` / `ja` translated `hello` to Japanese without modifying process environment or Alfred settings.
- Native Vicinae UI displayed `trans`, its six suggestions, and the full `transfer` dictionary entry.
- Selecting `transfer` and pressing Cmd+O completed the input and launched a new lookup.
- Cmd+L displayed full text for both ordinary definitions and suggested words; Esc returned to the list.
- Enter copied a suggested word (`transition`) exactly and closed the window; ordinary `hello` definition copy also verified against the clipboard.
- Cmd+Enter invoked speech with a visible Speaking indicator; the result list remained open. Direct macOS `say` completion also succeeded. Audio quality/voice choice was not independently assessed.
- After speech, Esc dismissed the query; the Vicinae CLI confirmed the window was closed.
- Native UI showed `:ja hello` → `こんにちは`.
- New query generations ignore late responses; cache keys separate languages; disabled cache and preference validation are covered in tests.
- Existing installed Alfred runtime files (`core`, `providers`, `languages`, `cli`, launcher) matched the original Git HEAD byte-for-byte. They were not replaced.
- Alfred workflow structure, action connections and shortcuts were unchanged. The rebuilt archive contains no Vicinae/SDK dependency, and its extracted CLI successfully translated `:ja hello`.

- Native UI verified full-width `ins` results in Alfred ordering, with pronunciation in right-hand accessories. Selected-suggestion pronunciation fetching was verified with `inspira` → `inspiration`.

## Deliberate differences / 明确差异

- Completion uses Cmd+O on macOS (Ctrl+O on Linux): Tab did not trigger the extension action in native macOS testing. Alfred retains Tab.
- Full text uses a scrollable Vicinae Detail view, not Alfred Large Type.
- Dependencies and cache belong to Vicinae; Alfred's worker and cache paths are not used.

## Not verified / 未验证

- Linux/XFCE desktop interactions and Speech Dispatcher audio. Linux speech is implemented via `spd-say --wait -- text`, with shell-free argument handling tested.
- Bing live availability in this run; its existing parser tests pass and the per-client preference path is tested.
- All eleven languages individually; Japanese and the preferred/secondary language switch were exercised online.
- A fresh Alfred GUI re-import of the new archive: the installed workflow was intentionally kept intact; source tests and extracted-package execution were verified instead.

Desktop automation initially timed out when attaching to the launcher. Reopening via the installed app and launching the command using Vicinae's CLI restored access. These startup failures were not counted as successful UI checks.
