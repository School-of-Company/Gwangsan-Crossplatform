import { useState, useMemo, useCallback, useEffect } from 'react';

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
  // 직접 입력으로 추가했거나, 서버에서 받아온 선택값 중 기본 목록에 없는 항목.
  // 칩으로 계속 보이고 다시 선택 해제할 수 있어야 한다.
  const [customItems, setCustomItems] = useState<string[]>(() =>
    initialSelectedItems.filter((item) => !items.includes(item))
  );

  // 내 정보 수정 화면처럼 선택값이 마운트 이후 비동기로 도착하는 경우가 있다. 마운트
  // 시점의 값만 쓰면 기존 특기가 선택 표시되지 않고(#721), 직접 입력했던 특기는 칩으로
  // 나타나지도 않아 저장할 때 조용히 사라진다(#722). 외부 선택값이 바뀔 때마다 반영한다.
  // 값이 그대로면 이전 상태를 그대로 돌려줘서, items/initialSelectedItems가 매 렌더
  // 새 배열로 들어와도 리렌더가 반복되지 않는다.
  const externalSelected = JSON.stringify(initialSelectedItems);
  useEffect(() => {
    const next: string[] = JSON.parse(externalSelected);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedItems((prev) => (JSON.stringify(prev) === externalSelected ? prev : next));
    setCustomItems((prev) => {
      const added = next.filter((item) => !items.includes(item as T) && !prev.includes(item));
      return added.length > 0 ? [...prev, ...added] : prev;
    });
  }, [externalSelected, items]);

  const allItems = useMemo(() => [...items, ...customItems], [items, customItems]);

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
      if (selectedItems.includes(newItem)) return;

      setCustomItems((prev) =>
        prev.includes(newItem) || items.includes(newItem as T) ? prev : [...prev, newItem]
      );
      setSelectedItems([...selectedItems, newItem]);
      if (onSelect) {
        onSelect([...selectedItems, newItem] as T[]);
      }
    },
    [selectedItems, onSelect, items]
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
