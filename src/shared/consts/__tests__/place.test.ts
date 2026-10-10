import { HEAD, PLACES, PLACE_ITEMS } from '../place';

describe('PLACE_ITEMS', () => {
  it('6개의 장소 항목을 포함한다', () => {
    expect(PLACE_ITEMS).toHaveLength(6);
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

  it('신창, 고실마을 지점만 포함하고 그 외 지점은 포함하지 않는다', () => {
    expect(PLACES).toContain('신창');
    expect(PLACES).toContain('고실마을');
    expect(PLACES).not.toContain('신가');
    expect(PLACES).not.toContain('수완마을');
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

  it('HEAD의 각 value가 PLACE_ITEMS에 존재하는 name과 일치한다', () => {
    Object.entries(HEAD).forEach(([id, name]) => {
      const item = PLACE_ITEMS.find((p) => p.id === Number(id));
      expect(item?.name).toBe(name);
    });
  });
});
