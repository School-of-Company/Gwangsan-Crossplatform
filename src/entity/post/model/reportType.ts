import type { ReportReason } from '../api/report';

export type ReportType = ReportReason;

export const REPORT_TYPE_MAP: Record<ReportType, string> = {
  SEXUAL: '성적/선정적',
  ABUSE_HATE_HARASSMENT: '욕설/혐오/괴롭힘',
  SPAM_AD: '스팸/광고',
  IMPERSONATION: '사칭',
  SELF_HARM_DANGER: '자해/위험',
  ETC: '기타',
};

export type ReportTypeOption = { value: ReportType; label: string };

export const REPORT_TYPES: ReportTypeOption[] = Object.entries(REPORT_TYPE_MAP).map(
  ([value, label]) => ({ value: value as ReportType, label })
);
