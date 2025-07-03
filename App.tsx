import './global.css';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';

// Expo Router는 자동으로 엔트리 포인트를 처리합니다.
// 이 파일은 초기화 로직만 포함합니다.
export default function App() {
  useEffect(() => {
    // 앱 초기화 로직을 여기에 추가할 수 있습니다.
  }, []);

  return null;
}
