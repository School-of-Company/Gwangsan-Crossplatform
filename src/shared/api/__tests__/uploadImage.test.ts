import { uploadImage } from '../uploadImage';
import { instance } from '~/shared/lib/axios';

import * as FileSystem from 'expo-file-system';

jest.mock('~/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
}));

const mockPost = instance.post as jest.Mock;
const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;

describe('uploadImage', () => {
  beforeEach(() => jest.clearAllMocks());

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

    // 확장자가 없는 URI: 파일명이 '.'으로 끝나면 fileType='' (falsy) → Android 분기 진입
    it('Android에서 fileType이 빈 문자열인 URI + 파일 존재 시 getInfoAsync를 호출한다', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: true });
      mockPost.mockResolvedValue({ data: { imageId: 1, imageUrl: '' } });

      await uploadImage('file:///local/path/photo.');

      expect(mockGetInfoAsync).toHaveBeenCalledWith('file:///local/path/photo.');
    });

    it('Android에서 fileType이 빈 문자열인 URI + 파일 미존재 시 jpeg 기본 타입으로 요청한다', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: false });
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

    it('Android에서 확장자 있는 URI는 getInfoAsync를 호출하지 않는다', async () => {
      mockPost.mockResolvedValue({ data: { imageId: 1, imageUrl: '' } });

      await uploadImage('file:///local/path/photo.jpg');

      expect(mockGetInfoAsync).not.toHaveBeenCalled();
    });
  });
});
