import { createStorage, StorageEnum } from '../base/index.js';
import type { ThemeStateType, ThemeStorageType } from '../base/index.js';

const storage = createStorage<ThemeStateType>(
  'theme-storage-key',
  {
    theme: 'light',
    isLight: true,
    accent: 'blue',
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const exampleThemeStorage: ThemeStorageType = {
  ...storage,
  toggle: async () => {
    await storage.set(currentState => {
      const newTheme = currentState.theme === 'light' ? 'dark' : 'light';

      return {
        ...currentState,
        accent: currentState.accent ?? 'blue',
        theme: newTheme,
        isLight: newTheme === 'light',
      };
    });
  },
  setTheme: async theme => {
    await storage.set(current => ({
      ...current,
      accent: current.accent ?? 'blue',
      theme,
      isLight: theme === 'light',
    }));
  },
  setAccent: async accent => {
    await storage.set(current => ({
      ...current,
      theme: current.theme ?? 'light',
      isLight: current.isLight ?? current.theme !== 'dark',
      accent,
    }));
  },
};

export const THEME_ACCENT_OPTIONS: Array<{ value: ThemeStateType['accent']; label: string; color: string }> = [
  { value: 'blue', label: 'Blue', color: '#1677ff' },
  { value: 'green', label: 'Green', color: '#52c41a' },
  { value: 'orange', label: 'Orange', color: '#fa8c16' },
  { value: 'purple', label: 'Purple', color: '#722ed1' },
  { value: 'red', label: 'Red', color: '#f5222d' },
];
