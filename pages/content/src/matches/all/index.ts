import { domTranslator } from '@src/matches/all/dom-translator';
import { initSelectionTranslate } from '@src/matches/all/selection-translator';
import { startSkipPickMode } from '@src/matches/all/skip-picker';
import type { ExtensionMessage } from '@extension/shared';

declare global {
  interface Window {
    __CEB_TRANSLATE_READY__?: boolean;
  }
}

if (!window.__CEB_TRANSLATE_READY__) {
  window.__CEB_TRANSLATE_READY__ = true;

  console.log('[CEB] All content script loaded');
  initSelectionTranslate();

  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'START_SKIP_PICK') {
      try {
        sendResponse(startSkipPickMode());
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return false;
    }

    if (message.type === 'GET_PAGE_TRANSLATE_STATE') {
      sendResponse({ ok: true, enabled: domTranslator.isEnabled });
      return false;
    }

    if (message.type !== 'TRANSLATE_PAGE') {
      return false;
    }

    void (async () => {
      try {
        if (message.enabled) {
          await domTranslator.start();
        } else {
          domTranslator.restore();
        }
        sendResponse({ ok: true, enabled: domTranslator.isEnabled });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();

    return true;
  });
}
