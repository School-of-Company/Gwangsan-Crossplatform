import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { ReservationCalendarSheet } from '../index';

jest.mock('~/shared/ui/BottomSheetModalWrapper', () => ({
  BottomSheetModalWrapper: ({ isVisible, children, title }: any) => {
    if (!isVisible) return null;
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        {children}
      </View>
    );
  },
}));

const MIN_DATE = new Date(2026, 0, 10); // 2026-01-10
const MAX_DATE = new Date(2026, 2, 20); // 2026-03-20

const defaultProps = {
  isVisible: true,
  onClose: jest.fn(),
  onSelect: jest.fn(),
  minDate: MIN_DATE,
  maxDate: MAX_DATE,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReservationCalendarSheet', () => {
  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(
      <ReservationCalendarSheet {...defaultProps} isVisible={false} />
    );
    expect(queryByText('날짜 선택')).toBeNull();
  });

  it('selectedDate가 없으면 minDate가 속한 월을 그린다', () => {
    const { getByText } = render(<ReservationCalendarSheet {...defaultProps} />);

    expect(getByText('2026년 1월')).toBeTruthy();
    // minDate(1/10)를 포함해 1월의 날짜 셀들이 그려진다
    expect(getByText('10')).toBeTruthy();
    expect(getByText('31')).toBeTruthy();
  });

  it('selectedDate가 있으면 해당 월을 그린다', () => {
    const { getByText } = render(
      <ReservationCalendarSheet {...defaultProps} selectedDate="2026-02-14" />
    );

    expect(getByText('2026년 2월')).toBeTruthy();
  });

  it('요일 라벨을 렌더링한다', () => {
    const { getByText } = render(<ReservationCalendarSheet {...defaultProps} />);

    ['일', '월', '화', '수', '목', '금', '토'].forEach((label) => {
      expect(getByText(label)).toBeTruthy();
    });
  });

  it('prev/next 버튼으로 월을 이동할 수 있다', () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <ReservationCalendarSheet {...defaultProps} selectedDate="2026-02-14" />
    );

    expect(getByText('2026년 2월')).toBeTruthy();

    const [prevButton, nextButton] = UNSAFE_getAllByType(TouchableOpacity);

    fireEvent.press(prevButton);
    expect(getByText('2026년 1월')).toBeTruthy();

    fireEvent.press(nextButton);
    expect(getByText('2026년 2월')).toBeTruthy();

    fireEvent.press(nextButton);
    expect(getByText('2026년 3월')).toBeTruthy();
  });

  it('minDate가 속한 월에서는 prev 버튼이 동작하지 않는다(경계)', () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <ReservationCalendarSheet {...defaultProps} />
    );

    expect(getByText('2026년 1월')).toBeTruthy();

    const [prevButton] = UNSAFE_getAllByType(TouchableOpacity);
    expect(prevButton.props.disabled).toBe(true);

    fireEvent.press(prevButton);
    // disabled 상태이므로 그대로 1월을 유지한다
    expect(getByText('2026년 1월')).toBeTruthy();
  });

  it('maxDate가 속한 월에서는 next 버튼이 동작하지 않는다(경계)', () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <ReservationCalendarSheet {...defaultProps} selectedDate="2026-03-20" />
    );

    expect(getByText('2026년 3월')).toBeTruthy();

    const [, nextButton] = UNSAFE_getAllByType(TouchableOpacity);
    expect(nextButton.props.disabled).toBe(true);

    fireEvent.press(nextButton);
    expect(getByText('2026년 3월')).toBeTruthy();
  });

  it('날짜를 선택하면 YYYY-MM-DD 형식으로 onSelect와 onClose가 호출된다', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <ReservationCalendarSheet
        {...defaultProps}
        selectedDate="2026-02-14"
        onSelect={onSelect}
        onClose={onClose}
      />
    );

    fireEvent.press(getByText('18'));

    expect(onSelect).toHaveBeenCalledWith('2026-02-18');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('minDate/maxDate 범위 밖의 날짜는 비활성화되어 눌러도 onSelect가 호출되지 않는다', () => {
    const onSelect = jest.fn();
    // 1월을 그리면 1일~9일은 minDate(1/10) 이전이라 비활성화된다.
    const { getByText } = render(
      <ReservationCalendarSheet {...defaultProps} onSelect={onSelect} />
    );

    fireEvent.press(getByText('5'));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('selectedDate와 같은 날짜 셀에는 선택 강조 스타일이 적용된다', () => {
    const { getByText } = render(
      <ReservationCalendarSheet {...defaultProps} selectedDate="2026-02-14" />
    );

    const selectedDayText = getByText('14');
    expect(selectedDayText.props.className).toContain('text-white');

    // 선택되지 않은 활성화된 날짜는 검정 텍스트 스타일을 사용한다
    const otherDayText = getByText('15');
    expect(otherDayText.props.className).toContain('text-black');
  });
});
