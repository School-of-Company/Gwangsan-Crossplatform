import { handleCategory, returnValue } from '../handleCategory';

describe('handleCategory', () => {
  it('OBJECT는 ["팔아요", "필요해요"]를 반환한다', () => {
    expect(handleCategory('OBJECT')).toEqual(['팔아요', '필요해요']);
  });

  it('SERVICE는 ["할 수 있어요", "해주세요"]를 반환한다', () => {
    expect(handleCategory('SERVICE')).toEqual(['할 수 있어요', '해주세요']);
  });

  it('OBJECT 반환값의 첫 번째 요소는 팔아요이다', () => {
    expect(handleCategory('OBJECT')[0]).toBe('팔아요');
  });

  it('OBJECT 반환값의 두 번째 요소는 필요해요이다', () => {
    expect(handleCategory('OBJECT')[1]).toBe('필요해요');
  });

  it('SERVICE 반환값의 첫 번째 요소는 할 수 있어요이다', () => {
    expect(handleCategory('SERVICE')[0]).toBe('할 수 있어요');
  });

  it('SERVICE 반환값의 두 번째 요소는 해주세요이다', () => {
    expect(handleCategory('SERVICE')[1]).toBe('해주세요');
  });

  it('OBJECT와 SERVICE는 서로 다른 배열을 반환한다', () => {
    expect(handleCategory('OBJECT')).not.toEqual(handleCategory('SERVICE'));
  });
});

describe('returnValue', () => {
  it.each<[string, string]>([
    ['팔아요', 'GIVER'],
    ['할 수 있어요', 'GIVER'],
  ])('%s → GIVER', (input, expected) => {
    expect(returnValue(input as '팔아요' | '할 수 있어요')).toBe(expected);
  });

  it.each<[string, string]>([
    ['필요해요', 'RECEIVER'],
    ['해주세요', 'RECEIVER'],
  ])('%s → RECEIVER', (input, expected) => {
    expect(returnValue(input as '필요해요' | '해주세요')).toBe(expected);
  });

  it('undefined는 undefined를 반환한다', () => {
    expect(returnValue(undefined)).toBeUndefined();
  });

  it('GIVER를 반환하는 카테고리는 2개이다', () => {
    const giverCategories = (['팔아요', '할 수 있어요', '필요해요', '해주세요'] as const).filter(
      (c) => returnValue(c) === 'GIVER'
    );
    expect(giverCategories).toHaveLength(2);
  });

  it('RECEIVER를 반환하는 카테고리는 2개이다', () => {
    const receiverCategories = (['팔아요', '할 수 있어요', '필요해요', '해주세요'] as const).filter(
      (c) => returnValue(c) === 'RECEIVER'
    );
    expect(receiverCategories).toHaveLength(2);
  });
});
