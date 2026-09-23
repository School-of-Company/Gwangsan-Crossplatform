import { useState, useMemo, useCallback } from 'react';

interface UseMultiSelectProps<T extends string> {
  items: T[];
  initialSelectedItems?: T[];
  onSelect?: (items: T[]) => void;
}

export function useMultiSelect<T extends string>({
  items,
  initialSelectedItems = [],
  onSelect,
}: UseMultiSelectProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelectedItems);
  // 이전에 직접 입력으로 추가했던 항목처럼, 초기 선택값 중 기본 목록에 없는 항목도
  // 칩으로 계속 보이고 다시 선택 해제할 수 있어야 한다.
  const [allItems, setAllItems] = useState<string[]>(() => [
    ...items,
    ...initialSelectedItems.filter((item) => !items.includes(item)),
  ]);

  const handleSelect = useCallback(
    (item: string) => {
      let newSelectedItems: string[];

      if (selectedItems.includes(item)) {
        newSelectedItems = selectedItems.filter((selectedItem) => selectedItem !== item);
      } else {
        newSelectedItems = [...selectedItems, item];
      }

      setSelectedItems(newSelectedItems);
      if (onSelect) {
        onSelect(newSelectedItems as T[]);
      }
    },
    [selectedItems, onSelect]
  );

  const addCustomItem = useCallback(
    (newItem: string) => {
      setAllItems((prev) => [...prev, newItem]);
      setSelectedItems((prev) => [...prev, newItem]);
      if (onSelect) {
        onSelect([...selectedItems, newItem] as T[]);
      }
    },
    [selectedItems, onSelect]
  );

  const displayText = useMemo(() => {
    return selectedItems.length > 0 ? selectedItems.join(', ') : undefined;
  }, [selectedItems]);

  const isSelected = useCallback(
    (item: string) => {
      return selectedItems.includes(item);
    },
    [selectedItems]
  );

  return {
    selectedItems,
    allItems,
    displayText,
    handleSelect,
    addCustomItem,
    isSelected,
  };
}
