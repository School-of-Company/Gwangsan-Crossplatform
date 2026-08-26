import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomSheetModalWrapper } from '../index';
import { BottomSheetPortalOutlet } from '../../BottomSheetPortalOutlet';
import { useBottomSheetPortalStore } from '~/shared/store/useBottomSheetPortalStore';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

// BottomSheetModalWrapper는 이제 자신을 직접 렌더링하지 않고 포털 스토어에 등록만
// 하므로, 실제 출력을 확인하려면 Outlet을 같은 트리에 함께 렌더링해야 한다.
function renderSheet(ui: React.ReactElement) {
  return render(
    <>
      {ui}
      <BottomSheetPortalOutlet />
    </>
  );
}

beforeEach(() => {
  useBottomSheetPortalStore.getState().reset();
});

describe('BottomSheetModalWrapper', () => {
  it('isVisible이 false이면 아무것도 렌더링하지 않는다', () => {
    const { queryByText } = renderSheet(
      <BottomSheetModalWrapper isVisible={false} onClose={jest.fn()} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(queryByText('제목')).toBeNull();
    expect(queryByText('내용')).toBeNull();
  });

  it('isVisible이 true이면 title과 children을 렌더링한다', () => {
    const { getByText } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(getByText('제목')).toBeTruthy();
    expect(getByText('내용')).toBeTruthy();
  });

  it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={onClose} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('오버레이(배경) 클릭 시 onClose를 호출한다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByProps } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={onClose} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    fireEvent.press(UNSAFE_getByProps({ className: 'flex-1 justify-end' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('컨텐츠 영역 클릭 시 onClose를 호출하지 않는다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByProps } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={onClose} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    fireEvent.press(UNSAFE_getByProps({ className: 'flex-1 px-4 pt-4' }), {
      stopPropagation: jest.fn(),
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('hasHeader가 false이면 title과 닫기 버튼을 렌더링하지 않는다', () => {
    const { queryByText, UNSAFE_queryAllByType } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" hasHeader={false}>
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(queryByText('제목')).toBeNull();
    expect(UNSAFE_queryAllByType(TouchableOpacity)).toHaveLength(0);
  });

  it('스냅샷 - hasHeader true (기본값)', () => {
    const { toJSON } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - hasHeader false', () => {
    const { toJSON } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" hasHeader={false}>
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
