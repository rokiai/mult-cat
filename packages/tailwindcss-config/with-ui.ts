import deepmerge from 'deepmerge';
import type { Config } from 'tailwindcss';

/** Merge page Tailwind content with shared `@extension/ui` component sources. */
export const withUI = (tailwindConfig: Config): Config =>
  deepmerge(tailwindConfig, {
    content: ['../../packages/ui/lib/**/*.tsx'],
  });
