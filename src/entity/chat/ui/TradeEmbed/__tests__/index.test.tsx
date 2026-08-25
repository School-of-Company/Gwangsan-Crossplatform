import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { TradeEmbed } from '../index';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';
import { logger } from '~/shared/lib/logger';
import { useReservationDraftStore } from '~/shared/store/useReservationDraftStore';

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
  isReserved: false,
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

  it('showButtons가 true이고 게시물 작성자이며 미완료면 예약하기/거래 완료하기 버튼을 표시한다', () => {
    const { getByText } = render(
      <TradeEmbed product={createProduct({ isSeller: true })} showButtons />
    );

    expect(getByText('예약하기')).toBeTruthy();
    expect(getByText('거래 완료하기')).toBeTruthy();
  });

  it('게시물 작성자가 아니면 예약하기 버튼을 표시하지 않는다', () => {
    const { getByText, queryByText } = render(
      <TradeEmbed product={createProduct({ isSeller: false })} showButtons />
    );

    expect(queryByText('예약하기')).toBeNull();
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

  it('버튼이 없는 쪽에서도 isReserved가 true면 예약 중 안내를 보여준다', () => {
    const { getByTestId } = render(
      <TradeEmbed product={createProduct({ isReserved: true })} showButtons={false} />
    );

    expect(getByTestId('trade-reserved-notice')).toBeTruthy();
  });

  it('isReserved가 false면 예약 중 안내를 보여주지 않는다', () => {
    const { queryByTestId } = render(
      <TradeEmbed product={createProduct({ isReserved: false })} showButtons={false} />
    );

    expect(queryByTestId('trade-reserved-notice')).toBeNull();
  });

  it('거래가 완료되면 예약 중 안내를 보여주지 않는다', () => {
    const { queryByTestId } = render(
      <TradeEmbed product={createProduct({ isReserved: true, isCompleted: true })} showButtons />
    );

    expect(queryByTestId('trade-reserved-notice')).toBeNull();
  });

  it('product.isReserved가 false면 예약하기 버튼을 보여주고 누르면 onOpenReservationModal을 호출한다', () => {
    const onOpenReservationModal = jest.fn();
    const { getByText, queryByText } = render(
      <TradeEmbed
        product={createProduct({ isSeller: true, isReserved: false })}
        showButtons
        onOpenReservationModal={onOpenReservationModal}
      />
    );

    expect(queryByText('예약 취소')).toBeNull();

    fireEvent.press(getByText('예약하기'));

    expect(onOpenReservationModal).toHaveBeenCalledTimes(1);
  });

  it('product.isReserved가 true면 예약 취소 버튼을 보여주고 누르면 onCancelReservation을 호출한다', async () => {
    const onCancelReservation = jest.fn().mockResolvedValue(undefined);
    const { getByText, queryByText } = render(
      <TradeEmbed
        product={createProduct({ isSeller: true, isReserved: true })}
        showButtons
        onCancelReservation={onCancelReservation}
      />
    );

    expect(queryByText('예약하기')).toBeNull();

    fireEvent.press(getByText('예약 취소'));

    await waitFor(() => expect(onCancelReservation).toHaveBeenCalledTimes(1));
  });

  it('예약 중이고 예약 정보가 저장되어 있으면 날짜/시간/장소를 함께 보여준다', () => {
    useReservationDraftStore.getState().setDraft(100, {
      date: '2026-08-28',
      time: '14:00',
      place: '상무역 2번 출구',
    });

    const { getByTestId } = render(
      <TradeEmbed product={createProduct({ isReserved: true })} showButtons={false} />
    );

    expect(getByTestId('trade-reservation-detail').props.children).toContain('14:00');
    expect(getByTestId('trade-reservation-detail').props.children).toContain('상무역 2번 출구');

    act(() => useReservationDraftStore.getState().clearDraft(100));
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
