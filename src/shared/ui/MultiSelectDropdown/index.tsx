import CheckIcon from '@/shared/assets/svg/CheckIcon';
import Icon from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native';

interface MultiSelectDropdownProps<T extends string> {
  label?: string;
  items: T[];
  placeholder?: string;
  selectedItems?: T[];
  onSelect?: (items: T[]) => void;
}

export function MultiSelectDropdown<T extends string>({
  label,
  items,
  placeholder,
  selectedItems: externalSelectedItems,
  onSelect
}: MultiSelectDropdownProps<T>) {
  const [show, setShow] = useState(false);
  const [selectedItems, setSelectedItems] = useState<T[]>(externalSelectedItems || []);

  const handleSelect = (item: T) => {
    let newSelectedItems: T[];
    
    if (selectedItems.includes(item)) {
      newSelectedItems = selectedItems.filter((selectedItem) => selectedItem !== item);
    } else {
      newSelectedItems = [...selectedItems, item];
    }
    
    setSelectedItems(newSelectedItems);
    if (onSelect) {
      onSelect(newSelectedItems);
    }
  };

  const displayText = selectedItems.length > 0 
    ? selectedItems.join(', ') 
    : placeholder || '선택해주세요';

  return (
    <View className="relative flex w-full">
      {label && <Text>{label}</Text>}
      <TouchableOpacity
        className="w-full rounded-xl border border-yellow-400 px-5 py-4 bg-white"
        onPress={() => setShow((prev) => !prev)}>
        <View className="flex-row items-center justify-between">
          <Text className="text-body5">
            {displayText}
          </Text>
          <Icon name={show ? 'chevron-up' : 'chevron-down'} size={16} color="#000" />
        </View>
      </TouchableOpacity>
      {show && (
        <View className="absolute top-16 z-10 w-full rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden">
          <ScrollView className="w-full">
            {items.map((item) => {
              const isSelected = selectedItems.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  className={`px-5 py-4 flex-row items-center ${
                    isSelected ? 'bg-blue-50' : 'bg-white'
                  }`}
                  onPress={() => handleSelect(item)}>
                  <View className="w-8 h-8 items-center justify-center mr-3">
                    {isSelected && <CheckIcon />}
                  </View>
                  <Text className="text-body5">
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
