import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export const useCustomFonts = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Cafe24SsurroundOTF: require('@/shared/assets/fonts/Cafe24Ssurround-v2.0/Cafe24Ssurround-v2.0.otf'),
    }).then(() => setLoaded(true));
  }, []);

  return loaded;
};
