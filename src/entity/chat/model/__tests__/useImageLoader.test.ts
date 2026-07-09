import { act, renderHook } from '@testing-library/react-native';
import { useImageLoader } from '../useImageLoader';

describe('useImageLoader', () => {
  it('초기 상태에서는 모든 이미지가 로딩 중도, 에러도 아니다', () => {
    const { result } = renderHook(() => useImageLoader());

    expect(result.current.isImageLoading(1)).toBe(false);
    expect(result.current.hasImageError(1)).toBe(false);
    expect(result.current.imageStates).toEqual({});
  });

  it('handleImageLoadStart 호출 시 해당 이미지가 로딩 중 상태가 된다', () => {
    const { result } = renderHook(() => useImageLoader());

    act(() => {
      result.current.handleImageLoadStart(1);
    });

    expect(result.current.isImageLoading(1)).toBe(true);
    expect(result.current.hasImageError(1)).toBe(false);
  });

  it('handleImageLoadEnd 호출 시 해당 이미지의 로딩이 끝나고 에러는 없다', () => {
    const { result } = renderHook(() => useImageLoader());

    act(() => {
      result.current.handleImageLoadStart(1);
    });
    act(() => {
      result.current.handleImageLoadEnd(1);
    });

    expect(result.current.isImageLoading(1)).toBe(false);
    expect(result.current.hasImageError(1)).toBe(false);
  });

  it('handleImageError 호출 시 로딩은 끝나고 에러 상태가 된다', () => {
    const { result } = renderHook(() => useImageLoader());

    act(() => {
      result.current.handleImageLoadStart(1);
    });
    act(() => {
      result.current.handleImageError(1);
    });

    expect(result.current.isImageLoading(1)).toBe(false);
    expect(result.current.hasImageError(1)).toBe(true);
  });

  it('여러 이미지의 상태를 독립적으로 관리한다', () => {
    const { result } = renderHook(() => useImageLoader());

    act(() => {
      result.current.handleImageLoadStart(1);
      result.current.handleImageError(2);
    });

    expect(result.current.isImageLoading(1)).toBe(true);
    expect(result.current.hasImageError(1)).toBe(false);
    expect(result.current.isImageLoading(2)).toBe(false);
    expect(result.current.hasImageError(2)).toBe(true);
  });

  it('상태가 없는 imageId는 로딩도, 에러도 아니다 (기본값)', () => {
    const { result } = renderHook(() => useImageLoader());

    act(() => {
      result.current.handleImageLoadStart(1);
    });

    expect(result.current.isImageLoading(999)).toBe(false);
    expect(result.current.hasImageError(999)).toBe(false);
  });
});
