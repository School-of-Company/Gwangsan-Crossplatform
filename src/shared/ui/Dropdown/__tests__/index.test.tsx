import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Dropdown } from '../index';

const items = [
  { value: 'a', label: '항목 A' },
  { value: 'b', label: '항목 B' },
  { value: 'c', label: '항목 C' },
];

describe('Dropdown', () => {
  it('label을 렌더링한다', () => {
    const { getByText } = render(<Dropdown label="선택" items={items} />);
    expect(getByText('선택')).toBeTruthy();
  });

  it('선택된 값이 없으면 기본 placeholder "선택해주세요"를 표시한다', () => {
    const { getByText } = render(<Dropdown items={items} />);
    expect(getByText('선택해주세요')).toBeTruthy();
  });

  it('placeholder prop을 표시한다', () => {
    const { getByText } = render(<Dropdown items={items} placeholder="옵션을 고르세요" />);
    expect(getByText('옵션을 고르세요')).toBeTruthy();
  });

  it('selectedItem prop으로 초기 선택 라벨을 표시한다', () => {
    const { getByText } = render(<Dropdown items={items} selectedItem="b" />);
    expect(getByText('항목 B')).toBeTruthy();
  });

  it('트리거를 클릭하면 항목 목록이 열린다', () => {
    const { getByText, queryByText } = render(<Dropdown items={items} />);
    expect(queryByText('항목 A')).toBeNull();
    fireEvent.press(getByText('선택해주세요'));
    expect(getByText('항목 A')).toBeTruthy();
    expect(getByText('항목 B')).toBeTruthy();
    expect(getByText('항목 C')).toBeTruthy();
  });

  it('항목을 선택하면 onSelect를 호출하고 목록이 닫힌다', () => {
    const onSelect = jest.fn();
    const { getByText, queryByText } = render(<Dropdown items={items} onSelect={onSelect} />);
    fireEvent.press(getByText('선택해주세요'));
    fireEvent.press(getByText('항목 C'));

    expect(onSelect).toHaveBeenCalledWith('c');
    expect(getByText('항목 C')).toBeTruthy();
    expect(queryByText('항목 A')).toBeNull();
  });

  it('스냅샷 - 닫힌 상태', () => {
    const { toJSON } = render(<Dropdown label="선택" items={items} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - 열린 상태', () => {
    const { getByText, toJSON } = render(<Dropdown label="선택" items={items} />);
    fireEvent.press(getByText('선택해주세요'));
    expect(toJSON()).toMatchSnapshot();
  });
});
