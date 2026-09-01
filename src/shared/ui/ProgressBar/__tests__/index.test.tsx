import React from 'react';
import { View, PanResponder } from 'react-native';
import { act } from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react-native';
import ProgressBar from '../index';

// ProgressBar는 `sliderRef.current.measure(...)`로 실제 네이티브 레이아웃을 측정한다.
// jest-expo의 react-test-renderer 설정에서는 `createNodeMock`이 (버전 조합 문제로)
// 호출되지 않아 ref가 항상 null로 남는다. 대신 'react-native'의 View export를
// (모듈 전체를 교체하는 게 아니라, 이미 완전히 초기화된 실제 모듈 객체의 View
// 프로퍼티만) `measure`를 노출하는 forwardRef 래퍼로 재정의해 실제 ref 부착 경로를
// 검증한다. `{...RN}`처럼 모듈 전체를 스프레드하면 TurboModule의 지연 getter가
// 즉시 평가되며 깨지므로, 반드시 실제 모듈 객체를 그대로 유지한 채 View
// 프로퍼티만 교체한다.
const mockMeasureFn = jest.fn((callback: (x: number, y: number) => void) => callback(0, 0));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  const OriginalView = RN.View;

  const ViewWithMeasure = ReactActual.forwardRef((props: unknown, ref: unknown) => {
    ReactActual.useImperativeHandle(ref, () => ({
      measure: (callback: (x: number, y: number) => void) => mockMeasureFn(callback),
    }));
    return ReactActual.createElement(OriginalView, props);
  });

  Object.defineProperty(RN, 'View', {
    value: ViewWithMeasure,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  return RN;
});

// PanResponder.create()의 gesture-negotiation/native touch-history 배관을 거치지 않고
// onPanResponderGrant / onPanResponderMove 콜백을 직접 검증하기 위해 config를 캡처한다.
let capturedConfig: any = null;

const withCapturedPanResponderConfig = () =>
  jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => {
    capturedConfig = config;
    return { panHandlers: {}, getInteractionHandle: () => null };
  });

describe('ProgressBar', () => {
  it('"밝기" 라벨을 렌더링한다', () => {
    const { getByText } = render(<ProgressBar value={50} onChange={jest.fn()} />);
    expect(getByText('밝기')).toBeTruthy();
  });

  it('value prop이 바뀌어도 에러 없이 다시 렌더링된다', () => {
    const { rerender, getByText } = render(<ProgressBar value={20} onChange={jest.fn()} />);
    expect(() => rerender(<ProgressBar value={80} onChange={jest.fn()} />)).not.toThrow();
    expect(getByText('밝기')).toBeTruthy();
  });

  it('레이아웃 측정 후에도 에러 없이 렌더링된다', () => {
    const { UNSAFE_getAllByType } = render(<ProgressBar value={50} onChange={jest.fn()} />);
    const root = UNSAFE_getAllByType(View)[0];
    expect(() =>
      fireEvent(root, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 48 } },
      })
    ).not.toThrow();
  });

  describe('PanResponder 콜백 (config 캡처)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      capturedConfig = null;
      mockMeasureFn.mockClear();
    });

    it('onStartShouldSetPanResponder / onMoveShouldSetPanResponder는 항상 true를 반환한다', () => {
      withCapturedPanResponderConfig();
      render(<ProgressBar value={50} onChange={jest.fn()} />);

      expect(capturedConfig).toBeTruthy();
      expect(capturedConfig.onStartShouldSetPanResponder()).toBe(true);
      expect(capturedConfig.onMoveShouldSetPanResponder()).toBe(true);
    });

    it('onPanResponderGrant 시 measure로 얻은 위치를 바탕으로 onChange를 호출한다', () => {
      withCapturedPanResponderConfig();
      const onChange = jest.fn();
      render(<ProgressBar value={50} onChange={onChange} />);

      expect(capturedConfig).toBeTruthy();
      act(() => {
        capturedConfig.onPanResponderGrant({ nativeEvent: { pageX: 150 } });
      });

      expect(mockMeasureFn).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(expect.any(Number));
    });

    it('onPanResponderMove 시 measure로 얻은 위치를 바탕으로 onChange를 호출한다', () => {
      withCapturedPanResponderConfig();
      const onChange = jest.fn();
      render(<ProgressBar value={50} onChange={onChange} />);

      expect(capturedConfig).toBeTruthy();
      act(() => {
        capturedConfig.onPanResponderMove({ nativeEvent: { pageX: 80 } });
      });

      expect(mockMeasureFn).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(expect.any(Number));
    });

    it('드래그 중에는 엄지 위에 현재 값을 보여주는 말풍선을 표시하고, 손을 떼면 사라진다', () => {
      withCapturedPanResponderConfig();
      const { getByTestId, queryByTestId, UNSAFE_getAllByType } = render(
        <ProgressBar value={50} onChange={jest.fn()} />
      );

      const root = UNSAFE_getAllByType(View)[0];
      fireEvent(root, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 48 } },
      });

      expect(queryByTestId('progress-bar-value-tooltip')).toBeNull();

      act(() => {
        capturedConfig.onPanResponderGrant({ nativeEvent: { pageX: 150 } });
      });

      expect(getByTestId('progress-bar-value-tooltip')).toHaveTextContent('50');

      act(() => {
        capturedConfig.onPanResponderRelease();
      });

      expect(queryByTestId('progress-bar-value-tooltip')).toBeNull();
    });

    it('드래그가 다른 제스처에 가로채여 종료(Terminate)되어도 말풍선이 사라진다', () => {
      withCapturedPanResponderConfig();
      const { queryByTestId, UNSAFE_getAllByType } = render(
        <ProgressBar value={50} onChange={jest.fn()} />
      );

      const root = UNSAFE_getAllByType(View)[0];
      fireEvent(root, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 48 } },
      });

      act(() => {
        capturedConfig.onPanResponderGrant({ nativeEvent: { pageX: 150 } });
      });
      expect(queryByTestId('progress-bar-value-tooltip')).toBeTruthy();

      act(() => {
        capturedConfig.onPanResponderTerminate();
      });

      expect(queryByTestId('progress-bar-value-tooltip')).toBeNull();
    });

    it('언마운트되어 ref가 정리된 후에는 onPanResponderGrant/Move가 measure를 호출하지 않는다', () => {
      withCapturedPanResponderConfig();
      const onChange = jest.fn();
      const { unmount } = render(<ProgressBar value={50} onChange={onChange} />);

      expect(capturedConfig).toBeTruthy();
      act(() => {
        unmount();
      });

      // 언마운트 후에는 React가 ref.current를 null로 정리하므로
      // `if (sliderRef.current)` 분기가 false로 평가되어 아무 일도 일어나지 않는다.
      expect(() =>
        act(() => {
          capturedConfig.onPanResponderGrant({ nativeEvent: { pageX: 150 } });
          capturedConfig.onPanResponderMove({ nativeEvent: { pageX: 80 } });
        })
      ).not.toThrow();

      expect(mockMeasureFn).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it('스냅샷 - 기본값', () => {
    const { toJSON } = render(<ProgressBar value={0} onChange={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - 커스텀 min/max/value', () => {
    const { toJSON } = render(
      <ProgressBar value={5} min={0} max={10} step={1} onChange={jest.fn()} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
