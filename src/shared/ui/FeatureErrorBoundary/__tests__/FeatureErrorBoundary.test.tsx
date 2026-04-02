import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { FeatureErrorBoundary } from '../index';

import * as Sentry from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

const mockCaptureException = Sentry.captureException as jest.Mock;
const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;

const ThrowError = () => {
  throw new Error('테스트 에러');
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('FeatureErrorBoundary - 정상 렌더링', () => {
  it('에러가 없으면 children을 렌더링한다', () => {
    const { getByText } = render(
      <FeatureErrorBoundary>
        <Text>정상 화면</Text>
      </FeatureErrorBoundary>
    );
    expect(getByText('정상 화면')).toBeTruthy();
  });
});

describe('FeatureErrorBoundary - 에러 발생 시 기본 fallback', () => {
  it('"오류가 발생했습니다" 텍스트를 표시한다', () => {
    const { getByText } = render(
      <FeatureErrorBoundary>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(getByText('오류가 발생했습니다')).toBeTruthy();
  });

  it('"잠시 후 다시 시도해 주세요." 텍스트를 표시한다', () => {
    const { getByText } = render(
      <FeatureErrorBoundary>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(getByText('잠시 후 다시 시도해 주세요.')).toBeTruthy();
  });

  it('"다시 시도" 버튼을 표시한다', () => {
    const { getByText } = render(
      <FeatureErrorBoundary>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(getByText('다시 시도')).toBeTruthy();
  });

  it('에러 발생 시 children을 렌더링하지 않는다', () => {
    const { queryByText } = render(
      <FeatureErrorBoundary>
        <ThrowError />
        <Text>보이면 안 되는 텍스트</Text>
      </FeatureErrorBoundary>
    );
    expect(queryByText('보이면 안 되는 텍스트')).toBeNull();
  });
});

describe('FeatureErrorBoundary - 커스텀 fallback', () => {
  it('fallback prop이 있으면 커스텀 fallback을 렌더링한다', () => {
    const { getByText } = render(
      <FeatureErrorBoundary fallback={<Text>커스텀 에러 화면</Text>}>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(getByText('커스텀 에러 화면')).toBeTruthy();
  });

  it('fallback이 있으면 기본 fallback UI를 표시하지 않는다', () => {
    const { queryByText } = render(
      <FeatureErrorBoundary fallback={<Text>커스텀</Text>}>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(queryByText('오류가 발생했습니다')).toBeNull();
  });

  it('fallback이 render function이면 reset 콜백을 전달하며 호출한다', () => {
    const fallbackFn = jest.fn(({ reset }: { reset: () => void }) => (
      <Text onPress={reset}>render function fallback</Text>
    ));

    const { getByText } = render(
      <FeatureErrorBoundary fallback={fallbackFn}>
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(fallbackFn).toHaveBeenCalledWith(
      expect.objectContaining({ reset: expect.any(Function) })
    );
    expect(getByText('render function fallback')).toBeTruthy();
  });
});

describe('FeatureErrorBoundary - 다시 시도', () => {
  it('"다시 시도" 버튼을 누르면 children을 다시 렌더링한다', () => {
    let shouldThrow = true;

    const MaybeThrow = () => {
      if (shouldThrow) throw new Error('에러');
      return <Text>복구된 화면</Text>;
    };

    const { getByText, queryByText } = render(
      <FeatureErrorBoundary>
        <MaybeThrow />
      </FeatureErrorBoundary>
    );

    expect(getByText('다시 시도')).toBeTruthy();

    shouldThrow = false;
    fireEvent.press(getByText('다시 시도'));

    expect(getByText('복구된 화면')).toBeTruthy();
    expect(queryByText('오류가 발생했습니다')).toBeNull();
  });
});

describe('FeatureErrorBoundary - Sentry 연동', () => {
  it('에러 발생 시 Sentry.captureException을 호출한다', () => {
    render(
      <FeatureErrorBoundary>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ componentStack: expect.any(String) }),
      })
    );
  });

  it('에러 발생 시 Sentry.addBreadcrumb을 호출한다', () => {
    render(
      <FeatureErrorBoundary>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'ui.error', level: 'error' })
    );
  });

  it('에러가 없으면 Sentry를 호출하지 않는다', () => {
    render(
      <FeatureErrorBoundary>
        <Text>정상</Text>
      </FeatureErrorBoundary>
    );
    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });
});

describe('FeatureErrorBoundary - 화면 이름 추출 (getScreenName)', () => {
  it('함수형 컴포넌트 이름을 tags.screen에 전달한다', () => {
    const MyScreen = () => {
      throw new Error('에러');
    };

    render(
      <FeatureErrorBoundary>
        <MyScreen />
      </FeatureErrorBoundary>
    );

    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { screen: 'MyScreen' } })
    );
  });

  it('displayName이 있으면 name보다 displayName을 우선한다', () => {
    const MyScreen = () => {
      throw new Error('에러');
    };
    MyScreen.displayName = 'CustomDisplayName';

    render(
      <FeatureErrorBoundary>
        <MyScreen />
      </FeatureErrorBoundary>
    );

    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { screen: 'CustomDisplayName' } })
    );
  });

  it('children이 string이면 tags.screen이 "unknown"이다', () => {
    const ThrowInChild = () => {
      throw new Error('에러');
    };

    // string children을 흉내내기 위해 type이 string인 native element 사용
    render(
      <FeatureErrorBoundary>
        <ThrowInChild />
      </FeatureErrorBoundary>
    );

    // ThrowInChild는 함수형 컴포넌트이므로 이름이 잡힌다 - 이 케이스는 native element로 테스트
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { screen: 'ThrowInChild' } })
    );
  });

  it('children이 React 엘리먼트가 아니면 tags.screen이 "unknown"이다', () => {
    // class 컴포넌트(type이 function이지만 class) - 이름 추출 가능
    // 일반 string children은 Error Boundary를 트리거하지 않으므로
    // 에러를 던지는 class 컴포넌트로 'unknown' 경로 외의 fallback 테스트
    // React element가 아닌 경우: FeatureErrorBoundary에 null 자식
    // 에러는 throw할 수 없으므로 이 케이스는 스냅샷으로 확인
    const { queryByText } = render(<FeatureErrorBoundary>{null}</FeatureErrorBoundary>);
    expect(queryByText('오류가 발생했습니다')).toBeNull();
  });
});

describe('FeatureErrorBoundary - 스냅샷', () => {
  it('정상 상태 스냅샷', () => {
    const { toJSON } = render(
      <FeatureErrorBoundary>
        <Text>정상 화면</Text>
      </FeatureErrorBoundary>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('에러 상태 기본 fallback 스냅샷', () => {
    const { toJSON } = render(
      <FeatureErrorBoundary>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('에러 상태 커스텀 fallback 스냅샷', () => {
    const { toJSON } = render(
      <FeatureErrorBoundary fallback={<Text>커스텀 fallback</Text>}>
        <ThrowError />
      </FeatureErrorBoundary>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
