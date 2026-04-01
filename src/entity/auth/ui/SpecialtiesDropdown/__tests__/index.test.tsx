import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpecialtiesDropdown from '../index';

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});
jest.mock('@/shared/assets/svg/CheckIcon', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});

const defaultItems = ['수영', '요가', '필라테스'];

describe('SpecialtiesDropdown', () => {
  it('placeholder 텍스트를 렌더링한다', () => {
    const { getByText } = render(
      <SpecialtiesDropdown items={defaultItems} placeholder="선택해주세요" />
    );

    expect(getByText('선택해주세요')).toBeTruthy();
  });

  it('label이 있으면 label을 렌더링한다', () => {
    const { getByText } = render(<SpecialtiesDropdown items={defaultItems} label="특기 선택" />);

    expect(getByText('특기 선택')).toBeTruthy();
  });

  it('드롭다운 클릭 시 항목들이 표시된다', () => {
    const { getByText, queryByText } = render(<SpecialtiesDropdown items={defaultItems} />);

    expect(queryByText('수영')).toBeNull();

    fireEvent.press(getByText('선택해주세요'));

    expect(getByText('수영')).toBeTruthy();
    expect(getByText('요가')).toBeTruthy();
    expect(getByText('필라테스')).toBeTruthy();
  });

  it('항목 선택 시 onSelect가 호출된다', () => {
    const mockOnSelect = jest.fn();
    const { getByText } = render(
      <SpecialtiesDropdown items={defaultItems} onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('선택해주세요'));
    fireEvent.press(getByText('수영'));

    expect(mockOnSelect).toHaveBeenCalledWith(['수영']);
  });

  it('selectedItems prop으로 초기 선택 항목을 설정한다', () => {
    const { getByText } = render(
      <SpecialtiesDropdown items={defaultItems} selectedItems={['요가']} onSelect={jest.fn()} />
    );

    expect(getByText('요가')).toBeTruthy();
  });

  it('allowCustomInput이 true이면 "직접 입력..." 항목이 표시된다', () => {
    const { getByText } = render(<SpecialtiesDropdown items={defaultItems} allowCustomInput />);

    fireEvent.press(getByText('선택해주세요'));

    expect(getByText('직접 입력...')).toBeTruthy();
  });

  it('"직접 입력..." 클릭 시 커스텀 입력 필드가 활성화된다', () => {
    const { getByText, getByPlaceholderText } = render(
      <SpecialtiesDropdown items={defaultItems} allowCustomInput />
    );

    fireEvent.press(getByText('선택해주세요'));
    fireEvent.press(getByText('직접 입력...'));

    expect(getByPlaceholderText('새로운 특기 입력')).toBeTruthy();
  });

  it('두 번 클릭하면 드롭다운이 토글된다', () => {
    const { getByText, queryByText } = render(<SpecialtiesDropdown items={defaultItems} />);

    const trigger = getByText('선택해주세요');
    fireEvent.press(trigger);
    expect(getByText('수영')).toBeTruthy();

    fireEvent.press(trigger);
    expect(queryByText('수영')).toBeNull();
  });
});
