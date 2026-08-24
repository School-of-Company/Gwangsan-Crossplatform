import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MenuRow } from '../index';

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text testID="chevron-icon">{name}</Text>;
});

describe('MenuRow', () => {
  it('label을 렌더링한다', () => {
    const { getByText } = render(<MenuRow label="내 글" onPress={() => {}} />);

    expect(getByText('내 글')).toBeTruthy();
  });

  it('눌렀을 때 onPress를 호출한다', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MenuRow label="내 글" onPress={onPress} />);

    fireEvent.press(getByText('내 글'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled이면 onPress가 호출되지 않는다', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MenuRow label="후기" disabled onPress={onPress} />);

    fireEvent.press(getByText('후기'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('기본적으로 chevron 아이콘을 렌더링한다', () => {
    const { getByTestId } = render(<MenuRow label="내 글" onPress={() => {}} />);

    expect(getByTestId('chevron-icon')).toBeTruthy();
  });

  it('showChevron=false이면 chevron 아이콘을 렌더링하지 않는다', () => {
    const { queryByTestId } = render(
      <MenuRow label="로그아웃" showChevron={false} onPress={() => {}} />
    );

    expect(queryByTestId('chevron-icon')).toBeNull();
  });
});
