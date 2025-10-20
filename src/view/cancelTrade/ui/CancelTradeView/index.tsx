import { useLocalSearchParams } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header } from '~/shared/ui';
import { useGetReview } from '../../model/useGetReview';
import { getLightColor } from '~/shared/lib/handleLightColor';
import { clsx } from 'clsx';

export default function CancelTradeView() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data } = useGetReview(id ?? '');

  const imageUris = (data?.imageUrls ?? [])
    .map((u: any) => (typeof u === 'string' ? u : (u?.url ?? u?.uri)))
    .filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="내가 작성한 후기" />
      <View className="flex-1 justify-between px-4">
        <View className="gap-6">
          {imageUris.length > 0 ? (
            imageUris.map((uri, index) => (
              <Image key={index} source={{ uri }} className="h-[280px] w-full" resizeMode="cover" />
            ))
          ) : (
            <Image
              source={require('~/shared/assets/png/logo.png')}
              className="h-[280px] w-full"
              resizeMode="contain"
            />
          )}
          <View>
            <Text className="text-titleSmall">{data?.title}</Text>
            <Text>{data?.content}</Text>
            <View className="relative flex h-4 w-[120px] justify-center rounded-xl bg-gray-200">
              <View
                style={{ width: `${data?.light ?? 0}%` }}
                className={clsx('absolute mx-1 h-2 rounded-xl', getLightColor(data?.light ?? 0))}
              />
            </View>
          </View>
        </View>
        <Button variant="error">철회하기</Button>
      </View>
    </SafeAreaView>
  );
}
