import { TYPE_OPTIONS, MODE_OPTIONS, getTypeLabel, getModeLabel } from '../options';
import { TYPE } from '../type';
import { MODE } from '../mode';

describe('TYPE_OPTIONS', () => {
  it('2개의 항목을 포함한다', () => {
    expect(TYPE_OPTIONS).toHaveLength(2);
  });

  it('각 항목이 value와 label을 가진다', () => {
    TYPE_OPTIONS.forEach((option) => {
      expect(option).toHaveProperty('value');
      expect(option).toHaveProperty('label');
    });
  });

  it.each([
    [TYPE.OBJECT, '물건'],
    [TYPE.SERVICE, '서비스'],
  ] as const)('%s → "%s" 레이블을 가진다', (value, label) => {
    expect(TYPE_OPTIONS.find((option) => option.value === value)?.label).toBe(label);
  });

  it('중복되는 value가 없다', () => {
    const values = TYPE_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('MODE_OPTIONS', () => {
  it('TYPE의 모든 키를 포함한다', () => {
    expect(Object.keys(MODE_OPTIONS).sort()).toEqual(Object.values(TYPE).sort());
  });

  it.each([
    [TYPE.OBJECT, MODE.GIVER, '팔아요'],
    [TYPE.OBJECT, MODE.RECEIVER, '필요해요'],
    [TYPE.SERVICE, MODE.GIVER, '할 수 있어요'],
    [TYPE.SERVICE, MODE.RECEIVER, '해주세요'],
  ] as const)('%s / %s → "%s" 레이블을 가진다', (type, mode, label) => {
    expect(MODE_OPTIONS[type].find((option) => option.value === mode)?.label).toBe(label);
  });

  it('각 타입마다 2개의 모드 옵션을 가진다', () => {
    Object.values(MODE_OPTIONS).forEach((options) => {
      expect(options).toHaveLength(2);
    });
  });

  it('각 타입 내에서 중복되는 mode value가 없다', () => {
    Object.values(MODE_OPTIONS).forEach((options) => {
      const values = options.map((option) => option.value);
      expect(new Set(values).size).toBe(values.length);
    });
  });
});

describe('getTypeLabel', () => {
  it('알려진 type에 대해 레이블을 반환한다', () => {
    expect(getTypeLabel(TYPE.OBJECT)).toBe('물건');
    expect(getTypeLabel(TYPE.SERVICE)).toBe('서비스');
  });

  it('알 수 없는 type에 대해서는 입력값을 그대로 반환한다', () => {
    expect(getTypeLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('getModeLabel', () => {
  it('알려진 type/mode 조합에 대해 레이블을 반환한다', () => {
    expect(getModeLabel(TYPE.OBJECT, MODE.GIVER)).toBe('팔아요');
    expect(getModeLabel(TYPE.SERVICE, MODE.RECEIVER)).toBe('해주세요');
  });

  it('알 수 없는 type에 대해서는 mode를 그대로 반환한다', () => {
    expect(getModeLabel('UNKNOWN', MODE.GIVER)).toBe(MODE.GIVER);
  });

  it('알려진 type이지만 알 수 없는 mode에 대해서는 mode를 그대로 반환한다', () => {
    expect(getModeLabel(TYPE.OBJECT, 'UNKNOWN')).toBe('UNKNOWN');
  });
});
