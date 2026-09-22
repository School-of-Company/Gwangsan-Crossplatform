import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SpecialtiesDropdown from '../index';
import { BottomSheetPortalOutlet } from '~/shared/ui/BottomSheetPortalOutlet';
import { useBottomSheetPortalStore } from '~/shared/store/useBottomSheetPortalStore';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

// CustomInputCard가 사용하는 Input/Button을 단순한 형태로 대체해 접근성 상태 등
// 부가 로직 없이 텍스트/값/disabled 검증에만 집중할 수 있게 한다.
jest.mock('~/shared/ui', () => {
  const React = require('react');
  const { TextInput, TouchableOpacity, Text } = require('react-native');
  return {
    Input: React.forwardRef(({ label, ...props }: any, ref: any) =>
      React.createElement(TextInput, { ref, ...props })
    ),
    Button: ({ children, onPress, disabled }: any) =>
      React.createElement(
        TouchableOpacity,
        { onPress, disabled },
        React.createElement(Text, null, children)
      ),
  };
});

const defaultItems = ['수영', '요가', '필라테스'];

beforeEach(() => {
  useBottomSheetPortalStore.getState().reset();
});

// CustomInputCard는 포털 스토어에 등록만 하고 직접 렌더링하지 않으므로,
// 실제 출력을 확인하려면 Outlet을 같은 트리에 함께 렌더링해야 한다.
function renderDropdown(ui: React.ReactElement) {
  return render(
    <>
      {ui}
      <BottomSheetPortalOutlet />
    </>
  );
}

describe('SpecialtiesDropdown', () => {
  it('label이 있으면 label을 렌더링한다', () => {
    const { getByText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} label="특기 선택" />
    );

    expect(getByText('특기 선택')).toBeTruthy();
  });

  it('별도 클릭 없이 항목들이 바로(칩 형태로) 표시된다', () => {
    const { getByText } = renderDropdown(<SpecialtiesDropdown items={defaultItems} />);

    expect(getByText('수영')).toBeTruthy();
    expect(getByText('요가')).toBeTruthy();
    expect(getByText('필라테스')).toBeTruthy();
  });

  it('아무것도 선택하지 않았으면 placeholder 안내 문구를 표시한다', () => {
    const { getByText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} placeholder="특기를 선택해주세요" />
    );

    expect(getByText('특기를 선택해주세요')).toBeTruthy();
  });

  it('하나라도 선택하면 placeholder 안내 문구가 사라진다', () => {
    const { getByText, queryByText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} placeholder="특기를 선택해주세요" />
    );

    fireEvent.press(getByText('수영'));

    expect(queryByText('특기를 선택해주세요')).toBeNull();
  });

  it('칩을 누르면 onSelect가 선택된 항목 배열과 함께 호출된다', () => {
    const mockOnSelect = jest.fn();
    const { getByText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('수영'));

    expect(mockOnSelect).toHaveBeenCalledWith(['수영']);
  });

  it('선택된 칩을 다시 누르면 선택이 해제된다', () => {
    const mockOnSelect = jest.fn();
    const { getByText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('수영'));
    fireEvent.press(getByText('수영'));

    expect(mockOnSelect).toHaveBeenLastCalledWith([]);
  });

  it('selectedItems prop으로 초기 선택 항목을 표시하고, 선택된 칩만 selected 상태로 표시된다', () => {
    const { getByText, getByTestId } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} selectedItems={['요가']} onSelect={jest.fn()} />
    );

    expect(getByText('요가')).toBeTruthy();
    expect(getByTestId('specialty-chip-요가').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('specialty-chip-수영').props.accessibilityState.selected).toBe(false);
  });

  it('allowCustomInput이 true이면 "직접 입력" 칩이 표시된다', () => {
    const { getByText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput />
    );

    expect(getByText('직접 입력')).toBeTruthy();
  });

  it('allowCustomInput이 false이면 "직접 입력" 칩이 표시되지 않는다', () => {
    const { queryByText } = renderDropdown(<SpecialtiesDropdown items={defaultItems} />);

    expect(queryByText('직접 입력')).toBeNull();
  });

  it('"직접 입력" 클릭 전에는 커스텀 입력 카드가 보이지 않는다', () => {
    const { queryByPlaceholderText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput />
    );

    expect(queryByPlaceholderText('예: 목공, 사진 촬영')).toBeNull();
  });

  it('"직접 입력" 클릭 시 커스텀 입력 카드(입력창)가 열린다', () => {
    const { getByPlaceholderText, getByText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput />
    );

    fireEvent.press(getByText('직접 입력'));

    expect(getByPlaceholderText('예: 목공, 사진 촬영')).toBeTruthy();
  });

  it('입력값이 없으면 추가하기 버튼이 비활성화된다', () => {
    const { getByText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput />
    );

    fireEvent.press(getByText('직접 입력'));

    expect(getByText('추가하기').parent?.parent?.props.accessibilityState?.disabled).toBe(true);
  });

  it('추가하기 버튼을 누르면 새 칩으로 추가되고 onSelect가 호출되며 카드가 닫힌다', async () => {
    const mockOnSelect = jest.fn();
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('직접 입력'));
    fireEvent.changeText(getByPlaceholderText('예: 목공, 사진 촬영'), '독서');
    fireEvent.press(getByText('추가하기'));

    expect(mockOnSelect).toHaveBeenCalledWith(['독서']);
    expect(getByText('독서')).toBeTruthy();
    await waitFor(() => expect(queryByPlaceholderText('예: 목공, 사진 촬영')).toBeNull());
  });

  it('입력창에서 제출(엔터)해도 새 칩으로 추가된다', () => {
    const mockOnSelect = jest.fn();
    const { getByText, getByPlaceholderText } = renderDropdown(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('직접 입력'));
    fireEvent.changeText(getByPlaceholderText('예: 목공, 사진 촬영'), '독서');
    fireEvent(getByPlaceholderText('예: 목공, 사진 촬영'), 'onSubmitEditing');

    expect(mockOnSelect).toHaveBeenCalledWith(['독서']);
    expect(getByText('독서')).toBeTruthy();
  });
});
