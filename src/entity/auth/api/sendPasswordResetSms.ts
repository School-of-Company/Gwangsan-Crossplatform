import { API_URL } from '@env';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const sendPasswordResetSms = async (phoneNumber: string) => {
  try {
    const response = await fetch(`${API_URL}/sms/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const responseText = await response.text();

    let data: Record<string, unknown> = {};
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        if (!response.ok) {
          throw new Error(responseText.substring(0, 100));
        }
      }
    }

    if (!response.ok) {
      const serverMessage = data && typeof data === 'object' ? (data.message as string) : undefined;
      const errorMessage = serverMessage || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    logger.error('sendPasswordResetSms failed', error);
    throw new Error(getErrorMessage(error));
  }
};
