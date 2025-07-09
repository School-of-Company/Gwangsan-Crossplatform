import Toast from 'react-native-toast-message';
import { instance } from '../lib/aixos';
import { MODE, TYPE } from '../types/postType';

export const getPosts = async (type?: TYPE, mode?: MODE) => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (mode) params.append('mode', mode);
    return (await instance.get('/post?' + params.toString())).data;
  } catch (error) {
    if (error instanceof Error) {
      Toast.show({
        type: 'error',
        text1: '게시물 불러오기 실패',
        text2: error.message,
      });
    }
    return [];
  }
};
