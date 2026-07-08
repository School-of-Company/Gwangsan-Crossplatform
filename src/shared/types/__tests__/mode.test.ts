import { MODE } from '../mode';

describe('MODE', () => {
  it('GIVER와 RECEIVER 값을 노출한다', () => {
    expect(MODE.GIVER).toBe('GIVER');
    expect(MODE.RECEIVER).toBe('RECEIVER');
  });

  it('정확히 두 개의 키를 갖는다', () => {
    expect(Object.keys(MODE)).toEqual(['GIVER', 'RECEIVER']);
  });
});
