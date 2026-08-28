import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import ProfilePageView from '../index';
import { useGetProfile } from '~/view/profile/model/useGetProfile';
import { useGetMyProfile } from '~/view/profile/model/useGetMyProfile';
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
  Introduce: (props: any) => {
    const { Text } = require('react-native');
    return <Text testID="introduce">{JSON.stringify(props)}</Text>;
  },
  ProfileMenu: (props: any) => {
    const { Text } = require('react-native');
    return <Text testID="profile-menu">{JSON.stringify(props)}</Text>;
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetProfile = useGetProfile as jest.Mock;
const mockUseGetMyProfile = useGetMyProfile as jest.Mock;
const mockUseGetBlockList = useGetBlockList as jest.Mock;

const refetchProfile = jest.fn().mockResolvedValue({});
const refetchMyProfile = jest.fn().mockResolvedValue({});

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

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({});
  mockUseGetProfile.mockReturnValue(defaultProfileReturn());
  mockUseGetMyProfile.mockReturnValue(defaultMyProfileReturn());
  mockUseGetBlockList.mockReturnValue({ data: [] });
});

describe('ProfilePageView', () => {
  describe('본인 프로필(id 없음)', () => {
    it('isMe=true로 관련 훅을 호출한다', () => {
      render(<ProfilePageView />);

      expect(mockUseGetMyProfile).toHaveBeenCalledWith(true);
      expect(mockUseGetProfile).toHaveBeenCalledWith(undefined);
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

    it('ProfileMenu에 isMe=true와 내 memberId를 전달한다', () => {
      const { getByTestId } = render(<ProfilePageView />);

      const menu = JSON.parse(getByTestId('profile-menu').props.children);
      expect(menu.isMe).toBe(true);
      expect(menu.memberId).toBe(1);
      expect(menu.name).toBe('나');
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
      expect(mockUseGetProfile).toHaveBeenCalledWith('5');
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

    it('ProfileMenu에 isMe=false와 상대방 memberId를 전달한다', () => {
      const { getByTestId } = render(<ProfilePageView />);

      const menu = JSON.parse(getByTestId('profile-menu').props.children);
      expect(menu.isMe).toBe(false);
      expect(menu.memberId).toBe(5);
      expect(menu.name).toBe('상대방');
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

    it('에러 메시지가 없으면 기본 안내 문구로 Toast를 표시한다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockUseGetProfile.mockReturnValue({
        data: undefined,
        error: new Error(''),
        isError: true,
        refetch: refetchProfile,
      });

      render(<ProfilePageView />);

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text2: '잠시 후 다시 시도해주세요.' })
      );
    });
  });

  describe('새로고침', () => {
    it('본인 프로필에서 새로고침하면 refetchMyProfile을 호출한다', async () => {
      const { UNSAFE_getByType } = render(<ProfilePageView />);

      const { RefreshControl } = require('react-native');
      const refreshControl = UNSAFE_getByType(RefreshControl);

      await act(async () => {
        await refreshControl.props.onRefresh();
      });

      expect(refetchMyProfile).toHaveBeenCalled();
      expect(refetchProfile).not.toHaveBeenCalled();
    });

    it('상대방 프로필에서 새로고침하면 refetchProfile을 호출한다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockUseGetProfile.mockReturnValue({
        data: { memberId: 5, nickname: '상대방', description: '설명', specialties: [], light: 3 },
        error: null,
        isError: false,
        refetch: refetchProfile,
      });

      const { UNSAFE_getByType } = render(<ProfilePageView />);

      const { RefreshControl } = require('react-native');
      const refreshControl = UNSAFE_getByType(RefreshControl);

      await act(async () => {
        await refreshControl.props.onRefresh();
      });

      expect(refetchProfile).toHaveBeenCalled();
      expect(refetchMyProfile).not.toHaveBeenCalled();
    });

    it('새로고침이 실패해도 refreshing 상태를 해제한다', async () => {
      refetchMyProfile.mockRejectedValueOnce(new Error('새로고침 실패'));

      const { UNSAFE_getByType } = render(<ProfilePageView />);

      const { RefreshControl } = require('react-native');
      const refreshControl = UNSAFE_getByType(RefreshControl);

      await act(async () => {
        await expect(refreshControl.props.onRefresh()).rejects.toThrow('새로고침 실패');
      });

      expect(refetchMyProfile).toHaveBeenCalled();
    });
  });
});
