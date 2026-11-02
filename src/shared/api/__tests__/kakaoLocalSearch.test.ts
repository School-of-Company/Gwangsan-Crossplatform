import { AxiosError, AxiosHeaders } from 'axios';
import { searchPlaces, searchNearbyPlaces, getAddressName, kakaoClient } from '../kakaoLocalSearch';

const KAKAO_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

// 성공 응답은 { data }로 resolve하고, 실패 응답은 axios처럼 AxiosError로 reject한다
const makeResponse = (ok: boolean, body: unknown, status = 200) =>
  ok
    ? Promise.resolve({ data: body })
    : Promise.reject(
        new AxiosError('Request failed', String(status), undefined, undefined, {
          status,
          statusText: '',
          data: body,
          headers: {},
          config: { headers: new AxiosHeaders() },
        })
      );

let mockGet: jest.SpyInstance;

beforeEach(() => {
  mockGet = jest.spyOn(kakaoClient, 'get');
});

afterEach(() => {
  jest.restoreAllMocks();
});

// 예전 fetch URL 검증과 같은 의미가 되도록, 요청 경로와 쿼리 파라미터를 URL 문자열로 합친다
const requestUrl = (callIndex = 0) => {
  const [path, config] = mockGet.mock.calls[callIndex];
  return `https://dapi.kakao.com${path}?${new URLSearchParams(config.params).toString()}`;
};

describe('searchPlaces', () => {
  it('카카오 API 키가 없으면 요청하지 않고 에러를 던진다', async () => {
    delete process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
    try {
      await expect(searchPlaces('상무역')).rejects.toThrow('카카오 API 키가 설정되지 않았습니다.');
      expect(mockGet).not.toHaveBeenCalled();
    } finally {
      process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = KAKAO_API_KEY;
    }
  });

  it('성공 시 documents를 반환하고 Authorization 헤더를 포함해 요청한다', async () => {
    const documents = [
      {
        id: '1',
        place_name: '상무역',
        category_name: '지하철역',
        address_name: '광주 서구 상무동',
        road_address_name: '광주 서구 상무중앙로',
        x: '126.0',
        y: '35.0',
      },
    ];
    mockGet.mockImplementationOnce(() => makeResponse(true, { documents }));

    const result = await searchPlaces('상무역');

    expect(result).toEqual(documents);
    expect(mockGet).toHaveBeenCalledTimes(1);
    const url = requestUrl();
    const [, options] = mockGet.mock.calls[0];
    expect(url).toContain('https://dapi.kakao.com/v2/local/search/keyword.json');
    expect(url).toContain('query=%EC%83%81%EB%AC%B4%EC%97%AD');
    expect(options.headers.Authorization).toBe(`KakaoAK ${KAKAO_API_KEY}`);
  });

  it('응답이 ok가 아니면 상태 코드를 포함한 에러를 던진다', async () => {
    mockGet.mockImplementationOnce(() => makeResponse(false, {}, 500));

    await expect(searchPlaces('상무역')).rejects.toThrow('장소 검색 요청이 실패했습니다. (500)');
  });
});

describe('searchNearbyPlaces', () => {
  const coordinate = { latitude: 35.0, longitude: 126.0 };

  it('카테고리별 결과를 중복 제거하고 거리순으로 병합하며, 실패한 카테고리는 빈 배열로 취급한다', async () => {
    const place1 = { id: '1', place_name: 'A', distance: '100' };
    const place2 = { id: '2', place_name: 'B', distance: '50' };
    const place2Dup = { id: '2', place_name: 'B-dup', distance: '999' };
    const place3 = { id: '3', place_name: 'C', distance: '10' };
    const place4 = { id: '4', place_name: 'D', distance: '200' };

    mockGet
      // SW8: 지하철역
      .mockImplementationOnce(() => makeResponse(true, { documents: [place1, place2] }))
      // CS2: 편의점
      .mockImplementationOnce(() => makeResponse(true, { documents: [place2Dup, place3] }))
      // CE7: 카페 - 실패 응답
      .mockImplementationOnce(() => makeResponse(false, {}, 500))
      // BK9: 은행
      .mockImplementationOnce(() => makeResponse(true, { documents: [place4] }));

    const result = await searchNearbyPlaces(coordinate, 500);

    expect(mockGet).toHaveBeenCalledTimes(4);
    // 중복 id('2')는 처음 등장한 place2만 유지되고, 거리(distance) 오름차순으로 정렬된다.
    expect(result.map((p) => p.id)).toEqual(['3', '2', '1', '4']);
    expect(result.find((p) => p.id === '2')).toEqual(place2);
  });

  it('요청 파라미터에 좌표와 반경, 정렬 기준을 포함한다', async () => {
    mockGet.mockImplementation(() => makeResponse(true, { documents: [] }));

    await searchNearbyPlaces(coordinate, 300);

    const url = requestUrl();
    expect(url).toContain('https://dapi.kakao.com/v2/local/search/category.json');
    expect(url).toContain('category_group_code=SW8');
    expect(url).toContain('x=126');
    expect(url).toContain('y=35');
    expect(url).toContain('radius=300');
    expect(url).toContain('sort=distance');
  });
});

describe('getAddressName', () => {
  const coordinate = { latitude: 35.0, longitude: 126.0 };

  it('응답이 ok가 아니면 상태 코드를 포함한 에러를 던진다', async () => {
    mockGet.mockImplementationOnce(() => makeResponse(false, {}, 400));

    await expect(getAddressName(coordinate)).rejects.toThrow(
      '주소 변환 요청이 실패했습니다. (400)'
    );
  });

  it('road_address가 있으면 도로명 주소를 반환한다', async () => {
    mockGet.mockImplementationOnce(() =>
      makeResponse(true, {
        documents: [
          {
            address: { address_name: '광주 광산구 지번주소' },
            road_address: { address_name: '광주 광산구 도로명주소' },
          },
        ],
      })
    );

    const result = await getAddressName(coordinate);
    expect(result).toBe('광주 광산구 도로명주소');
  });

  it('road_address가 null이면 address_name으로 대체한다', async () => {
    mockGet.mockImplementationOnce(() =>
      makeResponse(true, {
        documents: [
          {
            address: { address_name: '광주 광산구 지번주소' },
            road_address: null,
          },
        ],
      })
    );

    const result = await getAddressName(coordinate);
    expect(result).toBe('광주 광산구 지번주소');
  });

  it('documents가 비어있으면 빈 문자열을 반환한다', async () => {
    mockGet.mockImplementationOnce(() => makeResponse(true, { documents: [] }));

    const result = await getAddressName(coordinate);
    expect(result).toBe('');
  });
});
