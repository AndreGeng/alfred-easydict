# Verification — 2026-10-24

Implemented and packaged version: 0.1.5.

Version 0.1.5 acceptance:

- 20 Node tests and 3 Python tests passed after adding multilingual regression
  coverage. The new language tests failed before the implementation, then passed.
- Live Google checks passed for Japanese with kana/kanji, Korean, French, Chinese,
  explicit Japanese/Korean/French/German/Spanish targets, and kanji-only 東京.
  Examples: 今日はいい天気です → 今天天气很好; 안녕하세요 → 你好;
  :ja 你好 → こんにちは; :fr 你好 → Bonjour; 東京 → 东京.
- Actual CLI `--wait ':ja 你好'` produced Japanese text and a speech argument of 你好,
  excluding the language command. Invalid/incomplete targets and Youdao-only
  translation configurations return actionable guidance without network calls.
- Tests cover target parsing, Japanese script routing, upstream language-based
  direction correction, all eleven configured targets, dictionary exclusion,
  speech prefix stripping, and CLI guidance. Cache schema was incremented so the
  previous translation-direction results cannot be reused.
- Alfred Preferences visibly loaded 0.1.5. Actual incremental Alfred query
  `ed :ja hello` displayed こんにちは as a Google translation result.
- Bing target routing was updated, but its live endpoint remains unverified on
  this network. Multilingual speech voice quality was not verified; it depends
  on the current macOS voice. Dictionary phonetics/forms and prefix suggestions
  retain their English–Chinese scope.

Version 0.1.4 acceptance:

- 15 Node tests and 3 Python tests passed. Candidate actions now reuse the normal
  result-row actions: Enter copies the word, Command-Return speaks the full
  candidate rather than the input prefix, Command-L shows the word and explanation;
  Tab still completes the query.
- Removed the speech-to-SEARCH connection and query echo, which previously caused
  re-entry and list redraw after speech. The SEARCH-to-SPEECH connection retains
  its keep-open flag. A regression test prevents restoring the refresh loop.
- Alfred Preferences visibly loaded 0.1.4 with no outgoing connection from SPEECH.
- UI: selecting transfer under `ed trans` and pressing Command-L displayed the
  candidate word and the explanation supplied by Youdao Suggest in Large Type.
  Escape returned to the list. Enter then executed the action and cleared the query.
  This acceptance copied the test candidate to the clipboard.
- Physical Command-Return playback/window stability still needs manual validation;
  the existing automation limitation below applies. The redraw loop was confirmed
  in the old graph and removed, but the absence of all visible jitter is not claimed
  from static routing tests.

Earlier-version checks (historical behavior where noted):

- `node --test`: 15 passing tests, no external services or real HOME changes.
- Python package regression checks: 3 passing tests. The Run Script object uses
  schema version 2; version 3 in 0.1.0 caused Alfred's incompatible-workflow error.
  The schema regression test failed before this fix and passed afterward.
- `bash -n launch.sh`: passed.
- Package builder validates ZIP integrity and reads back its generated plist.
- Live provider checks passed for `hello`, `你好`, `getHTTPServer`, and
  `The request was cancelled because a newer query was started.` with
  the default Youdao + Google providers. No failure rows in these checks.
- One terminal run observed cold query completion in roughly 0.7–1.2 seconds.
  This is a single local smoke check, not a performance guarantee.
- Actual incremental CLI polling: first pending response about 48 ms, completed
  results within about 960 ms; cached query about 77 ms. Tested with a temporary
  cache directory removed after the check.
- Bing's translator page was accessible, but translation requests failed in
  the development network. It is optional and disabled by default.

- Alfred Preferences visibly loaded version 0.1.1 and displayed all three workflow
  objects (Script Filter, Run Script, Universal Action), without the incompatibility
  warning. The observed Alfred version was 5.8.1 [2349].
- Version 0.1.2 imported with a dedicated Command speech branch. Both links on
  this branch veto closing Alfred; speech runs in the background and passes the
  original query back to the Script Filter. The regression check covers routing.
- UI check: `ed hello` displayed dictionary and Google results. Command-L displayed
  the full selected dictionary sense in Large Type; Escape returned to the query.
- Version 0.1.3 was updated through Alfred Preferences. Live `ed trans` displayed
  six prefix candidates with Chinese explanations, following the first dictionary
  meaning: transfer, transition, transaction, transform, transport, transient.
- UI acceptance: selecting transfer and pressing Return changed the field to
  `ed transfer`, kept Alfred open and displayed transfer's dictionary results.
  Selecting transition and pressing Tab changed the field to `ed transition`.
- Suggestion regression tests cover English-prefix gating, the enabled-Youdao
  requirement, malformed responses, deduplication, exact-word exclusion, prefix
  filtering, the six-item limit, autocomplete routing and silent failure fallback.
- A live `--wait trans` check also returned the six candidates alongside Youdao
  and Google results, without provider errors.
- UI automation could not verify Command-Return: injected modifier actions were
  observed in Alfred's debugger as plain copy actions. Physical-key validation of
  the speech branch and its window retention remains necessary.

Not verified in Alfred UI: Universal Actions routing, physical Command-Return,
local speech playback and speech-window retention.
These remain manual acceptance items; CLI JSON and unit tests are not full UI E2E.

The fixed workflow is now present in Alfred. UI automation action attempts hit the
copy branch and copied a test dictionary sense. No dependency installation,
publication or push was performed.
