import { act, render } from '@testing-library/react-native';
import { useToastQueueStore } from '~/shared/lib/toastQueue';
import { ToastStack } from '../ToastStack';

beforeEach(() => {
  useToastQueueStore.setState({ toasts: [] });
});

describe('ToastStack', () => {
  it('큐가 비어있으면 아무 토스트도 렌더링하지 않는다', () => {
    const { queryAllByTestId } = render(<ToastStack />);

    expect(queryAllByTestId('gwangsan-toast')).toHaveLength(0);
  });

  it('큐에 쌓인 순서대로 모든 토스트를 렌더링한다', () => {
    useToastQueueStore.getState().push({ type: 'success', text1: '첫번째' });
    useToastQueueStore.getState().push({ type: 'info', text1: '두번째' });

    const { getAllByTestId, getByText } = render(<ToastStack />);

    expect(getAllByTestId('gwangsan-toast')).toHaveLength(2);
    expect(getByText('첫번째')).toBeTruthy();
    expect(getByText('두번째')).toBeTruthy();
  });

  it('store가 갱신되면 새로 추가된 토스트가 함께 렌더링된다', () => {
    const { getAllByTestId, queryAllByTestId } = render(<ToastStack />);
    expect(queryAllByTestId('gwangsan-toast')).toHaveLength(0);

    act(() => {
      useToastQueueStore.getState().push({ type: 'error', text1: '실패' });
    });

    expect(getAllByTestId('gwangsan-toast')).toHaveLength(1);
  });
});
