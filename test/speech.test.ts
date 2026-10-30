import test from 'node:test';
import assert from 'node:assert/strict';
import { speechLanguage, selectVoice, speechCommand } from '@easydict/core/speech';

const voices = `Samantha            en_US    # Hello!
Eddy (Japanese (Japan)) ja_JP # こんにちは
Kyoko               ja_JP    # こんにちは
Tingting            zh_CN    # 你好
Yuna                ko_KR    # 안녕하세요`;

test('Japanese and Korean take priority over Han; English retains the default voice', () => {
  for (const text of ['こんにちは', '日本語です', 'コンニチハ']) assert.equal(speechLanguage(text), 'ja');
  assert.equal(speechLanguage('韓國 안녕하세요'), 'ko');
  assert.equal(speechLanguage('你好'), 'zh');
  assert.equal(speechLanguage('hello'), undefined);
});

test('macOS selects an installed native voice, including names containing spaces', () => {
  assert.equal(selectVoice('ja', voices), 'Kyoko');
  assert.equal(selectVoice('zh', voices), 'Tingting');
  assert.equal(selectVoice('ko', voices), 'Yuna');
  assert.equal(selectVoice('ja', 'Eddy (Japanese (Japan)) ja_JP # hello'), 'Eddy (Japanese (Japan))');
  assert.throws(() => selectVoice('ja', 'Samantha en_US # hello'), /ja/);
  assert.deepEqual(speechCommand('こんにちは', 'darwin', selectVoice('ja', voices)),
    ['/usr/bin/say', ['-v', 'Kyoko', '--', 'こんにちは']]);
});

test('Linux requests the text language; speech text remains a literal argument', () => {
  assert.deepEqual(speechCommand('こんにちは', 'linux'), ['spd-say', ['--wait', '-l', 'ja', '--', 'こんにちは']]);
  const text = '-n $(touch /tmp/not-executed) こんにちは';
  assert.deepEqual(speechCommand(text, 'darwin', 'Kyoko'), ['/usr/bin/say', ['-v', 'Kyoko', '--', text]]);
});
