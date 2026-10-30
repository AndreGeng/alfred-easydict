export interface LanguagePreferences { primary: string; secondary: string }
export interface Dictionary {
  phonetic?: string;
  senses?: { text: string; note?: string }[];
  forms?: string[];
  web?: { text: string; note?: string }[];
}
export interface Suggestion { word: string; explanation: string }
export type ProviderValue = Dictionary | Suggestion[] | string;
export type Provider = (query: string, signal?: AbortSignal, preferences?: LanguagePreferences) => Promise<ProviderValue>;
export type Providers = Record<string, Provider>;
export interface QueryState {
  updated: number;
  results: { Youdao?: Dictionary; Suggest?: Suggestion[]; Google?: string; Bing?: string; [name: string]: ProviderValue | undefined };
  errors: Record<string, string>;
  pending: string[];
  id?: string;
  query?: string;
}
export interface ResultItem {
  title: string;
  subtitle: string;
  copy?: string;
  speak?: string;
  fullText?: string;
  completion?: string;
}
