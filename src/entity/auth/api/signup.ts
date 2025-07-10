import { instance } from '@/shared/lib/aixos';
import { SignupFormData } from '~/entity/auth/model/authState';

export const signup = async (formData: SignupFormData) => {
  try {
    const { verificationCode, passwordConfirm, ...signupData } = formData;
    
    return (
      await instance.post('/api/auth/signup', signupData)
    ).data;
  } catch (error) {
    throw error;
  }
};
