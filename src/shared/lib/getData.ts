import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export const getData = async (name: string) => {
  try {
    return AsyncStorage.getItem(name);
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: '오류 발생',
      text2: `데이터를 가져오는 중 오류가 발생했습니다`,
    });
  }
};
