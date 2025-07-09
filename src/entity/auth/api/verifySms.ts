import { instance } from '@/shared/lib/aixos';

export const verifySms = async (phoneNumber: string, code: string) => {
  try {
    return (await instance.post('/api/sms/verify', {
      phoneNumber,
      code,
    })).data;
  } catch (error) {
    throw error;
  }
};
