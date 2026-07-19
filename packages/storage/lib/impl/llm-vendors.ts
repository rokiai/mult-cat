/** OpenAI-compatible LLM vendors for translation settings. */

export type LlmVendorId =
  'openai' | 'kimi' | 'deepseek' | 'zhipu' | 'qwen' | 'doubao' | 'siliconflow' | 'openrouter' | 'custom';

export type LlmModelOption = {
  id: string;
  label: string;
};

export type LlmVendorOption = {
  id: LlmVendorId;
  name: string;
  /** Short mark shown in UI when no SVG (e.g. "O", "K"). */
  mark: string;
  /** Brand accent for icon chip. */
  color: string;
  /** Default OpenAI-compatible base URL. */
  baseUrl: string;
  defaultModel: string;
  models: LlmModelOption[];
  /** Placeholder hint for API token field. */
  tokenHint?: string;
};

export const LLM_VENDORS: LlmVendorOption[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    mark: 'O',
    color: '#10a37f',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    tokenHint: 'sk-...',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
      { id: 'gpt-4.1', label: 'GPT-4.1' },
      { id: 'o4-mini', label: 'o4-mini' },
      { id: 'o3-mini', label: 'o3-mini' },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    mark: 'K',
    color: '#1783ff',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    tokenHint: 'sk-...',
    models: [
      { id: 'moonshot-v1-8k', label: 'moonshot-v1-8k' },
      { id: 'moonshot-v1-32k', label: 'moonshot-v1-32k' },
      { id: 'moonshot-v1-128k', label: 'moonshot-v1-128k' },
      { id: 'kimi-latest', label: 'kimi-latest' },
      { id: 'kimi-k2.5', label: 'Kimi K2.5' },
      { id: 'kimi-k2.6', label: 'Kimi K2.6' },
      { id: 'kimi-k3', label: 'Kimi K3' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    mark: 'D',
    color: '#4d6bfe',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    tokenHint: 'sk-...',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
    ],
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    mark: 'Z',
    color: '#2254f4',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    tokenHint: 'API Key',
    models: [
      { id: 'glm-4-flash', label: 'GLM-4-Flash' },
      { id: 'glm-4-air', label: 'GLM-4-Air' },
      { id: 'glm-4-plus', label: 'GLM-4-Plus' },
      { id: 'glm-4.5-flash', label: 'GLM-4.5-Flash' },
      { id: 'glm-4.5', label: 'GLM-4.5' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问',
    mark: 'Q',
    color: '#615ced',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
    tokenHint: 'sk-...',
    models: [
      { id: 'qwen-turbo', label: 'Qwen Turbo' },
      { id: 'qwen-plus', label: 'Qwen Plus' },
      { id: 'qwen-max', label: 'Qwen Max' },
      { id: 'qwen-long', label: 'Qwen Long' },
      { id: 'qwen3-max', label: 'Qwen3 Max' },
    ],
  },
  {
    id: 'doubao',
    name: '豆包 (火山方舟)',
    mark: '豆',
    color: '#3b82f6',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-1-5-pro-32k',
    tokenHint: 'API Key',
    models: [
      { id: 'doubao-1-5-lite-32k', label: 'Doubao 1.5 Lite' },
      { id: 'doubao-1-5-pro-32k', label: 'Doubao 1.5 Pro' },
      { id: 'doubao-seed-1-6', label: 'Doubao Seed 1.6' },
    ],
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    mark: 'Si',
    color: '#7c3aed',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    tokenHint: 'sk-...',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3' },
      { id: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek-R1' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen2.5-72B' },
      { id: 'moonshotai/Kimi-K2-Instruct', label: 'Kimi-K2-Instruct' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    mark: 'OR',
    color: '#a855f7',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    tokenHint: 'sk-or-...',
    models: [
      { id: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o mini' },
      { id: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
      { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
    ],
  },
  {
    id: 'custom',
    name: '自定义 (OpenAI 兼容)',
    mark: '⋯',
    color: '#64748b',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: '',
    tokenHint: 'API Token',
    models: [],
  },
];

export const getLlmVendor = (id: LlmVendorId | string | undefined): LlmVendorOption =>
  LLM_VENDORS.find(v => v.id === id) ?? LLM_VENDORS[0]!;

export const CUSTOM_LLM_MODEL_VALUE = '__custom__';
