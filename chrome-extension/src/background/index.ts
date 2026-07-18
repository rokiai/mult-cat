import 'webextension-polyfill';
import { exampleThemeStorage, refreshBuiltinSiteRulesFromRemote, translationSettingsStorage } from '@extension/storage';
import { translate } from '@extension/translate';
import type { ExtensionMessage, TranslateTextResultMessage } from '@extension/shared';
import type { TranslateRequest } from '@extension/translate';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

const refreshBuiltinRulesQuietly = () => {
  void refreshBuiltinSiteRulesFromRemote().catch(() => undefined);
};

chrome.runtime.onInstalled.addListener(() => {
  refreshBuiltinRulesQuietly();
});

chrome.runtime.onStartup.addListener(() => {
  refreshBuiltinRulesQuietly();
});

// Service worker wake: also try once when the background module loads.
refreshBuiltinRulesQuietly();

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'REFRESH_BUILTIN_SITE_RULES') {
    void refreshBuiltinSiteRulesFromRemote()
      .then(rules => {
        sendResponse(rules ? { ok: true as const } : { ok: false as const, error: 'Remote fetch failed' });
      })
      .catch((error: unknown) => {
        sendResponse({
          ok: false as const,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return true;
  }

  if (message.type !== 'TRANSLATE_TEXT') {
    return false;
  }

  void (async () => {
    try {
      const settings = await translationSettingsStorage.get();
      const payload: TranslateRequest = { ...message.payload };

      if (payload.provider === 'openai') {
        payload.apiKey = settings.llmApiKey ?? '';
        payload.apiUrl = settings.llmApiUrl || 'https://api.openai.com/v1';
        payload.model = settings.llmModel || 'gpt-4o-mini';
      }

      const result = await translate(payload);
      const response: TranslateTextResultMessage = {
        type: 'TRANSLATE_TEXT_RESULT',
        ok: true,
        result,
      };
      sendResponse(response);
    } catch (error: unknown) {
      const response: TranslateTextResultMessage = {
        type: 'TRANSLATE_TEXT_RESULT',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      sendResponse(response);
    }
  })();

  return true;
});

console.log('Background loaded');
