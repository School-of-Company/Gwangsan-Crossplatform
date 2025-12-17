import Icon from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native';

interface DropdownProps<T extends string> {
  label?: string;
  items: { value: T; label: string }[];
  placeholder?: string;
  selectedItem?: T;
  width?: string;
  onSelect?: (item: T) => void;
}

export function Dropdown<T extends string>({
  label,
  items,
  placeholder,
  selectedItem,
  onSelect,
  width = 'full',
}: DropdownProps<T>) {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<T | null>(selectedItem || null);

  const selectedLabel = selected
    ? items.find((item) => item.value === selected)?.label
    : selectedItem
      ? items.find((item) => item.value === selectedItem)?.label
      : undefined;

  return (
    <View className={`${width} relative flex gap-2`}>
      {label && <Text className="text-label text-black">{label}</Text>}
      <TouchableOpacity
        className={`rounded-xl border ${show ? 'border-sub2-500' : 'border-gray-400'} px-4 py-5 text-body5`}
        onPress={() => setShow((prev) => !prev)}>
        <View className="flex-row items-center justify-between">
          <Text>{selectedLabel || placeholder || '선택해주세요'}</Text>
          <Icon name={show ? 'chevron-up' : 'chevron-down'} size={16} color="#000" />
        </View>
      </TouchableOpacity>
      {show && (
        <View className="absolute left-0 top-full z-50 w-full rounded-xl border-b border-b-gray-300 bg-gray-50 last:border-b-0">
          <ScrollView
            style={{ maxHeight: 200 }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}>
            {items.map((item, i) => (
              <Text
                key={item.value}
                className={`border-b border-gray-300 bg-gray-50 px-4 py-5 ${i === 0 ? 'rounded-t-xl' : ''} ${i === items.length - 1 ? 'border-b-0 rounded-b-xl' : ''}`}
                onPress={() => {
                  setSelected(item.value);
                  if (onSelect) {
                    onSelect(item.value);
                  }
                  setShow(false);
                }}>
                {item.label}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
