import { useSyncExternalStore } from 'react';
import { chatSocket } from '~/shared/lib/socket';

const CONNECTION_EVENTS = ['connect', 'disconnect', 'connect_error'] as const;

const subscribe = (onChange: () => void) => {
  CONNECTION_EVENTS.forEach((event) => chatSocket.on(event, onChange));
  return () => CONNECTION_EVENTS.forEach((event) => chatSocket.off(event, onChange));
};

const getSnapshot = () => chatSocket.isConnected;

// 앱 전체가 공유하는 채팅 소켓의 연결 여부. 특정 채팅방에 들어가지 않은 화면(탭바 뱃지 등)에서
// 소켓이 연결돼 있는 동안 폴링을 멈추는 판단에 쓴다.
export const useChatSocketConnected = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
