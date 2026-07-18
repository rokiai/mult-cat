/**
 * Returns the Chrome extension path.
 * @param browser
 * @returns path to the Chrome extension
 */
export const getChromeExtensionPath = async (browser: WebdriverIO.Browser) => {
  await browser.url('chrome://extensions/');

  /**
   * https://webdriver.io/docs/extension-testing/web-extensions/#test-popup-modal-in-chrome
   *
   * Shadow DOM on chrome://extensions must be walked manually.
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

      const extensionItem = await itemList.shadow$('extensions-item');
      if (!(await extensionItem.isExisting())) {
        return false;
      }

      return extensionItem.getAttribute('id');
    },
    {
      timeout: 20000,
      interval: 500,
      timeoutMsg: 'Chrome extension did not appear on chrome://extensions (need --headless=new in CI)',
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
