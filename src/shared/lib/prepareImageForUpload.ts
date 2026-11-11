import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_LONG_SIDE = 1600;
const JPEG_QUALITY = 0.7;

// 긴 변을 1600px로 줄이고 JPEG 0.7로 다시 인코딩한다. 작은 사진은 확대하지 않는다.
export const prepareImageForUpload = async (uri: string): Promise<string> => {
  const source = await ImageManipulator.manipulate(uri).renderAsync();
  const needsResize = Math.max(source.width, source.height) > MAX_LONG_SIDE;
  const image = needsResize
    ? await ImageManipulator.manipulate(source)
        .resize(
          source.width >= source.height ? { width: MAX_LONG_SIDE } : { height: MAX_LONG_SIDE }
        )
        .renderAsync()
    : source;
  const { uri: resizedUri } = await image.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  return resizedUri;
};
