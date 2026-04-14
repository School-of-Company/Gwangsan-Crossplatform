import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useChatEntry } from '../useChatEntry';
import { findChatRoom, createChatRoom } from '@/entity/chat';
import Toast from 'react-native-toast-message';

jest.mock('@/entity/chat', () => ({
  findChatRoom: jest.fn(),
  createChatRoom: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockFindChatRoom = findChatRoom as jest.Mock;
const mockCreateChatRoom = createChatRoom as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useChatEntry', () => {
  it('초기 상태: isLoading이 false이다', () => {
    const { result } = renderHookWithProviders(() => useChatEntry());

    expect(result.current.isLoading).toBe(false);
  });

  it('findChatRoom 성공 시 해당 채팅방으로 이동한다', async () => {
    mockFindChatRoom.mockResolvedValue({ roomId: 'room-42' });

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(1);
    });

    expect(mockFindChatRoom).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith('/chatting/room-42');
    expect(result.current.isLoading).toBe(false);
  });

  it('findChatRoom 실패(방 없음) 시 createChatRoom을 호출한다', async () => {
    mockFindChatRoom.mockRejectedValue(new Error('해당하는 채팅방을 찾을 수 없습니다.'));
    mockCreateChatRoom.mockResolvedValue({ roomId: 'new-room-1' });

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(2);
    });

    expect(mockCreateChatRoom).toHaveBeenCalledWith(2);
    expect(mockPush).toHaveBeenCalledWith('/chatting/new-room-1');
    expect(result.current.isLoading).toBe(false);
  });

  it('findChatRoom 실패(방 없음) + createChatRoom 실패 시 create error Toast를 표시한다', async () => {
    mockFindChatRoom.mockRejectedValue(new Error('해당하는 채팅방을 찾을 수 없습니다.'));
    mockCreateChatRoom.mockRejectedValue(new Error('채팅방 생성 실패'));

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(3);
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'create error', text1: '채팅방 생성 실패' })
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('findChatRoom 기타 에러 시 error Toast를 표시한다', async () => {
    mockFindChatRoom.mockRejectedValue(new Error('서버 오류'));

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(4);
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '서버 오류' })
    );
    expect(mockCreateChatRoom).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('navigateToChat 호출 중 isLoading이 true가 된다', async () => {
    let resolveFind!: (value: any) => void;
    mockFindChatRoom.mockReturnValue(new Promise((res) => (resolveFind = res)));

    const { result } = renderHookWithProviders(() => useChatEntry());

    act(() => {
      result.current.navigateToChat(5);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveFind({ roomId: 'room-5' });
    });

    expect(result.current.isLoading).toBe(false);
  });
});
