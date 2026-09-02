import { act } from '@testing-library/react-native';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
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
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

const mockUseUploadImage = useUploadImage as jest.Mock;
const mockRequestPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchImageLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockRequestCameraPermission = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock;

const setupUploadMock = (mutateAsync = jest.fn()) => {
  mockUseUploadImage.mockReturnValue({ mutateAsync });
  return mutateAsync;
};

// ActionSheet를 갤러리(1) 선택으로 고정
const mockActionSheetGallery = () =>
  jest
    .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
    .mockImplementation((_opts: any, cb: any) => cb(1));

// ActionSheet를 카메라(2) 선택으로 고정
const mockActionSheetCamera = () =>
  jest
    .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
    .mockImplementation((_opts: any, cb: any) => cb(2));

beforeEach(() => {
  jest.clearAllMocks();
  setupUploadMock();
  mockActionSheetGallery();
  // 기본값: 권한 거부 (ActionSheet 콜백 후 비동기 흐름이 조용히 종료되도록)
  mockRequestPermission.mockResolvedValue({ granted: false });
  mockRequestCameraPermission.mockResolvedValue({ granted: false });
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
      expect(result.current.permissionAlertMessage).toBeNull();
      expect(result.current.isUploadErrorAlertVisible).toBe(false);
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

    it('선택된 이미지 목록에서 imageId가 일치하는 이미지를 제거한다', async () => {
      setupUploadMock(
        jest.fn().mockResolvedValue({ imageId: 7, imageUrl: 'https://example.com/7.jpg' })
      );
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://7.jpg' }],
      });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(result.current.selectedImages).toHaveLength(1);

      act(() => result.current.removeImage(7));

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

    it('텍스트 없이 이미지만 있으면 content로 null을 전달한다', async () => {
      setupUploadMock(
        jest.fn().mockResolvedValue({ imageId: 5, imageUrl: 'https://example.com/5.jpg' })
      );
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://5.jpg' }],
      });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      await act(async () => {
        await result.current.handleSendMessage();
      });

      expect(onSendMessage).toHaveBeenCalledWith(null, [5]);
      expect(result.current.selectedImages).toEqual([]);
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

    it('권한이 없으면 이미지를 추가하지 않고 권한 안내를 표시한다', async () => {
      mockRequestPermission.mockResolvedValue({ granted: false });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(result.current.selectedImages).toEqual([]);
      expect(mockLaunchImageLibrary).not.toHaveBeenCalled();
      expect(result.current.permissionAlertMessage).toBe(
        '사진첨부를 위해 사진첩 접근 권한이 필요합니다.'
      );
    });

    it('closePermissionAlert를 호출하면 권한 안내가 사라진다', async () => {
      mockRequestPermission.mockResolvedValue({ granted: false });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });
      act(() => result.current.closePermissionAlert());

      expect(result.current.permissionAlertMessage).toBeNull();
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

    it('이미지 선택 중 오류 시 selectedImages가 변하지 않고 isUploading이 false이다', async () => {
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockRejectedValue(new Error('picker error'));

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(result.current.selectedImages).toEqual([]);
      expect(result.current.isUploading).toBe(false);
    });

    it('이미지 업로드 실패 시 selectedImages가 변하지 않고 업로드 오류 안내를 표시한다', async () => {
      setupUploadMock(jest.fn().mockRejectedValue(new Error('upload error')));
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(result.current.selectedImages).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.isUploadErrorAlertVisible).toBe(true);
    });

    it('closeUploadErrorAlert를 호출하면 업로드 오류 안내가 사라진다', async () => {
      setupUploadMock(jest.fn().mockRejectedValue(new Error('upload error')));
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });
      act(() => result.current.closeUploadErrorAlert());

      expect(result.current.isUploadErrorAlertVisible).toBe(false);
    });

    it('iOS ActionSheet에서 카메라 촬영을 선택하면 카메라 권한을 요청하고 촬영 결과를 업로드한다', async () => {
      mockActionSheetCamera();
      mockRequestCameraPermission.mockResolvedValue({ granted: true });
      const mockMutateAsync = setupUploadMock(
        jest.fn().mockResolvedValue({ imageId: 20, imageUrl: 'https://example.com/cam.jpg' })
      );
      mockLaunchCamera.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://cam.jpg' }],
      });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(mockRequestCameraPermission).toHaveBeenCalled();
      expect(mockMutateAsync).toHaveBeenCalledWith('file://cam.jpg');
      expect(result.current.selectedImages).toEqual([
        { imageId: 20, imageUrl: 'https://example.com/cam.jpg', localUri: 'file://cam.jpg' },
      ]);
    });

    it('카메라 권한이 없으면 촬영하지 않고 권한 안내를 표시한다', async () => {
      mockActionSheetCamera();
      mockRequestCameraPermission.mockResolvedValue({ granted: false });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(mockLaunchCamera).not.toHaveBeenCalled();
      expect(result.current.selectedImages).toEqual([]);
      expect(result.current.permissionAlertMessage).toBe(
        '카메라 사용을 위해 카메라 접근 권한이 필요합니다.'
      );
    });

    it('ActionSheet에서 취소를 선택하면 아무 동작도 하지 않는다', async () => {
      jest
        .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
        .mockImplementation((_options, callback) => {
          callback(0);
        });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(mockRequestPermission).not.toHaveBeenCalled();
      expect(mockRequestCameraPermission).not.toHaveBeenCalled();
    });

    it('Android에서는 Alert로 선택지를 보여주고 갤러리 선택 시 pickFromGallery를 호출한다', async () => {
      const originalOS = Platform.OS;
      Platform.OS = 'android';
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
        const galleryButton = buttons?.find((b) => b.text === '갤러리에서 선택');
        galleryButton?.onPress?.();
      });
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: [] });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(alertSpy).toHaveBeenCalledWith('사진 선택', undefined, expect.any(Array));
      expect(mockRequestPermission).toHaveBeenCalled();

      Platform.OS = originalOS;
      alertSpy.mockRestore();
    });

    it('selectedImages가 5개 이상이면 아무 동작도 하지 않는다', async () => {
      const mockMutateAsync = setupUploadMock(
        jest.fn().mockResolvedValue({ imageId: 1, imageUrl: 'https://example.com/1.jpg' })
      );
      mockRequestPermission.mockResolvedValue({ granted: true });
      mockLaunchImageLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://1.jpg' }],
      });

      const { result } = renderHookWithProviders(() => useChatInput({ onSendMessage }));

      for (let i = 0; i < 5; i++) {
        mockMutateAsync.mockResolvedValueOnce({
          imageId: i + 1,
          imageUrl: `https://example.com/${i + 1}.jpg`,
        });
        mockLaunchImageLibrary.mockResolvedValueOnce({
          canceled: false,
          assets: [{ uri: `file://${i + 1}.jpg` }],
        });

        await act(async () => {
          await result.current.handleImagePicker();
        });
      }

      expect(result.current.selectedImages).toHaveLength(5);

      await act(async () => {
        await result.current.handleImagePicker();
      });

      expect(mockRequestPermission).toHaveBeenCalledTimes(5);
    });
  });
});
