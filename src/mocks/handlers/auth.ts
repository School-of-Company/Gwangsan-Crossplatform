import { http, HttpResponse } from 'msw';

const BASE = 'http://test-api.com';

export const authHandlers = [
  http.post(`${BASE}/auth/signin`, () =>
    HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      accessTokenExpiresIn: '3600',
      refreshTokenExpiresIn: '86400',
    })
  ),
  http.post(`${BASE}/auth/signup`, () => HttpResponse.json({ message: 'success' })),
  http.delete(`${BASE}/auth/signout`, () => HttpResponse.json({ message: 'success' })),
  http.delete(`${BASE}/member`, () => HttpResponse.json({ message: 'success' })),
  http.post(`${BASE}/auth/reissue`, () => HttpResponse.json({ accessToken: 'new-access-token' })),
  http.post(`${BASE}/sms`, () => HttpResponse.json({ message: 'success' })),
  http.post(`${BASE}/sms/verify`, () => HttpResponse.json({ message: 'success' })),
  http.patch(`${BASE}/auth/password`, () => HttpResponse.json({ message: 'success' })),
  http.post(`${BASE}/sms/password`, () => HttpResponse.json({ message: 'success' })),
  http.post(`${BASE}/sms/password/verify`, () => HttpResponse.json({ message: 'success' })),
  http.get(`${BASE}/member`, () => HttpResponse.json({ memberId: 123 })),
];
