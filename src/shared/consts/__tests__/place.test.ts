import { HEAD, PLACES, PLACE_ITEMS, findPlaceItem } from '../place';

describe('PLACE_ITEMS', () => {
  it('3개의 장소 항목을 포함한다', () => {
    expect(PLACE_ITEMS).toHaveLength(3);
  });

  it('각 항목이 id(number)와 name(string)을 가진다', () => {
    PLACE_ITEMS.forEach((item) => {
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
    });
  });

  it('id 값이 중복되지 않는다', () => {
    const ids = PLACE_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('수완지점, 고실마을지점, 신창지점만 관리자 웹과 같은 id로 포함한다', () => {
    expect(PLACE_ITEMS).toEqual([
      { id: 1, name: '수완지점' },
      { id: 2, name: '고실마을지점' },
      { id: 4, name: '신창지점' },
    ]);
    expect(PLACES).not.toContain('신가');
    expect(PLACES).not.toContain('수완마을');
    expect(PLACES).not.toContain('광산구도시재생공동체센터');
    expect(PLACES).not.toContain('투게더광산나눔문화센터');
  });
});

describe('PLACES', () => {
  it('PLACE_ITEMS의 name 값들과 순서, 개수가 동일하다', () => {
    expect(PLACES).toEqual(PLACE_ITEMS.map((item) => item.name));
  });

  it('중복된 이름이 없다', () => {
    expect(new Set(PLACES).size).toBe(PLACES.length);
  });
});

describe('findPlaceItem', () => {
  it('placeId가 있으면 placeId로 찾는다', () => {
    expect(findPlaceItem({ placeId: 2, placeName: '신창지점' })).toEqual({
      id: 2,
      name: '고실마을지점',
    });
  });

  it('노출하지 않는 placeId면 지점명으로 찾는다', () => {
    expect(findPlaceItem({ placeId: 3, placeName: '신창' })?.id).toBe(4);
  });

  it.each(['신창지점', '신창', '신창동', ' 신창 지점'])('"%s"를 신창지점으로 본다', (placeName) => {
    expect(findPlaceItem({ placeName })?.id).toBe(4);
  });

  it.each(['고실마을지점', '고실마을'])('"%s"를 고실마을지점으로 본다', (placeName) => {
    expect(findPlaceItem({ placeName })?.id).toBe(2);
  });

  it.each(['수완지점', '수완마을', '수완', '수완동'])('"%s"를 수완지점으로 본다', (placeName) => {
    expect(findPlaceItem({ placeName })?.id).toBe(1);
  });

  it('placeId 1이면 수완지점을 찾는다', () => {
    expect(findPlaceItem({ placeId: 1 })?.name).toBe('수완지점');
  });

  it('노출하지 않는 지점이나 빈 값이면 undefined를 반환한다', () => {
    expect(findPlaceItem({ placeName: '신가' })).toBeUndefined();
    expect(findPlaceItem({ placeName: '' })).toBeUndefined();
    expect(findPlaceItem({ placeId: null, placeName: null })).toBeUndefined();
  });
});

describe('HEAD', () => {
  it('id 12~15에 해당하는 4개의 매핑을 가진다', () => {
    expect(Object.keys(HEAD)).toHaveLength(4);
    expect(HEAD).toEqual({
      12: '광산구도시재생공동체센터',
      13: '광산구자원봉사센터',
      14: '광산구지역사회보장협의체',
      15: '투게더광산나눔문화센터',
    });
  });
});
