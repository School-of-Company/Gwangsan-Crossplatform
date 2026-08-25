import React from 'react';
import { render } from '@testing-library/react-native';
import { Image } from 'react-native';
import defaultImage from '~/shared/assets/png/icon.png';
import { ChatRoomProductInfo } from '../index';

describe('ChatRoomProductInfo', () => {
  const defaultProps = {
    title: '아이패드 프로 팝니다',
    gwangsan: 3000,
    imageUrl: 'https://example.com/product.png',
  };

  it('물품명을 렌더링한다', () => {
    const { getByText } = render(<ChatRoomProductInfo {...defaultProps} />);

    expect(getByText('아이패드 프로 팝니다')).toBeTruthy();
  });

  it('가격(광산)을 렌더링한다', () => {
    const { getByText } = render(<ChatRoomProductInfo {...defaultProps} />);

    expect(getByText('3000 광산')).toBeTruthy();
  });

  it('gwangsan이 없으면 가격을 렌더링하지 않는다', () => {
    const { queryByText } = render(
      <ChatRoomProductInfo title={defaultProps.title} imageUrl={defaultProps.imageUrl} />
    );

    expect(queryByText(/광산/)).toBeNull();
  });

  it('imageUrl이 있으면 해당 uri로 썸네일을 표시한다', () => {
    const { getByTestId } = render(<ChatRoomProductInfo {...defaultProps} />);

    const image = getByTestId('chat-room-product-info').findByType(Image);
    expect(image.props.source).toEqual({ uri: defaultProps.imageUrl });
  });

  it('imageUrl이 없으면 기본 이미지를 표시한다', () => {
    const { getByTestId } = render(
      <ChatRoomProductInfo title={defaultProps.title} gwangsan={defaultProps.gwangsan} />
    );

    const image = getByTestId('chat-room-product-info').findByType(Image);
    expect(image.props.source).toEqual(defaultImage);
  });
});
