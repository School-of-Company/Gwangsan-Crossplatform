import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PostPageContent } from '../index';

jest.mock('~/entity/post/ui/miniProfile', () => {
  const { View } = require('react-native');
  return () => <View testID="mini-profile" />;
});

jest.mock('~/shared/ui', () => ({
  Button: ({ children, onPress, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

const makeData = (overrides = {}) => ({
  id: 1,
  title: '테스트 제목',
  content: '테스트 내용입니다.',
  gwangsan: 3,
  type: 'OBJECT' as const,
  mode: 'GIVER' as const,
  isCompletable: true,
  isCompleted: false,
  images: [{ imageId: 1, imageUrl: 'https://example.com/img.jpg' }],
  member: { memberId: 42, nickname: '홍길동', placeName: '광산구', light: 3 },
  ...overrides,
});

const makeProps = (overrides = {}) => ({
  data: makeData(),
  isMyPost: false,
  isDeleting: false,
  isChatLoading: false,
  isTradeRequestLoading: false,
  refreshing: false,
  computedValues: {
    canTrade: true,
    isTradeButtonDisabled: false,
    tradeButtonText: '거래하기',
  },
  onDeletePress: jest.fn(),
  onReportPress: jest.fn(),
  onEditPress: jest.fn(),
  onChatPress: jest.fn(),
  onTradeRequest: jest.fn(),
  onReviewButtonPress: jest.fn(),
  onRefresh: jest.fn(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('PostPageContent', () => {
  describe('기본 렌더링', () => {
    it('제목, 내용, 광산 번호를 렌더링한다', () => {
      const { getByText } = render(<PostPageContent {...makeProps()} />);

      expect(getByText('테스트 제목')).toBeTruthy();
      expect(getByText('테스트 내용입니다.')).toBeTruthy();
      expect(getByText('3 광산')).toBeTruthy();
    });

    it('MiniProfile을 렌더링한다', () => {
      const { getByTestId } = render(<PostPageContent {...makeProps()} />);

      expect(getByTestId('mini-profile')).toBeTruthy();
    });
  });

  describe('내 게시글 (isMyPost=true)', () => {
    it('"이 게시글 삭제하기"를 표시한다', () => {
      const { getByText } = render(<PostPageContent {...makeProps({ isMyPost: true })} />);

      expect(getByText('이 게시글 삭제하기')).toBeTruthy();
    });

    it('isDeleting=true이면 "삭제 처리 중..."을 표시한다', () => {
      const { getByText } = render(
        <PostPageContent {...makeProps({ isMyPost: true, isDeleting: true })} />
      );

      expect(getByText('삭제 처리 중...')).toBeTruthy();
    });

    it('"수정하기" 버튼을 표시한다', () => {
      const { getByText } = render(<PostPageContent {...makeProps({ isMyPost: true })} />);

      expect(getByText('수정하기')).toBeTruthy();
    });

    it('"채팅하기" 버튼을 표시하지 않는다', () => {
      const { queryByText } = render(<PostPageContent {...makeProps({ isMyPost: true })} />);

      expect(queryByText('채팅하기')).toBeNull();
    });

    it('"삭제하기" 텍스트를 누르면 onDeletePress가 호출된다', () => {
      const onDeletePress = jest.fn();
      const { getByText } = render(
        <PostPageContent {...makeProps({ isMyPost: true, onDeletePress })} />
      );

      fireEvent.press(getByText('이 게시글 삭제하기'));

      expect(onDeletePress).toHaveBeenCalled();
    });

    it('"수정하기"를 누르면 onEditPress가 호출된다', () => {
      const onEditPress = jest.fn();
      const { getByText } = render(
        <PostPageContent {...makeProps({ isMyPost: true, onEditPress })} />
      );

      fireEvent.press(getByText('수정하기'));

      expect(onEditPress).toHaveBeenCalled();
    });
  });

  describe('남의 게시글 (isMyPost=false)', () => {
    it('"이 게시글 신고하기"를 표시한다', () => {
      const { getByText } = render(<PostPageContent {...makeProps()} />);

      expect(getByText('이 게시글 신고하기')).toBeTruthy();
    });

    it('"채팅하기"와 거래 버튼을 표시한다', () => {
      const { getByText } = render(<PostPageContent {...makeProps()} />);

      expect(getByText('채팅하기')).toBeTruthy();
      expect(getByText('거래하기')).toBeTruthy();
    });

    it('isChatLoading=true이면 "채팅방 생성 중..."을 표시한다', () => {
      const { getByText } = render(<PostPageContent {...makeProps({ isChatLoading: true })} />);

      expect(getByText('채팅방 생성 중...')).toBeTruthy();
    });

    it('"신고하기" 텍스트를 누르면 onReportPress가 호출된다', () => {
      const onReportPress = jest.fn();
      const { getByText } = render(<PostPageContent {...makeProps({ onReportPress })} />);

      fireEvent.press(getByText('이 게시글 신고하기'));

      expect(onReportPress).toHaveBeenCalled();
    });

    it('"채팅하기"를 누르면 onChatPress가 호출된다', () => {
      const onChatPress = jest.fn();
      const { getByText } = render(<PostPageContent {...makeProps({ onChatPress })} />);

      fireEvent.press(getByText('채팅하기'));

      expect(onChatPress).toHaveBeenCalled();
    });

    it('거래 버튼을 누르면 onTradeRequest가 호출된다', () => {
      const onTradeRequest = jest.fn();
      const { getByText } = render(<PostPageContent {...makeProps({ onTradeRequest })} />);

      fireEvent.press(getByText('거래하기'));

      expect(onTradeRequest).toHaveBeenCalled();
    });

    it('computedValues.tradeButtonText를 거래 버튼에 표시한다', () => {
      const props = makeProps({
        computedValues: {
          canTrade: false,
          isTradeButtonDisabled: true,
          tradeButtonText: '거래 불가',
        },
      });
      const { getByText } = render(<PostPageContent {...props} />);

      expect(getByText('거래 불가')).toBeTruthy();
    });
  });

  describe('리뷰 작성 모드 (review="1")', () => {
    it('"리뷰 작성" 버튼을 표시한다', () => {
      const { getByText } = render(<PostPageContent {...makeProps({ review: '1' })} />);

      expect(getByText('리뷰 작성')).toBeTruthy();
    });

    it('"채팅하기" / 거래 버튼을 표시하지 않는다', () => {
      const { queryByText } = render(<PostPageContent {...makeProps({ review: '1' })} />);

      expect(queryByText('채팅하기')).toBeNull();
      expect(queryByText('거래하기')).toBeNull();
    });

    it('"리뷰 작성"을 누르면 onReviewButtonPress가 호출된다', () => {
      const onReviewButtonPress = jest.fn();
      const { getByText } = render(
        <PostPageContent {...makeProps({ review: '1', onReviewButtonPress })} />
      );

      fireEvent.press(getByText('리뷰 작성'));

      expect(onReviewButtonPress).toHaveBeenCalled();
    });
  });
});
