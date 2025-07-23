import { instance } from '@/shared/lib/axios';
import { SignupFormData } from '~/entity/auth/model/authState';
import { removeData } from '@/shared/lib/removeData';

export const signup = async (formData: SignupFormData) => {
  try {
    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);
    const { verificationCode, passwordConfirm, ...signupData } = formData;

    return (await instance.post('/auth/signup', signupData)).data;
  } catch (error) {
    throw error;
  }
};
