import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import PostView from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle }: any) => {
    const { Text } = require('react-native');
    return <Text testID="header-title">{headerTitle}</Text>;
  },
}));

jest.mock('~/widget/post/ui/PostList', () => {
  const { View, Text } = require('react-native');
  return ({ category }: any) => (
    <View testID="post-list">
      <Text testID="post-list-category">{category}</Text>
    </View>
  );
});

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('PostView', () => {
  describe('OBJECT 타입', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'OBJECT' });
    });

    it('헤더에 "물건"을 표시한다', () => {
      const { getByTestId } = render(<PostView />);

      expect(getByTestId('header-title').props.children).toBe('물건');
    });

    it('"팔아요"와 "필요해요" 탭을 표시한다', () => {
      const { getAllByText } = render(<PostView />);

      expect(getAllByText('팔아요').length).toBeGreaterThan(0);
      expect(getAllByText('필요해요').length).toBeGreaterThan(0);
    });

    it('초기 카테고리는 "팔아요"이다', () => {
      const { getByTestId } = render(<PostView />);

      expect(getByTestId('post-list-category').props.children).toBe('팔아요');
    });

    it('"필요해요" 탭을 누르면 카테고리가 변경된다', () => {
      const { getByText, getByTestId } = render(<PostView />);

      fireEvent.press(getByText('필요해요'));

      expect(getByTestId('post-list-category').props.children).toBe('필요해요');
    });
  });

  describe('SERVICE 타입', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE' });
    });

    it('헤더에 "서비스"를 표시한다', () => {
      const { getByTestId } = render(<PostView />);

      expect(getByTestId('header-title').props.children).toBe('서비스');
    });

    it('"할 수 있어요"와 "해주세요" 탭을 표시한다', () => {
      const { getAllByText } = render(<PostView />);

      expect(getAllByText('할 수 있어요').length).toBeGreaterThan(0);
      expect(getAllByText('해주세요').length).toBeGreaterThan(0);
    });

    it('초기 카테고리는 "할 수 있어요"이다', () => {
      const { getByTestId } = render(<PostView />);

      expect(getByTestId('post-list-category').props.children).toBe('할 수 있어요');
    });

    it('"해주세요" 탭을 누르면 카테고리가 변경된다', () => {
      const { getByText, getByTestId } = render(<PostView />);

      fireEvent.press(getByText('해주세요'));

      expect(getByTestId('post-list-category').props.children).toBe('해주세요');
    });
  });

  describe('mode 파라미터로 초기 카테고리 설정', () => {
    it('OBJECT + RECEIVER이면 초기 카테고리가 "필요해요"이다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'OBJECT', mode: 'RECEIVER' });

      const { getByTestId } = render(<PostView />);

      expect(getByTestId('post-list-category').props.children).toBe('필요해요');
    });

    it('SERVICE + RECEIVER이면 초기 카테고리가 "해주세요"이다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'RECEIVER' });

      const { getByTestId } = render(<PostView />);

      expect(getByTestId('post-list-category').props.children).toBe('해주세요');
    });

    it('SERVICE + GIVER이면 초기 카테고리가 "할 수 있어요"이다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });

      const { getByTestId } = render(<PostView />);

      expect(getByTestId('post-list-category').props.children).toBe('할 수 있어요');
    });
  });
});
