import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

type ToastVariant = 'success' | 'error' | 'info';

const VARIANT_ICON: Record<
  ToastVariant,
  { name: ComponentProps<typeof Icon>['name']; color: string }
> = {
  success: { name: 'checkmark-circle', color: '#8FC31D' },
  error: { name: 'close-circle', color: '#DF454A' },
  info: { name: 'information-circle', color: '#3391CE' },
};

function GwangsanToast({ type, text1, text2, onPress }: ToastConfigParams<unknown>) {
  const { name, color } = VARIANT_ICON[type as ToastVariant] ?? VARIANT_ICON.info;

  return (
    <Pressable
      testID="gwangsan-toast"
      onPress={onPress}
      className="min-w-[240px] max-w-[92%] flex-row items-center gap-2.5 rounded-[100px] bg-gray-900 px-6 py-3.5 shadow-lg">
      <Icon name={name} size={20} color={color} />
      <View className="shrink">
        {text1 ? (
          <Text numberOfLines={2} className="text-body4 font-semibold text-white">
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text numberOfLines={2} className="text-body5 text-gray-300">
            {text2}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const toastConfig: ToastConfig = {
  success: (params) => <GwangsanToast {...params} />,
  error: (params) => <GwangsanToast {...params} />,
  info: (params) => <GwangsanToast {...params} />,
};
