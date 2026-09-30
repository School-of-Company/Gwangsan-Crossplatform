import React from 'react';
import { render } from '@testing-library/react-native';
import { Image } from 'expo-image';
import { CachedImage } from '../index';

describe('CachedImage', () => {
  it('기본으로 메모리와 디스크에 캐시하고 cover로 채운다', () => {
    const { UNSAFE_getByType } = render(
      <CachedImage source={{ uri: 'https://example.com/a.jpg' }} />
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.cachePolicy).toBe('memory-disk');
    expect(image.props.contentFit).toBe('cover');
  });

  it('캐시 정책과 채우기 방식을 바꿀 수 있다', () => {
    const { UNSAFE_getByType } = render(
      <CachedImage source={{ uri: 'file://local.jpg' }} cachePolicy="none" contentFit="contain" />
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.cachePolicy).toBe('none');
    expect(image.props.contentFit).toBe('contain');
  });

  it('로딩/실패 콜백을 그대로 넘긴다', () => {
    const onError = jest.fn();
    const onLoadEnd = jest.fn();
    const { UNSAFE_getByType } = render(
      <CachedImage
        source={{ uri: 'https://example.com/a.jpg' }}
        onError={onError}
        onLoadEnd={onLoadEnd}
      />
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.onError).toBe(onError);
    expect(image.props.onLoadEnd).toBe(onLoadEnd);
  });
});
