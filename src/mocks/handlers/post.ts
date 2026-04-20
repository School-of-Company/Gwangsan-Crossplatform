import { http, HttpResponse } from 'msw';

const BASE = 'http://test-api.com';

export const makePostListItem = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '테스트 게시글',
  content: '테스트 내용',
  gwangsan: 1,
  type: 'OBJECT',
  mode: 'GIVER',
  images: [{ imageId: 1, imageUrl: 'https://example.com/img.jpg' }],
  isCompletable: true,
  isCompleted: false,
  ...overrides,
});

export const makePostDetail = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '상세 게시글',
  content: '상세 내용',
  gwangsan: 1,
  type: 'OBJECT',
  mode: 'GIVER',
  images: [{ imageId: 1, imageUrl: 'https://example.com/img.jpg' }],
  isCompletable: true,
  isCompleted: false,
  member: {
    memberId: 42,
    nickname: '홍길동',
    placeName: '광산구',
    light: 80,
  },
  ...overrides,
});

export const postHandlers = [
  http.get(`${BASE}/post`, () => HttpResponse.json([makePostListItem()])),

  http.get(`${BASE}/post/:postId`, ({ params }) => {
    const { postId } = params;
    return HttpResponse.json(makePostDetail({ id: Number(postId) }));
  }),
];
