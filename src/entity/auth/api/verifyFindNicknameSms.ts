import { API_URL } from '@env';

export const verifyFindNicknameSms = async (phoneNumber: string, code: string) => {
  const response = await fetch(`${API_URL}/sms/nickname/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phoneNumber, code }),
  });

  if (!response.ok) {
    throw new Error(response.status.toString());
  }
};
