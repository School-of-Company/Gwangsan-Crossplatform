import { API_URL } from '@env';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export interface VerifyPasswordResetSmsRequest {
  phoneNumber: string;
  code: string;
}

export const verifyPasswordResetSms = async (
  request: VerifyPasswordResetSmsRequest
): Promise<Response> => {
  try {
    const response = await fetch(`${API_URL}/sms/password/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
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

    return data as unknown as Response;
  } catch (error) {
    logger.error('verifyPasswordResetSms failed', error);
    throw new Error(getErrorMessage(error));
  }
};
