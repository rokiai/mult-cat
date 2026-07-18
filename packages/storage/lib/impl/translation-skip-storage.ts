import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

type TranslationSkipState = {
  /** Selectors applied on every site. */
  globalSelectors: string[];
  /** hostname → selectors */
  byHost: Record<string, string[]>;
};

type TranslationSkipStorageType = BaseStorageType<TranslationSkipState> & {
  addGlobal: (selector: string) => Promise<void>;
  addForHost: (host: string, selector: string) => Promise<void>;
  removeGlobal: (selector: string) => Promise<void>;
  removeForHost: (host: string, selector: string) => Promise<void>;
  listForHost: (host: string) => Promise<string[]>;
};

const normalizeSelector = (selector: string): string => selector.trim();

const uniquePush = (list: string[], selector: string): string[] => {
  const next = normalizeSelector(selector);
  if (!next || list.includes(next)) return list;
  return [...list, next];
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
};

/** Always-on selectors (HTML / Google Translate conventions + our mark). */
const BUILTIN_SKIP_SELECTORS = [
  '.notranslate',
  '[translate="no"]',
  '[data-ceb-skip]',
  '[contenteditable="true"]',
] as const;

export { translationSkipStorage, BUILTIN_SKIP_SELECTORS };
export type { TranslationSkipState, TranslationSkipStorageType };
