import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { IChatSocketService } from '../lib/socketService';

interface UseSocketConnectionProps {
  socketService: IChatSocketService;
  autoConnect?: boolean;
}

export const useSocketConnection = ({
  socketService,
  autoConnect = true,
}: UseSocketConnectionProps) => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [connectionState, setConnectionState] = useState(socketService.connectionState);

  useEffect(() => {
    const handleConnect = () => setConnectionState('connected');
    const handleDisconnect = () => setConnectionState('disconnected');
    const handleConnectError = () => setConnectionState('disconnected');

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
    };
  }, [socketService]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (autoConnect && !socketService.isConnected) {
          socketService.connect().catch(console.error);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [autoConnect, socketService]);

  useFocusEffect(
    useCallback(() => {
      if (autoConnect && !socketService.isConnected) {
        socketService.connect().catch(console.error);
      }
    }, [autoConnect, socketService])
  );

  useEffect(() => {
    if (autoConnect && !socketService.isConnected) {
      socketService.connect().catch(console.error);
    }
  }, [autoConnect, socketService]);

  const connect = useCallback(() => socketService.connect(), [socketService]);
  const disconnect = useCallback(() => socketService.disconnect(), [socketService]);

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    connect,
    disconnect,
  };
};
