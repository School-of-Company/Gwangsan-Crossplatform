import { act, renderHook } from '@testing-library/react-native';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { useMessageActions } from '../useMessageActions';
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

const originalOS = Platform.OS;

// ActionSheet에서 특정 버튼을 누른 것처럼 콜백을 호출한다
const pressActionSheet = (label: string) =>
  jest
    .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
    .mockImplementation((opts: any, cb: any) => cb(opts.options.indexOf(label)));

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  mockCanModify.mockReturnValue(true);
  mockCanEdit.mockReturnValue(true);
  (useUpdateChatMessage as jest.Mock).mockReturnValue({ mutate: mockUpdateMutate });
  (useDeleteChatMessage as jest.Mock).mockReturnValue({ mutate: mockDeleteMutate });
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
});

describe('useMessageActions', () => {
  describe('메뉴', () => {
    it('텍스트 메시지는 수정/삭제/취소 메뉴를 띄운다(iOS)', () => {
      const spy = jest
        .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
        .mockImplementation(() => {});
      const { result } = renderHook(() => useMessageActions(1));

      act(() => result.current.openMessageMenu(message()));

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          options: ['취소', '수정', '삭제'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        }),
        expect.any(Function)
      );
    });

    it('이미지 메시지는 삭제만 보여준다', () => {
      mockCanEdit.mockReturnValue(false);
      const spy = jest
        .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
        .mockImplementation(() => {});
      const { result } = renderHook(() => useMessageActions(1));

      act(() => result.current.openMessageMenu(message({ messageType: 'IMAGE' })));

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ options: ['취소', '삭제'] }),
        expect.any(Function)
      );
    });

    it('수정/삭제할 수 없는 메시지는 메뉴를 띄우지 않는다', () => {
      mockCanModify.mockReturnValue(false);
      const spy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      const { result } = renderHook(() => useMessageActions(1));

      act(() => result.current.openMessageMenu(message()));

      expect(spy).not.toHaveBeenCalled();
    });

    it('안드로이드에서는 Alert으로 메뉴를 띄운다', () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { result } = renderHook(() => useMessageActions(1));

      act(() => result.current.openMessageMenu(message()));

      expect(alertSpy).toHaveBeenCalledWith('메시지', undefined, [
        expect.objectContaining({ text: '취소', style: 'cancel' }),
        expect.objectContaining({ text: '수정' }),
        expect.objectContaining({ text: '삭제', style: 'destructive' }),
      ]);
    });
  });

  describe('수정', () => {
    it('수정을 고르면 기존 내용으로 수정 모드가 된다', () => {
      pressActionSheet('수정');
      const { result } = renderHook(() => useMessageActions(1));

      act(() => result.current.openMessageMenu(message()));

      expect(result.current.editingMessage).toEqual({ messageId: 7, content: '원래 내용' });
    });

    it('바뀐 내용으로 제출하면 수정 요청을 보내고 수정 모드를 끝낸다', () => {
      pressActionSheet('수정');
      const { result } = renderHook(() => useMessageActions(1));
      act(() => result.current.openMessageMenu(message()));

      act(() => result.current.submitEdit('  새 내용  '));

      expect(mockUpdateMutate).toHaveBeenCalledWith({ messageId: 7, content: '새 내용' });
      expect(result.current.editingMessage).toBeNull();
    });

    it('내용이 그대로거나 비어 있으면 요청 없이 수정 모드만 끝낸다', () => {
      pressActionSheet('수정');
      const { result } = renderHook(() => useMessageActions(1));
      act(() => result.current.openMessageMenu(message()));

      act(() => result.current.submitEdit('원래 내용'));
      expect(mockUpdateMutate).not.toHaveBeenCalled();
      expect(result.current.editingMessage).toBeNull();

      act(() => result.current.openMessageMenu(message()));
      act(() => result.current.submitEdit('   '));
      expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('취소하면 수정 모드를 끝낸다', () => {
      pressActionSheet('수정');
      const { result } = renderHook(() => useMessageActions(1));
      act(() => result.current.openMessageMenu(message()));

      act(() => result.current.cancelEdit());

      expect(result.current.editingMessage).toBeNull();
    });
  });

  describe('삭제', () => {
    it('삭제를 고르면 확인 모달을 띄우고, 확인하면 삭제 요청을 보낸다', () => {
      pressActionSheet('삭제');
      const { result } = renderHook(() => useMessageActions(1));

      act(() => result.current.openMessageMenu(message()));
      expect(result.current.isDeleteConfirmVisible).toBe(true);
      expect(mockDeleteMutate).not.toHaveBeenCalled();

      act(() => result.current.confirmDelete());

      expect(mockDeleteMutate).toHaveBeenCalledWith(7);
      expect(result.current.isDeleteConfirmVisible).toBe(false);
    });

    it('확인 모달에서 취소하면 삭제하지 않는다', () => {
      pressActionSheet('삭제');
      const { result } = renderHook(() => useMessageActions(1));
      act(() => result.current.openMessageMenu(message()));

      act(() => result.current.cancelDelete());

      expect(result.current.isDeleteConfirmVisible).toBe(false);
      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });

    it('수정 중인 메시지를 삭제하면 수정 모드도 끝낸다', () => {
      const spy = pressActionSheet('수정');
      const { result } = renderHook(() => useMessageActions(1));
      act(() => result.current.openMessageMenu(message()));

      spy.mockImplementation((opts: any, cb: any) => cb(opts.options.indexOf('삭제')));
      act(() => result.current.openMessageMenu(message()));
      act(() => result.current.confirmDelete());

      expect(result.current.editingMessage).toBeNull();
    });
  });
});
