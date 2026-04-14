import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useChatInput } from '../useChatInput';

import { useUploadImage } from '@/shared/model/useUploadImage';
import * as ImagePicker from 'expo-image-picker';

jest.mock('@/shared/model/useUploadImage', () => ({
  useUploadImage: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockUseUploadImage = useUploadImage as jest.Mock;
const mockRequestPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchImageLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

const setupUploadMock = (mutateAsync = jest.fn()) => {
  mockUseUploadImage.mockReturnValue({ mutateAsync });
  return mutateAsync;
};

beforeEach(() => {
  jest.clearAllMocks();
  setupUploadMock();
});

describe('useChatInput', () => {
  const onSendMessage = jest.fn();

  describe('초기 상태', () => {
    it('textMessage는 빈 문자열, selectedImages는 빈 배열이다', () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      expect(result.current.textMessage).toBe('');
      expect(result.current.selectedImages).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.isSending).toBe(false);
    });
  });

  describe('canSend', () => {
    it('textMessage와 selectedImages가 모두 비어있으면 false이다', () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      expect(result.current.canSend).toBe(false);
    });

    it('textMessage가 있으면 canSend가 true이다', () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      act(() => result.current.updateMessage('안녕'));

      expect(result.current.canSend).toBe(true);
    });

    it('공백만 있으면 canSend가 false이다', () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      act(() => result.current.updateMessage('   '));

      expect(result.current.canSend).toBe(false);
    });

    it('disabled=true이면 텍스트가 있어도 canSend가 false이다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatInput({ onSendMessage, disabled: true })
      );

      act(() => result.current.updateMessage('안녕'));

      expect(result.current.canSend).toBe(false);
    });
  });

  describe('updateMessage', () => {
    it('textMessage를 업데이트한다', () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      act(() => result.current.updateMessage('새 메시지'));

      expect(result.current.textMessage).toBe('새 메시지');
    });
  });

  describe('removeImage', () => {
    it('존재하지 않는 imageId로 removeImage를 호출해도 안전하다', () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      act(() => result.current.removeImage(999));

      expect(result.current.selectedImages).toEqual([]);
    });
  });

  describe('handleSendMessage', () => {
    it('canSend가 false이면 onSendMessage를 호출하지 않는다', async () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleSendMessage();
      });

      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('텍스트가 있으면 onSendMessage를 호출하고 textMessage를 초기화한다', async () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      act(() => result.current.updateMessage('보낼 메시지'));

      await act(async () => {
        await result.current.handleSendMessage();
      });

      expect(onSendMessage).toHaveBeenCalledWith('보낼 메시지', []);
      expect(result.current.textMessage).toBe('');
    });

    it('앞뒤 공백은 trim하여 전달한다', async () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      act(() => result.current.updateMessage('  텍스트  '));

      await act(async () => {
        await result.current.handleSendMessage();
      });

      expect(onSendMessage).toHaveBeenCalledWith('텍스트', []);
    });
  });

  describe('resetInput', () => {
    it('모든 상태를 초기화한다', () => {
      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      act(() => result.current.updateMessage('텍스트'));
      act(() => result.current.resetInput());

      expect(result.current.textMessage).toBe('');
      expect(result.current.selectedImages).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.isSending).toBe(false);
    });
  });

  describe('handleImagePicker', () => {
    it('disabled=true이면 아무것도 하지 않는다', async () => {
      const { result } = renderHookWithProviders(() =>
        useChatInput({ onSendMessage, disabled: true })
      );

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(mockRequestPermission).not.toHaveBeenCalled();
    });

    it('권한이 없으면 이미지를 추가하지 않는다', async () => {
      mockRequestPermission.mockResolvedValue({ granted: false });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(result.current.selectedImages).toEqual([]);
      expect(mockLaunchImageLibrary).not.toHaveBeenCalled();
    });

    it('이미지 선택이 취소되면 selectedImages가 변하지 않는다', async () => {
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: [] });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(result.current.selectedImages).toEqual([]);
    });

    it('권한과 선택 성공 시 이미지를 업로드하고 selectedImages에 추가한다', async () => {
      const mockMutateAsync = setupUploadMock(
        jest.fn().mockResolvedValue({ imageId: 10, imageUrl: 'https://example.com/img.jpg' })
      );
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith('file://photo.jpg');
      expect(result.current.selectedImages).toEqual([
        { imageId: 10, imageUrl: 'https://example.com/img.jpg', localUri: 'file://photo.jpg' },
      ]);
      expect(result.current.isUploading).toBe(false);
    });
  });
});
