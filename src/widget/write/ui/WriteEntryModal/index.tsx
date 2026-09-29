import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomSheetModalWrapper } from '~/shared/ui';
import { MODE_OPTIONS, TYPE_OPTIONS } from '~/widget/write/model/options';
import { ProductType, TYPE } from '~/shared/types/type';
import { ModeType, MODE } from '~/shared/types/mode';
import { useThemeColors } from '~/shared/lib/theme';

interface WriteEntryModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type Stage = 'category' | 'mode';

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 2,
  },
});

const TYPE_ICONS: Record<ProductType, (color: string) => React.ReactNode> = {
  [TYPE.OBJECT]: (color) => <Ionicons name="bag-outline" size={36} color={color} />,
  [TYPE.SERVICE]: (color) => <MaterialCommunityIcons name="headset" size={36} color={color} />,
};

const MODE_ICONS: Record<ProductType, Record<ModeType, keyof typeof Ionicons.glyphMap>> = {
  [TYPE.OBJECT]: {
    [MODE.GIVER]: 'pricetag-outline',
    [MODE.RECEIVER]: 'search-outline',
  },
  [TYPE.SERVICE]: {
    [MODE.GIVER]: 'hand-left-outline',
    [MODE.RECEIVER]: 'help-circle-outline',
  },
};

export function WriteEntryModal({ isVisible, onClose }: WriteEntryModalProps) {
  const colors = useThemeColors();
  const [stage, setStage] = useState<Stage>('category');
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);

  useEffect(() => {
    if (isVisible) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setStage('category');
      setSelectedType(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isVisible]);

  const handleSelectType = (type: ProductType) => {
    setSelectedType(type);
    setStage('mode');
  };

  const handleSelectMode = (mode: ModeType) => {
    if (!selectedType) return;
    onClose();
    router.push({ pathname: '/write', params: { type: selectedType, mode } });
  };

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      title={stage === 'category' ? '무엇을 등록할까요?' : '어떤 유형인가요?'}
      height={320}>
      {stage === 'mode' && (
        <TouchableOpacity
          className="mb-4 flex-row items-center"
          onPress={() => setStage('category')}>
          <Ionicons name="chevron-back" size={18} color={colors['gray-700']} />
          <Text className="ml-1 text-sm text-gray-500">뒤로</Text>
        </TouchableOpacity>
      )}
      <View className="flex-row justify-center gap-4">
        {stage === 'category'
          ? TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.card, { backgroundColor: colors.surface }]}
                className="flex-1 items-center justify-center gap-3 py-8"
                onPress={() => handleSelectType(option.value)}>
                {TYPE_ICONS[option.value](colors.foreground)}
                <Text className="text-body3 font-semibold text-foreground">{option.label}</Text>
              </TouchableOpacity>
            ))
          : selectedType &&
            MODE_OPTIONS[selectedType].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.card, { backgroundColor: colors.surface }]}
                className="flex-1 items-center justify-center gap-3 py-8"
                onPress={() => handleSelectMode(option.value)}>
                <Ionicons
                  name={MODE_ICONS[selectedType][option.value]}
                  size={36}
                  color={colors.foreground}
                />
                <Text className="text-body3 font-semibold text-foreground">{option.label}</Text>
              </TouchableOpacity>
            ))}
      </View>
    </BottomSheetModalWrapper>
  );
}
