import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { logger } from '~/shared/lib/logger';

export const useCustomFonts = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 루트 레이아웃이 이 값을 기다리므로 실패해도 진행시킨다 (해당 텍스트만 시스템 폰트로 표시됨)
    Font.loadAsync({
      Cafe24SsurroundOTF: require('~/shared/assets/fonts/Cafe24Ssurround-v2.0/Cafe24Ssurround-v2.0.otf'),
    })
      .catch((error: unknown) => {
        logger.error('폰트 로드 실패', error);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return loaded;
};
