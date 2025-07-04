import CheckIcon from '@/shared/assets/svg/CheckIcon';
import Icon from 'react-native-vector-icons/Ionicons';
import { useState, useRef } from 'react';
import { Text, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import { Button } from '@/shared/ui/Button';

interface MultiSelectDropdownProps<T extends string> {
  label?: string;
  items: T[];
  placeholder?: string;
  selectedItems?: T[];
  onSelect?: (items: T[]) => void;
  allowCustomInput?: boolean;
}

export function MultiSelectDropdown<T extends string>({
  label,
  items,
  placeholder,
  selectedItems: externalSelectedItems,
  onSelect,
  allowCustomInput = false
}: MultiSelectDropdownProps<T>) {
  const [show, setShow] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>(externalSelectedItems || []);
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
  const [customItemText, setCustomItemText] = useState('');
  const [allItems, setAllItems] = useState<string[]>([...items]);
  const customInputRef = useRef<TextInput>(null);

  const handleSelect = (item: string) => {
    if (item === '직접 입력...') {
      setIsAddingCustomItem(true);
      setTimeout(() => {
        customInputRef.current?.focus();
      }, 100);
      return;
    }

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
  };

  const handleAddCustomItem = () => {
    if (customItemText.trim() === '') return;
    
    const newItem = customItemText.trim();
    setAllItems(prev => [...prev, newItem]);
    setSelectedItems(prev => [...prev, newItem]);
    if (onSelect) {
      onSelect([...selectedItems, newItem] as T[]);
    }
    
    setCustomItemText('');
    setIsAddingCustomItem(false);
  };

  const displayText = selectedItems.length > 0 
    ? selectedItems.join(', ') 
    : placeholder || '선택해주세요';

  return (
    <View className="relative flex w-full">
      {label && <Text>{label}</Text>}
      <TouchableOpacity
        className="w-full rounded-xl border border-yellow-400 px-5 py-5 bg-white"
        onPress={() => setShow((prev) => !prev)}>
        <View className="flex-row items-center justify-between">
          <Text className="text-body5">
            {displayText}
          </Text>
          <Icon name={show ? 'chevron-up' : 'chevron-down'} size={16} color="#000" />
        </View>
      </TouchableOpacity>
      {show && (
        <View className="absolute top-20 z-10 w-full rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden">
          <ScrollView className="w-full">
            {allItems.map((item) => {
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
            
            {allowCustomInput && !isAddingCustomItem && (
              <TouchableOpacity
                className="px-5 py-4 flex-row items-center bg-white"
                onPress={() => handleSelect('직접 입력...')}>
                <View className="w-8 h-8 items-center justify-center mr-3">
                  <Icon name="add-circle-outline" size={20} color="#0075C2" />
                </View>
                <Text className="text-body5 text-[#0075C2]">
                  직접 입력...
                </Text>
              </TouchableOpacity>
            )}
            
            {allowCustomInput && isAddingCustomItem && (
              <View className="px-5 py-4 flex-row items-center bg-white">
                <View className="w-8 h-8 items-center justify-center mr-3">
                  <Icon name="add-circle-outline" size={20} color="#0075C2" />
                </View>
                <TextInput
                  ref={customInputRef}
                  className="flex-1 text-body5 border-b border-gray-300"
                  placeholder="새로운 특기 입력"
                  value={customItemText}
                  onChangeText={setCustomItemText}
                  onSubmitEditing={handleAddCustomItem}
                  autoFocus
                />
                <TouchableOpacity 
                  className="ml-2 p-2"
                  onPress={handleAddCustomItem}>
                  <Icon name="checkmark-circle" size={20} color="#0075C2" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
