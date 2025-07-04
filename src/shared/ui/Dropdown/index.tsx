import Icon from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface DropdownProps<T extends string> {
  label?: string;
  items: T[];
  placeholder?: string;
  selectedItem?: T;
  onSelect?: (item: T) => void;
}

export function Dropdown<T extends string>({
  label,
  items,
  placeholder,
  selectedItem,
  onSelect
}: DropdownProps<T>) {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<T | null>(selectedItem || null);

  return (
    <View className="relative flex w-full gap-2">
      {label && <Text>{label}</Text>}
      <TouchableOpacity
        className={`w-full rounded-xl border ${show ? 'border-sub2-500' : 'border-gray-400'} px-4 py-5 text-body5`}
        onPress={() => setShow((prev) => !prev)}>
        <View className="flex-row items-center justify-between">
          <Text>{selectedItem || selected || placeholder || '선택해주세요'}</Text>
          <Icon name={show ? 'chevron-up' : 'chevron-down'} size={16} color="#000" />
        </View>
      </TouchableOpacity>
      {show && (
        <View className="absolute top-24 z-10 w-full rounded-xl border-b border-b-gray-300 bg-gray-50 transition last:border-b-0">
          {items.map((v, i) => (
            <Text
              key={v}
              className={`border-b border-gray-300 bg-gray-50 px-4 py-5 first:rounded-t-xl last:rounded-xl ${i === items.length - 1 ? 'border-b-0' : ''}`}
              onPress={() => {
                setSelected(v);
                if (onSelect) {
                  onSelect(v);
                }
                setShow(false);
              }}>
              {v}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
