import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActionSheetRow } from '../index';

describe('ActionSheetRow', () => {
  it('라벨을 표시하고 누르면 onPress를 호출한다', () => {
    const onPress = jest.fn();
    render(<ActionSheetRow label="삭제" onPress={onPress} />);

    fireEvent.press(screen.getByText('삭제'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('누르는 동안 눌림 애니메이션이 오류 없이 시작된다', () => {
    render(<ActionSheetRow label="수정" />);
    const label = screen.getByText('수정');

    expect(() => {
      fireEvent(label, 'pressIn');
      fireEvent(label, 'pressOut');
    }).not.toThrow();
  });

  it('disabled이면 눌러도 onPress를 호출하지 않는다', () => {
    const onPress = jest.fn();
    render(<ActionSheetRow label="닫기" disabled onPress={onPress} />);

    fireEvent.press(screen.getByText('닫기'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('labelClassName을 라벨에 적용한다', () => {
    render(<ActionSheetRow label="삭제" labelClassName="text-red-500" />);

    expect(screen.getByText('삭제').props.className).toContain('text-red-500');
  });
});
