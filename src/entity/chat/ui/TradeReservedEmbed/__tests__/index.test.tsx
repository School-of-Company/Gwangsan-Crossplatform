import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TradeReservedEmbed } from '../index';

describe('TradeReservedEmbed', () => {
  it('닉네임이 없으면 기본 안내 문구를 표시한다', () => {
    const { getByTestId } = render(<TradeReservedEmbed />);

    expect(getByTestId('trade-reserved-notice').props.children).toBe('예약을 했어요');
  });

  it('닉네임이 있으면 누가 예약했는지 보여준다', () => {
    const { getByTestId } = render(<TradeReservedEmbed otherPartyNickname="상무동주민" />);

    expect(getByTestId('trade-reserved-notice').props.children).toBe(
      '상무동주민님이 예약을 했어요'
    );
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

  it('onOpenMap이 없으면 지도 보기 버튼을 표시하지 않는다', () => {
    const { queryByTestId } = render(<TradeReservedEmbed />);

    expect(queryByTestId('trade-reserved-map-button')).toBeNull();
  });

  it('onOpenMap이 있으면 지도 보기 버튼을 표시하고 누르면 호출한다', () => {
    const onOpenMap = jest.fn();
    const { getByTestId } = render(<TradeReservedEmbed onOpenMap={onOpenMap} />);

    fireEvent.press(getByTestId('trade-reserved-map-button'));

    expect(onOpenMap).toHaveBeenCalledTimes(1);
  });
});
