import { isBlockedSocketError } from '../blockError';

describe('isBlockedSocketError', () => {
  it('code가 BLOCKED이면 true를 반환한다', () => {
    expect(isBlockedSocketError({ code: 'BLOCKED' })).toBe(true);
  });

  it('message에 "차단"이 포함되면 true를 반환한다', () => {
    expect(isBlockedSocketError({ message: '차단한 사용자입니다.' })).toBe(true);
  });

  it('차단과 무관한 에러는 false를 반환한다', () => {
    expect(isBlockedSocketError({ message: '알 수 없는 오류입니다.' })).toBe(false);
  });

  it('message와 code가 모두 없으면 false를 반환한다', () => {
    expect(isBlockedSocketError({})).toBe(false);
  });
});
