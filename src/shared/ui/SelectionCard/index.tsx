import { ReactNode } from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface SelectionCardProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  className?: string;
}

export function SelectionCard({ icon, label, onPress, className = '' }: SelectionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-1 items-center justify-center gap-3 rounded-2xl bg-gray-50 px-4 py-7 ${className}`}>
      {icon}
      <Text className="text-body1 text-gray-900">{label}</Text>
    </TouchableOpacity>
  );
}
