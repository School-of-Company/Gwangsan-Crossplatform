import { act, renderHook } from '@testing-library/react-native';
import { useCustomInput } from '../useCustomInput';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useCustomInput', () => {
  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useCustomInput());

    expect(result.current.isAddingCustomItem).toBe(false);
    expect(result.current.customItemText).toBe('');
    expect(result.current.customInputRef).toBeDefined();
  });

  describe('activateCustomInput', () => {
    it('isAddingCustomItem을 true로 설정한다', () => {
      const { result } = renderHook(() => useCustomInput());

      act(() => {
        result.current.activateCustomInput();
      });

      expect(result.current.isAddingCustomItem).toBe(true);
    });

    it('100ms 후 focus를 시도한다', () => {
      const { result } = renderHook(() => useCustomInput());

      act(() => {
        result.current.activateCustomInput();
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });
    });
  });

  describe('deactivateCustomInput', () => {
    it('isAddingCustomItem을 false로, customItemText를 빈 문자열로 설정한다', () => {
      const { result } = renderHook(() => useCustomInput());

      act(() => {
        result.current.activateCustomInput();
        result.current.updateCustomItemText('some text');
      });

      act(() => {
        result.current.deactivateCustomInput();
      });

      expect(result.current.isAddingCustomItem).toBe(false);
      expect(result.current.customItemText).toBe('');
    });
  });

  describe('updateCustomItemText', () => {
    it('입력 텍스트를 업데이트한다', () => {
      const { result } = renderHook(() => useCustomInput());

      act(() => {
        result.current.updateCustomItemText('새로운 항목');
      });

      expect(result.current.customItemText).toBe('새로운 항목');
    });
  });

  describe('handleSubmitCustomItem', () => {
    it('텍스트가 있으면 onSubmit을 호출하고 상태를 초기화한다', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() => useCustomInput({ onSubmit }));

      act(() => {
        result.current.updateCustomItemText('새 항목');
      });
      act(() => {
        result.current.handleSubmitCustomItem();
      });

      expect(onSubmit).toHaveBeenCalledWith('새 항목');
      expect(result.current.customItemText).toBe('');
      expect(result.current.isAddingCustomItem).toBe(false);
    });

    it('앞뒤 공백을 제거해서 onSubmit에 전달한다', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() => useCustomInput({ onSubmit }));

      act(() => {
        result.current.updateCustomItemText('  항목  ');
      });
      act(() => {
        result.current.handleSubmitCustomItem();
      });

      expect(onSubmit).toHaveBeenCalledWith('항목');
    });

    it('빈 문자열(공백만)이면 onSubmit을 호출하지 않는다', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() => useCustomInput({ onSubmit }));

      act(() => {
        result.current.updateCustomItemText('   ');
        result.current.handleSubmitCustomItem();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('텍스트가 비어 있으면 아무것도 하지 않는다', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() => useCustomInput({ onSubmit }));

      act(() => {
        result.current.handleSubmitCustomItem();
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.isAddingCustomItem).toBe(false);
    });

    it('onSubmit이 없어도 에러 없이 동작한다', () => {
      const { result } = renderHook(() => useCustomInput());

      act(() => {
        result.current.updateCustomItemText('항목');
      });
      act(() => {
        result.current.handleSubmitCustomItem();
      });

      expect(result.current.customItemText).toBe('');
    });
  });
});
