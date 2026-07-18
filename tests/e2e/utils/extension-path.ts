/**
 * Returns the Chrome extension path.
 * @param browser
 * @returns path to the Chrome extension
 */
export const getChromeExtensionPath = async (browser: WebdriverIO.Browser) => {
  await browser.url('chrome://extensions/');

  /**
   * Walk shadow DOM on chrome://extensions (WebdriverIO deep selectors are flaky here).
   * @url https://github.com/webdriverio/webdriverio/issues/13521
   */
  const extensionId = await browser.waitUntil(
    async () => {
      const extensionsManager = await $('extensions-manager');
      if (!(await extensionsManager.isExisting())) {
        return false;
      }

      const itemList = await extensionsManager.shadow$('#container > #viewManager > extensions-item-list');
      if (!(await itemList.isExisting())) {
        return false;
      }

      // Prefer MultCat if multiple items exist.
      const items = await itemList.shadow$$('extensions-item');
      if (!items.length) {
        return false;
      }

      for (const item of items) {
        try {
          const name = await (await item.shadow$('#name')).getText();
          if (name.includes('MultCat')) {
            return item.getAttribute('id');
          }
        } catch {
          // ignore and try next / fall through
        }
      }

      return items[0].getAttribute('id');
    },
    {
      timeout: 30000,
      interval: 500,
      timeoutMsg:
        'Chrome extension did not appear on chrome://extensions. Ensure dist/ exists and --load-extension is set (zip base64 is not a valid .crx).',
    },
  );

  if (!extensionId) {
    throw new Error('Extension ID not found');
  }

  return `chrome-extension://${extensionId}`;
};

/**
 * Returns the Firefox extension path.
 * @param browser
 * @returns path to the Firefox extension
 */
export const getFirefoxExtensionPath = async (browser: WebdriverIO.Browser) => {
  await browser.url('about:debugging#/runtime/this-firefox');
  const uuidElement = await browser.$('//dt[contains(text(), "Internal UUID")]/following-sibling::dd').getElement();
  const internalUUID = await uuidElement.getText();

  if (!internalUUID) {
    throw new Error('Internal UUID not found');
  }

  return `moz-extension://${internalUUID}`;
};
