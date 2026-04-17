import { uploadImage } from '../uploadImage';
import { instance } from '~/shared/lib/axios';
import * as FileSystem from 'expo-file-system';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  init: jest.fn(),
}));

jest.mock('~/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockReturnValue({ exists: true, size: 0 }),
}));

const mockPost = instance.post as jest.Mock;
const MockFile = FileSystem.File as unknown as jest.Mock;

describe('uploadImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockFile.mockReturnValue({ exists: true, size: 0 });
  });

  it('성공 시 서버 응답 데이터를 반환한다', async () => {
    const mockResponse = { imageId: 1, imageUrl: 'https://cdn.example.com/img.jpg' };
    mockPost.mockResolvedValue({ data: mockResponse });

    const result = await uploadImage('file:///local/path/photo.jpg');

    expect(result).toEqual(mockResponse);
  });

  it('multipart/form-data Content-Type으로 POST 요청한다', async () => {
    mockPost.mockResolvedValue({ data: { imageId: 1, imageUrl: '' } });

    await uploadImage('file:///local/path/photo.jpg');

    expect(mockPost).toHaveBeenCalledWith(
      '/image',
      expect.any(Object),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  });

  it('URI에서 파일명을 추출해 FormData에 추가한다', async () => {
    mockPost.mockResolvedValue({ data: { imageId: 1, imageUrl: '' } });

    await uploadImage('file:///local/path/photo.png');

    const formData = mockPost.mock.calls[0][1] as FormData;
    expect(formData).toBeDefined();
  });

  it('확장자가 없는 URI는 jpeg를 기본 타입으로 사용한다', async () => {
    mockPost.mockResolvedValue({ data: { imageId: 1, imageUrl: '' } });

    await uploadImage('file:///local/path/photo');

    expect(mockPost).toHaveBeenCalled();
  });

  it('10MB 초과 파일은 에러를 던진다', async () => {
    MockFile.mockReturnValue({ exists: true, size: 11 * 1024 * 1024 });

    await expect(uploadImage('file:///local/path/photo.jpg')).rejects.toThrow(
      '파일 크기가 10MB를 초과합니다'
    );
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('파일이 존재하지 않으면 크기 검사를 건너뛴다', async () => {
    MockFile.mockReturnValue({ exists: false, size: 11 * 1024 * 1024 });
    mockPost.mockResolvedValue({ data: { imageId: 1, imageUrl: '' } });

    await expect(uploadImage('file:///local/path/photo.jpg')).resolves.toBeDefined();
  });

  it('API 실패 시 에러를 그대로 던진다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockPost.mockRejectedValue(new Error('Upload failed'));

    await expect(uploadImage('file:///local/path/photo.jpg')).rejects.toThrow('Upload failed');
  });

  describe('Android 플랫폼', () => {
    const platform = require('react-native').Platform;

    beforeEach(() => {
      platform.OS = 'android';
    });

    afterEach(() => {
      platform.OS = 'ios';
    });

    it('Android에서 확장자 없는 URI는 jpeg를 기본 타입으로 사용한다', async () => {
      mockPost.mockResolvedValue({ data: { imageId: 1, imageUrl: '' } });

      await uploadImage('file:///local/path/photo.');

      expect(mockPost).toHaveBeenCalledWith(
        '/image',
        expect.any(Object),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
    });

    it('Android에서 확장자 있는 URI는 해당 타입으로 요청한다', async () => {
      mockPost.mockResolvedValue({ data: { imageId: 1, imageUrl: '' } });

      await uploadImage('file:///local/path/photo.jpg');

      expect(mockPost).toHaveBeenCalled();
    });
  });
});
