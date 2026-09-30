import { reviewKeys } from '../reviewQueryKeys';

describe('reviewKeys', () => {
  it('모든 후기 키는 reviews로 시작해 한 번에 무효화할 수 있다', () => {
    expect(reviewKeys.toss().slice(0, 1)).toEqual(reviewKeys.all);
    expect(reviewKeys.received('current').slice(0, 1)).toEqual(reviewKeys.all);
    expect(reviewKeys.receivedInfinite('current', 20).slice(0, 1)).toEqual(reviewKeys.all);
  });

  it('내가 쓴 후기는 화면과 상관없이 같은 키를 쓴다(이중 캐시 방지)', () => {
    expect(reviewKeys.toss()).toEqual(['reviews', 'toss']);
  });

  it('무한 스크롤 키는 전체 목록 키와 섞이지 않는다', () => {
    expect(reviewKeys.receivedInfinite('current', 20)).not.toEqual(reviewKeys.received('current'));
  });
});
