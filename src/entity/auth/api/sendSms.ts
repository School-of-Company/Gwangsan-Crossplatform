import { instance } from '@/shared/lib/aixos';

export const sendSms = async (phoneNumber: string) => {
  try {
    return (
      await instance.post('/api/sms', {
        phoneNumber,
      })
    ).data;
  } catch (error) {
    throw error;
  }
};
