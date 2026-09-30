import { Image, type ImageProps } from 'expo-image';
import { cssInterop } from 'nativewind';

// expo-image는 NativeWind에 등록되어 있지 않아 className이 무시된다. style로 연결해
// RN Image를 쓰던 곳의 className(크기, 모서리 등)을 그대로 쓸 수 있게 한다.
cssInterop(Image, { className: 'style' });

export type CachedImageProps = ImageProps & { className?: string };

// 네트워크 이미지를 메모리와 디스크에 캐시해, 같은 화면에 다시 들어오거나 앱을 다시 켜도
// 이미 받은 이미지를 다시 내려받지 않는다(#732). RN Image는 디스크 캐시 정책을 지정할 수 없다.
export function CachedImage({
  cachePolicy = 'memory-disk',
  contentFit = 'cover',
  ...props
}: CachedImageProps) {
  return <Image cachePolicy={cachePolicy} contentFit={contentFit} {...props} />;
}
