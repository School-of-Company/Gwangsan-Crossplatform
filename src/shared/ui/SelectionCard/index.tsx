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
      className={`flex-1 items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 ${className}`}>
      {icon}
      <Text className="text-body1 text-gray-900">{label}</Text>
    </TouchableOpacity>
  );
}
