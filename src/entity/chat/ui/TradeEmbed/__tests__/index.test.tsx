import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TradeEmbed } from '../index';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';

jest.mock('~/shared/ui', () => ({
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

  it('showButtons가 true이면 요청자 안내 문구를 표시한다', () => {
    const { getByText, queryByText } = render(
      <TradeEmbed product={createProduct()} otherPartyNickname="홍길동" showButtons />
    );

    expect(getByText('홍길동님이 거래하기를 원합니다')).toBeTruthy();
    expect(queryByText('거래 상품')).toBeNull();
  });

  it('showButtons가 true이고 otherPartyNickname이 없으면 기본값 "상대방"을 사용한다', () => {
    const { getByText } = render(<TradeEmbed product={createProduct()} showButtons />);

    expect(getByText('상대방님이 거래하기를 원합니다')).toBeTruthy();
  });

  it('showButtons가 false이면 사진/제목 없이 상대방에게 요청했다는 문구만 표시한다', () => {
    const { getByText, queryByText, UNSAFE_queryByType } = render(
      <TradeEmbed product={createProduct()} otherPartyNickname="홍길동" showButtons={false} />
    );
    const { Image } = require('react-native');

    expect(getByText('홍길동님에게 거래를 요청했어요')).toBeTruthy();
    expect(queryByText('거래 상품')).toBeNull();
    expect(queryByText('홍길동님이 거래하기를 원합니다')).toBeNull();
    expect(UNSAFE_queryByType(Image)).toBeNull();
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
    const { getByText } = render(<TradeEmbed product={product} showButtons />);

    expect(getByText('+2')).toBeTruthy();
  });

  it('showButtons가 true이고 게시물 작성자이며 미예약/미완료면 예약하기 버튼을 표시하고 누르면 onOpenReservationModal을 호출한다', () => {
    const onOpenReservationModal = jest.fn();
    const { getByText, queryByText } = render(
      <TradeEmbed
        product={createProduct({ isSeller: true, isReserved: false })}
        showButtons
        onOpenReservationModal={onOpenReservationModal}
      />
    );

    expect(queryByText('거래 완료하기')).toBeNull();

    fireEvent.press(getByText('예약하기'));

    expect(onOpenReservationModal).toHaveBeenCalledTimes(1);
  });

  it('게시물 작성자가 아니면 예약하기 버튼을 표시하지 않는다', () => {
    const { queryByText } = render(
      <TradeEmbed product={createProduct({ isSeller: false })} showButtons />
    );

    expect(queryByText('예약하기')).toBeNull();
  });

  it('이미 예약 중이면 예약하기 버튼을 표시하지 않는다', () => {
    const { queryByText } = render(
      <TradeEmbed product={createProduct({ isSeller: true, isReserved: true })} showButtons />
    );

    expect(queryByText('예약하기')).toBeNull();
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

  it('예약 중이고 서버에서 예약 정보를 내려주면 날짜/시간/장소를 함께 보여준다', () => {
    const { getByTestId } = render(
      <TradeEmbed
        product={createProduct({
          isReserved: true,
          reservationScheduledAt: '2026-08-28T14:00:00',
          reservationPlaceName: '상무역 2번 출구',
        })}
        showButtons={false}
      />
    );

    expect(getByTestId('trade-reservation-detail').props.children).toContain('14:00');
    expect(getByTestId('trade-reservation-detail').props.children).toContain('상무역 2번 출구');
  });
});
