import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { uploadImage, UPLOAD_TIMEOUT_MS } from '../uploadImage';

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockReturnValue({ exists: true, size: 0 }),
}));

const MockFile = FileSystem.File as unknown as jest.Mock;

const BASE = 'http://test-api.com';
const IMAGE = { imageId: 1, imageUrl: 'https://cdn.example.com/img.jpg' };

beforeAll(() => {
  instance.defaults.baseURL = BASE;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// 실제 요청은 MSW로 처리하고, axios config와 FormData 인자는 spy로 확인한다
let postSpy: jest.SpyInstance;
let appendSpy: jest.SpyInstance;

beforeEach(() => {
  postSpy = jest.spyOn(instance, 'post');
  appendSpy = jest.spyOn(FormData.prototype, 'append');
  MockFile.mockReset();
  MockFile.mockReturnValue({ exists: true, size: 0 });
});

afterEach(() => {
  postSpy.mockRestore();
  appendSpy.mockRestore();
});

// 요청이 도착했는지 기록하고 이미지 응답을 돌려준다
const captureUpload = (response: object = IMAGE) => {
  const received = jest.fn();
  server.use(
    http.post(`${BASE}/image`, () => {
      received();
      return HttpResponse.json(response);
    })
  );
  return received;
};

const uploadedFile = () => appendSpy.mock.calls[0][1];

describe('uploadImage', () => {
  it('POST /image로 multipart 업로드하고 서버 응답 데이터를 반환한다', async () => {
    const received = captureUpload();

    await expect(uploadImage('file:///local/path/photo.jpg')).resolves.toEqual(IMAGE);
    expect(received).toHaveBeenCalledTimes(1);
  });

  it('multipart Content-Type 헤더를 명시하고 업로드 전용 타임아웃을 건다', async () => {
    captureUpload();

    await uploadImage('file:///local/path/photo.jpg');

    expect(postSpy).toHaveBeenCalledWith(
      '/image',
      expect.any(FormData),
      expect.objectContaining({
        timeout: UPLOAD_TIMEOUT_MS,
        headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
      })
    );
  });

  it('RN 방식의 { uri, name, type } 파일 객체를 file 필드로 담는다', async () => {
    captureUpload();

    await uploadImage('file:///local/path/photo.png');

    expect(appendSpy).toHaveBeenCalledWith('file', {
      uri: 'file:///local/path/photo.png',
      name: 'photo.png',
      type: 'image/png',
    });
  });

  it('확장자·파일명을 알 수 없는 URI도 기본값으로 업로드한다', async () => {
    captureUpload();

    await expect(uploadImage('file:///local/path/')).resolves.toEqual(IMAGE);
    expect(uploadedFile()).toEqual(expect.objectContaining({ name: 'image.jpg' }));

    appendSpy.mockClear();
    await expect(uploadImage('file:///local/path/photo')).resolves.toEqual(IMAGE);
    expect(uploadedFile()).toEqual(expect.objectContaining({ name: 'photo' }));
  });

  it('10MB 초과 파일은 요청을 보내지 않고 에러를 던진다', async () => {
    MockFile.mockReturnValue({ exists: true, size: 11 * 1024 * 1024 });
    const received = captureUpload();

    await expect(uploadImage('file:///local/path/photo.jpg')).rejects.toThrow(
      '파일 크기가 10MB를 초과합니다'
    );
    expect(received).not.toHaveBeenCalled();
  });

  it('파일이 존재하지 않으면 크기 검사를 건너뛴다', async () => {
    MockFile.mockReturnValue({ exists: false, size: 11 * 1024 * 1024 });
    captureUpload();

    await expect(uploadImage('file:///local/path/photo.jpg')).resolves.toEqual(IMAGE);
  });

  it('서버 4xx는 서버 메시지로 바꾸되 상태 코드를 유지한 AxiosError로 던진다', async () => {
    server.use(
      http.post(`${BASE}/image`, () =>
        HttpResponse.json({ message: '업로드할 수 있는 크기를 초과했습니다.' }, { status: 413 })
      )
    );

    const error = await uploadImage('file:///local/path/photo.jpg').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(413);
    expect((error as Error).message).toBe('업로드할 수 있는 크기를 초과했습니다.');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.post(`${BASE}/image`, () => HttpResponse.error()));

    await expect(uploadImage('file:///local/path/photo.jpg')).rejects.toThrow();
  });

  describe('Android 플랫폼', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    afterEach(() => {
      Platform.OS = 'ios';
    });

    it.each([
      ['file:///local/path/photo.', 'image/jpeg'],
      ['file:///local/path/photo.jpg', 'image/jpg'],
    ])('%s 는 %s 타입으로 업로드한다', async (uri, type) => {
      captureUpload();

      await expect(uploadImage(uri)).resolves.toEqual(IMAGE);
      expect(uploadedFile()).toEqual(expect.objectContaining({ type }));
    });
  });
});
