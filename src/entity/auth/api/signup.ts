import { instance } from '@/shared/lib/axios';
import { SignupFormData } from '~/entity/auth/model/authState';
import { clearAuthTokens } from '@/shared/lib/auth';
import { toAppError } from '~/shared/lib/errorHandler';

export const signup = async (formData: SignupFormData) => {
  try {
    await clearAuthTokens();
    const { verificationCode, passwordConfirm, ...signupData } = formData;

    return (await instance.post('/auth/signup', signupData)).data;
  } catch (error) {
    throw toAppError(error);
  }
};
