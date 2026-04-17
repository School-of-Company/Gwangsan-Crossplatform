import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      Sentry.addBreadcrumb({
        category: 'network',
        message: connected ? 'Network connected' : 'Network disconnected',
        level: connected ? 'info' : 'warning',
        data: {
          type: state.type,
          isInternetReachable: state.isInternetReachable,
        },
      });
    });

    return unsubscribe;
  }, []);

  return isConnected;
}
