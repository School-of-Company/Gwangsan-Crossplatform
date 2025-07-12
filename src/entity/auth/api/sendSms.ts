import { instance } from '@/shared/lib/axios';

export const sendSms = async (phoneNumber: string) => {
  try {
    return (
      await instance.post('/sms', {
        phoneNumber,
      })
    ).data;
  } catch (error) {
    throw error;
  }
};
