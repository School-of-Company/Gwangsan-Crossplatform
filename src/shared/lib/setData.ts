import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export const setData = async (name: string, data: string) => {
  try {
    await AsyncStorage.setItem(name, data);
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: '오류 발생',
      text2: `데이터를 저장하는 중 오류가 발생했습니다`,
    });
  }
};
