import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomSheetModalWrapper } from '../index';

describe('BottomSheetModalWrapper', () => {
  it('isVisible이 false이면 아무것도 렌더링하지 않는다', () => {
    const { queryByText } = render(
      <BottomSheetModalWrapper isVisible={false} onClose={jest.fn()} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(queryByText('제목')).toBeNull();
    expect(queryByText('내용')).toBeNull();
  });

  it('isVisible이 true이면 title과 children을 렌더링한다', () => {
    const { getByText } = render(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(getByText('제목')).toBeTruthy();
    expect(getByText('내용')).toBeTruthy();
  });

  it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = render(
      <BottomSheetModalWrapper isVisible onClose={onClose} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('오버레이(배경) 클릭 시 onClose를 호출한다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByProps } = render(
      <BottomSheetModalWrapper isVisible onClose={onClose} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    fireEvent.press(UNSAFE_getByProps({ className: 'flex-1 justify-end' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('컨텐츠 영역 클릭 시 onClose를 호출하지 않는다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByProps } = render(
      <BottomSheetModalWrapper isVisible onClose={onClose} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    fireEvent.press(UNSAFE_getByProps({ className: 'flex-1 p-4' }), { stopPropagation: jest.fn() });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('hasHeader가 false이면 title과 닫기 버튼을 렌더링하지 않는다', () => {
    const { queryByText, UNSAFE_queryAllByType } = render(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" hasHeader={false}>
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(queryByText('제목')).toBeNull();
    expect(UNSAFE_queryAllByType(TouchableOpacity)).toHaveLength(0);
  });

  it('스냅샷 - hasHeader true (기본값)', () => {
    const { toJSON } = render(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - hasHeader false', () => {
    const { toJSON } = render(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" hasHeader={false}>
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
