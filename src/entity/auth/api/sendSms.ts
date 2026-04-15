import { API_URL } from '@env';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export const sendSms = async (phoneNumber: string) => {
  try {
    const response = await fetch(`${API_URL}/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const data = JSON.parse(responseText);
        if (data.message) errorMessage = data.message;
      } catch {}
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error(error);
    throw new Error(getErrorMessage(error));
  }
};
