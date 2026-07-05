import Constants from 'expo-constants';

// app.config.ts가 정한 우선순위(process.env.API_URL ?? app.json의 extra.apiUrl)를
// 그대로 따르도록 expo-constants를 단일 진실 공급원으로 사용한다.
export const API_BASE_URL: string =
  Constants.expoConfig?.extra?.apiUrl ?? 'https://api.gwangsan.io.kr/api';
