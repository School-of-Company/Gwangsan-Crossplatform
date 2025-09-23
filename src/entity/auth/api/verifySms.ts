import { API_URL } from '@env';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export const verifySms = async (phoneNumber: string, code: string) => {
  try {
    const response = await fetch(`${API_URL}/sms/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, code }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.warn(responseText);
      data = {};
    }

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(getErrorMessage(error));
  }
};
