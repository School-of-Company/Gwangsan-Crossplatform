import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { logger } from '~/shared/lib/logger';

const MAX_LONG_SIDE = 1600;
const JPEG_QUALITY = 0.7;

// 긴 변을 1600px로 줄이고 JPEG 0.7로 다시 인코딩한다. 작은 사진은 확대하지 않는다.
// 투명 PNG는 배경이 검게 되고 GIF는 첫 프레임만 남는다.
// 손상된 파일 등으로 실패하면 원본으로 올려 업로드까지 막지 않는다.
export const prepareImageForUpload = async (uri: string): Promise<string> => {
  // 네이티브 비트맵은 GC를 기다리지 않고 바로 해제한다 (여러 장을 동시에 처리하면 OOM 위험)
  const refs: { release: () => void }[] = [];
  try {
    const source = await ImageManipulator.manipulate(uri).renderAsync();
    refs.push(source);
    const needsResize = Math.max(source.width, source.height) > MAX_LONG_SIDE;
    let image = source;
    if (needsResize) {
      image = await ImageManipulator.manipulate(source)
        .resize(
          source.width >= source.height ? { width: MAX_LONG_SIDE } : { height: MAX_LONG_SIDE }
        )
        .renderAsync();
      refs.push(image);
    }
    const { uri: resizedUri } = await image.saveAsync({
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });
    return resizedUri;
  } catch (error) {
    logger.warn('prepareImageForUpload failed, uploading original', error);
    return uri;
  } finally {
    refs.forEach((ref) => ref.release());
  }
};
