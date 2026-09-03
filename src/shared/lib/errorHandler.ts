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

// Socket.io connect_error/error 등 AxiosError가 아닌 일반 Error로 전달되는 순수
// 네트워크 실패(예: 안드로이드 NoRouteToHostException, SocketException: Software
// caused connection abort, xhr poll error, 자체 연결 타임아웃)까지 잡아내기 위한
// 메시지 패턴이다.
const NETWORK_ERROR_MESSAGE_PATTERN =
  /network request failed|no ?route ?to ?host|host unreachable|unable to resolve host|xhr poll error|websocket error|timeout|econnrefused|econnreset|enotfound|etimedout|econnaborted|network error|internet connection|offline|connection abort|connection reset|software caused connection abort|socketexception|epipe/i;

// 기기 오프라인, 셀룰러 전환, 5s 타임아웃, 소켓 연결 실패/강제 종료 등 실사용자
// 네트워크 상태에 의한 실패로, 서버 응답 자체를 받지 못한 경우다. 앱/서버 버그가
// 아니므로 별도로 구분해 취급한다.
export const isNetworkOrTimeoutError = (error: unknown): boolean => {
  if (error instanceof AxiosError && error.response === undefined) return true;
  if (error instanceof Error) return NETWORK_ERROR_MESSAGE_PATTERN.test(error.message);
  return false;
};

export const toAppError = (error: unknown): Error => {
  const message = getErrorMessage(error);
  if (error instanceof Error) {
    error.message = message;
    return error;
  }
  return new Error(message);
};
