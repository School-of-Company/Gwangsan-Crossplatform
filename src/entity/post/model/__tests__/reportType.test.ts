import { REPORT_TYPE_MAP, REPORT_TYPES } from '../reportType';

describe('REPORT_TYPE_MAP', () => {
  it('6개의 신고 유형을 포함한다', () => {
    expect(Object.keys(REPORT_TYPE_MAP)).toHaveLength(6);
  });

  it.each([
    ['SEXUAL', '성적/선정적'],
    ['ABUSE_HATE_HARASSMENT', '욕설/혐오/괴롭힘'],
    ['SPAM_AD', '스팸/광고'],
    ['IMPERSONATION', '사칭'],
    ['SELF_HARM_DANGER', '자해/위험'],
    ['ETC', '기타'],
  ] as const)('%s → "%s" 레이블을 반환한다', (key, label) => {
    expect(REPORT_TYPE_MAP[key]).toBe(label);
  });
});

describe('REPORT_TYPES', () => {
  it('6개의 항목을 반환한다', () => {
    expect(REPORT_TYPES).toHaveLength(6);
  });

  it('각 항목이 value와 label을 가진다', () => {
    REPORT_TYPES.forEach((item) => {
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('label');
    });
  });

  it('REPORT_TYPE_MAP의 모든 키를 포함한다', () => {
    const values = REPORT_TYPES.map((item) => item.value);
    const mapKeys = Object.keys(REPORT_TYPE_MAP);

    expect(values.sort()).toEqual(mapKeys.sort());
  });

  it('각 value의 label이 REPORT_TYPE_MAP과 일치한다', () => {
    REPORT_TYPES.forEach(({ value, label }) => {
      expect(label).toBe(REPORT_TYPE_MAP[value]);
    });
  });
});
