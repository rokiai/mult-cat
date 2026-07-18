import { RichTranslateResult } from './RichTranslateResult';
import { getPopupCopy } from './ui-copy';
import {
  AimOutlined,
  ApiOutlined,
  BookOutlined,
  ClearOutlined,
  FileTextOutlined,
  RedoOutlined,
  RightOutlined,
  SettingOutlined,
  StarFilled,
  StarOutlined,
  SwapOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { sendToTab, translateTextViaBackground, useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import {
  TRANSLATION_FROM_LANG_OPTIONS,
  TRANSLATION_PROVIDER_OPTIONS,
  TRANSLATION_TO_LANG_OPTIONS,
  UI_LOCALE_OPTIONS,
  exampleThemeStorage,
  getLlmVendor,
  resolveUiLocale,
  translationSettingsStorage,
} from '@extension/storage';
import { ErrorDisplay, LoadingSpinner, ProviderLogo } from '@extension/ui';
import '@src/Popup.css';
import { App as AntApp, Button, ConfigProvider, Input, Select, theme as antdTheme } from 'antd';
import deDE from 'antd/locale/de_DE';
import enUS from 'antd/locale/en_US';
import esES from 'antd/locale/es_ES';
import frFR from 'antd/locale/fr_FR';
import jaJP from 'antd/locale/ja_JP';
import koKR from 'antd/locale/ko_KR';
import ptBR from 'antd/locale/pt_BR';
import ruRU from 'antd/locale/ru_RU';
import viVN from 'antd/locale/vi_VN';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';
import { useEffect, useMemo, useState } from 'react';
import type { PageTranslateStateResponse } from '@extension/shared';
import type { TranslationFromLang, TranslationProviderId, TranslationToLang, UiLocaleId } from '@extension/storage';
import type { TranslateResult } from '@extension/translate';
import type { ReactNode } from 'react';

const { TextArea } = Input;
const MAX_CHARS = 5000;
const LOGO_URL = chrome.runtime.getURL('popup/logo.png');

const providerLabel = (item: (typeof TRANSLATION_PROVIDER_OPTIONS)[number], llmName?: string): ReactNode => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <ProviderLogo provider={item.value} size={18} />
    <span>{item.value === 'openai' && llmName ? `${item.label} · ${llmName}` : item.label}</span>
  </span>
);

const ANTD_LOCALES: Record<string, typeof zhCN> = {
  zh_CN: zhCN,
  zh_TW: zhTW,
  en: enUS,
  ja: jaJP,
  ko: koKR,
  fr: frFR,
  de: deDE,
  es: esES,
  ru: ruRU,
  pt_BR: ptBR,
  vi: viVN,
};

const PopupContent = () => {
  const { message } = AntApp.useApp();
  const themeState = useStorage(exampleThemeStorage);
  const settings = useStorage(translationSettingsStorage);
  const [pageBusy, setPageBusy] = useState(false);
  const [boxBusy, setBoxBusy] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);
  const [pageOn, setPageOn] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [richResult, setRichResult] = useState<TranslateResult | null>(null);
  /** Temporary pair for popup box only — swap must not write storage. */
  const [boxPair, setBoxPair] = useState<{
    from: TranslationFromLang;
    to: TranslationToLang;
  } | null>(null);

  const effectiveLocale = resolveUiLocale(settings.uiLocale ?? 'auto');
  const copy = useMemo(() => getPopupCopy(effectiveLocale), [effectiveLocale]);

  const boxFrom = boxPair?.from ?? settings.fromLang ?? 'auto';
  const boxTo = boxPair?.to ?? settings.toLang ?? 'zh-CN';

  const fromOptions = useMemo(
    () => TRANSLATION_FROM_LANG_OPTIONS.map(item => ({ value: item.value, label: item.label })),
    [],
  );
  const toOptions = useMemo(
    () => TRANSLATION_TO_LANG_OPTIONS.map(item => ({ value: item.value, label: item.label })),
    [],
  );

  const providerOptions = useMemo(
    () =>
      TRANSLATION_PROVIDER_OPTIONS.map(item => ({
        value: item.value,
        label: providerLabel(item, item.value === 'openai' ? getLlmVendor(settings.llmVendor).name : undefined),
      })),
    [settings.llmVendor],
  );

  const getActiveTabId = async (): Promise<number> => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    if (!tab?.id) throw new Error('No active tab');
    if (
      tab.url?.startsWith('chrome://') ||
      tab.url?.startsWith('about:') ||
      tab.url?.startsWith('chrome-extension://')
    ) {
      throw new Error('Unsupported page');
    }
    return tab.id;
  };

  useEffect(() => {
    const syncPageStateFromTab = async () => {
      try {
        const tabId = await getActiveTabId();
        const response = await sendToTab<PageTranslateStateResponse>(tabId, {
          type: 'GET_PAGE_TRANSLATE_STATE',
        });
        if (response && 'ok' in response && response.ok && 'enabled' in response) {
          setPageOn(Boolean(response.enabled));
        } else {
          setPageOn(false);
        }
      } catch {
        setPageOn(false);
      }
    };
    void syncPageStateFromTab();
  }, []);

  const togglePage = async () => {
    const enabled = !pageOn;
    setPageBusy(true);
    try {
      const tabId = await getActiveTabId();
      const response = await sendToTab(tabId, { type: 'TRANSLATE_PAGE', enabled });
      if (response && 'ok' in response && !response.ok) throw new Error(response.error);
      const nextOn =
        response && 'ok' in response && response.ok && 'enabled' in response ? Boolean(response.enabled) : enabled;
      setPageOn(nextOn);
      void message.success(nextOn ? copy.pageTranslating : copy.restored);
    } catch (error) {
      void message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setPageBusy(false);
    }
  };

  const startSkipPick = async () => {
    setSkipBusy(true);
    try {
      const tabId = await getActiveTabId();
      const response = await sendToTab(tabId, { type: 'START_SKIP_PICK' });
      if (response && 'ok' in response && !response.ok) throw new Error(response.error);
      void message.success(copy.skipPickStarted);
      window.close();
    } catch (error) {
      void message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSkipBusy(false);
    }
  };

  const runBoxTranslate = async () => {
    const text = sourceText.trim();
    if (!text) return;
    setBoxBusy(true);
    setRichResult(null);
    try {
      const result = await translateTextViaBackground({
        text,
        from: boxFrom,
        to: boxTo,
        provider: settings.provider,
        rich: true,
      });
      setRichResult(result);
    } catch (error) {
      void message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBoxBusy(false);
    }
  };

  const swapBoxLanguages = () => {
    const from = boxFrom;
    const to = boxTo;
    if (from === 'auto') {
      setBoxPair({
        from: to,
        to: to.startsWith('zh') ? 'en' : 'zh-CN',
      });
    } else {
      setBoxPair({
        from: to,
        to: from as TranslationToLang,
      });
    }
    if (richResult?.text) {
      setSourceText(richResult.text);
      setRichResult(null);
    }
  };

  return (
    <div className={`popup-shell ${themeState.isLight ? 'is-light' : 'is-dark'}`}>
      <header className="popup-header">
        <div className="popup-brand">
          <img className="popup-logo" src={LOGO_URL} alt="" />
          <div className="popup-brand-text">
            <div className="popup-title">{copy.title}</div>
            <div className="popup-tagline">{copy.tagline}</div>
          </div>
        </div>
        <Button
          className="popup-settings"
          type="text"
          icon={<SettingOutlined />}
          onClick={() => chrome.runtime.openOptionsPage()}
        />
      </header>

      <section className="popup-section">
        <div className="popup-section-label">
          <ApiOutlined />
          {copy.provider}
        </div>
        <Select
          className="popup-field"
          style={{ width: '100%' }}
          value={settings.provider}
          options={providerOptions}
          onChange={(value: TranslationProviderId) => {
            void translationSettingsStorage.setProvider(value);
          }}
        />
      </section>

      <section className="popup-section">
        <div className="popup-section-label">
          <TranslationOutlined />
          {copy.uiLocale}
        </div>
        <Select
          className="popup-field"
          style={{ width: '100%' }}
          value={settings.uiLocale ?? 'auto'}
          options={UI_LOCALE_OPTIONS}
          onChange={(value: UiLocaleId) => {
            void translationSettingsStorage.setUiLocale(value);
          }}
        />
      </section>

      <section className="popup-section">
        <div className="popup-section-label">
          <FileTextOutlined />
          {copy.pageBilingual}
        </div>
        <div className="popup-page-actions">
          <Button
            className={pageOn ? 'popup-btn-secondary popup-page-toggle' : 'popup-btn-primary popup-page-toggle'}
            icon={pageOn ? <RedoOutlined /> : <FileTextOutlined />}
            loading={pageBusy}
            disabled={pageBusy || skipBusy}
            onClick={() => void togglePage()}>
            {pageOn ? copy.restore : copy.translatePage}
          </Button>
        </div>
        <button
          type="button"
          className="popup-skip"
          disabled={pageBusy || skipBusy}
          onClick={() => void startSkipPick()}>
          <span className="popup-skip-left">
            <AimOutlined />
            <span>{skipBusy ? '…' : copy.skipPick}</span>
          </span>
          <RightOutlined style={{ fontSize: 11, opacity: 0.45 }} />
        </button>
      </section>

      <section className="popup-section popup-box">
        <div className="popup-lang-row">
          <Select
            className="popup-field"
            style={{ flex: 1 }}
            value={boxFrom}
            options={fromOptions}
            onChange={(value: TranslationFromLang) => {
              setBoxPair(null);
              void translationSettingsStorage.setFromLang(value);
            }}
          />
          <Button
            className="popup-swap"
            type="text"
            icon={<SwapOutlined />}
            onClick={swapBoxLanguages}
            title={copy.swapLanguages}
          />
          <Select
            className="popup-field"
            style={{ flex: 1 }}
            value={boxTo}
            options={toOptions}
            onChange={(value: TranslationToLang) => {
              setBoxPair(null);
              void translationSettingsStorage.setToLang(value);
            }}
          />
        </div>

        <div className="popup-textarea-wrap">
          <TextArea
            className="popup-field"
            value={sourceText}
            maxLength={MAX_CHARS}
            onChange={event => setSourceText(event.target.value.slice(0, MAX_CHARS))}
            placeholder={copy.sourcePlaceholder}
            autoSize={{ minRows: 3, maxRows: 6 }}
            onPressEnter={event => {
              if (event.metaKey || event.ctrlKey) {
                event.preventDefault();
                void runBoxTranslate();
              }
            }}
          />
          <span className="popup-char-count">
            {sourceText.length} / {MAX_CHARS}
          </span>
        </div>

        <div className="popup-actions">
          <Button
            className="popup-btn-primary popup-translate-main"
            icon={<StarFilled />}
            loading={boxBusy}
            disabled={!sourceText.trim()}
            onClick={() => void runBoxTranslate()}>
            <span>{copy.translate}</span>
            <span className="popup-shortcut">{copy.translateShortcut}</span>
          </Button>
          <Button
            className="popup-clear"
            icon={<ClearOutlined />}
            disabled={!sourceText && !richResult}
            onClick={() => {
              setSourceText('');
              setRichResult(null);
            }}
          />
        </div>

        {richResult ? <RichTranslateResult result={richResult} meta={copy.result} /> : null}
      </section>

      <button
        type="button"
        className="popup-skip popup-guide"
        onClick={() => {
          void chrome.tabs.create({ url: chrome.runtime.getURL('options/index.html#guide') });
        }}>
        <span className="popup-skip-left">
          <BookOutlined />
          <span>{copy.guide}</span>
        </span>
        <RightOutlined style={{ fontSize: 11, opacity: 0.45 }} />
      </button>

      <footer className="popup-footer">
        <StarOutlined />
        <span>{copy.footerHint}</span>
      </footer>
    </div>
  );
};

const PopupApp = () => {
  const themeState = useStorage(exampleThemeStorage);
  const settings = useStorage(translationSettingsStorage);
  const algorithm = themeState.isLight ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm;
  const effectiveLocale = resolveUiLocale(settings.uiLocale ?? 'auto');
  const antdLocale = ANTD_LOCALES[effectiveLocale] ?? enUS;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm,
        token: {
          colorPrimary: '#6a6dff',
          borderRadius: 12,
          fontFamily: '"SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Segoe UI", sans-serif',
        },
      }}>
      <AntApp>
        <PopupContent />
      </AntApp>
    </ConfigProvider>
  );
};

export default withErrorBoundary(withSuspense(PopupApp, <LoadingSpinner />), ErrorDisplay);
