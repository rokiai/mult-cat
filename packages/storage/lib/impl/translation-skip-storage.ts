import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

type TranslationSkipState = {
  /** Selectors applied on every site. */
  globalSelectors: string[];
  /** hostname → selectors */
  byHost: Record<string, string[]>;
};

type TranslationSkipExport = {
  version: 1;
  exportedAt: string;
  globalSelectors: string[];
  byHost: Record<string, string[]>;
};

type ImportUserRulesOptions = {
  mode?: 'merge';
};

type TranslationSkipStorageType = BaseStorageType<TranslationSkipState> & {
  addGlobal: (selector: string) => Promise<void>;
  addForHost: (host: string, selector: string) => Promise<void>;
  removeGlobal: (selector: string) => Promise<void>;
  removeForHost: (host: string, selector: string) => Promise<void>;
  listForHost: (host: string) => Promise<string[]>;
  exportUserRules: () => Promise<TranslationSkipExport>;
  importUserRules: (payload: unknown, options?: ImportUserRulesOptions) => Promise<TranslationSkipState>;
};

const normalizeSelector = (selector: string): string => selector.trim();

const uniquePush = (list: string[], selector: string): string[] => {
  const next = normalizeSelector(selector);
  if (!next || list.includes(next)) return list;
  return [...list, next];
};

const uniqueList = (list: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const next = normalizeSelector(item);
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
};

const mergeSelectorLists = (current: readonly string[], incoming: readonly string[]): string[] => {
  let next = [...current];
  for (const item of incoming) {
    next = uniquePush(next, item);
  }
  return next;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

const parseImportPayload = (payload: unknown): { globalSelectors: string[]; byHost: Record<string, string[]> } => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid skip rules file');
  }
  const data = payload as Record<string, unknown>;
  if (data.version !== 1) {
    throw new Error('Unsupported skip rules version');
  }
  if (!isStringArray(data.globalSelectors)) {
    throw new Error('Invalid globalSelectors');
  }
  if (!data.byHost || typeof data.byHost !== 'object' || Array.isArray(data.byHost)) {
    throw new Error('Invalid byHost');
  }

  const byHost: Record<string, string[]> = {};
  for (const [host, selectors] of Object.entries(data.byHost as Record<string, unknown>)) {
    const key = host.trim().toLowerCase();
    if (!key || !isStringArray(selectors)) continue;
    const list = uniqueList(selectors);
    if (list.length === 0) continue;
    byHost[key] = list;
  }

  return {
    globalSelectors: uniqueList(data.globalSelectors),
    byHost,
  };
};

const storage = createStorage<TranslationSkipState>(
  'translation-skip-storage-key',
  {
    globalSelectors: [],
    byHost: {},
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

const translationSkipStorage: TranslationSkipStorageType = {
  ...storage,
  addGlobal: async selector => {
    await storage.set(current => ({
      ...current,
      globalSelectors: uniquePush(current.globalSelectors, selector),
    }));
  },
  addForHost: async (host, selector) => {
    const key = host.trim().toLowerCase();
    if (!key) return;
    await storage.set(current => ({
      ...current,
      byHost: {
        ...current.byHost,
        [key]: uniquePush(current.byHost[key] ?? [], selector),
      },
    }));
  },
  removeGlobal: async selector => {
    const target = normalizeSelector(selector);
    await storage.set(current => ({
      ...current,
      globalSelectors: current.globalSelectors.filter(item => item !== target),
    }));
  },
  removeForHost: async (host, selector) => {
    const key = host.trim().toLowerCase();
    const target = normalizeSelector(selector);
    await storage.set(current => {
      const existing = current.byHost[key] ?? [];
      const nextList = existing.filter(item => item !== target);
      const byHost = { ...current.byHost };
      if (nextList.length === 0) {
        delete byHost[key];
      } else {
        byHost[key] = nextList;
      }
      return { ...current, byHost };
    });
  },
  listForHost: async host => {
    const state = await storage.get();
    const key = host.trim().toLowerCase();
    return [...state.globalSelectors, ...(state.byHost[key] ?? [])];
  },
  exportUserRules: async () => {
    const state = await storage.get();
    const byHost: Record<string, string[]> = {};
    for (const [host, selectors] of Object.entries(state.byHost ?? {})) {
      const list = uniqueList(selectors ?? []);
      if (list.length === 0) continue;
      byHost[host] = list;
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      globalSelectors: uniqueList(state.globalSelectors ?? []),
      byHost,
    };
  },
  importUserRules: async (payload, options = {}) => {
    const mode = options.mode ?? 'merge';
    const incoming = parseImportPayload(payload);
    if (mode !== 'merge') {
      throw new Error('Unsupported import mode');
    }

    let nextState: TranslationSkipState = { globalSelectors: [], byHost: {} };
    await storage.set(current => {
      const globalSelectors = mergeSelectorLists(current.globalSelectors ?? [], incoming.globalSelectors);
      const byHost: Record<string, string[]> = { ...(current.byHost ?? {}) };
      for (const [host, selectors] of Object.entries(incoming.byHost)) {
        byHost[host] = mergeSelectorLists(byHost[host] ?? [], selectors);
      }
      nextState = { globalSelectors, byHost };
      return nextState;
    });
    return nextState;
  },
};

/** Always-on selectors (HTML / Google Translate conventions + our mark). */
const BUILTIN_SKIP_SELECTORS = [
  '.notranslate',
  '[translate="no"]',
  '[data-ceb-skip]',
  '[contenteditable="true"]',
  // Extension UI — must not be swept into page bilingual mode.
  '#ceb-selection-root',
  '#ceb-skip-pick-toast',
] as const;

export { translationSkipStorage, BUILTIN_SKIP_SELECTORS };
export type { TranslationSkipState, TranslationSkipStorageType, TranslationSkipExport, ImportUserRulesOptions };
