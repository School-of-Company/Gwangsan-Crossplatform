import { act, renderHook } from '@testing-library/react-native';
import { useMessageActions, type MessageAnchor } from '../useMessageActions';
import {
  canEditMessage,
  canModifyMessage,
  useDeleteChatMessage,
  useUpdateChatMessage,
  type EnhancedChatMessage,
} from '~/entity/chat';

jest.mock('~/entity/chat', () => ({
  canModifyMessage: jest.fn(() => true),
  canEditMessage: jest.fn(() => true),
  useUpdateChatMessage: jest.fn(),
  useDeleteChatMessage: jest.fn(),
}));

const mockCanModify = canModifyMessage as jest.Mock;
const mockCanEdit = canEditMessage as jest.Mock;
const mockUpdateMutate = jest.fn();
const mockDeleteMutate = jest.fn();

const anchor: MessageAnchor = { x: 120, y: 400, width: 200, height: 48 };

const message = (overrides: Partial<EnhancedChatMessage> = {}): EnhancedChatMessage => ({
  messageId: 7,
  roomId: 1,
  content: '원래 내용',
  messageType: 'TEXT',
  createdAt: '2026-09-29T12:00:00.000Z',
  senderNickname: '나',
  senderId: 1,
  checked: false,
  isMine: true,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCanModify.mockReturnValue(true);
  mockCanEdit.mockReturnValue(true);
  (useUpdateChatMessage as jest.Mock).mockReturnValue({ mutate: mockUpdateMutate });
  (useDeleteChatMessage as jest.Mock).mockReturnValue({ mutate: mockDeleteMutate });
});

const openMenu = (result: { current: ReturnType<typeof useMessageActions> }, msg = message()) =>
  act(() => result.current.openMessageMenu(msg, anchor));

describe('useMessageActions', () => {
  describe('메뉴', () => {
    it('꾹 누르면 누른 말풍선 위치와 함께 메뉴를 연다', () => {
      const { result } = renderHook(() => useMessageActions(1));

      openMenu(result);

      expect(result.current.menu).toEqual({ message: message(), anchor, canEdit: true });
    });

    it('이미지 메시지는 수정 없이 삭제만 할 수 있는 메뉴를 연다', () => {
      mockCanEdit.mockReturnValue(false);
      const { result } = renderHook(() => useMessageActions(1));

      openMenu(result, message({ messageType: 'IMAGE' }));

      expect(result.current.menu?.canEdit).toBe(false);
    });

    it('수정/삭제할 수 없는 메시지는 메뉴를 열지 않는다', () => {
      mockCanModify.mockReturnValue(false);
      const { result } = renderHook(() => useMessageActions(1));

      openMenu(result);

      expect(result.current.menu).toBeNull();
    });

    it('닫으면 메뉴가 사라진다', () => {
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result);

      act(() => result.current.closeMenu());

      expect(result.current.menu).toBeNull();
    });
  });

  describe('수정', () => {
    it('수정을 고르면 메뉴를 닫고 기존 내용으로 수정 모드가 된다', () => {
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result);

      act(() => result.current.selectEdit());

      expect(result.current.menu).toBeNull();
      expect(result.current.editingMessage).toEqual({ messageId: 7, content: '원래 내용' });
    });

    it('수정할 수 없는 메시지에서는 수정을 골라도 수정 모드가 되지 않는다', () => {
      mockCanEdit.mockReturnValue(false);
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result, message({ messageType: 'IMAGE' }));

      act(() => result.current.selectEdit());

      expect(result.current.editingMessage).toBeNull();
    });

    it('바뀐 내용으로 제출하면 수정 요청을 보내고 수정 모드를 끝낸다', () => {
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result);
      act(() => result.current.selectEdit());

      act(() => result.current.submitEdit('  새 내용  '));

      expect(mockUpdateMutate).toHaveBeenCalledWith({ messageId: 7, content: '새 내용' });
      expect(result.current.editingMessage).toBeNull();
    });

    it('내용이 그대로거나 비어 있으면 요청 없이 수정 모드만 끝낸다', () => {
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result);
      act(() => result.current.selectEdit());
      act(() => result.current.submitEdit('원래 내용'));
      expect(mockUpdateMutate).not.toHaveBeenCalled();
      expect(result.current.editingMessage).toBeNull();

      openMenu(result);
      act(() => result.current.selectEdit());
      act(() => result.current.submitEdit('   '));
      expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('취소하면 수정 모드를 끝낸다', () => {
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result);
      act(() => result.current.selectEdit());

      act(() => result.current.cancelEdit());

      expect(result.current.editingMessage).toBeNull();
    });
  });

  describe('삭제', () => {
    it('삭제를 고르면 메뉴를 닫고 확인 모달을 띄우며, 확인하면 삭제 요청을 보낸다', () => {
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result);

      act(() => result.current.selectDelete());
      expect(result.current.menu).toBeNull();
      expect(result.current.isDeleteConfirmVisible).toBe(true);
      expect(mockDeleteMutate).not.toHaveBeenCalled();

      act(() => result.current.confirmDelete());

      expect(mockDeleteMutate).toHaveBeenCalledWith(7);
      expect(result.current.isDeleteConfirmVisible).toBe(false);
    });

    it('확인 모달에서 취소하면 삭제하지 않는다', () => {
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result);
      act(() => result.current.selectDelete());

      act(() => result.current.cancelDelete());

      expect(result.current.isDeleteConfirmVisible).toBe(false);
      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });

    it('수정 중인 메시지를 삭제하면 수정 모드도 끝낸다', () => {
      const { result } = renderHook(() => useMessageActions(1));
      openMenu(result);
      act(() => result.current.selectEdit());

      openMenu(result);
      act(() => result.current.selectDelete());
      act(() => result.current.confirmDelete());

      expect(result.current.editingMessage).toBeNull();
    });
  });
});
