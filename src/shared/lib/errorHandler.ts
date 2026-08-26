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
  if (error instanceof AxiosError) {
    // 5xx 응답 본문에는 서버 예외 클래스명(FunctionCallException 등)이 그대로 담겨 오므로
    // 사용자에게 노출하지 않고 상태 코드만 알린다.
    const serverErrorStatus = error.response?.status;
    if (serverErrorStatus !== undefined && serverErrorStatus >= 500) {
      return `요청이 실패했습니다. (${serverErrorStatus})`;
    }

    if (isErrorResponse(error.response?.data)) {
      const message: string = error.response.data.message;
      const matches: RegExpMatchArray | null = message.match(/default message \[([^\]]+)\]/g);
      if (matches && matches.length > 0) {
        const lastMatch: string = matches[matches.length - 1];
        const content: RegExpMatchArray | null = lastMatch.match(/\[([^\]]+)\]/);
        return content?.[1] ?? message;
      }
      return message;
    }

    const status = error.response?.status;
    if (status) {
      return `요청이 실패했습니다. (${status})`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '알 수 없는 오류가 발생했습니다.';
};

export const toAppError = (error: unknown): Error => {
  const message = getErrorMessage(error);
  if (error instanceof Error) {
    error.message = message;
    return error;
  }
  return new Error(message);
};
