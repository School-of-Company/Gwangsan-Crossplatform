import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import MainPageView from '../index';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/entity/main/model/useGetMyInformation', () => ({
  useGetMyInformation: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('~/entity/main/ui/header', () => {
  const { View } = require('react-native');
  return () => <View testID="main-header" />;
});

jest.mock('~/widget/main', () => ({
  Inform: ({ head, dong, place }: any) => {
    const { Text, View } = require('react-native');
    return (
      <View testID="inform">
        <Text testID="inform-head">{head}</Text>
        <Text testID="inform-dong">{dong}</Text>
        <Text testID="inform-place">{place}</Text>
      </View>
    );
  },
  MainSlideViewer: () => {
    const { View } = require('react-native');
    return <View testID="slide-viewer" />;
  },
}));

const mockUseGetMyInformation = useGetMyInformation as jest.Mock;
const mockToastShow = Toast.show as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MainPageView', () => {
  it('데이터가 있으면 Inform에 head/dong/place를 전달한다', () => {
    mockUseGetMyInformation.mockReturnValue({
      data: { headName: '광산점', dongName: '수완동', placeName: '지점1' },
      isError: false,
      error: null,
    });

    const { getByTestId } = render(<MainPageView />);

    expect(getByTestId('inform-head').props.children).toBe('광산점');
    expect(getByTestId('inform-dong').props.children).toBe('수완동');
    expect(getByTestId('inform-place').props.children).toBe('지점1');
  });

  it('data가 없으면 기본값을 Inform에 전달한다', () => {
    mockUseGetMyInformation.mockReturnValue({
      data: undefined,
      isError: false,
      error: null,
    });

    const { getByTestId } = render(<MainPageView />);

    expect(getByTestId('inform-head').props.children).toBe('본점');
    expect(getByTestId('inform-dong').props.children).toBe('동');
    expect(getByTestId('inform-place').props.children).toBe('지점');
  });

  it('Header, MainSlideViewer를 렌더링한다', () => {
    mockUseGetMyInformation.mockReturnValue({ data: undefined, isError: false, error: null });

    const { getByTestId } = render(<MainPageView />);

    expect(getByTestId('main-header')).toBeTruthy();
    expect(getByTestId('slide-viewer')).toBeTruthy();
  });

  it('isError가 true이면 Toast로 에러 메시지를 보여준다', async () => {
    mockUseGetMyInformation.mockReturnValue({
      data: undefined,
      isError: true,
      error: new Error('요청 실패'),
    });

    render(<MainPageView />);

    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith({
        type: 'error',
        text1: '정보 조회 실패',
        text2: '요청 실패',
      })
    );
  });

  it('error가 Error 인스턴스가 아니면 기본 메시지를 보여준다', async () => {
    mockUseGetMyInformation.mockReturnValue({
      data: undefined,
      isError: true,
      error: 'string error',
    });

    render(<MainPageView />);

    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith({
        type: 'error',
        text1: '정보 조회 실패',
        text2: '알 수 없는 오류가 발생했습니다.',
      })
    );
  });

  it('isError가 false이면 Toast를 호출하지 않는다', () => {
    mockUseGetMyInformation.mockReturnValue({ data: undefined, isError: false, error: null });

    render(<MainPageView />);

    expect(mockToastShow).not.toHaveBeenCalled();
  });
});
