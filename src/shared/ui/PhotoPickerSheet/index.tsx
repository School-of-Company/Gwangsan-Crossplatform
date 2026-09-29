import { memo, useCallback, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Icon from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { usePhotoLibrary, type LibraryPhoto } from '../../model/usePhotoLibrary';

const COLUMNS = 3;
const GAP = 2;
const TILE_SIZE = (Dimensions.get('window').width - GAP * (COLUMNS - 1)) / COLUMNS;

interface PhotoPickerSheetProps {
  readonly visible: boolean;
  // 이 화면에서 고를 수 있는 최대 장수(이미 첨부한 사진 중 이 화면에서 고른 것도 포함)
  readonly maxSelection: number;
  // 이미 첨부한 사진. 화면을 열면 선택된 상태로 보이고, 해제하면 첨부에서도 빠진다
  readonly initialSelectedIds: readonly string[];
  readonly onCancel: () => void;
  // 선택 순서대로 사진 id를 돌려준다
  readonly onConfirm: (selectedIds: string[]) => void;
}

interface PhotoTileProps {
  readonly photo: LibraryPhoto;
  readonly order: number | null;
  readonly onPress: (id: string) => void;
}

const PhotoTile = memo(({ photo, order, onPress }: PhotoTileProps) => {
  const isSelected = order !== null;

  return (
    <Pressable
      testID={`photo-tile-${photo.id}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={isSelected ? `${order}번째로 선택된 사진` : '사진 선택'}
      onPress={() => onPress(photo.id)}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}>
      <Image
        source={{ uri: photo.uri }}
        style={{ width: TILE_SIZE, height: TILE_SIZE }}
        contentFit="cover"
        recyclingKey={photo.id}
      />
      {isSelected && <View className="absolute inset-0 border-[3px] border-sub-500 bg-black/20" />}
      <View className="absolute right-2 top-2">
        {isSelected ? (
          <View className="h-7 w-7 items-center justify-center rounded-full bg-sub-500">
            <Text className="text-label font-semibold text-white">{order}</Text>
          </View>
        ) : (
          <View className="h-7 w-7 rounded-full border-2 border-white bg-black/20" />
        )}
      </View>
    </Pressable>
  );
});

// iOS 앱 내 사진 선택 화면(토스 스타일). 시스템 사진 피커는 이미 고른 사진을 선택된 상태로 띄울 수
// 없어서, 사진을 다시 추가할 때 기존 선택이 보이도록 직접 만들었다(#714). Android는 사진 전체 접근
// 권한 정책 때문에 시스템 피커를 그대로 쓴다.
export function PhotoPickerSheet({
  visible,
  maxSelection,
  initialSelectedIds,
  onCancel,
  onConfirm,
}: PhotoPickerSheetProps) {
  const { photos, access, loadMore, selectMorePhotos } = usePhotoLibrary(visible);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 열릴 때마다 이미 첨부한 사진을 선택된 상태로 시작한다
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setSelectedIds([...initialSelectedIds]);
  }

  const togglePhoto = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((selectedId) => selectedId !== id);
        if (prev.length >= maxSelection) {
          Toast.show({
            type: 'info',
            text1: `사진은 최대 ${maxSelection}장까지 고를 수 있어요`,
          });
          return prev;
        }
        return [...prev, id];
      });
    },
    [maxSelection]
  );

  const renderItem = useCallback(
    ({ item }: { item: LibraryPhoto }) => {
      const index = selectedIds.indexOf(item.id);
      return (
        <PhotoTile photo={item} order={index === -1 ? null : index + 1} onPress={togglePhoto} />
      );
    },
    [selectedIds, togglePhoto]
  );

  const count = selectedIds.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}>
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
          <TouchableOpacity
            testID="photo-picker-close"
            onPress={onCancel}
            accessibilityLabel="사진 선택 닫기"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close" size={26} color="#3C3C3E" />
          </TouchableOpacity>
          <Text className="text-titleSmall text-gray-900">사진 선택</Text>
          <Text testID="photo-picker-count" className="text-body3 text-gray-500">
            <Text className={count > 0 ? 'text-sub-500' : 'text-gray-500'}>{count}</Text>/
            {maxSelection}
          </Text>
        </View>

        {access === 'limited' && (
          <View className="mx-5 mb-4 flex-row items-center justify-between rounded-2xl bg-gray-50 px-4 py-3.5">
            <Text className="flex-1 text-body5 text-gray-700">
              허용한 사진만 보여요. 다른 사진도 고를 수 있어요.
            </Text>
            <TouchableOpacity testID="photo-picker-select-more" onPress={selectMorePhotos}>
              <Text className="text-body3 text-sub-500">더 선택하기</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          testID="photo-picker-grid"
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={COLUMNS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP, paddingBottom: 24 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="items-center justify-center py-24">
              <Text className="text-body4 text-gray-500">표시할 사진이 없어요</Text>
            </View>
          }
        />

        <View className="border-t border-gray-100 px-5 pb-2 pt-3">
          <TouchableOpacity
            testID="photo-picker-confirm"
            onPress={() => onConfirm(selectedIds)}
            activeOpacity={0.85}
            className="h-14 items-center justify-center rounded-2xl bg-sub-500">
            <Text className="text-body1 text-white">
              {count > 0 ? `${count}장 선택 완료` : '선택 완료'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
