import { instance } from '@/shared/lib/axios';
import { ItemFormRequestBody } from '../model/itemFormSchema';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const createItem = async (requestBody: ItemFormRequestBody) => {
  try {
    const response = await instance.post('/post', requestBody);
    return response.data;
  } catch (error) {
    logger.error('createItem failed', error);
    throw new Error(getErrorMessage(error));
  }
};
