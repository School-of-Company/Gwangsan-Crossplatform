describe('API_BASE_URL', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('expo-constants');
  });

  it('expoConfig.extra.apiUrl 값이 있으면 해당 값을 사용한다', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: { apiUrl: 'http://custom-api.com' } } },
    }));

    const { API_BASE_URL } = require('../api');

    expect(API_BASE_URL).toBe('http://custom-api.com');
  });

  it('expoConfig.extra.apiUrl 값이 없으면 기본 URL로 대체된다', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: {} } },
    }));

    const { API_BASE_URL } = require('../api');

    expect(API_BASE_URL).toBe('https://api.gwangsan.io.kr/api');
  });

  it('expoConfig 자체가 없어도 기본 URL로 대체된다', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {},
    }));

    const { API_BASE_URL } = require('../api');

    expect(API_BASE_URL).toBe('https://api.gwangsan.io.kr/api');
  });
});
