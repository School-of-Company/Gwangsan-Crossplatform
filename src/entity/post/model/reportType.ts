export type ReportType = 'BAD_LANGUAGE' | 'FRAUD' | 'MEMBER' | 'ETC';

export const REPORT_TYPE_MAP: Record<ReportType, string> = {
  BAD_LANGUAGE: '욕설/비방',
  FRAUD: '스팸/홍보',
  MEMBER: '문제 있는 회원',
  ETC: '기타',
};

export type ReportTypeOption = { value: ReportType; label: string };

export const REPORT_TYPES: ReportTypeOption[] = Object.entries(REPORT_TYPE_MAP).map(
  ([value, label]) => ({ value: value as ReportType, label })
);
