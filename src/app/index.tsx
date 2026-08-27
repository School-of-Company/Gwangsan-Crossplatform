import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { getAccessToken } from '~/shared/lib/auth';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getAccessToken()
      .then((token) => {
        if (isMounted) setHasToken(!!token);
      })
      .catch(() => {
        if (isMounted) setHasToken(false);
      })
      .finally(() => {
        if (isMounted) setIsChecking(false);
        SplashScreen.hideAsync().catch(() => {});
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) return null;

  return <Redirect href={hasToken ? '/main' : '/onboarding'} />;
}
