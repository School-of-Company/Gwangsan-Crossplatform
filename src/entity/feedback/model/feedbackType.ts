import type { FeedbackType } from '../api/createFeedback';

export const FEEDBACK_TYPE_MAP: Record<FeedbackType, string> = {
  BUG: '오류/버그',
  SUGGESTION: '기능 제안/개선',
  TRADE: '거래 관련',
  ACCOUNT: '계정/로그인',
  ETC: '기타',
};

export type FeedbackTypeOption = { value: FeedbackType; label: string };

export const FEEDBACK_TYPES: FeedbackTypeOption[] = Object.entries(FEEDBACK_TYPE_MAP).map(
  ([value, label]) => ({ value: value as FeedbackType, label })
);
