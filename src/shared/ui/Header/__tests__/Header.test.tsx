import { render, fireEvent } from '@testing-library/react-native';
import { Header } from '../index';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return function MockIcon(props: any) {
    return React.createElement(View, { testID: `icon-${props.name}` });
  };
});

const mockRouterBack = jest.requireMock('expo-router').router.back as jest.Mock;

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('headerTitle을 렌더링한다', () => {
    const { getByText } = render(<Header headerTitle="채팅방" />);
    expect(getByText('채팅방')).toBeTruthy();
  });

  it('onBack이 없으면 뒤로가기 버튼 클릭 시 router.back()을 호출한다', () => {
    const { getByTestId } = render(<Header headerTitle="채팅방" />);
    fireEvent.press(getByTestId('icon-chevron-back'));
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it('onBack이 있으면 뒤로가기 버튼 클릭 시 onBack을 호출한다', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(<Header headerTitle="채팅방" onBack={onBack} />);
    fireEvent.press(getByTestId('icon-chevron-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  it('showMenuButton이 true이면 메뉴 버튼을 렌더링한다', () => {
    const { getByTestId } = render(<Header headerTitle="채팅방" showMenuButton />);
    expect(getByTestId('icon-ellipsis-vertical')).toBeTruthy();
  });

  it('showMenuButton이 false이면 메뉴 버튼을 렌더링하지 않는다', () => {
    const { queryByTestId } = render(<Header headerTitle="채팅방" />);
    expect(queryByTestId('icon-ellipsis-vertical')).toBeNull();
  });

  it('메뉴 버튼 클릭 시 onMenuPress를 호출한다', () => {
    const onMenuPress = jest.fn();
    const { getByTestId } = render(
      <Header headerTitle="채팅방" showMenuButton onMenuPress={onMenuPress} />
    );
    fireEvent.press(getByTestId('icon-ellipsis-vertical'));
    expect(onMenuPress).toHaveBeenCalledTimes(1);
  });

  it('onTitlePress가 있으면 타이틀 클릭 시 onTitlePress를 호출한다', () => {
    const onTitlePress = jest.fn();
    const { getByText } = render(<Header headerTitle="채팅방" onTitlePress={onTitlePress} />);
    fireEvent.press(getByText('채팅방'));
    expect(onTitlePress).toHaveBeenCalledTimes(1);
  });

  it('연결되지 않은 동안에는 색 점과 함께 상태 문구를 보여준다', () => {
    const { getByText, rerender, queryByText } = render(
      <Header headerTitle="채팅방" connectionState="disconnected" />
    );
    expect(getByText('연결 끊김')).toBeTruthy();

    rerender(<Header headerTitle="채팅방" connectionState="connecting" />);
    expect(getByText('연결 중')).toBeTruthy();

    rerender(<Header headerTitle="채팅방" connectionState="connected" />);
    expect(queryByText('연결 중')).toBeNull();
    expect(queryByText('연결 끊김')).toBeNull();
  });

  it('연결 상태를 스크린리더용 라벨로도 제공한다', () => {
    const { getByTestId } = render(<Header headerTitle="채팅방" connectionState="connected" />);

    expect(getByTestId('header-connection-indicator').props.accessibilityLabel).toBe('연결됨');
  });

  it('스냅샷 - 기본 상태', () => {
    const { toJSON } = render(<Header headerTitle="광산구" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - connectionState connected', () => {
    const { toJSON } = render(<Header headerTitle="채팅방" connectionState="connected" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - connectionState connecting', () => {
    const { toJSON } = render(<Header headerTitle="채팅방" connectionState="connecting" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - connectionState disconnected', () => {
    const { toJSON } = render(<Header headerTitle="채팅방" connectionState="disconnected" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - 메뉴 버튼 있음', () => {
    const { toJSON } = render(<Header headerTitle="채팅방" showMenuButton />);
    expect(toJSON()).toMatchSnapshot();
  });
});
