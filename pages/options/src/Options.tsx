import { getChangelog } from './changelog';
import { getOptionsCopy } from './ui-copy';
import {
  ApiOutlined,
  BgColorsOutlined,
  BookOutlined,
  BugOutlined,
  BulbOutlined,
  GithubOutlined,
  GlobalOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { PROJECT_URL_OBJECT, useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import {
  BUILTIN_SKIP_SELECTORS,
  CUSTOM_LLM_MODEL_VALUE,
  LLM_VENDORS,
  LOCAL_BUILTIN_SITE_RULES,
  TRANSLATION_FROM_LANG_OPTIONS,
  TRANSLATION_PROVIDER_OPTIONS,
  TRANSLATION_TO_LANG_OPTIONS,
  UI_LOCALE_OPTIONS,
  exampleThemeStorage,
  getLlmVendor,
  loadBuiltinSiteRules,
  resolveUiLocale,
  siteRuleLabel,
  translationSettingsStorage,
  translationSkipStorage,
} from '@extension/storage';
import { ErrorDisplay, LoadingSpinner, ProviderLogo } from '@extension/ui';
import '@src/Options.css';
import {
  Button,
  Collapse,
  ConfigProvider,
  Empty,
  Form,
  Input,
  Layout,
  Menu,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  theme as antdTheme,
  App as AntApp,
  message,
} from 'antd';
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
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  LlmVendorId,
  SiteRule,
  TranslationFromLang,
  TranslationProviderId,
  TranslationToLang,
  UiLocaleId,
} from '@extension/storage';
import type { ChangeEvent } from 'react';

const { Sider, Content } = Layout;

const PROJECT_REPO_URL = PROJECT_URL_OBJECT.url;
const PROJECT_ISSUES_URL = `${PROJECT_REPO_URL}/issues`;

type SectionId = 'guide' | 'language' | 'engine' | 'appearance' | 'skip' | 'changelog' | 'about';
const SECTIONS: SectionId[] = ['guide', 'language', 'engine', 'appearance', 'skip', 'changelog', 'about'];

const parseHash = (): SectionId => {
  const hash = window.location.hash.replace(/^#/, '') as SectionId;
  return SECTIONS.includes(hash) ? hash : 'guide';
};

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

const LOGO_URL = chrome.runtime.getURL('popup/logo.png');
const GUIDE_ART_URL = chrome.runtime.getURL('options/guide-welcome-cat.png');
const APP_VERSION = chrome.runtime.getManifest().version;

const GUIDE_STEP_VISUALS = ['engine', 'language', 'bilingual', 'selection', 'skip', 'shortcut'] as const;

const faviconUrl = (host: string, size = 32) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;

const SiteFavicon = ({ host, size = 16 }: { host: string; size?: number }) => {
  const [failed, setFailed] = useState(false);
  const clean =
    host
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0] ?? '';

  useEffect(() => {
    setFailed(false);
  }, [clean]);

  if (!clean || failed) {
    return (
      <span
        aria-hidden
        className="settings-favicon settings-favicon-fallback"
        style={{ width: size, height: size, fontSize: Math.max(10, size - 4) }}
      />
    );
  }

  return (
    <img
      className="settings-favicon"
      src={faviconUrl(clean, size >= 24 ? 64 : 32)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
};

const VendorIcon = ({ mark, color, size = 20 }: { mark: string; color: string; size?: number }) => (
  <span
    aria-hidden
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: 6,
      background: color,
      color: '#fff',
      fontSize: size <= 20 ? 10 : 11,
      fontWeight: 700,
      lineHeight: 1,
      flexShrink: 0,
      letterSpacing: mark.length > 1 ? -0.3 : 0,
    }}>
    {mark}
  </span>
);

const GuideStepVisual = ({ kind }: { kind: (typeof GUIDE_STEP_VISUALS)[number] }) => {
  if (kind === 'engine') {
    return (
      <div className="guide-visual guide-visual-engine" aria-hidden>
        {(['google', 'microsoft', 'yandex', 'openai'] as const).map(id => (
          <ProviderLogo key={id} provider={id} size={18} />
        ))}
      </div>
    );
  }
  if (kind === 'language') {
    return (
      <div className="guide-visual guide-visual-language" aria-hidden>
        <span className="guide-chip">Auto</span>
        <span className="guide-chip guide-chip-primary">中文</span>
      </div>
    );
  }
  if (kind === 'bilingual') {
    return (
      <div className="guide-visual guide-visual-bilingual" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    );
  }
  if (kind === 'selection') {
    return (
      <div className="guide-visual guide-visual-selection" aria-hidden>
        <span className="guide-selection-line" />
        <span className="guide-selection-pop" />
      </div>
    );
  }
  if (kind === 'skip') {
    return (
      <div className="guide-visual guide-visual-skip" aria-hidden>
        <span>.nav</span>
        <span>.menu</span>
      </div>
    );
  }
  return (
    <div className="guide-visual guide-visual-shortcut" aria-hidden>
      <kbd>⌘</kbd>
      <kbd>Enter</kbd>
    </div>
  );
};

const SettingsPage = () => {
  const themeState = useStorage(exampleThemeStorage);
  const settings = useStorage(translationSettingsStorage);
  const skipState = useStorage(translationSkipStorage);
  const [globalInput, setGlobalInput] = useState('');
  const [siteHostInput, setSiteHostInput] = useState('');
  const [siteSelectorInput, setSiteSelectorInput] = useState('');
  const [section, setSection] = useState<SectionId>(() => (typeof window === 'undefined' ? 'guide' : parseHash()));
  const [builtinSiteRules, setBuiltinSiteRules] = useState<SiteRule[]>(LOCAL_BUILTIN_SITE_RULES);
  const skipImportInputRef = useRef<HTMLInputElement>(null);

  const algorithm = themeState.isLight ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm;
  const effectiveLocale = resolveUiLocale(settings.uiLocale ?? 'auto');
  const copy = useMemo(() => getOptionsCopy(effectiveLocale), [effectiveLocale]);
  const changelog = useMemo(() => getChangelog(effectiveLocale), [effectiveLocale]);
  const antdLocale = ANTD_LOCALES[effectiveLocale] ?? enUS;

  const fromOptions = useMemo(
    () => TRANSLATION_FROM_LANG_OPTIONS.map(item => ({ value: item.value, label: item.label })),
    [],
  );
  const toOptions = useMemo(
    () => TRANSLATION_TO_LANG_OPTIONS.map(item => ({ value: item.value, label: item.label })),
    [],
  );

  const llmVendor = getLlmVendor(settings.llmVendor ?? 'openai');
  const modelInPreset = llmVendor.models.some(m => m.id === settings.llmModel);
  const modelSelectValue =
    llmVendor.id === 'custom' || !modelInPreset
      ? CUSTOM_LLM_MODEL_VALUE
      : (settings.llmModel ?? llmVendor.defaultModel);

  const vendorOptions = useMemo(
    () =>
      LLM_VENDORS.map(vendor => ({
        value: vendor.id,
        label: (
          <Space size={8}>
            <VendorIcon mark={vendor.mark} color={vendor.color} size={20} />
            <span>{vendor.name}</span>
          </Space>
        ),
      })),
    [],
  );

  const providerOptions = useMemo(
    () =>
      TRANSLATION_PROVIDER_OPTIONS.map(item => ({
        value: item.value,
        label: (
          <Space size={8}>
            <ProviderLogo provider={item.value} size={18} />
            <span>{item.label}</span>
          </Space>
        ),
      })),
    [],
  );

  const modelOptions = useMemo(() => {
    const options = llmVendor.models.map(model => ({
      value: model.id,
      label: model.label,
    }));
    options.push({ value: CUSTOM_LLM_MODEL_VALUE, label: copy.customModel });
    return options;
  }, [llmVendor, copy.customModel]);

  const siteEntries = useMemo(() => {
    const byHost = skipState.byHost ?? {};
    return Object.entries(byHost)
      .map(([host, selectors]) => ({ host, selectors: selectors ?? [] }))
      .filter(entry => entry.selectors.length > 0)
      .sort((a, b) => a.host.localeCompare(b.host));
  }, [skipState.byHost]);

  const addGlobal = async () => {
    const selector = globalInput.trim();
    if (!selector) return;
    await translationSkipStorage.addGlobal(selector);
    setGlobalInput('');
  };

  const addSiteRule = async () => {
    const host = siteHostInput.trim().toLowerCase();
    const selector = siteSelectorInput.trim();
    if (!host || !selector) return;
    await translationSkipStorage.addForHost(host, selector);
    setSiteSelectorInput('');
  };

  const exportSkipRules = async () => {
    const snapshot = await translationSkipStorage.exportUserRules();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'multcat-skip-rules.json';
    anchor.click();
    URL.revokeObjectURL(url);
    void message.success(copy.skipExportOk);
  };

  const onSkipImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      await translationSkipStorage.importUserRules(payload, { mode: 'merge' });
      void message.success(copy.skipImportOk);
    } catch {
      void message.error(copy.skipImportFail);
    }
  };

  const onVendorChange = (vendorId: LlmVendorId) => {
    void translationSettingsStorage.setLlmVendor(vendorId);
  };

  const onModelChange = (value: string) => {
    if (value === CUSTOM_LLM_MODEL_VALUE) {
      void translationSettingsStorage.setLlmConfig({ llmModel: '' });
      return;
    }
    void translationSettingsStorage.setLlmConfig({ llmModel: value });
  };

  useEffect(() => {
    const sync = () => setSection(parseHash());
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadBuiltinSiteRules().then(rules => {
      if (!cancelled) setBuiltinSiteRules(rules);
    });
    try {
      chrome.runtime.sendMessage({ type: 'REFRESH_BUILTIN_SITE_RULES' }, () => {
        void chrome.runtime.lastError;
        if (cancelled) return;
        void loadBuiltinSiteRules().then(rules => {
          if (!cancelled) setBuiltinSiteRules(rules);
        });
      });
    } catch {
      // ignore
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const goSection = (key: SectionId) => {
    setSection(key);
    window.location.hash = key;
  };

  const menuItems = useMemo(
    () => [
      { key: 'guide', icon: <BookOutlined />, label: copy.navGuide },
      { key: 'language', icon: <GlobalOutlined />, label: copy.navLanguage },
      { key: 'engine', icon: <ApiOutlined />, label: copy.navEngine },
      { key: 'appearance', icon: <BgColorsOutlined />, label: copy.navAppearance },
      { key: 'skip', icon: <StopOutlined />, label: copy.navSkip },
      { key: 'changelog', icon: <HistoryOutlined />, label: copy.navChangelog },
      { key: 'about', icon: <InfoCircleOutlined />, label: copy.navAbout },
    ],
    [copy],
  );

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm,
        token: {
          colorPrimary: '#7b61ff',
          borderRadius: 14,
          fontFamily: '"SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Segoe UI", sans-serif',
        },
      }}>
      <AntApp>
        <div className={`settings-shell ${themeState.isLight ? 'is-light' : 'is-dark'}`}>
          <Layout className="settings-layout">
            <Sider className="settings-sider" width={220} theme={themeState.isLight ? 'light' : 'dark'}>
              <div className="settings-sider-brand">
                <img className="settings-sider-logo" src={LOGO_URL} alt="" />
                <div className="settings-sider-brand-text">
                  <div className="settings-brand-name">{copy.brandName}</div>
                  <div className="settings-brand-version">v{APP_VERSION}</div>
                </div>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[section]}
                items={menuItems}
                onClick={({ key }) => goSection(key as SectionId)}
              />
            </Sider>
            <Content className="settings-content">
              <div className="settings-stack">
                {section === 'guide' ? (
                  <section id="guide" className="settings-guide-page">
                    <div className="guide-welcome">
                      <div className="guide-welcome-copy">
                        <h1 className="guide-welcome-title">👋 {copy.welcomeTitle}</h1>
                        <p className="guide-welcome-desc">{copy.welcomeDesc}</p>
                      </div>
                      <div className="guide-welcome-art" aria-hidden>
                        <img className="guide-welcome-img" src={GUIDE_ART_URL} alt="" />
                        <span className="guide-bubble guide-bubble-1">Hello</span>
                        <span className="guide-bubble guide-bubble-2">你好</span>
                        <span className="guide-bubble guide-bubble-3">Hola</span>
                        <span className="guide-bubble guide-bubble-4">こんにちは</span>
                      </div>
                    </div>

                    <div className="guide-quick">
                      <h2 className="guide-quick-title">{copy.guideQuickTitle}</h2>
                      <div className="guide-steps">
                        {copy.guideSteps.map((step, index) => (
                          <article key={step.title} className="guide-step-card">
                            <div className="guide-step-num">{index + 1}</div>
                            <GuideStepVisual kind={GUIDE_STEP_VISUALS[index] ?? 'engine'} />
                            <h3 className="guide-step-title">{step.title}</h3>
                            <p className="guide-step-body">{step.body}</p>
                          </article>
                        ))}
                      </div>
                    </div>

                    <div className="guide-tip">
                      <div className="guide-tip-left">
                        <BulbOutlined className="guide-tip-icon" />
                        <div>
                          <div className="guide-tip-title">{copy.tipTitle}</div>
                          <p className="guide-tip-body">{copy.tipBody}</p>
                        </div>
                      </div>
                      <Button type="link" className="guide-tip-action" onClick={() => goSection('language')}>
                        {copy.tipAction} →
                      </Button>
                    </div>
                  </section>
                ) : null}

                {section === 'language' ? (
                  <section className="settings-card">
                    <div className="settings-card-title">
                      <GlobalOutlined />
                      {copy.languageTitle}
                    </div>
                    <Form layout="vertical" className="settings-field">
                      <Form.Item label={copy.uiLocale} tooltip={copy.uiLocaleTip} required>
                        <Select
                          className="settings-field"
                          value={settings.uiLocale ?? 'auto'}
                          options={UI_LOCALE_OPTIONS}
                          onChange={(value: UiLocaleId) => {
                            void translationSettingsStorage.setUiLocale(value);
                          }}
                        />
                      </Form.Item>
                      <Form.Item label={copy.fromLang} tooltip={copy.fromLangTip}>
                        <Select
                          className="settings-field"
                          value={settings.fromLang ?? 'auto'}
                          options={fromOptions}
                          onChange={(value: TranslationFromLang) => {
                            void translationSettingsStorage.setFromLang(value);
                          }}
                        />
                      </Form.Item>
                      <Form.Item label={copy.toLang} style={{ marginBottom: 8 }}>
                        <Select
                          className="settings-field"
                          value={settings.toLang ?? 'zh-CN'}
                          options={toOptions}
                          onChange={(value: TranslationToLang) => {
                            void translationSettingsStorage.setToLang(value);
                          }}
                        />
                      </Form.Item>
                    </Form>
                    <div className="settings-meta">
                      {copy.currentPair}: {(settings.fromLang ?? 'auto').toUpperCase()} →{' '}
                      {(settings.toLang ?? 'zh-CN').toUpperCase()}
                    </div>
                  </section>
                ) : null}

                {section === 'engine' ? (
                  <section className="settings-card">
                    <div className="settings-card-title">
                      <ApiOutlined />
                      {copy.engineTitle}
                    </div>
                    <Form layout="vertical">
                      <Form.Item label={copy.engineType}>
                        <Select
                          className="settings-field"
                          value={settings.provider}
                          options={providerOptions}
                          optionLabelProp="label"
                          onChange={(value: TranslationProviderId) => {
                            void translationSettingsStorage.setProvider(value);
                          }}
                        />
                      </Form.Item>
                      {settings.provider === 'openai' ? (
                        <>
                          <Form.Item label={copy.llmVendor} required>
                            <Select
                              className="settings-field"
                              value={llmVendor.id}
                              options={vendorOptions}
                              optionLabelProp="label"
                              onChange={onVendorChange}
                              listHeight={360}
                            />
                          </Form.Item>
                          <Form.Item label={copy.llmModel} tooltip={copy.llmModelTip} required>
                            {llmVendor.id === 'custom' ? (
                              <Input
                                className="settings-field"
                                placeholder="model-id"
                                value={settings.llmModel ?? ''}
                                onChange={e => {
                                  void translationSettingsStorage.setLlmConfig({ llmModel: e.target.value });
                                }}
                              />
                            ) : (
                              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                <Select
                                  className="settings-field"
                                  value={modelSelectValue}
                                  options={modelOptions}
                                  onChange={onModelChange}
                                  showSearch
                                  optionFilterProp="label"
                                />
                                {modelSelectValue === CUSTOM_LLM_MODEL_VALUE ? (
                                  <Input
                                    className="settings-field"
                                    placeholder={copy.customModelPlaceholder}
                                    value={settings.llmModel ?? ''}
                                    onChange={e => {
                                      void translationSettingsStorage.setLlmConfig({ llmModel: e.target.value });
                                    }}
                                  />
                                ) : null}
                              </Space>
                            )}
                          </Form.Item>
                          <Form.Item label={copy.apiToken} tooltip={copy.apiTokenTip} required>
                            <Input.Password
                              className="settings-field"
                              placeholder={llmVendor.tokenHint ?? 'sk-...'}
                              value={settings.llmApiKey ?? ''}
                              onChange={e => {
                                void translationSettingsStorage.setLlmConfig({ llmApiKey: e.target.value });
                              }}
                              autoComplete="off"
                            />
                          </Form.Item>
                          <Form.Item label={copy.apiBaseUrl} tooltip={copy.apiBaseUrlTip}>
                            <Input
                              className="settings-field"
                              placeholder={llmVendor.baseUrl}
                              value={settings.llmApiUrl ?? llmVendor.baseUrl}
                              onChange={e => {
                                void translationSettingsStorage.setLlmConfig({ llmApiUrl: e.target.value });
                              }}
                            />
                          </Form.Item>
                          <div className="settings-meta" style={{ marginBottom: 12 }}>
                            {llmVendor.name}
                            {settings.llmModel ? ` · ${settings.llmModel}` : ''}
                          </div>
                        </>
                      ) : null}
                      <Form.Item
                        label={copy.selectionTranslate}
                        tooltip={copy.selectionTranslateTip}
                        style={{ marginBottom: 0 }}>
                        <Switch
                          checked={settings.selectionTranslateEnabled ?? true}
                          onChange={checked => {
                            void translationSettingsStorage.setSelectionTranslateEnabled(checked);
                          }}
                        />
                      </Form.Item>
                    </Form>
                  </section>
                ) : null}

                {section === 'appearance' ? (
                  <section className="settings-card">
                    <div className="settings-card-title">
                      <BgColorsOutlined />
                      {copy.appearanceTitle}
                    </div>
                    <Form layout="vertical">
                      <Form.Item label={copy.theme} style={{ marginBottom: 0 }}>
                        <Radio.Group
                          className="settings-theme-group"
                          value={themeState.isLight ? 'light' : 'dark'}
                          onChange={e => {
                            const nextLight = e.target.value === 'light';
                            if (nextLight !== themeState.isLight) {
                              void exampleThemeStorage.toggle();
                            }
                          }}
                          optionType="button"
                          buttonStyle="solid"
                          options={[
                            { label: copy.themeLight, value: 'light' },
                            { label: copy.themeDark, value: 'dark' },
                          ]}
                        />
                      </Form.Item>
                    </Form>
                  </section>
                ) : null}

                {section === 'skip' ? (
                  <>
                    <section className="settings-card">
                      <div className="settings-card-title">
                        <StopOutlined />
                        {copy.skipTitle}
                        <span className="settings-card-actions">
                          <Button size="small" onClick={() => void exportSkipRules()}>
                            {copy.skipExport}
                          </Button>
                          <Button size="small" onClick={() => skipImportInputRef.current?.click()}>
                            {copy.skipImport}
                          </Button>
                          <input
                            ref={skipImportInputRef}
                            type="file"
                            accept="application/json,.json"
                            hidden
                            onChange={event => void onSkipImportFile(event)}
                          />
                        </span>
                      </div>
                      <p className="settings-card-hint">{copy.skipDesc}</p>

                      <div style={{ marginBottom: 14 }}>
                        <div
                          className="settings-meta"
                          style={{ marginBottom: 8, fontWeight: 650, color: 'var(--opt-label)' }}>
                          {copy.skipBuiltin}
                        </div>
                        <div className="settings-tags">
                          {BUILTIN_SKIP_SELECTORS.map(sel => (
                            <Tag key={sel}>{sel}</Tag>
                          ))}
                        </div>
                      </div>

                      <Form layout="vertical">
                        <Form.Item label={copy.skipGlobal}>
                          <div className="settings-row">
                            <Input
                              className="settings-field"
                              placeholder=".sidebar, #logo…"
                              value={globalInput}
                              onChange={e => setGlobalInput(e.target.value)}
                              onPressEnter={() => void addGlobal()}
                            />
                            <Button className="settings-btn-primary" type="primary" onClick={() => void addGlobal()}>
                              {copy.skipAdd}
                            </Button>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            {(skipState.globalSelectors ?? []).length === 0 ? (
                              <div className="settings-empty">
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.skipEmpty} />
                              </div>
                            ) : (
                              <div className="settings-tags">
                                {(skipState.globalSelectors ?? []).map(sel => (
                                  <Tag
                                    key={sel}
                                    closable
                                    onClose={() => {
                                      void translationSkipStorage.removeGlobal(sel);
                                    }}>
                                    {sel}
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        </Form.Item>

                        <Form.Item label={copy.skipSite} style={{ marginBottom: 0 }}>
                          <div className="settings-row" style={{ marginBottom: 10 }}>
                            <div className="settings-host-field">
                              <SiteFavicon host={siteHostInput} size={16} />
                              <Input
                                className="settings-field"
                                placeholder="example.com"
                                value={siteHostInput}
                                onChange={e => setSiteHostInput(e.target.value)}
                              />
                            </div>
                            <Input
                              className="settings-field"
                              placeholder=".no-translate"
                              value={siteSelectorInput}
                              onChange={e => setSiteSelectorInput(e.target.value)}
                              onPressEnter={() => void addSiteRule()}
                            />
                            <Button className="settings-btn-primary" type="primary" onClick={() => void addSiteRule()}>
                              {copy.skipAdd}
                            </Button>
                          </div>

                          {siteEntries.length === 0 ? (
                            <div className="settings-empty">
                              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.skipNoSite} />
                            </div>
                          ) : (
                            <Collapse
                              className="settings-collapse"
                              size="small"
                              items={siteEntries.map(entry => ({
                                key: entry.host,
                                label: (
                                  <span className="settings-site-label">
                                    <SiteFavicon host={entry.host} size={18} />
                                    <span>{entry.host}</span>
                                    <span className="settings-site-count">{entry.selectors.length}</span>
                                  </span>
                                ),
                                children: (
                                  <div className="settings-tags">
                                    {entry.selectors.map(sel => (
                                      <Tag
                                        key={sel}
                                        closable
                                        onClose={() => {
                                          void translationSkipStorage.removeForHost(entry.host, sel);
                                        }}>
                                        {sel}
                                      </Tag>
                                    ))}
                                  </div>
                                ),
                              }))}
                            />
                          )}
                        </Form.Item>
                      </Form>
                    </section>

                    <section className="settings-card">
                      <div className="settings-card-title">
                        <GlobalOutlined />
                        {copy.builtinSitesTitle}
                      </div>
                      <p className="settings-card-hint">{copy.builtinSitesDesc}</p>
                      {builtinSiteRules.length === 0 ? (
                        <div className="settings-empty">
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.builtinSitesEmpty} />
                        </div>
                      ) : (
                        <Collapse
                          className="settings-collapse"
                          size="small"
                          items={builtinSiteRules.map((rule, index) => ({
                            key: `${siteRuleLabel(rule)}-${index}`,
                            label: (
                              <span className="settings-site-label">
                                <span>{siteRuleLabel(rule)}</span>
                                <span className="settings-site-count">{rule.excludeSelectors.length}</span>
                              </span>
                            ),
                            children: (
                              <div className="settings-tags">
                                {rule.excludeSelectors.map(sel => (
                                  <Tag key={sel}>{sel}</Tag>
                                ))}
                              </div>
                            ),
                          }))}
                        />
                      )}
                    </section>
                  </>
                ) : null}

                {section === 'changelog' ? (
                  <section className="settings-card">
                    <div className="settings-card-title">
                      <HistoryOutlined />
                      {copy.changelogTitle}
                    </div>
                    <p className="settings-card-hint">{copy.changelogHint}</p>
                    <div className="settings-changelog">
                      {changelog.map(entry => (
                        <article key={entry.version} className="settings-changelog-item">
                          <div className="settings-changelog-head">
                            <span className="settings-changelog-version">v{entry.version}</span>
                            <span className="settings-changelog-date">{entry.date}</span>
                          </div>
                          <ul className="settings-changelog-list">
                            {entry.highlights.map(line => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                {section === 'about' ? (
                  <section className="settings-card">
                    <div className="settings-card-title">
                      <InfoCircleOutlined />
                      {copy.aboutTitle}
                    </div>
                    <div className="settings-about">
                      <img className="settings-about-logo" src={LOGO_URL} alt="" />
                      <div>
                        <div className="settings-about-name">
                          {copy.brandName} <span className="settings-brand-version">v{APP_VERSION}</span>
                        </div>
                        <p className="settings-card-hint" style={{ margin: '6px 0 0' }}>
                          {copy.aboutBody}
                        </p>
                        <div className="settings-about-links">
                          <a
                            className="settings-about-link"
                            href={PROJECT_REPO_URL}
                            target="_blank"
                            rel="noreferrer noopener">
                            <GithubOutlined />
                            {copy.aboutGithub}
                          </a>
                          <a
                            className="settings-about-link"
                            href={PROJECT_ISSUES_URL}
                            target="_blank"
                            rel="noreferrer noopener">
                            <BugOutlined />
                            {copy.aboutFeedback}
                          </a>
                        </div>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            </Content>
          </Layout>
        </div>
      </AntApp>
    </ConfigProvider>
  );
};

export default withErrorBoundary(withSuspense(SettingsPage, <LoadingSpinner />), ErrorDisplay);
