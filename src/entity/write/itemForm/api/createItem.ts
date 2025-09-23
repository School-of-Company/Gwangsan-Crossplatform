import { instance } from '@/shared/lib/axios';
import { ItemFormRequestBody } from '../model/itemFormSchema';

export const createItem = async (requestBody: ItemFormRequestBody) => {
  try {
    const response = await instance.post('/post', requestBody);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
