import { TYPE } from '../type';

describe('TYPE', () => {
  it('OBJECT와 SERVICE 값을 노출한다', () => {
    expect(TYPE.OBJECT).toBe('OBJECT');
    expect(TYPE.SERVICE).toBe('SERVICE');
  });

  it('정확히 두 개의 키를 갖는다', () => {
    expect(Object.keys(TYPE)).toEqual(['OBJECT', 'SERVICE']);
  });
});
