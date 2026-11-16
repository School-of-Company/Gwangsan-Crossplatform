import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { updateChatMessage } from '../updateChatMessage';
import { deleteChatMessage } from '../deleteChatMessage';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('updateChatMessage', () => {
  it('PATCH /chat/message/:id 로 수정할 내용을 보낸다', async () => {
    const received = jest.fn();
    server.use(
      http.patch(`${BASE}/chat/message/:id`, async ({ params, request }) => {
        received(params.id, await request.json());
        return HttpResponse.json({ messageId: 3, content: '수정', editedAt: 'T' });
      })
    );

    await expect(updateChatMessage(3, '수정')).resolves.toEqual({
      messageId: 3,
      content: '수정',
      editedAt: 'T',
    });
    expect(received).toHaveBeenCalledWith('3', { content: '수정' });
  });

  it('응답 본문이 없으면 undefined를 돌려준다', async () => {
    server.use(http.patch(`${BASE}/chat/message/3`, () => new HttpResponse(null, { status: 204 })));

    await expect(updateChatMessage(3, '수정')).resolves.toBeUndefined();
  });

  it('실패하면 서버 메시지를 담고 상태 코드를 유지한 에러를 던진다', async () => {
    server.use(
      http.patch(`${BASE}/chat/message/3`, () =>
        HttpResponse.json(
          { message: '24시간이 지난 메시지는 수정할 수 없습니다.' },
          { status: 400 }
        )
      )
    );

    await expect(updateChatMessage(3, '수정')).rejects.toMatchObject({
      message: '24시간이 지난 메시지는 수정할 수 없습니다.',
      response: { status: 400 },
    });
  });
});

describe('deleteChatMessage', () => {
  it('DELETE /chat/message/:id 를 호출한다', async () => {
    const requested = jest.fn();
    server.use(
      http.delete(`${BASE}/chat/message/:id`, ({ params }) => {
        requested(params.id);
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(deleteChatMessage(9)).resolves.toBeUndefined();
    expect(requested).toHaveBeenCalledWith('9');
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.delete(`${BASE}/chat/message/9`, () =>
        HttpResponse.json({ message: '권한이 없습니다.' }, { status: 403 })
      )
    );

    await expect(deleteChatMessage(9)).rejects.toThrow('권한이 없습니다.');
  });
});
