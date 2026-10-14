import Icon from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useMultiSelect } from '../../model/useMultiSelect';
import { useCustomInput } from '../../model/useCustomInput';
import { CustomInputCard } from '../CustomInputCard';

interface SpecialtiesDropdownProps<T extends string> {
  label?: string;
  items: T[];
  placeholder?: string;
  selectedItems?: T[];
  onSelect?: (items: T[]) => void;
  allowCustomInput?: boolean;
  // 직접 입력 카드가 열려있는 동안, 화면 하단에 고정된 제출 버튼이 키보드를 따라
  // 올라와 카드 아래에 겹쳐 보이는 것을 막기 위해 부모가 그 버튼을 숨길 수 있게 한다.
  onCustomInputVisibleChange?: (visible: boolean) => void;
}

export default function SpecialtiesDropdown<T extends string>({
  label,
  items,
  placeholder,
  selectedItems: externalSelectedItems,
  onSelect,
  allowCustomInput = false,
  onCustomInputVisibleChange,
}: SpecialtiesDropdownProps<T>) {
  const multiSelect = useMultiSelect({
    items,
    selectedItems: externalSelectedItems,
    onSelect,
  });

  const customInput = useCustomInput({
    onSubmit: multiSelect.addCustomItem,
  });

  useEffect(() => {
    onCustomInputVisibleChange?.(customInput.isAddingCustomItem);
  }, [customInput.isAddingCustomItem, onCustomInputVisibleChange]);

  return (
    <View className="w-full gap-2">
      {label && <Text className="text-foreground">{label}</Text>}

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
                isSelected ? 'border-main-500 bg-main-500' : 'border-gray-200 bg-background'
              }`}>
              <Text className={`text-body5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}

        {allowCustomInput && (
          <TouchableOpacity
            onPress={customInput.activateCustomInput}
            className="flex-row items-center gap-1.5 rounded-full border border-dashed border-gray-300 bg-background px-4 py-2.5">
            <Icon name="add" size={16} color="#0075C2" />
            <Text className="text-body5 text-sub-500">직접 입력</Text>
          </TouchableOpacity>
        )}
      </View>

      {multiSelect.selectedItems.length === 0 && placeholder && (
        <Text className="text-caption text-gray-500">{placeholder}</Text>
      )}

      {allowCustomInput && (
        <CustomInputCard
          isVisible={customInput.isAddingCustomItem}
          placeholder="예: 목공, 사진 촬영"
          onSubmit={customInput.handleSubmitCustomItem}
          onClose={customInput.deactivateCustomInput}
          inputRef={customInput.customInputRef}
          onOpenAnimationStart={customInput.focusInput}
        />
      )}
    </View>
  );
}
