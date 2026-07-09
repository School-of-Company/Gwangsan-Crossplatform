import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Active from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush });
});

describe('Active', () => {
  it('isMe=true이면 "내가 받은 후기"와 "내가 작성한 후기" 버튼을 모두 표시한다', () => {
    const { getByText } = render(<Active isMe id="1" />);

    expect(getByText('내가 받은 후기')).toBeTruthy();
    expect(getByText('내가 작성한 후기')).toBeTruthy();
  });

  it('isMe=false이면 상대방 이름이 포함된 버튼만 표시한다', () => {
    const { getByText, queryByText } = render(<Active isMe={false} id="1" name="홍길동" />);

    expect(getByText('홍길동님이 받은 후기')).toBeTruthy();
    expect(queryByText('내가 작성한 후기')).toBeNull();
  });

  it('id가 있으면 리뷰 버튼 클릭 시 /reviews/:id로 이동한다', () => {
    const { getByText } = render(<Active isMe id="42" />);

    fireEvent.press(getByText('내가 받은 후기'));

    expect(mockPush).toHaveBeenCalledWith('/reviews/42');
  });

  it('id가 없으면 리뷰 버튼이 비활성화되어 클릭해도 이동하지 않는다', () => {
    const { getByText } = render(<Active isMe />);

    fireEvent.press(getByText('내가 받은 후기'));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('"내가 작성한 후기" 클릭 시 /reviews로 이동한다', () => {
    const { getByText } = render(<Active isMe id="1" />);

    fireEvent.press(getByText('내가 작성한 후기'));

    expect(mockPush).toHaveBeenCalledWith('/reviews');
  });
});
