import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import MainSlideViewer from '../index';

jest.mock('@/shared/assets/png/mainSlides/slide1.png', () => 1);
jest.mock('@/shared/assets/png/mainSlides/slide2.png', () => 2);
jest.mock('@/shared/assets/png/mainSlides/slide3.png', () => 3);
jest.mock('@/shared/assets/png/mainSlides/slide4.png', () => 4);
jest.mock('@/shared/assets/png/mainSlides/slide5.png', () => 5);
jest.mock('@/shared/assets/png/mainSlides/slide6.png', () => 6);

const SCREEN_WIDTH = Dimensions.get('window').width;

describe('MainSlideViewer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('6개의 슬라이드 이미지를 렌더링한다', () => {
    const { UNSAFE_getAllByType } = render(<MainSlideViewer />);

    const images = UNSAFE_getAllByType(require('expo-image').Image);
    expect(images).toHaveLength(6);
  });

  it('첫 번째 이미지는 high priority이고 나머지는 low이다', () => {
    const { UNSAFE_getAllByType } = render(<MainSlideViewer />);

    const images = UNSAFE_getAllByType(require('expo-image').Image);
    expect(images[0].props.priority).toBe('high');
    expect(images[1].props.priority).toBe('low');
  });

  it('이미지 너비가 화면 너비와 같다', () => {
    const { UNSAFE_getAllByType } = render(<MainSlideViewer />);

    const images = UNSAFE_getAllByType(require('expo-image').Image);
    expect(images[0].props.style.width).toBe(SCREEN_WIDTH);
  });

  it('3초 간격의 setInterval을 등록한다', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    render(<MainSlideViewer />);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 3000);

    setIntervalSpy.mockRestore();
  });

  it('interval 콜백 실행 시 에러 없이 스크롤을 진행한다', () => {
    render(<MainSlideViewer />);

    expect(() => {
      act(() => {
        jest.advanceTimersByTime(3000 * (6 + 1));
      });
    }).not.toThrow();
  });

  it('언마운트 시 interval을 정리한다', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<MainSlideViewer />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });
});
