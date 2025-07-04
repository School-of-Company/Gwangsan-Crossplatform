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
  const [allItems, setAllItems] = useState<string[]>([...items]);

  const handleSelect = useCallback((item: string) => {
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
  }, [selectedItems, onSelect]);

  const addCustomItem = useCallback((newItem: string) => {
    setAllItems(prev => [...prev, newItem]);
    setSelectedItems(prev => [...prev, newItem]);
    if (onSelect) {
      onSelect([...selectedItems, newItem] as T[]);
    }
  }, [selectedItems, onSelect]);

  const displayText = useMemo(() => {
    return selectedItems.length > 0 
      ? selectedItems.join(', ') 
      : undefined;
  }, [selectedItems]);

  const isSelected = useCallback((item: string) => {
    return selectedItems.includes(item);
  }, [selectedItems]);

  return {
    selectedItems,
    allItems,
    displayText,
    handleSelect,
    addCustomItem,
    isSelected,
  };
} 