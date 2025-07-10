import { instance } from '@/shared/lib/aixos';
import { SignupFormData } from '~/entity/auth/model/authState';

export const signup = async (formData: SignupFormData) => {
  try {
    return (
      await instance.post('/api/auth/signup', {
        ...formData,
      })
    ).data;
  } catch (error) {
    throw error;
  }
};
