import { act, renderHook } from '@testing-library/react-native';
import { useMultiSelect } from '../useMultiSelect';

const ITEMS = ['운동', '독서', '요리', '여행'];

describe('useMultiSelect', () => {
  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useMultiSelect({ items: ITEMS }));

    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.allItems).toEqual(ITEMS);
    expect(result.current.displayText).toBeUndefined();
  });

  it('initialSelectedItems로 초기화된다', () => {
    const { result } = renderHook(() =>
      useMultiSelect({ items: ITEMS, initialSelectedItems: ['운동', '독서'] })
    );

    expect(result.current.selectedItems).toEqual(['운동', '독서']);
  });

  describe('handleSelect', () => {
    it('선택하지 않은 항목을 선택하면 selectedItems에 추가된다', () => {
      const { result } = renderHook(() => useMultiSelect({ items: ITEMS }));

      act(() => {
        result.current.handleSelect('운동');
      });

      expect(result.current.selectedItems).toContain('운동');
    });

    it('이미 선택된 항목을 선택하면 selectedItems에서 제거된다', () => {
      const { result } = renderHook(() =>
        useMultiSelect({ items: ITEMS, initialSelectedItems: ['운동'] })
      );

      act(() => {
        result.current.handleSelect('운동');
      });

      expect(result.current.selectedItems).not.toContain('운동');
    });

    it('onSelect 콜백이 호출된다', () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() => useMultiSelect({ items: ITEMS, onSelect }));

      act(() => {
        result.current.handleSelect('요리');
      });

      expect(onSelect).toHaveBeenCalledWith(['요리']);
    });

    it('onSelect가 없어도 에러 없이 동작한다', () => {
      const { result } = renderHook(() => useMultiSelect({ items: ITEMS }));

      expect(() => {
        act(() => {
          result.current.handleSelect('독서');
        });
      }).not.toThrow();
    });

    it('여러 항목을 선택할 수 있다', () => {
      const { result } = renderHook(() => useMultiSelect({ items: ITEMS }));

      act(() => {
        result.current.handleSelect('운동');
      });
      act(() => {
        result.current.handleSelect('독서');
      });

      expect(result.current.selectedItems).toContain('운동');
      expect(result.current.selectedItems).toContain('독서');
    });
  });

  describe('addCustomItem', () => {
    it('새 항목을 allItems와 selectedItems에 추가한다', () => {
      const { result } = renderHook(() => useMultiSelect({ items: ITEMS }));

      act(() => {
        result.current.addCustomItem('댄스');
      });

      expect(result.current.allItems).toContain('댄스');
      expect(result.current.selectedItems).toContain('댄스');
    });

    it('onSelect 콜백에 새 항목이 포함된 배열을 전달한다', () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelect({ items: ITEMS, initialSelectedItems: ['운동'], onSelect })
      );

      act(() => {
        result.current.addCustomItem('댄스');
      });

      expect(onSelect).toHaveBeenCalledWith(['운동', '댄스']);
    });
  });

  describe('displayText', () => {
    it('선택된 항목이 없으면 undefined이다', () => {
      const { result } = renderHook(() => useMultiSelect({ items: ITEMS }));

      expect(result.current.displayText).toBeUndefined();
    });

    it('선택된 항목을 쉼표로 연결한 문자열을 반환한다', () => {
      const { result } = renderHook(() =>
        useMultiSelect({ items: ITEMS, initialSelectedItems: ['운동', '독서'] })
      );

      expect(result.current.displayText).toBe('운동, 독서');
    });
  });

  describe('isSelected', () => {
    it('선택된 항목에 대해 true를 반환한다', () => {
      const { result } = renderHook(() =>
        useMultiSelect({ items: ITEMS, initialSelectedItems: ['운동'] })
      );

      expect(result.current.isSelected('운동')).toBe(true);
    });

    it('선택되지 않은 항목에 대해 false를 반환한다', () => {
      const { result } = renderHook(() => useMultiSelect({ items: ITEMS }));

      expect(result.current.isSelected('운동')).toBe(false);
    });
  });
});
