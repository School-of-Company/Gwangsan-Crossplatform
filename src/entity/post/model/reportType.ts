export type ReportType = 'BAD_LANGUAGE' | 'FRAUD' | 'MEMBER' | 'ETC';

export const REPORT_TYPE_MAP: Record<string, ReportType> = {
  '욕설/비방': 'BAD_LANGUAGE',
  '스팸/홍보': 'FRAUD',
  '문제 있는 회원': 'MEMBER',
  기타: 'ETC',
};
