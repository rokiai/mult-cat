import { config as baseConfig } from './wdio.conf.js';
import { getChromeExtensionPath, getFirefoxExtensionPath } from '../utils/extension-path.js';
import { IS_CI, IS_FIREFOX } from '@extension/env';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const extName = IS_FIREFOX ? '.xpi' : '.zip';
const extensions = await readdir(join(import.meta.dirname, '../../../dist-zip'));
const latestExtension = extensions.filter(file => extname(file) === extName).at(-1);
const extPath = join(import.meta.dirname, `../../../dist-zip/${latestExtension}`);
const bundledExtension = (await readFile(extPath)).toString('base64');
/** Unpacked build — Chrome `extensions: [base64]` only accepts .crx, not .zip. */
const unpackedExtPath = resolve(import.meta.dirname, '../../../dist');

const chromeCapabilities = {
  browserName: 'chrome',
  // Force Chrome for Testing (branded Chrome 137+ may ignore --load-extension).
  browserVersion: 'stable',
  acceptInsecureCerts: true,
  'goog:chromeOptions': {
    // Prefer Chrome for Testing (still allows --load-extension).
    args: [
      `--disable-extensions-except=${unpackedExtPath}`,
      `--load-extension=${unpackedExtPath}`,
      '--disable-web-security',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      // Old `--headless` does not load extensions.
      ...(IS_CI ? ['--headless=new'] : []),
    ],
    prefs: { 'extensions.ui.developer_mode': true },
  },
};

const firefoxCapabilities = {
  browserName: 'firefox',
  acceptInsecureCerts: true,
  'moz:firefoxOptions': {
    args: [...(IS_CI ? ['--headless'] : [])],
  },
};

export const config: WebdriverIO.Config = {
  ...baseConfig,
  capabilities: IS_FIREFOX ? [firefoxCapabilities] : [chromeCapabilities],

  maxInstances: 1,
  logLevel: 'error',
  execArgv: IS_CI ? [] : ['--inspect'],
  before: async ({ browserName }: WebdriverIO.Capabilities, _specs, browser: WebdriverIO.Browser) => {
    if (browserName === 'firefox') {
      await browser.installAddOn(bundledExtension, true);

      browser.addCommand('getExtensionPath', async () => getFirefoxExtensionPath(browser));
    } else if (browserName === 'chrome') {
      browser.addCommand('getExtensionPath', async () => getChromeExtensionPath(browser));
    }
  },
  afterTest: async () => {
    if (!IS_CI) {
      await browser.pause(500);
    }
  },
};
