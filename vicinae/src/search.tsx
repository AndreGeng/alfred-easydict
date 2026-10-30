import { useEffect, useMemo, useRef, useState } from 'react';
import { Action, ActionPanel, Cache, Clipboard, Detail, List, Toast,
  closeMainWindow, getPreferenceValues, showToast, type LaunchProps } from '@vicinae/api';
import { createSearchSession, prepareQuery, resultRows, pronunciationText } from './model.mjs';
import { speak } from './speech.mjs';

type State = { updated: number; results: Record<string, unknown>; errors: Record<string, string>; pending: string[] };
type Row = { id: string; title: string; subtitle: string; copy?: string; speak?: string; fullText?: string; completion?: string };
const modifier = process.platform === 'darwin' ? '⌘' : 'Ctrl+';
const shortcutHint = `Enter 复制 · ${modifier}Enter 朗读 · ${modifier}L 全文 · ${modifier}O 补全建议`;
const cache = new Cache({ namespace: 'queries-v1', capacity: 5 * 1024 * 1024 });
const markdown = (text: string) => text.replace(/[\\`*_{}\[\]()<>#+.!|~-]/g, '\\$&').replace(/\n/g, '  \n');

async function readAloud(text: string) {
  const toast = await showToast({ style: Toast.Style.Animated, title: '正在朗读 / Speaking' });
  try {
    await speak(text);
    toast.style = Toast.Style.Success;
    toast.title = '朗读完成 / Finished speaking';
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = (error as Error).message;
  }
}

function ResultActions({ row, complete, detail = false }: { row: Row; complete: (word: string) => void; detail?: boolean }) {
  return <ActionPanel>
    <Action title="复制 / Copy" onAction={async () => {
      try { await Clipboard.copy(row.copy!); await closeMainWindow(); }
      catch { await showToast({ style: Toast.Style.Failure, title: '复制失败 / Copy failed' }); }
    }} />
    <Action title="朗读 / Speak" shortcut={{ modifiers: ['cmd'], key: 'return' }}
      onAction={() => { void readAloud(row.speak!); }} />
    {!detail && <Action.Push title="查看全文 / Full Text" shortcut={{ modifiers: ['cmd'], key: 'l' }}
      target={<Detail navigationTitle="全文 / Full Text" markdown={markdown(row.fullText || row.copy!)}
        actions={<ResultActions row={row} complete={complete} detail />} />} />}
    {row.completion && !detail && <Action title="补全并查询 / Complete Word"
      shortcut={{ modifiers: ['cmd'], key: 'o' }} onAction={() => complete(row.completion!)} />}
  </ActionPanel>;
}

export default function Search(props: LaunchProps<{ arguments: { query?: string } }>) {
  const initialQuery = props.arguments?.query || props.fallbackText || '';
  const [query, setQuery] = useState(initialQuery);
  const [state, setState] = useState<State | null>(null);
  const [message, setMessage] = useState('输入单词、词语或句子 / Enter a word or sentence');
  const preferences = useMemo(() => getPreferenceValues<Record<string, string>>(), []);
  const session = useMemo(() => createSearchSession(cache, (value: State) => setState(value)), []);
  const [selectedId, setSelectedId] = useState<string>();
  const [pronunciation, setPronunciation] = useState<{ word: string; state: State } | null>(null);
  const input = useRef(initialQuery);
  function change(text: string) {
    session.cancel();
    setSelectedId(undefined);
    input.current = text;
    setState(null);
    setQuery(text);
  }
  useEffect(() => {
    let plan;
    try { plan = prepareQuery(query, preferences); setMessage('正在查询… / Searching…'); }
    catch (error) { setMessage((error as Error).message); return; }
    const timer = setTimeout(() => {
      if (input.current !== query) return;
      void session.search(plan).catch(() => setMessage('查询失败，请重试 / Query failed'));
    }, 250);
    return () => { clearTimeout(timer); session.cancel(); };
  }, [query, preferences, session]);
  const rows: Row[] = state ? resultRows(query.trim(), state) : [];
  const selected = rows.find(row => row.id === selectedId) || rows[0];
  const suggestedWord = selected?.completion;
  useEffect(() => {
    setPronunciation(null);
    if (!suggestedWord) return;
    // Suggestions contain glosses only. Fetch pronunciation for the selected word,
    // rather than sending a dictionary request for every visible suggestion.
    const lookup = createSearchSession(cache, (value: State) =>
      setPronunciation({ word: suggestedWord, state: value }));
    const plan = prepareQuery(suggestedWord, { ...preferences, providers: 'Youdao' });
    delete plan.selected.Suggest;
    plan.key += ":pronunciation";
    const timer = setTimeout(() => { void lookup.search(plan).catch(() => {}); }, 200);
    return () => { clearTimeout(timer); lookup.cancel(); };
  }, [suggestedWord, preferences]);
  function phoneticFor(row: Row) {
    if (row.completion) {
      if (row.id !== selected?.id) return '';
      return pronunciationText(pronunciation?.word === row.completion ? pronunciation.state : null);
    }
    return row.subtitle.startsWith('有道词典')
      ? (state?.results.Youdao as { phonetic?: string } | undefined)?.phonetic || '' : '';
  }
  return <List onSelectionChange={setSelectedId} navigationTitle="Easydict" searchText={query} onSearchTextChange={change}
    filtering={false} isLoading={!!state?.pending.length}
    searchBarPlaceholder="单词 / prefix / :ja hello">
    <List.EmptyView title={message} description={shortcutHint} />
    <List.Section title={shortcutHint}>
    {rows.map(row => {
      const phonetic = phoneticFor(row);
      const subtitle = phonetic && !row.completion
        ? row.subtitle.replace(` · ${phonetic}`, '') : row.subtitle;
      const actionRow = phonetic ? { ...row, fullText: `${phonetic}\n\n${row.fullText || row.title}` } : row;
      return <List.Item key={row.id} id={row.id} icon="icon.png" title={row.title} subtitle={subtitle}
        accessories={phonetic ? [{ text: phonetic }] : []}
        actions={row.copy !== undefined ? <ResultActions row={actionRow} complete={change} /> : undefined} />;
    })}
    </List.Section>
  </List>;
}
