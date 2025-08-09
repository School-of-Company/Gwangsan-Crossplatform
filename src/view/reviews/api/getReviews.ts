import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';

export const getReceiveReview = async (id: string) => {
  try {
    return await instance.get(`/review/${id}`);
  } catch (error) {
    console.error(error);
    Toast.show({
      type: 'error',
      text1: '후기 조회 실패',
      text2: '잠시 후 다시 시도해주세요.',
    });
    throw error;
  }
};

export const getTossReview = async () => {
  try {
    return await instance.get('/review');
  } catch (error) {
    console.error(error);
    Toast.show({
      type: 'error',
      text1: '후기 조회 실패',
      text2: '잠시 후 다시 시도해주세요.',
    });
    throw error;
  }
};
