import { execFile } from 'node:child_process';

export function speechCommand(text: string, platform: string = process.platform): [string, string[]] {
  if (platform === 'darwin') return ['/usr/bin/say', ['--', text]];
  if (platform === 'linux') return ['spd-say', ['--wait', '--', text]];
  throw new Error('Speech is supported on macOS and Linux');
}

export function speak(text: string) {
  const [command, args] = speechCommand(text);
  return new Promise<void>((resolve, reject) => {
    execFile(command, args, { timeout: 60000 }, error => {
      if (error) reject(new Error(process.platform === 'linux'
        ? '朗读失败：请安装并配置 speech-dispatcher（spd-say）'
        : '朗读失败：请检查 macOS 系统语音'));
      else resolve();
    });
  });
}
