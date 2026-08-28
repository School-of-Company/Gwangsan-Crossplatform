import { Fragment } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBottomSheetPortalStore } from '~/shared/store/useBottomSheetPortalStore';

// 앱 루트에 한 번만 마운트한다. BottomSheetModalWrapper는 여기로 자신의 내용을
// 등록만 하고 직접 렌더링하지 않는다 — Modal(별도 네이티브 창) 없이 이미 떠 있는
// 화면 위에 바로 얹어서, 토스트처럼 창 생성 지연으로 인한 첫 프레임 끊김이 없게 한다.
export function BottomSheetPortalOutlet() {
  const sheets = useBottomSheetPortalStore((s) => s.sheets);
  const entries = Object.entries(sheets);

  if (entries.length === 0) return null;

  return (
    <Fragment>
      {entries.map(([id, node]) => (
        <View key={id} style={StyleSheet.absoluteFill}>
          {node}
        </View>
      ))}
    </Fragment>
  );
}
