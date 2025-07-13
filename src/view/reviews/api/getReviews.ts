import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';
import { MODE, TYPE } from '~/shared/types/postType';

export const getReceiveReview = async (id: string, mode?: MODE, type?: TYPE) => {
  try {
    return await instance.get(`/review/${id}`, {
      params: {
        mode,
        type,
      },
    });
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

export const getTossReview = async (mode?: MODE, type?: TYPE) => {
  try {
    return await instance.get('/review', {
      params: {
        mode,
        type,
      },
    });
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
