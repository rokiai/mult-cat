const AUTH_URL = 'https://edge.microsoft.com/translate/auth';

type TokenCache = {
  token: string;
  exp: number;
};

let cache: TokenCache | null = null;

const parseExp = (token: string): number => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return 0;
    const json = JSON.parse(atob(payload)) as { exp?: number };
    return json.exp ?? 0;
  } catch {
    return 0;
  }
};

const isFresh = (entry: TokenCache | null): entry is TokenCache => !!entry && entry.exp * 1000 > Date.now() + 1000;

/**
 * Fetch a Microsoft Edge translator bearer token (memory-cached).
 */
export const getMicrosoftToken = async (): Promise<string> => {
  if (isFresh(cache)) {
    return cache.token;
  }

  const response = await fetch(AUTH_URL);
  if (!response.ok) {
    throw new Error(`Microsoft auth failed: ${response.status}`);
  }

  const token = (await response.text()).trim();
  if (!token) {
    throw new Error('Microsoft auth returned empty token');
  }

  cache = { token, exp: parseExp(token) };
  return token;
};
