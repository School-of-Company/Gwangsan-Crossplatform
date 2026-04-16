import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NoticeItem from '../index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('NoticeItem', () => {
  beforeEach(() => jest.clearAllMocks());

  const defaultProps = {
    id: 1,
    title: '테스트 공지',
    content: '공지 내용입니다.',
    images: [] as { imageId: number; imageUrl: string }[],
  };

  it('제목과 내용을 렌더링한다', () => {
    const { getByText } = render(<NoticeItem {...defaultProps} />);

    expect(getByText('테스트 공지')).toBeTruthy();
    expect(getByText('공지 내용입니다.')).toBeTruthy();
  });

  it('클릭하면 /notice/:id로 이동한다', () => {
    const { getByText } = render(<NoticeItem {...defaultProps} />);

    fireEvent.press(getByText('테스트 공지'));

    expect(mockPush).toHaveBeenCalledWith('/notice/1');
  });

  it('createdAt이 전달되면 표시한다', () => {
    const { getByText } = render(<NoticeItem {...defaultProps} createdAt="2025-01-15" />);

    expect(getByText('2025-01-15')).toBeTruthy();
  });

  it('createdAt 기본값은 빈 문자열이다', () => {
    const { queryByText } = render(<NoticeItem {...defaultProps} />);

    // 빈 문자열이므로 별도 날짜 텍스트가 보이지 않음
    expect(queryByText('2025')).toBeNull();
  });

  it('이미지가 있으면 첫 번째 이미지를 렌더링한다', () => {
    const props = {
      ...defaultProps,
      images: [
        { imageId: 1, imageUrl: 'https://example.com/1.png' },
        { imageId: 2, imageUrl: 'https://example.com/2.png' },
      ],
    };

    const { UNSAFE_getAllByType } = render(<NoticeItem {...props} />);

    const images = UNSAFE_getAllByType(require('react-native').Image);
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it('이미지가 없으면 Image 컴포넌트를 렌더링하지 않는다', () => {
    const { UNSAFE_queryAllByType } = render(<NoticeItem {...defaultProps} />);

    const images = UNSAFE_queryAllByType(require('react-native').Image);
    expect(images).toHaveLength(0);
  });

  it('id가 다르면 해당 id 경로로 이동한다', () => {
    const { getByText } = render(<NoticeItem {...defaultProps} id={42} />);

    fireEvent.press(getByText('테스트 공지'));

    expect(mockPush).toHaveBeenCalledWith('/notice/42');
  });
});
