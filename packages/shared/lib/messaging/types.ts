import type { TranslateRequest, TranslateResult } from '@extension/translate';

export type TranslatePageMessage = {
  type: 'TRANSLATE_PAGE';
  enabled: boolean;
};

export type GetPageTranslateStateMessage = {
  type: 'GET_PAGE_TRANSLATE_STATE';
};

export type TranslateTextMessage = {
  type: 'TRANSLATE_TEXT';
  payload: TranslateRequest;
};

export type StartSkipPickMessage = {
  type: 'START_SKIP_PICK';
};

export type RefreshBuiltinSiteRulesMessage = {
  type: 'REFRESH_BUILTIN_SITE_RULES';
};

export type TranslateTextSuccess = {
  type: 'TRANSLATE_TEXT_RESULT';
  ok: true;
  result: TranslateResult;
};

export type TranslateTextFailure = {
  type: 'TRANSLATE_TEXT_RESULT';
  ok: false;
  error: string;
};

export type TranslateTextResultMessage = TranslateTextSuccess | TranslateTextFailure;

export type PageTranslateStateResponse = {
  ok: true;
  enabled: boolean;
};

export type ExtensionMessage =
  | TranslatePageMessage
  | GetPageTranslateStateMessage
  | TranslateTextMessage
  | StartSkipPickMessage
  | RefreshBuiltinSiteRulesMessage;

export type ExtensionResponse =
  TranslateTextResultMessage | PageTranslateStateResponse | { ok: true } | { ok: false; error: string };
