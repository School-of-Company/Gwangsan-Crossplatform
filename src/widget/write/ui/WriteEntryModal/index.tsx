import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomSheetModalWrapper } from '~/shared/ui';
import { MODE_OPTIONS, TYPE_OPTIONS } from '~/widget/write/model/options';
import { ProductType, TYPE } from '~/widget/write/model/type';
import { ModeType, MODE } from '~/widget/write/model/mode';

interface WriteEntryModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type Stage = 'category' | 'mode';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 2,
  },
});

const TYPE_ICONS: Record<ProductType, React.ReactNode> = {
  [TYPE.OBJECT]: <Ionicons name="bag-outline" size={36} color="#222" />,
  [TYPE.SERVICE]: <MaterialCommunityIcons name="headset" size={36} color="#222" />,
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
          <Ionicons name="chevron-back" size={18} color="#666" />
          <Text className="ml-1 text-sm text-gray-500">뒤로</Text>
        </TouchableOpacity>
      )}
      <View className="flex-row justify-center gap-4">
        {stage === 'category'
          ? TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.card}
                className="flex-1 items-center justify-center gap-3 py-8"
                onPress={() => handleSelectType(option.value)}>
                {TYPE_ICONS[option.value]}
                <Text className="text-body3 font-semibold text-black">{option.label}</Text>
              </TouchableOpacity>
            ))
          : selectedType &&
            MODE_OPTIONS[selectedType].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.card}
                className="flex-1 items-center justify-center gap-3 py-8"
                onPress={() => handleSelectMode(option.value)}>
                <Ionicons name={MODE_ICONS[selectedType][option.value]} size={36} color="#222" />
                <Text className="text-body3 font-semibold text-black">{option.label}</Text>
              </TouchableOpacity>
            ))}
      </View>
    </BottomSheetModalWrapper>
  );
}
