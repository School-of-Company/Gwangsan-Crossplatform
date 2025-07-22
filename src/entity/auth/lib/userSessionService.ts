import { getData } from '@/shared/lib/getData';
import { instance } from '@/shared/lib/axios';

export interface UserSession {
  readonly memberId: number;
  readonly accessToken: string;
  readonly refreshToken?: string;
}

export interface IUserSessionService {
  getCurrentUserId(): Promise<number>;
  getCurrentSession(): Promise<UserSession>;
  clearSession(): void;
  isSessionValid(): Promise<boolean>;
}

const createUserSessionService = (): IUserSessionService => {
  let cachedSession: UserSession | null = null;
  let sessionPromise: Promise<UserSession> | null = null;

  const loadSession = async (): Promise<UserSession> => {
    try {
      const memberIdString = await getData('memberId');
      const accessToken = await getData('accessToken');
      
      if (memberIdString && accessToken) {
        return {
          memberId: parseInt(memberIdString, 10),
          accessToken,
          refreshToken: await getData('refreshToken') || undefined,
        };
      }

      if (accessToken) {
        const response = await instance.get('/member');
        return {
          memberId: response.data.memberId,
          accessToken,
          refreshToken: await getData('refreshToken') || undefined,
        };
      }

      throw new Error('No valid session found');
    } catch (error) {
      console.error('Failed to load user session:', error);
      throw new Error('Authentication required');
    }
  };

  const getCurrentUserId = async (): Promise<number> => {
    const session = await getCurrentSession();
    return session.memberId;
  };

  const getCurrentSession = async (): Promise<UserSession> => {
    if (sessionPromise) {
      return sessionPromise;
    }

    if (cachedSession) {
      return cachedSession;
    }

    sessionPromise = loadSession();
    
    try {
      const session = await sessionPromise;
      cachedSession = session;
      return session;
    } finally {
      sessionPromise = null;
    }
  };

  const clearSession = (): void => {
    cachedSession = null;
    sessionPromise = null;
  };

  const isSessionValid = async (): Promise<boolean> => {
    try {
      await getCurrentSession();
      return true;
    } catch {
      return false;
    }
  };

  return {
    getCurrentUserId,
    getCurrentSession,
    clearSession,
    isSessionValid,
  };
};

export const userSessionService = createUserSessionService(); 