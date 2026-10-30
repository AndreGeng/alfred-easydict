import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
type SpeechLanguage = 'ja' | 'ko' | 'zh';

// Kana/Hangul must take precedence over Han in mixed-script sentences.
// Latin text and Han-only Japanese are ambiguous without language metadata.
export function speechLanguage(text: string): SpeechLanguage | undefined {
  if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) return 'ja';
  if (/\p{Script=Hangul}/u.test(text)) return 'ko';
  if (/\p{Script=Han}/u.test(text)) return 'zh';
  return undefined;
}

export function selectVoice(language: SpeechLanguage, listing: string): string {
  const voices = listing.split('\n').flatMap(line => {
    const match = line.match(/^(.+?)\s+([a-z]{2,3})[_-]([A-Za-z]{2})\s+#/);
    return match && match[2] === language ? [match[1].trim()] : [];
  });
  const preferred = { ja: 'Kyoko', ko: 'Yuna', zh: 'Tingting' }[language];
  const voice = voices.includes(preferred) ? preferred : voices[0];
  if (!voice) throw new Error(`没有可用的 ${language} 语音，请在 macOS 系统设置中安装对应语言的语音`);
  return voice;
}

export function speechCommand(text: string, platform: string = process.platform, voice?: string): [string, string[]] {
  if (platform === 'darwin') return ['/usr/bin/say', [...(voice ? ['-v', voice] : []), '--', text]];
  if (platform === 'linux') {
    const language = speechLanguage(text);
    return ['spd-say', ['--wait', ...(language ? ['-l', language] : []), '--', text]];
  }
  throw new Error('Speech is supported on macOS and Linux');
}

export async function speak(text: string): Promise<void> {
  const language = speechLanguage(text);
  let voice: string | undefined;
  if (process.platform === 'darwin' && language) {
    const { stdout } = await run('/usr/bin/say', ['-v', '?'], { timeout: 10000 });
    voice = selectVoice(language, stdout);
  }
  const [command, args] = speechCommand(text, process.platform, voice);
  try {
    await run(command, args, { timeout: 60000 });
  } catch {
    throw new Error(process.platform === 'linux'
      ? '朗读失败：请安装并配置 speech-dispatcher（spd-say）及对应语言语音'
      : '朗读失败：请检查 macOS 系统语音');
  }
}
