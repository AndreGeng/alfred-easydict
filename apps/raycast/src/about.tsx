import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Action, ActionPanel, Detail, environment } from '@raycast/api';

function About() {
  const info: { version: string; commit: string; dirty: boolean; release: boolean } =
    JSON.parse(readFileSync(join(environment.assetsPath, 'build-info.json'), 'utf8'));
  const repository = 'https://github.com/AndreGeng/FelixDict';
  const url = info.release ? `${repository}/releases/tag/v${info.version}` : `${repository}/releases`;
  const description = `# FelixDict\n\n查词、拼写建议与多语言翻译。\n\nDictionary, spelling suggestions and multilingual translation.\n\n` +
    `- **版本 / Version:** ${info.version}\n` +
    `- **构建 / Build:** ${info.release ? 'Release' : '本地开发 / Development'}\n` +
    `- **Git commit:** ${info.commit}${info.dirty ? ' (含未提交改动 / uncommitted changes)' : ''}\n\n` +
    '构建信息用于识别代码版本；下载来源请结合 Release 校验和确认。\n\nBuild metadata identifies the code version; verify release checksums to confirm the downloaded artifact.';
  return <Detail navigationTitle="关于 FelixDict / About FelixDict" markdown={description}
    actions={<ActionPanel>
      <Action.OpenInBrowser title="GitHub Releases" url={url} />
      <Action.CopyToClipboard title="复制版本信息 / Copy Version Info" content={description} />
    </ActionPanel>} />;
}

export function AboutAction() {
  return <Action.Push title="关于 FelixDict / About FelixDict" target={<About />} />;
}
