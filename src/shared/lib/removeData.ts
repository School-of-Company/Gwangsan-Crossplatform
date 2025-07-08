import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export const removeData = async (name: string) => {
  try {
    await AsyncStorage.removeItem(name);
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: '오류 발생',
      text2: `데이터를 삭제하는 중 오류가 발생했습니다`,
    });
  }
};
