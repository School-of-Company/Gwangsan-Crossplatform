export interface ResetPasswordRequest {
  phoneNumber: string;
  newPassword: string;
}

export const resetPassword = async (request: ResetPasswordRequest): Promise<Response> => {
  const response = await fetch('/auth/password', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(response.status.toString());
  }

  const responseText = await response.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.warn(responseText);
    data = {};
  }

  return data;
};
