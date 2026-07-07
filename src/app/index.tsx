import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getAccessToken } from '~/shared/lib/auth';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    getAccessToken().then((token) => {
      setHasToken(!!token);
      setIsChecking(false);
    });
  }, []);

  if (isChecking) return null;

  return <Redirect href={hasToken ? '/main' : '/onboarding'} />;
}
