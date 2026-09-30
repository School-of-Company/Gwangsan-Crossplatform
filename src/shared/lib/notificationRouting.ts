// shared 레이어는 entity를 import할 수 없으므로(FSD 하향 의존 규칙) AlertType enum
// 대신 그 문자열 값을 그대로 리터럴로 비교한다. entity/notification의 AlertType은
// 문자열 enum이라 값 자체는 동일하다.
export interface NotificationData {
  alertType?: string;
  sourceId?: number;
  roomId?: number;
}

export type NotificationRouteAction =
  | { type: 'chatEntry'; productId: number }
  | { type: 'room'; roomId: number }
  | { type: 'push'; href: string }
  | { type: 'none' };

// _layout.tsx의 알림 응답 핸들러가 어디로 이동해야 하는지 결정하는 순수 함수.
// 실제 라우팅(router.push 등)은 호출부(_layout.tsx)가 반환값을 보고 수행한다.
export const resolveNotificationAction = (
  data: NotificationData | undefined
): NotificationRouteAction => {
  if (data?.alertType === 'CHTTING_REQUEST' && data?.sourceId != null) {
    return { type: 'chatEntry', productId: data.sourceId };
  }
  if (data?.roomId != null) {
    return { type: 'room', roomId: data.roomId };
  }
  if (data?.alertType === 'TRADE_COMPLETE' && data?.sourceId != null) {
    return { type: 'push', href: `/post/${data.sourceId}?review=1` };
  }
  if (data?.alertType === 'REVIEW' && data?.sourceId != null) {
    return { type: 'push', href: `/cancelTrade/${data.sourceId}` };
  }
  return { type: 'none' };
};

// 콜드스타트 경로(getLastNotificationResponseAsync)와 리스너 경로
// (addNotificationResponseReceivedListener)에서 같은 알림 응답이 중복 처리되지
// 않도록 막는 가드. 알림 identifier 단위로 한 번만 처리를 허용한다.
export const createNotificationDedupeGuard = () => {
  const handledIds = new Set<string>();
  return {
    shouldProcess: (id: string | null | undefined): boolean => {
      if (!id) return true;
      if (handledIds.has(id)) return false;
      handledIds.add(id);
      return true;
    },
  };
};
