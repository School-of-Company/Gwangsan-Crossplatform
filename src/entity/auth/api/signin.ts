import { instance } from '@/shared/lib/aixos';
import { SigninFormData } from '~/entity/auth/model/authState';

export const signin = async (formData: SigninFormData) => {
  try {
    return (
      await instance.post('/api/auth/signin', {
        ...formData,
      })
    ).data;
  } catch (error) {
    throw error;
  }
};
