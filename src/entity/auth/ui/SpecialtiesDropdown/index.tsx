import CheckIcon from '@/shared/assets/svg/CheckIcon';
import Icon from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import { useMultiSelect } from '../../model/useMultiSelect';
import { useCustomInput } from '../../model/useCustomInput';

interface SpecialtiesDropdownProps<T extends string> {
  label?: string;
  items: T[];
  placeholder?: string;
  selectedItems?: T[];
  onSelect?: (items: T[]) => void;
  allowCustomInput?: boolean;
}

export default function SpecialtiesDropdown<T extends string>({
  label,
  items,
  placeholder,
  selectedItems: externalSelectedItems,
  onSelect,
  allowCustomInput = false,
}: SpecialtiesDropdownProps<T>) {
  const [show, setShow] = useState(false);

  const multiSelect = useMultiSelect({
    items,
    initialSelectedItems: externalSelectedItems,
    onSelect,
  });

  const customInput = useCustomInput({
    onSubmit: multiSelect.addCustomItem,
  });

  const handleSelect = (item: string) => {
    if (item === '직접 입력...') {
      customInput.activateCustomInput();
      return;
    }

    multiSelect.handleSelect(item);
  };

  const displayText = multiSelect.displayText || placeholder || '선택해주세요';

  return (
    <View className="relative flex w-full gap-2">
      {label && <Text>{label}</Text>}
      <TouchableOpacity
        className="w-full rounded-xl border border-yellow-400 bg-white px-5 py-5"
        onPress={() => setShow((prev) => !prev)}>
        <View className="flex-row items-center justify-between">
          <Text className="text-body5">{displayText}</Text>
          <Icon name={show ? 'chevron-up' : 'chevron-down'} size={16} color="#000" />
        </View>
      </TouchableOpacity>
      {show && (
        <View className="fixed z-10 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
          <ScrollView className="w-full">
            {multiSelect.allItems.map((item) => {
              const isSelected = multiSelect.isSelected(item);
              return (
                <TouchableOpacity
                  key={item}
                  className={`flex-row items-center px-5 py-4 ${
                    isSelected ? 'bg-blue-50' : 'bg-white'
                  }`}
                  onPress={() => handleSelect(item)}>
                  <View className="mr-3 h-8 w-8 items-center justify-center">
                    {isSelected && <CheckIcon />}
                  </View>
                  <Text className="text-body5">{item}</Text>
                </TouchableOpacity>
              );
            })}

            {allowCustomInput && !customInput.isAddingCustomItem && (
              <TouchableOpacity
                className="flex-row items-center bg-white px-5 py-4"
                onPress={() => handleSelect('직접 입력...')}>
                <View className="mr-3 h-8 w-8 items-center justify-center">
                  <Icon name="add-circle-outline" size={20} color="#0075C2" />
                </View>
                <Text className="text-body5 text-[#0075C2]">직접 입력...</Text>
              </TouchableOpacity>
            )}

            {allowCustomInput && customInput.isAddingCustomItem && (
              <View className="flex-row items-center bg-white px-5 py-4">
                <View className="mr-3 h-8 w-8 items-center justify-center">
                  <Icon name="add-circle-outline" size={20} color="#0075C2" />
                </View>
                <TextInput
                  ref={customInput.customInputRef}
                  className="flex-1 border-b border-gray-300 text-body5"
                  placeholder="새로운 특기 입력"
                  value={customInput.customItemText}
                  onChangeText={customInput.updateCustomItemText}
                  onSubmitEditing={customInput.handleSubmitCustomItem}
                  autoFocus
                />
                <TouchableOpacity className="ml-2 p-2" onPress={customInput.handleSubmitCustomItem}>
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
