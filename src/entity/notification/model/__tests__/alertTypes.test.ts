import { AlertType } from '../alertTypes';

describe('AlertType', () => {
  it('11개의 알림 유형을 포함한다', () => {
    expect(Object.keys(AlertType)).toHaveLength(11);
  });

  it.each([
    ['CHTTING_REQUEST', 'CHTTING_REQUEST'],
    ['NOTICE', 'NOTICE'],
    ['TRADE_COMPLETE', 'TRADE_COMPLETE'],
    ['TRADE_COMPLETE_REJECT', 'TRADE_COMPLETE_REJECT'],
    ['OTHER_MEMBER_TRADE_COMPLETE', 'OTHER_MEMBER_TRADE_COMPLETE'],
    ['RECOMMENDER', 'RECOMMENDER'],
    ['REVIEW', 'REVIEW'],
    ['TRADE_CANCEL', 'TRADE_CANCEL'],
    ['TRADE_CANCEL_REJECT', 'TRADE_CANCEL_REJECT'],
    ['REPORT', 'REPORT'],
    ['REPORT_REJECT', 'REPORT_REJECT'],
  ] as const)('%s의 값은 "%s"이다', (key, value) => {
    expect(AlertType[key as keyof typeof AlertType]).toBe(value);
  });

  it('모든 값이 고유하다', () => {
    const values = Object.values(AlertType);
    expect(new Set(values).size).toBe(values.length);
  });
});
