import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import ProfilePageView from '../index';
import { useGetProfile } from '~/view/profile/model/useGetProfile';
import { useGetMyProfile } from '~/view/profile/model/useGetMyProfile';
import { useGetMyPosts } from '~/view/profile/model/useGetMyPosts';
import { useGetPosts } from '~/view/profile/model/useGetPosts';
import { useGetBlockList } from '~/view/profile/model/useGetBlockList';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/view/profile/model/useGetProfile', () => ({ useGetProfile: jest.fn() }));
jest.mock('~/view/profile/model/useGetMyProfile', () => ({ useGetMyProfile: jest.fn() }));
jest.mock('~/view/profile/model/useGetMyPosts', () => ({ useGetMyPosts: jest.fn() }));
jest.mock('~/view/profile/model/useGetPosts', () => ({ useGetPosts: jest.fn() }));
jest.mock('~/view/profile/model/useGetBlockList', () => ({ useGetBlockList: jest.fn() }));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle, showBackButton }: any) => {
    const { Text } = require('react-native');
    return <Text testID="header">{JSON.stringify({ headerTitle, showBackButton })}</Text>;
  },
}));

jest.mock('~/entity/profile/ui', () => ({
  Gwangsan: ({ gwangsan }: any) => {
    const { Text } = require('react-native');
    return <Text testID="gwangsan">{String(gwangsan)}</Text>;
  },
  Information: (props: any) => {
    const { Text } = require('react-native');
    return <Text testID="information">{JSON.stringify(props)}</Text>;
  },
  Light: ({ lightLevel }: any) => {
    const { Text } = require('react-native');
    return <Text testID="light">{String(lightLevel)}</Text>;
  },
}));

jest.mock('~/widget/profile/ui', () => ({
  Active: (props: any) => {
    const { Text } = require('react-native');
    return <Text testID="active">{JSON.stringify(props)}</Text>;
  },
  Introduce: (props: any) => {
    const { Text } = require('react-native');
    return <Text testID="introduce">{JSON.stringify(props)}</Text>;
  },
}));

jest.mock('~/shared/ui/Post', () => ({
  __esModule: true,
  default: ({ id, title }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`post-${id}`}>{title}</Text>;
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetProfile = useGetProfile as jest.Mock;
const mockUseGetMyProfile = useGetMyProfile as jest.Mock;
const mockUseGetMyPosts = useGetMyPosts as jest.Mock;
const mockUseGetPosts = useGetPosts as jest.Mock;
const mockUseGetBlockList = useGetBlockList as jest.Mock;

const refetchProfile = jest.fn().mockResolvedValue({});
const refetchMyProfile = jest.fn().mockResolvedValue({});
const refetchMyPosts = jest.fn().mockResolvedValue({});
const refetchOtherPosts = jest.fn().mockResolvedValue({});

const defaultProfileReturn = () => ({
  data: undefined,
  error: null,
  isError: false,
  refetch: refetchProfile,
});

const defaultMyProfileReturn = () => ({
  data: {
    memberId: 1,
    nickname: '나',
    description: '소개',
    specialties: [],
    light: 10,
    gwangsan: 5,
  },
  refetch: refetchMyProfile,
});

const defaultMyPostsReturn = () => ({
  data: [],
  error: null,
  isError: false,
  refetch: refetchMyPosts,
});

const defaultOtherPostsReturn = () => ({
  data: [],
  error: null,
  isError: false,
  refetch: refetchOtherPosts,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({});
  mockUseGetProfile.mockReturnValue(defaultProfileReturn());
  mockUseGetMyProfile.mockReturnValue(defaultMyProfileReturn());
  mockUseGetMyPosts.mockReturnValue(defaultMyPostsReturn());
  mockUseGetPosts.mockReturnValue(defaultOtherPostsReturn());
  mockUseGetBlockList.mockReturnValue({ data: [] });
});

describe('ProfilePageView', () => {
  describe('본인 프로필(id 없음)', () => {
    it('isMe=true로 관련 훅을 호출한다', () => {
      render(<ProfilePageView />);

      expect(mockUseGetMyProfile).toHaveBeenCalledWith(true);
      expect(mockUseGetMyPosts).toHaveBeenCalledWith(true);
      expect(mockUseGetProfile).toHaveBeenCalledWith(undefined);
      expect(mockUseGetPosts).toHaveBeenCalledWith(undefined);
    });

    it('Header에 뒤로가기 버튼을 표시하지 않는다', () => {
      const { getByTestId } = render(<ProfilePageView />);

      const header = JSON.parse(getByTestId('header').props.children);
      expect(header.headerTitle).toBe('프로필');
      expect(header.showBackButton).toBe(false);
    });

    it('Information에 내 프로필 정보를 전달한다', () => {
      const { getByTestId } = render(<ProfilePageView />);

      const info = JSON.parse(getByTestId('information').props.children);
      expect(info.isMe).toBe(true);
      expect(info.id).toBe(1);
      expect(info.name).toBe('나');
    });

    it('Gwangsan 컴포넌트를 렌더링한다', () => {
      const { getByTestId } = render(<ProfilePageView />);

      expect(getByTestId('gwangsan')).toBeTruthy();
    });
  });

  describe('상대방 프로필(id 있음)', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockUseGetProfile.mockReturnValue({
        data: { memberId: 5, nickname: '상대방', description: '설명', specialties: [], light: 3 },
        error: null,
        isError: false,
        refetch: refetchProfile,
      });
    });

    it('isMe=false로 관련 훅을 호출한다', () => {
      render(<ProfilePageView />);

      expect(mockUseGetMyProfile).toHaveBeenCalledWith(false);
      expect(mockUseGetMyPosts).toHaveBeenCalledWith(false);
      expect(mockUseGetProfile).toHaveBeenCalledWith('5');
      expect(mockUseGetPosts).toHaveBeenCalledWith('5');
    });

    it('Header에 뒤로가기 버튼을 표시한다', () => {
      const { getByTestId } = render(<ProfilePageView />);

      const header = JSON.parse(getByTestId('header').props.children);
      expect(header.showBackButton).toBe(true);
    });

    it('Gwangsan 컴포넌트를 렌더링하지 않는다', () => {
      const { queryByTestId } = render(<ProfilePageView />);

      expect(queryByTestId('gwangsan')).toBeNull();
    });

    it('차단된 사용자면 Information에 isBlocked=true를 전달한다', () => {
      mockUseGetBlockList.mockReturnValue({ data: [{ memberId: 5, nickname: '상대방' }] });

      const { getByTestId } = render(<ProfilePageView />);

      const info = JSON.parse(getByTestId('information').props.children);
      expect(info.isBlocked).toBe(true);
    });

    it('차단되지 않은 사용자면 Information에 isBlocked=false를 전달한다', () => {
      mockUseGetBlockList.mockReturnValue({ data: [{ memberId: 99, nickname: '다른유저' }] });

      const { getByTestId } = render(<ProfilePageView />);

      const info = JSON.parse(getByTestId('information').props.children);
      expect(info.isBlocked).toBe(false);
    });
  });

  describe('게시물 목록', () => {
    it('게시물이 없으면 안내 문구를 표시한다', () => {
      const { getByText } = render(<ProfilePageView />);

      expect(getByText('게시물이 없습니다.')).toBeTruthy();
    });

    it('게시물이 있으면 Post 컴포넌트를 렌더링한다', () => {
      mockUseGetMyPosts.mockReturnValue({
        data: [
          { id: 1, title: '내 글 1' },
          { id: 2, title: '내 글 2' },
        ],
        error: null,
        isError: false,
        refetch: refetchMyPosts,
      });

      const { getByTestId } = render(<ProfilePageView />);

      expect(getByTestId('post-1')).toBeTruthy();
      expect(getByTestId('post-2')).toBeTruthy();
    });

    it('본인 프로필일 때 "내 글" 타이틀을 표시한다', () => {
      const { getByText } = render(<ProfilePageView />);

      expect(getByText('내 글')).toBeTruthy();
    });

    it('상대방 프로필일 때 "{닉네임}님의 글" 타이틀을 표시한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockUseGetProfile.mockReturnValue({
        data: { memberId: 5, nickname: '상대방', specialties: [] },
        error: null,
        isError: false,
        refetch: refetchProfile,
      });

      const { getByText } = render(<ProfilePageView />);

      expect(getByText('상대방님의 글')).toBeTruthy();
    });
  });

  describe('에러 처리', () => {
    it('프로필 조회 실패 시 에러 Toast를 표시한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockUseGetProfile.mockReturnValue({
        data: undefined,
        error: new Error('프로필 오류'),
        isError: true,
        refetch: refetchProfile,
      });

      render(<ProfilePageView />);

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '프로필을 불러오는데 실패했습니다.' })
      );
    });

    it('게시물 조회 실패 시 에러 Toast를 표시한다', () => {
      mockUseGetMyPosts.mockReturnValue({
        data: undefined,
        error: new Error('게시물 오류'),
        isError: true,
        refetch: refetchMyPosts,
      });

      render(<ProfilePageView />);

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '글을 불러오는데 실패했습니다.' })
      );
    });
  });
});
