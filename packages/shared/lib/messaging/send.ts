import type { ExtensionMessage, ExtensionResponse, TranslateTextResultMessage } from './types.js';
import type { TranslateRequest, TranslateResult } from '@extension/translate';

const CONTENT_SCRIPT_FILE = 'content/all.iife.js';
const CONTENT_SCRIPT_DEV_FILE = 'content/all.iife_dev.js';

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const isNoReceiverError = (message: string): boolean =>
  /Receiving end does not exist|Could not establish connection/i.test(message);

const sendToBackground = async <T extends ExtensionResponse = ExtensionResponse>(
  message: ExtensionMessage,
): Promise<T> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });

const sendToTabOnce = async <T extends ExtensionResponse>(tabId: number, message: ExtensionMessage): Promise<T> =>
  new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: T) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });

const sendToTabWithRetries = async <T extends ExtensionResponse>(
  tabId: number,
  message: ExtensionMessage,
  attempts: number,
  intervalMs: number,
): Promise<T> => {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await sendToTabOnce<T>(tabId, message);
    } catch (error) {
      lastError = error;
      const messageText = error instanceof Error ? error.message : String(error);
      if (!isNoReceiverError(messageText) || i === attempts - 1) {
        throw error;
      }
      await delay(intervalMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

/**
 * Inject content script into an already-open tab.
 * - Production: inject the IIFE bundle via `files`
 * - Dev (HMR stub): also import `*_dev.js` via absolute chrome-extension URL
 *   (relative import inside the stub breaks under executeScript)
 */
const ensureContentScript = async (tabId: number): Promise<void> => {
  await chrome.scripting
    .executeScript({
      target: { tabId },
      files: [CONTENT_SCRIPT_FILE],
    })
    .catch(() => undefined);

  const devUrl = chrome.runtime.getURL(CONTENT_SCRIPT_DEV_FILE);
  await chrome.scripting
    .executeScript({
      target: { tabId },
      func: (url: string) => import(/* webpackIgnore: true */ url),
      args: [devUrl],
    })
    .catch(() => undefined);
};

/**
 * Send a message to the tab content script.
 * Retries + programmatic inject cover: page opened before extension load, and
 * dev HMR stubs that register the listener only after async import().
 */
const sendToTab = async <T extends ExtensionResponse = ExtensionResponse>(
  tabId: number,
  message: ExtensionMessage,
): Promise<T> => {
  try {
    return await sendToTabWithRetries<T>(tabId, message, 4, 75);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    if (!isNoReceiverError(messageText)) {
      throw error;
    }

    await ensureContentScript(tabId);
    return sendToTabWithRetries<T>(tabId, message, 10, 100);
  }
};

const translateTextViaBackground = async (payload: TranslateRequest): Promise<TranslateResult> => {
  const response = await sendToBackground<TranslateTextResultMessage>({
    type: 'TRANSLATE_TEXT',
    payload,
  });

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.result;
};

export { sendToBackground, ensureContentScript, sendToTab, translateTextViaBackground };
