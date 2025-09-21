import { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    typeof data === 'object' && data !== null && typeof (data as ErrorResponse).message === 'string'
  );
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && isErrorResponse(error.response?.data)) {
    const message: string = error.response.data.message;
    const matches: RegExpMatchArray | null = message.match(/default message \[([^\]]+)\]/g);
    if (matches && matches.length > 0) {
      const lastMatch: string = matches[matches.length - 1];
      const content: RegExpMatchArray | null = lastMatch.match(/\[([^\]]+)\]/);
      return content?.[1] ?? message;
    }
    return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Request failed with status code 500';
};
