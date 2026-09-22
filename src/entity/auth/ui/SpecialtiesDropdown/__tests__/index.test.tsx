import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpecialtiesDropdown from '../index';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});

const defaultItems = ['수영', '요가', '필라테스'];

describe('SpecialtiesDropdown', () => {
  it('label이 있으면 label을 렌더링한다', () => {
    const { getByText } = render(<SpecialtiesDropdown items={defaultItems} label="특기 선택" />);

    expect(getByText('특기 선택')).toBeTruthy();
  });

  it('별도 클릭 없이 항목들이 바로(칩 형태로) 표시된다', () => {
    const { getByText } = render(<SpecialtiesDropdown items={defaultItems} />);

    expect(getByText('수영')).toBeTruthy();
    expect(getByText('요가')).toBeTruthy();
    expect(getByText('필라테스')).toBeTruthy();
  });

  it('아무것도 선택하지 않았으면 placeholder 안내 문구를 표시한다', () => {
    const { getByText } = render(
      <SpecialtiesDropdown items={defaultItems} placeholder="특기를 선택해주세요" />
    );

    expect(getByText('특기를 선택해주세요')).toBeTruthy();
  });

  it('하나라도 선택하면 placeholder 안내 문구가 사라진다', () => {
    const { getByText, queryByText } = render(
      <SpecialtiesDropdown items={defaultItems} placeholder="특기를 선택해주세요" />
    );

    fireEvent.press(getByText('수영'));

    expect(queryByText('특기를 선택해주세요')).toBeNull();
  });

  it('칩을 누르면 onSelect가 선택된 항목 배열과 함께 호출된다', () => {
    const mockOnSelect = jest.fn();
    const { getByText } = render(
      <SpecialtiesDropdown items={defaultItems} onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('수영'));

    expect(mockOnSelect).toHaveBeenCalledWith(['수영']);
  });

  it('선택된 칩을 다시 누르면 선택이 해제된다', () => {
    const mockOnSelect = jest.fn();
    const { getByText } = render(
      <SpecialtiesDropdown items={defaultItems} onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('수영'));
    fireEvent.press(getByText('수영'));

    expect(mockOnSelect).toHaveBeenLastCalledWith([]);
  });

  it('selectedItems prop으로 초기 선택 항목을 표시하고, 선택된 칩만 selected 상태로 표시된다', () => {
    const { getByText, getByTestId } = render(
      <SpecialtiesDropdown items={defaultItems} selectedItems={['요가']} onSelect={jest.fn()} />
    );

    expect(getByText('요가')).toBeTruthy();
    expect(getByTestId('specialty-chip-요가').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('specialty-chip-수영').props.accessibilityState.selected).toBe(false);
  });

  it('allowCustomInput이 true이면 "직접 입력" 칩이 표시된다', () => {
    const { getByText } = render(<SpecialtiesDropdown items={defaultItems} allowCustomInput />);

    expect(getByText('직접 입력')).toBeTruthy();
  });

  it('allowCustomInput이 false이면 "직접 입력" 칩이 표시되지 않는다', () => {
    const { queryByText } = render(<SpecialtiesDropdown items={defaultItems} />);

    expect(queryByText('직접 입력')).toBeNull();
  });

  it('"직접 입력" 클릭 시 커스텀 입력 필드가 활성화된다', () => {
    const { getByText, getByPlaceholderText } = render(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput />
    );

    fireEvent.press(getByText('직접 입력'));

    expect(getByPlaceholderText('새로운 특기')).toBeTruthy();
  });

  it('커스텀 입력을 제출하면 새 칩으로 추가되고 onSelect가 호출된다', () => {
    const mockOnSelect = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('직접 입력'));
    fireEvent.changeText(getByPlaceholderText('새로운 특기'), '독서');
    fireEvent(getByPlaceholderText('새로운 특기'), 'onSubmitEditing');

    expect(mockOnSelect).toHaveBeenCalledWith(['독서']);
    expect(getByText('독서')).toBeTruthy();
  });
});
