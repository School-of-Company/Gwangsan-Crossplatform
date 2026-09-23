import { act, renderHook } from '@testing-library/react-native';
import { useCustomInput } from '../useCustomInput';

describe('useCustomInput', () => {
  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useCustomInput());

    expect(result.current.isAddingCustomItem).toBe(false);
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

    it('스스로 focus를 시도하지 않는다(바텀시트 오픈 애니메이션이 끝난 뒤 focusInput으로 호출해야 한다)', () => {
      const { result } = renderHook(() => useCustomInput());
      const mockFocus = jest.fn();
      (result.current.customInputRef as unknown as { current: { focus: jest.Mock } }).current = {
        focus: mockFocus,
      };

      act(() => {
        result.current.activateCustomInput();
      });

      expect(mockFocus).not.toHaveBeenCalled();
    });
  });

  describe('focusInput', () => {
    it('현재 입력창 ref에 focus를 호출한다', () => {
      const { result } = renderHook(() => useCustomInput());
      const mockFocus = jest.fn();
      (result.current.customInputRef as unknown as { current: { focus: jest.Mock } }).current = {
        focus: mockFocus,
      };

      act(() => {
        result.current.focusInput();
      });

      expect(mockFocus).toHaveBeenCalledTimes(1);
    });

    it('ref가 아직 비어있어도 에러 없이 동작한다', () => {
      const { result } = renderHook(() => useCustomInput());

      expect(() => {
        act(() => {
          result.current.focusInput();
        });
      }).not.toThrow();
    });
  });

  describe('deactivateCustomInput', () => {
    it('isAddingCustomItem을 false로 설정한다', () => {
      const { result } = renderHook(() => useCustomInput());

      act(() => {
        result.current.activateCustomInput();
      });

      act(() => {
        result.current.deactivateCustomInput();
      });

      expect(result.current.isAddingCustomItem).toBe(false);
    });
  });

  describe('handleSubmitCustomItem', () => {
    it('텍스트가 있으면 onSubmit을 호출하고 카드를 닫는다', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() => useCustomInput({ onSubmit }));

      act(() => {
        result.current.activateCustomInput();
      });
      act(() => {
        result.current.handleSubmitCustomItem('새 항목');
      });

      expect(onSubmit).toHaveBeenCalledWith('새 항목');
      expect(result.current.isAddingCustomItem).toBe(false);
    });

    it('앞뒤 공백을 제거해서 onSubmit에 전달한다', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() => useCustomInput({ onSubmit }));

      act(() => {
        result.current.handleSubmitCustomItem('  항목  ');
      });

      expect(onSubmit).toHaveBeenCalledWith('항목');
    });

    it('빈 문자열(공백만)이면 onSubmit을 호출하지 않는다', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() => useCustomInput({ onSubmit }));

      act(() => {
        result.current.handleSubmitCustomItem('   ');
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('onSubmit이 없어도 에러 없이 동작한다', () => {
      const { result } = renderHook(() => useCustomInput());

      expect(() => {
        act(() => {
          result.current.handleSubmitCustomItem('항목');
        });
      }).not.toThrow();
    });
  });
});
