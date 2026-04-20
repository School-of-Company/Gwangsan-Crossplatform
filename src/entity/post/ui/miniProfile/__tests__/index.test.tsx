import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MiniProfile from '../index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => jest.clearAllMocks());

describe('MiniProfile', () => {
  const defaultProps = {
    nickname: '홍길동',
    placeName: '광산구',
    light: 3,
    memberId: 42,
  };

  it('닉네임, 지역명, 단계를 렌더링한다', () => {
    const { getByText } = render(<MiniProfile {...defaultProps} />);

    expect(getByText('홍길동')).toBeTruthy();
    expect(getByText('광산구')).toBeTruthy();
    expect(getByText('3단계')).toBeTruthy();
  });

  it('누르면 /profile?id=memberId 경로로 이동한다', () => {
    const { getByText } = render(<MiniProfile {...defaultProps} />);

    fireEvent.press(getByText('홍길동'));

    expect(mockPush).toHaveBeenCalledWith('/profile?id=42');
  });

  it('다른 memberId로 올바른 프로필 경로를 생성한다', () => {
    const { getByText } = render(<MiniProfile {...defaultProps} memberId={99} />);

    fireEvent.press(getByText('홍길동'));

    expect(mockPush).toHaveBeenCalledWith('/profile?id=99');
  });

  it('light 값이 다를 때 올바르게 표시한다', () => {
    const { getByText } = render(<MiniProfile {...defaultProps} light={7} />);

    expect(getByText('7단계')).toBeTruthy();
  });
});
