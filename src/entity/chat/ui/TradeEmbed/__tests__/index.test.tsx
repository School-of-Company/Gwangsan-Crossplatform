import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TradeEmbed } from '../index';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';

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

  it('showButtons가 false이어도 작성자 화면과 동일한 사진 카드로 요청했다는 문구를 표시한다', () => {
    const { getByText, queryByText, UNSAFE_queryByType } = render(
      <TradeEmbed product={createProduct()} otherPartyNickname="홍길동" showButtons={false} />
    );
    const { Image } = require('react-native');

    expect(getByText('홍길동님에게 거래를 요청했어요')).toBeTruthy();
    expect(queryByText('거래 상품')).toBeNull();
    expect(queryByText('홍길동님이 거래하기를 원합니다')).toBeNull();
    expect(UNSAFE_queryByType(Image)).toBeTruthy();
  });

  it('isCompleted이어도 기존 거래요청 카드 문구는 바뀌지 않는다', () => {
    const { getByText, queryByText } = render(
      <TradeEmbed
        product={createProduct({ isCompleted: true })}
        otherPartyNickname="홍길동"
        showButtons
      />
    );

    expect(getByText('홍길동님이 거래하기를 원합니다')).toBeTruthy();
    expect(queryByText('거래가 완료되었습니다')).toBeNull();
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

  it('alignment가 right이면 우측 정렬 클래스를 적용한다', () => {
    const { toJSON } = render(
      <TradeEmbed product={createProduct()} showButtons alignment="right" />
    );

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('self-end');
    expect(tree).not.toContain('self-start ml-10');
  });

  it('alignment가 left(기본값)이면 좌측 정렬 클래스를 적용한다', () => {
    const { toJSON } = render(
      <TradeEmbed product={createProduct()} showButtons alignment="left" />
    );

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('self-start ml-10');
  });
});
