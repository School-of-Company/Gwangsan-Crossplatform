import { ImageManipulator } from 'expo-image-manipulator';
import { prepareImageForUpload } from '../prepareImageForUpload';
import { logger } from '~/shared/lib/logger';

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('~/shared/lib/logger', () => ({ logger: { warn: jest.fn() } }));

const mockManipulate = ImageManipulator.manipulate as jest.Mock;

const mockImage = (width: number, height: number, uri = 'file:///out.jpg') => ({
  width,
  height,
  release: jest.fn(),
  saveAsync: jest.fn().mockResolvedValue({ uri }),
});

describe('prepareImageForUpload', () => {
  const resize = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (source: ReturnType<typeof mockImage>, resized?: ReturnType<typeof mockImage>) => {
    mockManipulate.mockImplementation((input: unknown) =>
      typeof input === 'string'
        ? { renderAsync: jest.fn().mockResolvedValue(source) }
        : {
            resize: resize.mockReturnThis(),
            renderAsync: jest.fn().mockResolvedValue(resized),
          }
    );
  };

  it('가로가 긴 사진은 가로 1600px로 줄이고 JPEG 0.7로 저장한다', async () => {
    const resized = mockImage(1600, 1200, 'file:///resized.jpg');
    setup(mockImage(4000, 3000), resized);

    await expect(prepareImageForUpload('file:///in.jpg')).resolves.toBe('file:///resized.jpg');
    expect(resize).toHaveBeenCalledWith({ width: 1600 });
    expect(resized.saveAsync).toHaveBeenCalledWith({ compress: 0.7, format: 'jpeg' });
  });

  it('세로가 긴 사진은 세로 1600px로 줄인다', async () => {
    setup(mockImage(3000, 4000), mockImage(1200, 1600));

    await prepareImageForUpload('file:///in.jpg');

    expect(resize).toHaveBeenCalledWith({ height: 1600 });
  });

  it('1600px 이하 사진은 확대하지 않고 재인코딩만 한다', async () => {
    const source = mockImage(800, 600, 'file:///same-size.jpg');
    setup(source);

    await expect(prepareImageForUpload('file:///in.jpg')).resolves.toBe('file:///same-size.jpg');
    expect(resize).not.toHaveBeenCalled();
    expect(source.saveAsync).toHaveBeenCalledWith({ compress: 0.7, format: 'jpeg' });
  });

  it('정사각형 사진은 한 변을 기준으로 줄인다', async () => {
    setup(mockImage(3000, 3000), mockImage(1600, 1600));

    await prepareImageForUpload('file:///in.jpg');

    expect(resize).toHaveBeenCalledWith({ width: 1600 });
  });

  it('정확히 1600px인 사진은 리사이즈하지 않는다', async () => {
    setup(mockImage(1600, 1200));

    await prepareImageForUpload('file:///in.jpg');

    expect(resize).not.toHaveBeenCalled();
  });

  it('사용한 이미지는 모두 release 한다', async () => {
    const source = mockImage(4000, 3000);
    const resized = mockImage(1600, 1200);
    setup(source, resized);

    await prepareImageForUpload('file:///in.jpg');

    expect(source.release).toHaveBeenCalled();
    expect(resized.release).toHaveBeenCalled();
  });

  it('manipulator가 실패하면 경고를 남기고 원본 uri를 반환한다', async () => {
    mockManipulate.mockImplementation(() => ({
      renderAsync: jest.fn().mockRejectedValue(new Error('decode failed')),
    }));

    await expect(prepareImageForUpload('file:///broken.heic')).resolves.toBe('file:///broken.heic');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('저장 단계에서 실패해도 이미 만든 이미지를 release 하고 원본을 반환한다', async () => {
    const source = mockImage(800, 600);
    source.saveAsync.mockRejectedValue(new Error('disk full'));
    setup(source);

    await expect(prepareImageForUpload('file:///in.jpg')).resolves.toBe('file:///in.jpg');
    expect(source.release).toHaveBeenCalled();
  });
});
