import fs from 'fs';
import path from 'path';
import { searchPlaces, searchNearbyPlaces, getAddressName } from '../kakaoLocalSearch';

// NOTE on the "no API key" branch (`getKakaoApiKey` throwing when the key is falsy):
// babel.config.js runs `module:react-native-dotenv` unconditionally (not gated by
// `isTest`), and that plugin inlines every static `process.env.<KEY>` read as a
// compile-time string literal taken straight from the repo's `.env` file - it does
// NOT read `process.env` at runtime. Verified directly: transforming
// kakaoLocalSearch.ts with the project's exact babel config produces
// `var apiKey = "<the .env value>";` (the literal `.env` value, redacted here)
// baked into the compiled `getKakaoApiKey` body. So mutating `process.env` from a
// test (`delete process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY`, etc.) has zero effect
// on the already-compiled module - the `if (!apiKey) throw` branch is unreachable
// through this repo's tooling as long as `.env` defines the key, which it always
// does in this repo. This mirrors the exact same limitation documented in
// jest.setup.js for `EXPO_PUBLIC_SENTRY_DSN`. We therefore don't assert that branch
// here; instead we read the real inlined value out of `.env` so the "happy path"
// assertions don't hardcode a value that could drift from the repo's actual key.
const ENV_FILE_CONTENT = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const INLINED_KAKAO_API_KEY = (
  ENV_FILE_CONTENT.match(/^EXPO_PUBLIC_KAKAO_REST_API_KEY=(.*)$/m)?.[1] ?? ''
).trim();

const makeResponse = (ok: boolean, body: unknown, status = 200) => ({
  ok,
  status,
  json: async () => body,
});

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('searchPlaces', () => {
  it('전제조건: 테스트가 참조하는 카카오 API 키가 .env에 실제로 설정되어 있다', () => {
    expect(INLINED_KAKAO_API_KEY.length).toBeGreaterThan(0);
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
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeResponse(true, { documents }));

    const result = await searchPlaces('상무역');

    expect(result).toEqual(documents);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('https://dapi.kakao.com/v2/local/search/keyword.json');
    expect(url).toContain('query=%EC%83%81%EB%AC%B4%EC%97%AD');
    expect(options.headers.Authorization).toBe(`KakaoAK ${INLINED_KAKAO_API_KEY}`);
  });

  it('응답이 ok가 아니면 상태 코드를 포함한 에러를 던진다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeResponse(false, {}, 500));

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

    (global.fetch as jest.Mock)
      // SW8: 지하철역
      .mockResolvedValueOnce(makeResponse(true, { documents: [place1, place2] }))
      // CS2: 편의점
      .mockResolvedValueOnce(makeResponse(true, { documents: [place2Dup, place3] }))
      // CE7: 카페 - 실패 응답
      .mockResolvedValueOnce(makeResponse(false, {}, 500))
      // BK9: 은행
      .mockResolvedValueOnce(makeResponse(true, { documents: [place4] }));

    const result = await searchNearbyPlaces(coordinate, 500);

    expect(global.fetch).toHaveBeenCalledTimes(4);
    // 중복 id('2')는 처음 등장한 place2만 유지되고, 거리(distance) 오름차순으로 정렬된다.
    expect(result.map((p) => p.id)).toEqual(['3', '2', '1', '4']);
    expect(result.find((p) => p.id === '2')).toEqual(place2);
  });

  it('요청 파라미터에 좌표와 반경, 정렬 기준을 포함한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeResponse(true, { documents: [] }));

    await searchNearbyPlaces(coordinate, 300);

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
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
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeResponse(false, {}, 400));

    await expect(getAddressName(coordinate)).rejects.toThrow(
      '주소 변환 요청이 실패했습니다. (400)'
    );
  });

  it('road_address가 있으면 도로명 주소를 반환한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
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
    (global.fetch as jest.Mock).mockResolvedValueOnce(
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
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeResponse(true, { documents: [] }));

    const result = await getAddressName(coordinate);
    expect(result).toBe('');
  });
});
