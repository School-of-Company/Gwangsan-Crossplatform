import { http, HttpResponse } from 'msw';

const BASE = 'http://test-api.com';

export const makeAppVersion = (overrides: Record<string, unknown> = {}) => ({
  latestVersion: '1.3.0',
  minimumVersion: '1.0.0',
  ...overrides,
});

export const appVersionHandlers = [
  http.get(`${BASE}/app/version`, ({ request }) => {
    const platform = new URL(request.url).searchParams.get('platform');
    return HttpResponse.json(
      makeAppVersion({ latestVersion: platform === 'ios' ? '1.3.0' : '1.2.9' })
    );
  }),
];
