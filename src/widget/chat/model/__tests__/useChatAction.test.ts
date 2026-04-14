import { act } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useChatAction } from '../useChatActions';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => jest.clearAllMocks());

describe('useChatAction', () => {
  const otherUserInfo = { nickname: '광산주민', id: 42 };

  describe('navigationHandlers', () => {
    it('goToProfile을 호출하면 /profile로 이동한다', () => {
      const { result } = renderHookWithProviders(() => useChatAction({ otherUserInfo }));

      act(() => result.current.navigationHandlers.goToProfile(1));

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('goToOtherUserProfile을 호출하면 /profile?id=:id로 이동한다', () => {
      const { result } = renderHookWithProviders(() => useChatAction({ otherUserInfo }));

      act(() => result.current.navigationHandlers.goToOtherUserProfile());

      expect(mockPush).toHaveBeenCalledWith('/profile?id=42');
    });

    it('otherUserInfo.id가 없으면 goToOtherUserProfile이 push를 호출하지 않는다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatAction({ otherUserInfo: { nickname: '상대방' } })
      );

      act(() => result.current.navigationHandlers.goToOtherUserProfile());

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('formatLastMessageDate', () => {
    it('메시지가 없으면 "대화를 시작해보세요"를 반환한다', () => {
      const { result } = renderHookWithProviders(() => useChatAction({ otherUserInfo }));

      expect(result.current.formatLastMessageDate([])).toBe('대화를 시작해보세요');
    });

    it('메시지가 있으면 마지막 메시지의 날짜를 포맷해 반환한다', () => {
      const { result } = renderHookWithProviders(() => useChatAction({ otherUserInfo }));

      const messages = [
        { createdAt: '2026-01-01T10:00:00Z' },
        { createdAt: '2026-01-02T15:30:00Z' },
      ];

      const formatted = result.current.formatLastMessageDate(messages as any[]);

      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});
