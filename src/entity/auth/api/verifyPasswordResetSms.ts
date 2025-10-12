export interface VerifyPasswordResetSmsRequest {
  phoneNumber: string;
  code: string;
}

export const verifyPasswordResetSms = async (
  request: VerifyPasswordResetSmsRequest
): Promise<Response> => {
  const response = await fetch('/sms/password/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(response.status.toString());
  }

  return response.json();
};
