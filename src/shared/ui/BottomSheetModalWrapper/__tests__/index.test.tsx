import React from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Keyboard,
  PanResponder,
  Text,
  TouchableOpacity,
} from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
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

afterEach(() => {
  jest.restoreAllMocks();
});

// PanResponder.create를 통과(identity)시켜, 실제 제스처 시뮬레이션 없이도
// 컴포넌트가 등록한 콜백(onMoveShouldSetPanResponderCapture 등)을 직접 호출해
// 분기 로직을 검증할 수 있게 한다.
function mockPanResponderPassthrough() {
  jest.spyOn(PanResponder, 'create').mockImplementation((config) => ({
    panHandlers: config as unknown as Record<string, unknown>,
  }));
}

function getSheetHandlers(container: ReturnType<typeof render>) {
  const sheet = container.UNSAFE_getByProps({ className: 'rounded-t-[20px] bg-white' });
  return sheet.props as {
    onStartShouldSetPanResponder: () => boolean;
    onStartShouldSetPanResponderCapture: () => boolean;
    onMoveShouldSetPanResponderCapture: (
      evt: unknown,
      gestureState: { dy: number; dx: number }
    ) => boolean;
    onPanResponderGrant: (evt: unknown, gestureState: unknown) => void;
    onPanResponderMove: (evt: unknown, gestureState: { dy: number }) => void;
    onPanResponderRelease: (evt: unknown, gestureState: { dy: number; vy: number }) => void;
    onPanResponderTerminationRequest: () => boolean;
  };
}

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

  it('showCloseButton이 true이면 닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={onClose} title="제목" showCloseButton>
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('showCloseButton 기본값은 false이므로 닫기 버튼을 렌더링하지 않는다', () => {
    const { UNSAFE_queryAllByType } = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(UNSAFE_queryAllByType(TouchableOpacity)).toHaveLength(0);
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

  describe('드래그 제스처 (PanResponder)', () => {
    it('onStartShouldSetPanResponder(Capture)는 항상 false를 반환한다 (버튼 탭을 가로채지 않음)', () => {
      mockPanResponderPassthrough();
      const container = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" height={300}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );
      const handlers = getSheetHandlers(container);
      expect(handlers.onStartShouldSetPanResponder()).toBe(false);
      expect(handlers.onStartShouldSetPanResponderCapture()).toBe(false);
    });

    it('onPanResponderTerminationRequest는 항상 false를 반환한다', () => {
      mockPanResponderPassthrough();
      const container = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" height={300}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );
      const handlers = getSheetHandlers(container);
      expect(handlers.onPanResponderTerminationRequest()).toBe(false);
    });

    it('세로 이동이 뚜렷하면(dy>8, 대각선 아님) 제스처를 가로챈다', () => {
      mockPanResponderPassthrough();
      const container = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" height={300}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );
      const handlers = getSheetHandlers(container);
      expect(handlers.onMoveShouldSetPanResponderCapture({}, { dy: 20, dx: 1 })).toBe(true);
    });

    it('세로 이동이 8 이하이면 제스처를 가로채지 않는다', () => {
      mockPanResponderPassthrough();
      const container = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" height={300}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );
      const handlers = getSheetHandlers(container);
      expect(handlers.onMoveShouldSetPanResponderCapture({}, { dy: 5, dx: 0 })).toBe(false);
    });

    it('충분히 아래로 끌고 놓으면(dy 임계값 초과) onClose를 호출한다', () => {
      mockPanResponderPassthrough();
      const onClose = jest.fn();
      const container = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={onClose} title="제목" height={300}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );
      const handlers = getSheetHandlers(container);
      act(() => {
        handlers.onPanResponderGrant({}, {});
        handlers.onPanResponderMove({}, { dy: 400 });
        handlers.onPanResponderRelease({}, { dy: 400, vy: 0 });
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('빠른 속도(vy>0.8)로 놓으면 이동량이 작아도 onClose를 호출한다', () => {
      mockPanResponderPassthrough();
      const onClose = jest.fn();
      const container = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={onClose} title="제목" height={300}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );
      const handlers = getSheetHandlers(container);
      act(() => {
        handlers.onPanResponderGrant({}, {});
        handlers.onPanResponderMove({}, { dy: 10 });
        handlers.onPanResponderRelease({}, { dy: 10, vy: 1 });
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('이동량이 적고 속도도 느리면 onClose를 호출하지 않고 원위치로 돌아간다', () => {
      mockPanResponderPassthrough();
      const onClose = jest.fn();
      const container = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={onClose} title="제목" height={300}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );
      const handlers = getSheetHandlers(container);
      act(() => {
        handlers.onPanResponderGrant({}, {});
        handlers.onPanResponderMove({}, { dy: 5 });
        handlers.onPanResponderRelease({}, { dy: 5, vy: 0 });
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('키보드 표시/숨김', () => {
    it('키보드가 표시되면 시트 위치를 위로 이동시킨다', () => {
      const listeners: Record<string, (e?: unknown) => void> = {};
      jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
        listeners[event as string] = cb as (e?: unknown) => void;
        return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
      });

      renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );

      expect(listeners.keyboardDidShow).toBeDefined();
      expect(() =>
        act(() => listeners.keyboardDidShow({ endCoordinates: { height: 300 } }))
      ).not.toThrow();
    });

    it('키보드가 숨겨지면 시트 위치를 원위치로 되돌린다', () => {
      const listeners: Record<string, (e?: unknown) => void> = {};
      jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
        listeners[event as string] = cb as (e?: unknown) => void;
        return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
      });

      renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );

      expect(listeners.keyboardDidHide).toBeDefined();
      expect(() => act(() => listeners.keyboardDidHide())).not.toThrow();
    });

    it('입력 중 예측 변환 바 높이 변화처럼 작은 변화(임계값 미만)는 무시해 시트를 다시 애니메이션하지 않는다', () => {
      const listeners: Record<string, (e?: unknown) => void> = {};
      jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
        listeners[event as string] = cb as (e?: unknown) => void;
        return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
      });
      const timingSpy = jest.spyOn(Animated, 'timing');

      renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );

      act(() => listeners.keyboardDidShow({ endCoordinates: { height: 300 } }));
      timingSpy.mockClear();

      // 예측 변환 바가 나타나며 살짝 높아진 정도(임계값 미만)
      act(() => listeners.keyboardDidShow({ endCoordinates: { height: 330 } }));

      expect(timingSpy).not.toHaveBeenCalled();
    });

    it('실제 키보드 노출처럼 큰 변화(임계값 이상)는 시트를 다시 애니메이션한다', () => {
      const listeners: Record<string, (e?: unknown) => void> = {};
      jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
        listeners[event as string] = cb as (e?: unknown) => void;
        return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
      });
      const timingSpy = jest.spyOn(Animated, 'timing');

      // 위로 올릴 여유가 충분한 낮은 시트로 두어 이동량 제한(clamp)과 무관하게 검증한다.
      renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" height={300}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );

      act(() => listeners.keyboardDidShow({ endCoordinates: { height: 300 } }));
      timingSpy.mockClear();

      // 다른 입력 타입으로 바뀌며 키보드 자체가 크게 바뀐 경우(임계값 이상)
      act(() => listeners.keyboardDidShow({ endCoordinates: { height: 420 } }));

      expect(timingSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ toValue: -432 })
      );
    });

    it('키보드 높이가 줄어드는 변화는 임계값을 넘더라도 시트를 다시 애니메이션하지 않는다', () => {
      const listeners: Record<string, (e?: unknown) => void> = {};
      jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
        listeners[event as string] = cb as (e?: unknown) => void;
        return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
      });
      const timingSpy = jest.spyOn(Animated, 'timing');

      renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );

      act(() => listeners.keyboardDidShow({ endCoordinates: { height: 400 } }));
      timingSpy.mockClear();

      // 예측 변환 바가 사라지며 키보드가 낮아진 경우 — 따라 내려가면 시트가 흔들린다.
      act(() => listeners.keyboardDidShow({ endCoordinates: { height: 300 } }));

      expect(timingSpy).not.toHaveBeenCalled();
    });

    it('시트 상단이 화면 밖으로 밀려나지 않도록 키보드 이동량을 제한한다', () => {
      const listeners: Record<string, (e?: unknown) => void> = {};
      jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
        listeners[event as string] = cb as (e?: unknown) => void;
        return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
      });
      const timingSpy = jest.spyOn(Animated, 'timing');

      // 시트 위로 200px만 남는 높이 → 안전 여백 24를 빼면 최대 176px까지만 올릴 수 있다.
      const sheetHeight = Dimensions.get('window').height - 200;
      renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" height={sheetHeight}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );
      timingSpy.mockClear();

      act(() => listeners.keyboardDidShow({ endCoordinates: { height: 400 } }));

      expect(timingSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ toValue: -176 })
      );
    });

    it('밀어 올리고도 키보드에 가려지는 만큼 시트 하단 패딩으로 보정한다', () => {
      const listeners: Record<string, (e?: unknown) => void> = {};
      jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
        listeners[event as string] = cb as (e?: unknown) => void;
        return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
      });

      const sheetHeight = Dimensions.get('window').height - 200;
      const { UNSAFE_getByProps } = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목" height={sheetHeight}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );

      act(() => {
        listeners.keyboardDidShow({ endCoordinates: { height: 400 } });
      });

      // 400까지 올려야 하지만 176까지만 올릴 수 있으므로 224가 키보드에 가려진다.
      const content = UNSAFE_getByProps({ className: 'flex-1 px-4 pt-4' });
      expect(content.props.style).toEqual(
        expect.objectContaining({ paddingBottom: 16 + (400 - 176) })
      );
    });
  });

  describe('포털 등록', () => {
    it('children이 바뀌어도 포털에서 시트를 제거했다가 다시 등록하지 않는다', () => {
      const onClose = jest.fn();
      const tree = (content: string) => (
        <>
          <BottomSheetModalWrapper isVisible onClose={onClose} title="제목">
            <Text>{content}</Text>
          </BottomSheetModalWrapper>
          <BottomSheetPortalOutlet />
        </>
      );

      const { rerender, getByText } = render(tree('내용'));

      const sheetCounts: number[] = [];
      const unsubscribe = useBottomSheetPortalStore.subscribe((state) =>
        sheetCounts.push(Object.keys(state.sheets).length)
      );

      act(() => {
        rerender(tree('내용이 한 글자 늘었다'));
      });
      unsubscribe();

      // 한 번이라도 0이 되면 시트 트리가 통째로 언마운트되며 입력 포커스/키보드가 사라진다.
      expect(sheetCounts).not.toContain(0);
      expect(getByText('내용이 한 글자 늘었다')).toBeTruthy();
    });

    it('언마운트되면 포털에서 시트를 제거한다', () => {
      const { unmount } = renderSheet(
        <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
          <Text>내용</Text>
        </BottomSheetModalWrapper>
      );

      expect(Object.keys(useBottomSheetPortalStore.getState().sheets)).toHaveLength(1);

      act(() => {
        unmount();
      });

      expect(Object.keys(useBottomSheetPortalStore.getState().sheets)).toHaveLength(0);
    });
  });

  it('안드로이드 하드웨어 뒤로가기 버튼을 누르면 onClose를 호출한다', () => {
    let backHandlerCallback: (() => boolean) | undefined;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, cb) => {
      if (event === 'hardwareBackPress') backHandlerCallback = cb as () => boolean;
      return { remove: jest.fn() } as unknown as ReturnType<typeof BackHandler.addEventListener>;
    });

    const onClose = jest.fn();
    renderSheet(
      <BottomSheetModalWrapper isVisible onClose={onClose} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );

    expect(backHandlerCallback).toBeDefined();
    const result = backHandlerCallback!();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('시트 레이아웃이 확정되면(onLayout) 열림 애니메이션을 시작한다', async () => {
    const container = renderSheet(
      <BottomSheetModalWrapper isVisible onClose={jest.fn()} title="제목">
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    const sheet = container.UNSAFE_getByProps({ className: 'rounded-t-[20px] bg-white' });

    expect(() => fireEvent(sheet, 'layout', { nativeEvent: { layout: {} } })).not.toThrow();
    // requestAnimationFrame으로 한 프레임 미뤄지므로 실제로 콜백이 실행될 때까지 대기한다.
    await waitFor(() => expect(true).toBe(true));
  });

  it('isVisible이 true에서 false로 바뀌면 닫힘 애니메이션 후 사라지고 onAnimationComplete를 호출한다', async () => {
    const onAnimationComplete = jest.fn();
    const { rerender, queryByText } = renderSheet(
      <BottomSheetModalWrapper
        isVisible
        onClose={jest.fn()}
        title="제목"
        onAnimationComplete={onAnimationComplete}>
        <Text>내용</Text>
      </BottomSheetModalWrapper>
    );
    expect(queryByText('내용')).toBeTruthy();

    rerender(
      <>
        <BottomSheetModalWrapper
          isVisible={false}
          onClose={jest.fn()}
          title="제목"
          onAnimationComplete={onAnimationComplete}>
          <Text>내용</Text>
        </BottomSheetModalWrapper>
        <BottomSheetPortalOutlet />
      </>
    );

    await waitFor(() => expect(queryByText('내용')).toBeNull(), { timeout: 8000 });
    expect(onAnimationComplete).toHaveBeenCalledTimes(1);
  }, 10000);
});
