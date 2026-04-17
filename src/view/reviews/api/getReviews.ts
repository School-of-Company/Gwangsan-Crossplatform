import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';
import { logger } from '~/shared/lib/logger';

export const getReceiveReview = async (id: string) => {
  try {
    return await instance.get(`/review/${id}`);
  } catch (error) {
    logger.error('getReceiveReview failed', error);
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
    logger.error('getTossReview failed', error);
    Toast.show({
      type: 'error',
      text1: '후기 조회 실패',
      text2: '잠시 후 다시 시도해주세요.',
    });
    throw error;
  }
};
