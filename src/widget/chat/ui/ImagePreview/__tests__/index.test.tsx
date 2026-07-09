import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Image, TouchableOpacity } from 'react-native';
import { ImagePreview } from '../index';
import type { ImagePreview as ImagePreviewType } from '~/widget/chat/model/useChatInput';

const makeImage = (overrides: Partial<ImagePreviewType> = {}): ImagePreviewType => ({
  imageId: 1,
  imageUrl: 'https://example.com/1.png',
  localUri: 'file://1.png',
  ...overrides,
});

describe('ImagePreview', () => {
  it('이미지가 없으면 아무것도 렌더링하지 않는다', () => {
    const { toJSON } = render(<ImagePreview images={[]} onRemoveImage={jest.fn()} />);

    expect(toJSON()).toBeNull();
  });

  it('이미지 목록을 렌더링한다', () => {
    const images = [makeImage({ imageId: 1 }), makeImage({ imageId: 2, localUri: 'file://2.png' })];

    const { UNSAFE_getAllByType } = render(
      <ImagePreview images={images} onRemoveImage={jest.fn()} />
    );

    const renderedImages = UNSAFE_getAllByType(Image);
    expect(renderedImages).toHaveLength(2);
    expect(renderedImages[0].props.source).toEqual({ uri: 'file://1.png' });
    expect(renderedImages[1].props.source).toEqual({ uri: 'file://2.png' });
  });

  it('제거 버튼을 누르면 onRemoveImage가 해당 imageId로 호출된다', () => {
    const onRemoveImage = jest.fn();
    const images = [makeImage({ imageId: 5 })];

    const { UNSAFE_getByType } = render(
      <ImagePreview images={images} onRemoveImage={onRemoveImage} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));

    expect(onRemoveImage).toHaveBeenCalledWith(5);
  });

  it('이미지가 여러 개면 각각 독립적으로 제거할 수 있다', () => {
    const onRemoveImage = jest.fn();
    const images = [makeImage({ imageId: 1 }), makeImage({ imageId: 2 })];

    const { UNSAFE_getAllByType } = render(
      <ImagePreview images={images} onRemoveImage={onRemoveImage} />
    );

    const removeButtons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(removeButtons[1]);

    expect(onRemoveImage).toHaveBeenCalledWith(2);
    expect(onRemoveImage).not.toHaveBeenCalledWith(1);
  });
});
