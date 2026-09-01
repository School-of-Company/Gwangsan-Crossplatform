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

  it('예약 카드처럼 너비를 꽉 채운다', () => {
    const { toJSON } = render(<TradeCompletedEmbed />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('w-full');
  });
});
