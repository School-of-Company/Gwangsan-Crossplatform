import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import OnboardingSlideViewer from '../index';

jest.mock('~/shared/assets/png/startSlide/onboardingSlide1.png', () => 1);
jest.mock('~/shared/assets/png/startSlide/onboardingSlide2.png', () => 2);
jest.mock('~/shared/assets/png/startSlide/onboardingSlide3.png', () => 3);

jest.mock('@/shared/ui', () => ({
  SlideIndicator: ({
    total,
    current,
    onPress,
  }: {
    total: number;
    current: number;
    onPress: (i: number) => void;
  }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="slide-indicator">
        <Text testID="indicator-total">{total}</Text>
        <Text testID="indicator-current">{current}</Text>
        {Array.from({ length: total }, (_, i) => (
          <TouchableOpacity key={i} testID={`indicator-dot-${i}`} onPress={() => onPress(i)} />
        ))}
      </View>
    );
  },
}));

const SCREEN_WIDTH = Dimensions.get('window').width;

describe('OnboardingSlideViewer', () => {
  it('3개의 슬라이드 이미지를 렌더링한다', () => {
    const { UNSAFE_getAllByType } = render(<OnboardingSlideViewer />);

    const images = UNSAFE_getAllByType(require('react-native').Image);
    expect(images).toHaveLength(3);
  });

  it('SlideIndicator에 총 3개, 현재 0번째를 전달한다', () => {
    const { getByTestId } = render(<OnboardingSlideViewer />);

    expect(getByTestId('indicator-total').props.children).toBe(3);
    expect(getByTestId('indicator-current').props.children).toBe(0);
  });

  it('스크롤 종료 시 현재 인덱스가 업데이트된다', () => {
    const { UNSAFE_getAllByType, getByTestId } = render(<OnboardingSlideViewer />);

    const scrollViews = UNSAFE_getAllByType(require('react-native').ScrollView);
    const horizontalScrollView = scrollViews.find(
      (sv: { props: { horizontal?: boolean } }) => sv.props.horizontal
    );

    fireEvent(horizontalScrollView!, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: SCREEN_WIDTH * 2 } },
    });

    expect(getByTestId('indicator-current').props.children).toBe(2);
  });

  it('인디케이터 클릭 시 해당 인덱스로 이동한다', () => {
    const { getByTestId } = render(<OnboardingSlideViewer />);

    fireEvent.press(getByTestId('indicator-dot-1'));

    expect(getByTestId('indicator-current').props.children).toBe(1);
  });

  it('이미지 너비가 화면 너비와 같다', () => {
    const { UNSAFE_getAllByType } = render(<OnboardingSlideViewer />);

    const images = UNSAFE_getAllByType(require('react-native').Image);
    expect(images[0].props.style.width).toBe(SCREEN_WIDTH);
  });

  it('스크롤 위치가 반올림되어 인덱스를 계산한다', () => {
    const { UNSAFE_getAllByType, getByTestId } = render(<OnboardingSlideViewer />);

    const scrollViews = UNSAFE_getAllByType(require('react-native').ScrollView);
    const horizontalScrollView = scrollViews.find(
      (sv: { props: { horizontal?: boolean } }) => sv.props.horizontal
    );

    fireEvent(horizontalScrollView!, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: SCREEN_WIDTH * 1.4 } },
    });

    expect(getByTestId('indicator-current').props.children).toBe(1);
  });
});
