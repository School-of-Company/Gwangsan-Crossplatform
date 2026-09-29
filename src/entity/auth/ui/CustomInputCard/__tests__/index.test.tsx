import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { CustomInputCard } from '../index';
import { BottomSheetPortalOutlet } from '~/shared/ui/BottomSheetPortalOutlet';
import { useBottomSheetPortalStore } from '~/shared/store/useBottomSheetPortalStore';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

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

beforeEach(() => {
  useBottomSheetPortalStore.getState().reset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// CustomInputCard는 이제 자신을 직접 렌더링하지 않고 포털 스토어에 등록만
// 하므로, 실제 출력을 확인하려면 Outlet을 같은 트리에 함께 렌더링해야 한다.
function renderCard(ui: React.ReactElement) {
  return render(
    <>
      {ui}
      <BottomSheetPortalOutlet />
    </>
  );
}

describe('CustomInputCard', () => {
  it('isVisible이 false이면 아무것도 렌더링하지 않는다', () => {
    const { queryByPlaceholderText } = renderCard(
      <CustomInputCard
        isVisible={false}
        placeholder="예: 목공, 사진 촬영"
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(queryByPlaceholderText('예: 목공, 사진 촬영')).toBeNull();
  });

  it('isVisible이 true이면 입력창과 추가하기 버튼을 렌더링한다', () => {
    const { getByPlaceholderText, getByText } = renderCard(
      <CustomInputCard
        isVisible
        placeholder="예: 목공, 사진 촬영"
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(getByPlaceholderText('예: 목공, 사진 촬영')).toBeTruthy();
    expect(getByText('추가하기')).toBeTruthy();
  });

  it('값이 비어있으면 추가하기 버튼이 비활성화된다', () => {
    const { getByText } = renderCard(
      <CustomInputCard isVisible onSubmit={jest.fn()} onClose={jest.fn()} />
    );

    expect(getByText('추가하기').parent?.parent?.props.accessibilityState?.disabled).toBe(true);
  });

  it('값을 입력하면 추가하기 버튼이 활성화된다', () => {
    const { getByText, getByPlaceholderText } = renderCard(
      <CustomInputCard
        isVisible
        placeholder="예: 목공, 사진 촬영"
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    fireEvent.changeText(getByPlaceholderText('예: 목공, 사진 촬영'), '독서');

    expect(getByText('추가하기').parent?.parent?.props.accessibilityState?.disabled).toBe(false);
  });

  it('추가하기 버튼을 누르면 입력한 텍스트로 onSubmit이 호출된다', () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = renderCard(
      <CustomInputCard
        isVisible
        placeholder="예: 목공, 사진 촬영"
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );

    fireEvent.changeText(getByPlaceholderText('예: 목공, 사진 촬영'), '독서');
    fireEvent.press(getByText('추가하기'));

    expect(onSubmit).toHaveBeenCalledWith('독서');
  });

  it('입력창에서 제출(엔터)해도 입력한 텍스트로 onSubmit이 호출된다', () => {
    const onSubmit = jest.fn();
    const { getByPlaceholderText } = renderCard(
      <CustomInputCard
        isVisible
        placeholder="예: 목공, 사진 촬영"
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );

    fireEvent.changeText(getByPlaceholderText('예: 목공, 사진 촬영'), '독서');
    fireEvent(getByPlaceholderText('예: 목공, 사진 촬영'), 'onSubmitEditing');

    expect(onSubmit).toHaveBeenCalledWith('독서');
  });

  it('카드 바깥(배경)을 누르면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByProps } = renderCard(
      <CustomInputCard isVisible onSubmit={jest.fn()} onClose={onClose} />
    );

    fireEvent.press(UNSAFE_getByProps({ className: 'flex-1' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('카드 내부를 눌러도 onClose를 호출하지 않는다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByProps } = renderCard(
      <CustomInputCard isVisible onSubmit={jest.fn()} onClose={onClose} />
    );

    fireEvent.press(UNSAFE_getByProps({ className: 'w-full' }), {
      stopPropagation: jest.fn(),
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('레이아웃이 잡히고 열림 애니메이션이 끝나면 onOpenAnimationComplete를 호출한다', async () => {
    const onOpenAnimationComplete = jest.fn();
    const { UNSAFE_getByProps } = renderCard(
      <CustomInputCard
        isVisible
        onSubmit={jest.fn()}
        onClose={jest.fn()}
        onOpenAnimationComplete={onOpenAnimationComplete}
      />
    );

    fireEvent(UNSAFE_getByProps({ className: 'w-full gap-6 rounded-2xl bg-white p-6' }), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 200 } },
    });

    await waitFor(() => expect(onOpenAnimationComplete).toHaveBeenCalledTimes(1));
  });

  it('isVisible이 true에서 false로 바뀌면 닫힘 애니메이션 후 렌더링을 멈춘다', async () => {
    const { queryByPlaceholderText, rerender } = renderCard(
      <CustomInputCard
        isVisible
        placeholder="예: 목공, 사진 촬영"
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(queryByPlaceholderText('예: 목공, 사진 촬영')).toBeTruthy();

    rerender(
      <>
        <CustomInputCard
          isVisible={false}
          placeholder="예: 목공, 사진 촬영"
          onSubmit={jest.fn()}
          onClose={jest.fn()}
        />
        <BottomSheetPortalOutlet />
      </>
    );

    await waitFor(() => expect(queryByPlaceholderText('예: 목공, 사진 촬영')).toBeNull(), {
      timeout: 8000,
    });
  }, 10000);

  it('타이핑해도 포털 스토어에 카드를 다시 등록하지 않는다(한글 자소분리 회귀 방지)', () => {
    // 텍스트를 CustomInputCard(부모) 쪽 상태로 관리하면, 타이핑할 때마다 포털
    // 스토어에 새 JSX가 재등록되면서 한 프레임 지연이 생기고, 그 지연 때문에
    // 안드로이드에서 한글 입력 조합 중인 TextInput이 리렌더되어 자소가 분리되어
    // 보이는 문제가 있었다. 텍스트는 CardBody 내부 로컬 상태로만 관리해야 하며,
    // 타이핑이 setSheet를 다시 호출시키지 않아야 한다.
    const setSheetSpy = jest.spyOn(useBottomSheetPortalStore.getState(), 'setSheet');
    const { getByPlaceholderText } = renderCard(
      <CustomInputCard
        isVisible
        placeholder="예: 목공, 사진 촬영"
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );
    setSheetSpy.mockClear();

    fireEvent.changeText(getByPlaceholderText('예: 목공, 사진 촬영'), '독');
    fireEvent.changeText(getByPlaceholderText('예: 목공, 사진 촬영'), '독서');

    expect(setSheetSpy).not.toHaveBeenCalled();
  });

  // 키보드 추적은 이제 react-native-keyboard-controller의 KeyboardStickyView가 맡는다
  // (네이티브 키보드 애니메이션과 같은 프레임으로 동작 — 라이브러리 자체 책임이라 여기서
  // keyboardDidShow/Hide 타이밍을 다시 검증하지 않는다). offset이 올바르게 전달되는지만 확인한다.
  it('카드를 KeyboardStickyView로 감싸 키보드 위 KEYBOARD_GAP만큼 오프셋을 준다', () => {
    const { UNSAFE_getByType } = renderCard(
      <CustomInputCard isVisible onSubmit={jest.fn()} onClose={jest.fn()} />
    );

    const stickyView = UNSAFE_getByType(KeyboardStickyView);
    expect(stickyView.props.offset).toEqual({ closed: 0, opened: -12 });
  });
});
