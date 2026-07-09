import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { WriteEntryModal } from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('~/shared/ui', () => ({
  BottomSheetModalWrapper: ({ isVisible, children, title, onClose }: any) => {
    if (!isVisible) return null;
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity testID="modal-close-button" onPress={onClose} />
        {children}
      </View>
    );
  },
}));

const mockRouterPush = router.push as jest.Mock;

describe('WriteEntryModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(<WriteEntryModal isVisible={false} onClose={jest.fn()} />);

    expect(queryByText('무엇을 등록할까요?')).toBeNull();
  });

  it('isVisible=true이면 카테고리 선택 화면을 보여준다', () => {
    const { getByText } = render(<WriteEntryModal isVisible onClose={jest.fn()} />);

    expect(getByText('무엇을 등록할까요?')).toBeTruthy();
    expect(getByText('물건')).toBeTruthy();
    expect(getByText('서비스')).toBeTruthy();
  });

  it('카테고리를 선택하면 모드 선택 화면으로 전환된다', () => {
    const { getByText, queryByText } = render(<WriteEntryModal isVisible onClose={jest.fn()} />);

    fireEvent.press(getByText('물건'));

    expect(getByText('어떤 유형인가요?')).toBeTruthy();
    expect(getByText('팔아요')).toBeTruthy();
    expect(getByText('필요해요')).toBeTruthy();
    expect(queryByText('서비스')).toBeNull();
  });

  it('서비스 카테고리를 선택하면 서비스용 모드 옵션을 보여준다', () => {
    const { getByText } = render(<WriteEntryModal isVisible onClose={jest.fn()} />);

    fireEvent.press(getByText('서비스'));

    expect(getByText('할 수 있어요')).toBeTruthy();
    expect(getByText('해주세요')).toBeTruthy();
  });

  it('뒤로 버튼을 누르면 카테고리 선택 화면으로 돌아간다', () => {
    const { getByText, queryByText } = render(<WriteEntryModal isVisible onClose={jest.fn()} />);

    fireEvent.press(getByText('물건'));
    expect(getByText('어떤 유형인가요?')).toBeTruthy();

    fireEvent.press(getByText('뒤로'));

    expect(getByText('무엇을 등록할까요?')).toBeTruthy();
    expect(queryByText('팔아요')).toBeNull();
  });

  it('모드를 선택하면 onClose와 router.push가 올바른 인자로 호출된다', () => {
    const onClose = jest.fn();
    const { getByText } = render(<WriteEntryModal isVisible onClose={onClose} />);

    fireEvent.press(getByText('물건'));
    fireEvent.press(getByText('팔아요'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/write',
      params: { type: 'OBJECT', mode: 'GIVER' },
    });
  });

  it('모달 닫기 버튼을 누르면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<WriteEntryModal isVisible onClose={onClose} />);

    fireEvent.press(getByTestId('modal-close-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('다시 열리면 카테고리 선택 화면으로 초기화된다', () => {
    const { getByText, rerender, queryByText } = render(
      <WriteEntryModal isVisible onClose={jest.fn()} />
    );

    fireEvent.press(getByText('물건'));
    expect(getByText('어떤 유형인가요?')).toBeTruthy();

    rerender(<WriteEntryModal isVisible={false} onClose={jest.fn()} />);
    rerender(<WriteEntryModal isVisible onClose={jest.fn()} />);

    expect(getByText('무엇을 등록할까요?')).toBeTruthy();
    expect(queryByText('팔아요')).toBeNull();
  });
});
