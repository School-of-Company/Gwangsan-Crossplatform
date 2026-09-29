import { useState, useMemo, useCallback } from 'react';

interface UseMultiSelectProps<T extends string> {
  items: T[];
  selectedItems?: T[];
  onSelect?: (items: T[]) => void;
}

const EMPTY_ITEMS: readonly string[] = [];

const isSameItems = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

const withExtraItems = (base: readonly string[], extra: readonly string[]) => [
  ...base,
  ...extra.filter((item) => !base.includes(item)),
];

export function useMultiSelect<T extends string>({
  items,
  selectedItems: externalSelectedItems = EMPTY_ITEMS as T[],
  onSelect,
}: UseMultiSelectProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>(externalSelectedItems);
  // 이전에 직접 입력으로 추가했던 항목처럼, 선택값 중 기본 목록에 없는 항목도
  // 칩으로 계속 보이고 다시 선택 해제할 수 있어야 한다.
  const [allItems, setAllItems] = useState<string[]>(() =>
    withExtraItems(items, externalSelectedItems)
  );

  // 내 정보 수정처럼 프로필을 불러온 뒤에야 선택값이 채워지는 경우, 첫 마운트 때의 빈 값으로
  // 굳어 버리면 기존 특기가 선택되지 않은 채로 보이고, 칩을 누르면 빈 목록 기준으로 덮어써져
  // 기존 특기가 사라진다. 외부 선택값이 바뀌면 렌더 중에 내부 상태를 맞춘다.
  // onSelect → 부모 state → 다시 prop으로 돌아오는 값은 내부 상태와 같으므로 건너뛴다.
  const [lastExternalItems, setLastExternalItems] =
    useState<readonly string[]>(externalSelectedItems);
  if (!isSameItems(externalSelectedItems, lastExternalItems)) {
    setLastExternalItems(externalSelectedItems);
    if (!isSameItems(externalSelectedItems, selectedItems)) {
      setSelectedItems(externalSelectedItems);
      setAllItems((prev) => withExtraItems(prev, externalSelectedItems));
    }
  }

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
