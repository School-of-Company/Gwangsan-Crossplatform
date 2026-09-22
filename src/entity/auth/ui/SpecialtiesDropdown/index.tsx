import Icon from '@expo/vector-icons/Ionicons';
import { Text, TouchableOpacity, View, TextInput } from 'react-native';
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
  const multiSelect = useMultiSelect({
    items,
    initialSelectedItems: externalSelectedItems,
    onSelect,
  });

  const customInput = useCustomInput({
    onSubmit: multiSelect.addCustomItem,
  });

  return (
    <View className="w-full gap-2">
      {label && <Text>{label}</Text>}

      <View className="flex-row flex-wrap gap-2">
        {multiSelect.allItems.map((item) => {
          const isSelected = multiSelect.isSelected(item);
          return (
            <TouchableOpacity
              key={item}
              testID={`specialty-chip-${item}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => multiSelect.handleSelect(item)}
              className={`rounded-full border px-4 py-2.5 ${
                isSelected ? 'border-main-500 bg-main-500' : 'border-gray-200 bg-white'
              }`}>
              <Text className={`text-body5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}

        {allowCustomInput && !customInput.isAddingCustomItem && (
          <TouchableOpacity
            onPress={() => customInput.activateCustomInput()}
            className="flex-row items-center gap-1.5 rounded-full border border-dashed border-gray-300 bg-white px-4 py-2.5">
            <Icon name="add" size={16} color="#0075C2" />
            <Text className="text-body5 text-[#0075C2]">직접 입력</Text>
          </TouchableOpacity>
        )}

        {allowCustomInput && customInput.isAddingCustomItem && (
          <View className="flex-row items-center gap-1.5 rounded-full border border-main-500 bg-white py-1.5 pl-4 pr-1.5">
            <TextInput
              ref={customInput.customInputRef}
              className="min-w-[64px] text-body5"
              placeholder="새로운 특기"
              value={customInput.customItemText}
              onChangeText={customInput.updateCustomItemText}
              onSubmitEditing={customInput.handleSubmitCustomItem}
              autoFocus
            />
            <TouchableOpacity className="p-1" onPress={customInput.handleSubmitCustomItem}>
              <Icon name="checkmark-circle" size={22} color="#0075C2" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {multiSelect.selectedItems.length === 0 && placeholder && (
        <Text className="text-caption text-gray-500">{placeholder}</Text>
      )}
    </View>
  );
}
