import { instance } from '@/shared/lib/axios';

export const verifySms = async (phoneNumber: string, code: string) => {
  try {
    return (
      await instance.post('/sms/verify', {
        phoneNumber,
        code,
      })
    ).data;
  } catch (error) {
    throw error;
  }
};
