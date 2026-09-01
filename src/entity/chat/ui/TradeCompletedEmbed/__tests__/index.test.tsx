import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TradeCompletedEmbed } from '../index';

describe('TradeCompletedEmbed', () => {
  it('아직 리뷰를 작성하지 않았으면 거래 완료 안내 문구와 리뷰 작성하러 가기 버튼을 표시한다', () => {
    const { getByText } = render(<TradeCompletedEmbed />);

    expect(getByText('거래가 완료되었습니다')).toBeTruthy();
    expect(getByText('리뷰 작성하러 가기')).toBeTruthy();
  });

  it('이미 리뷰를 작성했으면 작성한 리뷰 확인하기 버튼을 표시한다', () => {
    const { getByText, queryByText } = render(<TradeCompletedEmbed hasReviewed />);

    expect(getByText('작성한 리뷰 확인하기')).toBeTruthy();
    expect(queryByText('리뷰 작성하러 가기')).toBeNull();
  });

  it('리뷰 버튼을 누르면 콜백이 호출된다', () => {
    const onReviewButtonPress = jest.fn();
    const { getByText } = render(<TradeCompletedEmbed onReviewButtonPress={onReviewButtonPress} />);

    fireEvent.press(getByText('리뷰 작성하러 가기'));

    expect(onReviewButtonPress).toHaveBeenCalledTimes(1);
  });

  it('예약 카드처럼 너비를 꽉 채운다', () => {
    const { toJSON } = render(<TradeCompletedEmbed />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('w-full');
  });
});
