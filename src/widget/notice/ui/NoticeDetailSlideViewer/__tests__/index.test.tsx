import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import NoticeDetailSlideViewer from '../index';
import { NoticeData } from '@/entity/notice/model/noticeData';

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

const makeNotice = (imageCount: number): NoticeData => ({
  id: 1,
  title: '공지',
  content: '내용',
  place: '광산구',
  createdAt: '2025-01-15',
  role: 'ROLE_PLACE_ADMIN',
  images: Array.from({ length: imageCount }, (_, i) => ({
    imageId: i + 1,
    imageUrl: `https://example.com/${i + 1}.png`,
  })),
});

describe('NoticeDetailSlideViewer', () => {
  it('이미지를 모두 렌더링한다', () => {
    const notice = makeNotice(3);
    const { UNSAFE_getAllByType } = render(<NoticeDetailSlideViewer notice={notice} />);

    const images = UNSAFE_getAllByType(require('react-native').Image);
    expect(images).toHaveLength(3);
  });

  it('이미지가 1개면 SlideIndicator를 렌더링하지 않는다', () => {
    const notice = makeNotice(1);
    const { queryByTestId } = render(<NoticeDetailSlideViewer notice={notice} />);

    expect(queryByTestId('slide-indicator')).toBeNull();
  });

  it('이미지가 2개 이상이면 SlideIndicator를 렌더링한다', () => {
    const notice = makeNotice(2);
    const { getByTestId } = render(<NoticeDetailSlideViewer notice={notice} />);

    expect(getByTestId('slide-indicator')).toBeTruthy();
    expect(getByTestId('indicator-total').props.children).toBe(2);
    expect(getByTestId('indicator-current').props.children).toBe(0);
  });

  it('스크롤 종료 시 현재 인덱스가 업데이트된다', () => {
    const notice = makeNotice(3);
    const { UNSAFE_getAllByType, getByTestId } = render(
      <NoticeDetailSlideViewer notice={notice} />
    );

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
    const notice = makeNotice(3);
    const { getByTestId } = render(<NoticeDetailSlideViewer notice={notice} />);

    fireEvent.press(getByTestId('indicator-dot-1'));

    expect(getByTestId('indicator-current').props.children).toBe(1);
  });

  it('이미지 너비가 화면 너비와 같다', () => {
    const notice = makeNotice(1);
    const { UNSAFE_getAllByType } = render(<NoticeDetailSlideViewer notice={notice} />);

    const images = UNSAFE_getAllByType(require('react-native').Image);
    expect(images[0].props.style.width).toBe(SCREEN_WIDTH);
  });

  it('스크롤 위치가 반올림되어 인덱스를 계산한다', () => {
    const notice = makeNotice(3);
    const { UNSAFE_getAllByType, getByTestId } = render(
      <NoticeDetailSlideViewer notice={notice} />
    );

    const scrollViews = UNSAFE_getAllByType(require('react-native').ScrollView);
    const horizontalScrollView = scrollViews.find(
      (sv: { props: { horizontal?: boolean } }) => sv.props.horizontal
    );

    // 두 번째 페이지 근처 (약간 오프셋)
    fireEvent(horizontalScrollView!, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: SCREEN_WIDTH * 1.4 } },
    });

    expect(getByTestId('indicator-current').props.children).toBe(1);
  });
});
