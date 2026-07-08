import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TradeEmbed } from '../index';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';
import { logger } from '~/shared/lib/logger';

jest.mock('~/shared/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('~/shared/ui', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Card: require('~/shared/ui/Card').Card,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Button: require('~/shared/ui/Button').Button,
}));

const createProduct = (overrides: Partial<TradeProduct> = {}): TradeProduct => ({
  id: 100,
  title: '거래 상품',
  images: [{ imageId: 1, imageUrl: 'https://example.com/product.png' }],
  createdAt: '2026-05-28T01:30:00.000Z',
  isSeller: false,
  isCompletable: true,
  isCompleted: false,
  ...overrides,
});

describe('TradeEmbed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('상품 제목과 요청자 안내 문구를 표시한다', () => {
    const { getByText } = render(
      <TradeEmbed product={createProduct()} requestorNickname="홍길동" />
    );

    expect(getByText('거래 상품')).toBeTruthy();
    expect(getByText('홍길동님께서 거래하기를 누르셨습니다')).toBeTruthy();
  });

  it('requestorNickname이 없으면 기본값 "상대방"을 사용한다', () => {
    const { getByText } = render(<TradeEmbed product={createProduct()} />);

    expect(getByText('상대방님께서 거래하기를 누르셨습니다')).toBeTruthy();
  });

  it('isCompleted이면 완료 안내 문구를 표시한다', () => {
    const { getByText, queryByText } = render(
      <TradeEmbed product={createProduct({ isCompleted: true })} showButtons />
    );

    expect(getByText('거래가 완료되었습니다')).toBeTruthy();
    expect(queryByText('예약하기')).toBeNull();
    expect(queryByText('거래 완료하기')).toBeNull();
  });

  it('이미지가 여러 장이면 추가 개수 뱃지를 표시한다', () => {
    const product = createProduct({
      images: [
        { imageId: 1, imageUrl: 'https://example.com/1.png' },
        { imageId: 2, imageUrl: 'https://example.com/2.png' },
        { imageId: 3, imageUrl: 'https://example.com/3.png' },
      ],
    });
    const { getByText } = render(<TradeEmbed product={product} />);

    expect(getByText('+2')).toBeTruthy();
  });

  it('showButtons가 true이고 미완료면 예약하기/거래 완료하기 버튼을 표시한다', () => {
    const { getByText } = render(<TradeEmbed product={createProduct()} showButtons />);

    expect(getByText('예약하기')).toBeTruthy();
    expect(getByText('거래 완료하기')).toBeTruthy();
  });

  it('showButtons가 false면 액션 버튼을 표시하지 않는다', () => {
    const { queryByText } = render(<TradeEmbed product={createProduct()} showButtons={false} />);

    expect(queryByText('예약하기')).toBeNull();
    expect(queryByText('거래 완료하기')).toBeNull();
  });

  it('showReviewButton이 true이고 isCompleted면 리뷰 작성 버튼을 표시하고 누르면 콜백이 호출된다', () => {
    const onReviewButtonPress = jest.fn();
    const { getByText } = render(
      <TradeEmbed
        product={createProduct({ isCompleted: true })}
        showReviewButton
        onReviewButtonPress={onReviewButtonPress}
      />
    );

    fireEvent.press(getByText('리뷰 작성하기'));

    expect(onReviewButtonPress).toHaveBeenCalledTimes(1);
  });

  it('showReviewButton이 true여도 isCompleted가 아니면 리뷰 버튼을 표시하지 않는다', () => {
    const { queryByText } = render(
      <TradeEmbed product={createProduct({ isCompleted: false })} showReviewButton />
    );

    expect(queryByText('리뷰 작성하기')).toBeNull();
  });

  it('예약하기를 누르면 onReservation을 호출하고 예약 취소 버튼으로 전환된다', async () => {
    const onReservation = jest.fn().mockResolvedValue(undefined);
    const { getByText, queryByText } = render(
      <TradeEmbed product={createProduct()} showButtons onReservation={onReservation} />
    );

    fireEvent.press(getByText('예약하기'));

    await waitFor(() => expect(onReservation).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByText('예약 취소')).toBeTruthy());
    expect(queryByText('예약하기')).toBeNull();
  });

  it('예약 취소를 누르면 onCancelReservation을 호출하고 예약하기 버튼으로 되돌아간다', async () => {
    const onReservation = jest.fn().mockResolvedValue(undefined);
    const onCancelReservation = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <TradeEmbed
        product={createProduct()}
        showButtons
        onReservation={onReservation}
        onCancelReservation={onCancelReservation}
      />
    );

    fireEvent.press(getByText('예약하기'));
    await waitFor(() => expect(getByText('예약 취소')).toBeTruthy());

    fireEvent.press(getByText('예약 취소'));

    await waitFor(() => expect(onCancelReservation).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByText('예약하기')).toBeTruthy());
  });

  it('거래 완료하기를 누르면 onTradeAccept를 호출한다', async () => {
    const onTradeAccept = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <TradeEmbed product={createProduct()} showButtons onTradeAccept={onTradeAccept} />
    );

    fireEvent.press(getByText('거래 완료하기'));

    await waitFor(() => expect(onTradeAccept).toHaveBeenCalledTimes(1));
  });

  it('onTradeAccept가 실패하면 logger.error를 호출하고 예외를 전파하지 않는다', async () => {
    const onTradeAccept = jest.fn().mockRejectedValue(new Error('실패'));
    const { getByText } = render(
      <TradeEmbed product={createProduct()} showButtons onTradeAccept={onTradeAccept} />
    );

    fireEvent.press(getByText('거래 완료하기'));

    await waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith('TradeEmbed action failed', expect.any(Error))
    );
  });

  it('isLoading이 true면 버튼 대신 로딩 인디케이터를 표시한다', () => {
    const { UNSAFE_getAllByType } = render(
      <TradeEmbed product={createProduct()} showButtons isLoading onTradeAccept={jest.fn()} />
    );
    const { ActivityIndicator } = require('react-native');

    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });
});
