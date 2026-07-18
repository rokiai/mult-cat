import 'webextension-polyfill';
import { exampleThemeStorage, translationSettingsStorage } from '@extension/storage';
import { translate } from '@extension/translate';
import type { ExtensionMessage, TranslateTextResultMessage } from '@extension/shared';
import type { TranslateRequest } from '@extension/translate';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
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
