import { render, fireEvent } from '@testing-library/react-native';
import { AppFooter } from '../index';

jest.mock('~/entity/chat', () => ({
  useChatRooms: jest.fn(() => ({ totalUnreadCount: 0 })),
}));

jest.mock('~/shared/ui/Footer', () => ({
  Footer: ({ onWritePress }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="footer-write-button" onPress={onWritePress}>
        <Text>글쓰기</Text>
      </TouchableOpacity>
    );
  },
}));

const mockTabBarProps = {
  state: { index: 0, routes: [{ key: 'main', name: 'main' }] },
  navigation: { navigate: jest.fn() },
  descriptors: {},
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
} as any;

jest.mock('../../WriteEntryModal', () => ({
  WriteEntryModal: ({ isVisible, onClose }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    if (!isVisible) return null;
    return (
      <View>
        <Text>모달 열림</Text>
        <TouchableOpacity testID="modal-close-button" onPress={onClose} />
      </View>
    );
  },
}));

describe('AppFooter', () => {
  it('Footer를 렌더링하고 모달은 기본적으로 보이지 않는다', () => {
    const { getByTestId, queryByText } = render(<AppFooter {...mockTabBarProps} />);

    expect(getByTestId('footer-write-button')).toBeTruthy();
    expect(queryByText('모달 열림')).toBeNull();
  });

  it('글쓰기 버튼을 누르면 WriteEntryModal이 보인다', () => {
    const { getByTestId, getByText } = render(<AppFooter {...mockTabBarProps} />);

    fireEvent.press(getByTestId('footer-write-button'));

    expect(getByText('모달 열림')).toBeTruthy();
  });

  it('모달의 onClose가 호출되면 모달이 닫힌다', () => {
    const { getByTestId, queryByText } = render(<AppFooter {...mockTabBarProps} />);

    fireEvent.press(getByTestId('footer-write-button'));
    expect(queryByText('모달 열림')).toBeTruthy();

    fireEvent.press(getByTestId('modal-close-button'));

    expect(queryByText('모달 열림')).toBeNull();
  });
});
