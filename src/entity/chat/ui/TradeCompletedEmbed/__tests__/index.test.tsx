import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TradeCompletedEmbed } from '../index';

describe('TradeCompletedEmbed', () => {
  it('거래 완료 안내 문구와 리뷰 작성 버튼을 표시한다', () => {
    const { getByText } = render(<TradeCompletedEmbed />);

    expect(getByText('거래가 완료되었습니다')).toBeTruthy();
    expect(getByText('리뷰 작성하기')).toBeTruthy();
  });

  it('리뷰 작성하기 버튼을 누르면 콜백이 호출된다', () => {
    const onReviewButtonPress = jest.fn();
    const { getByText } = render(<TradeCompletedEmbed onReviewButtonPress={onReviewButtonPress} />);

    fireEvent.press(getByText('리뷰 작성하기'));

    expect(onReviewButtonPress).toHaveBeenCalledTimes(1);
  });

  it('alignment가 right이면 우측 정렬 클래스를 적용한다', () => {
    const { toJSON } = render(<TradeCompletedEmbed alignment="right" />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('self-end');
    expect(tree).not.toContain('self-start ml-10');
  });

  it('alignment가 left(기본값)이면 좌측 정렬 클래스를 적용한다', () => {
    const { toJSON } = render(<TradeCompletedEmbed alignment="left" />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('self-start ml-10');
  });
});
