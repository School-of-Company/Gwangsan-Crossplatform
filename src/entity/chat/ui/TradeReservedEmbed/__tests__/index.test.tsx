import React from 'react';
import { render } from '@testing-library/react-native';
import { TradeReservedEmbed } from '../index';

describe('TradeReservedEmbed', () => {
  it('예약 중 안내 문구를 표시한다', () => {
    const { getByTestId } = render(<TradeReservedEmbed />);

    expect(getByTestId('trade-reserved-notice')).toBeTruthy();
  });

  it('예약 일시/장소가 없으면 상세 정보를 표시하지 않는다', () => {
    const { queryByTestId } = render(<TradeReservedEmbed />);

    expect(queryByTestId('trade-reservation-detail')).toBeNull();
  });

  it('예약 일시와 장소가 있으면 함께 보여준다', () => {
    const { getByTestId } = render(
      <TradeReservedEmbed scheduledAt="2026-08-28T14:00:00" placeName="상무역 2번 출구" />
    );

    expect(getByTestId('trade-reservation-detail').props.children).toContain('14:00');
    expect(getByTestId('trade-reservation-detail').props.children).toContain('상무역 2번 출구');
  });

  it('예약 일시 형식이 올바르지 않으면 원본 문자열을 그대로 보여준다', () => {
    const { getByTestId } = render(<TradeReservedEmbed scheduledAt="invalid-date-string" />);

    expect(getByTestId('trade-reservation-detail').props.children).toContain('invalid-date-string');
  });

  it('alignment가 right이면 우측 정렬 클래스를 적용한다', () => {
    const { toJSON } = render(<TradeReservedEmbed alignment="right" />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('self-end');
    expect(tree).not.toContain('self-start ml-10');
  });

  it('alignment가 left(기본값)이면 좌측 정렬 클래스를 적용한다', () => {
    const { toJSON } = render(<TradeReservedEmbed alignment="left" />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('self-start ml-10');
  });
});
