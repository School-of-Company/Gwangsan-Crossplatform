import { MESSAGE_TYPE } from '../chatType';

describe('MESSAGE_TYPE', () => {
  it('TEXT와 IMAGE 값을 노출한다', () => {
    expect(MESSAGE_TYPE.TEXT).toBe('TEXT');
    expect(MESSAGE_TYPE.IMAGE).toBe('IMAGE');
  });

  it('TEXT·IMAGE·SYSTEM 세 개의 키를 갖는다', () => {
    expect(Object.keys(MESSAGE_TYPE)).toEqual(['TEXT', 'IMAGE', 'SYSTEM']);
  });

  it('객체가 변경되지 않도록 const assertion을 사용한다', () => {
    expect(Object.isFrozen(MESSAGE_TYPE)).toBe(false);
    expect(MESSAGE_TYPE).toEqual({ TEXT: 'TEXT', IMAGE: 'IMAGE', SYSTEM: 'SYSTEM' });
  });
});
