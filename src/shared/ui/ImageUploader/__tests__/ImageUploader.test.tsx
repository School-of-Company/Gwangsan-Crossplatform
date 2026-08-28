import React, { useState } from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { ActionSheetIOS, Alert, Platform, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { renderWithProviders } from '~/test-utils';
import ImageUploader from '../index';
import { useUploadImage } from '@/shared/model/useUploadImage';
import { logger } from '@/shared/lib/logger';
import type { ImageType } from '@/shared/types/imageType';

jest.mock('@/shared/model/useUploadImage', () => ({
  useUploadImage: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('@/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

const mockUseUploadImage = useUploadImage as jest.Mock;
const mockRequestGalleryPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockRequestCameraPermission = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockLaunchGallery = ImagePicker.launchImageLibraryAsync as jest.Mock;
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
  mockRequestGalleryPermission.mockResolvedValue({ granted: false });
  mockRequestCameraPermission.mockResolvedValue({ granted: false });
});

// images 상태를 직접 관리하는 래퍼 (removeImageByUri가 images prop에 의존하므로 필요)
const StatefulImageUploader = ({
  onImagesChange,
  onImageIdsChange,
  onUploadStateChange,
  initialImages,
}: {
  onImagesChange?: jest.Mock;
  onImageIdsChange?: jest.Mock;
  onUploadStateChange?: jest.Mock;
  initialImages?: ImageType[];
}) => {
  const [images, setImages] = useState<string[]>(
    () => initialImages?.map((img) => img.imageUrl) ?? []
  );
  return (
    <ImageUploader
      images={images}
      initialImages={initialImages}
      onImagesChange={(newImages) => {
        setImages(newImages);
        onImagesChange?.(newImages);
      }}
      onImageIdsChange={onImageIdsChange}
      onUploadStateChange={onUploadStateChange}
    />
  );
};

// 버튼 쿼리 헬퍼 (TouchableOpacity accessibilityRole 미설정 환경 대응)
const getButtons = (container: ReturnType<typeof renderWithProviders>) =>
  container.UNSAFE_getAllByType(TouchableOpacity);

describe('ImageUploader', () => {
  describe('렌더링', () => {
    it('title을 렌더링한다', () => {
      const { getByText } = renderWithProviders(<ImageUploader title="사진 업로드" />);
      expect(getByText('사진 업로드')).toBeTruthy();
    });

    it('기본 title은 "사진첨부"이다', () => {
      const { getByText } = renderWithProviders(<ImageUploader />);
      expect(getByText('사진첨부')).toBeTruthy();
    });

    it('images prop으로 이미지 2개와 첨부 버튼을 렌더링한다', () => {
      const container = renderWithProviders(
        <ImageUploader images={['file://a.jpg', 'file://b.jpg']} />
      );
      // 이미지 버튼 2개 + 첨부 버튼 1개
      expect(getButtons(container)).toHaveLength(3);
    });

    it('readonly=true이면 첨부 버튼이 렌더링되지 않는다', () => {
      const container = renderWithProviders(<ImageUploader images={['file://a.jpg']} readonly />);
      // 이미지 버튼 1개만 (disabled), 첨부 버튼 없음
      expect(getButtons(container)).toHaveLength(1);
    });

    it('maxImages 도달 시 첨부 버튼이 렌더링되지 않는다', () => {
      const container = renderWithProviders(
        <ImageUploader images={['file://a.jpg', 'file://b.jpg']} maxImages={2} />
      );
      expect(getButtons(container)).toHaveLength(2);
    });
  });

  describe('pickImage', () => {
    it('첨부 버튼 탭 시 ActionSheetIOS가 열린다', () => {
      const container = renderWithProviders(<ImageUploader />);
      fireEvent.press(getButtons(container)[0]);

      expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalledWith(
        expect.objectContaining({ options: ['취소', '갤러리에서 선택', '카메라로 촬영'] }),
        expect.any(Function)
      );
    });
  });

  describe('갤러리 선택', () => {
    it('권한 거부 시 Toast 에러를 표시한다', async () => {
      const Toast = require('react-native-toast-message');
      mockRequestGalleryPermission.mockResolvedValue({ granted: false });

      const container = renderWithProviders(<ImageUploader />);
      fireEvent.press(getButtons(container)[0]);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error', text2: '사진 접근 권한이 필요합니다.' })
        );
      });
    });

    it('선택 취소 시 onImagesChange가 호출되지 않는다', async () => {
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({ canceled: true, assets: [] });

      const onImagesChange = jest.fn();
      const container = renderWithProviders(<ImageUploader onImagesChange={onImagesChange} />);
      fireEvent.press(getButtons(container)[0]);

      await waitFor(() => expect(mockLaunchGallery).toHaveBeenCalled());
      expect(onImagesChange).not.toHaveBeenCalled();
    });

    it('선택 성공 시 업로드 후 onImagesChange와 onImageIdsChange가 호출된다', async () => {
      setupUploadMock(
        jest.fn().mockResolvedValue({ imageId: 10, imageUrl: 'https://example.com/img.jpg' })
      );
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const onImagesChange = jest.fn();
      const onImageIdsChange = jest.fn();
      const container = renderWithProviders(
        <ImageUploader onImagesChange={onImagesChange} onImageIdsChange={onImageIdsChange} />
      );

      fireEvent.press(getButtons(container)[0]);

      await waitFor(() => expect(onImageIdsChange).toHaveBeenCalledWith([10]));
      expect(onImagesChange).toHaveBeenCalledWith(['file://photo.jpg']);
    });
  });

  describe('카메라 촬영', () => {
    beforeEach(() => {
      mockActionSheetCamera();
    });

    it('권한 거부 시 Toast 에러를 표시한다', async () => {
      const Toast = require('react-native-toast-message');
      mockRequestCameraPermission.mockResolvedValue({ granted: false });

      const container = renderWithProviders(<ImageUploader />);
      fireEvent.press(getButtons(container)[0]);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error', text2: '카메라 접근 권한이 필요합니다.' })
        );
      });
    });

    it('촬영 성공 시 업로드 후 onImageIdsChange가 호출된다', async () => {
      setupUploadMock(
        jest.fn().mockResolvedValue({ imageId: 20, imageUrl: 'https://example.com/cam.jpg' })
      );
      mockRequestCameraPermission.mockResolvedValue({ granted: true });
      mockLaunchCamera.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://camera.jpg' }],
      });

      const onImageIdsChange = jest.fn();
      const container = renderWithProviders(<ImageUploader onImageIdsChange={onImageIdsChange} />);

      fireEvent.press(getButtons(container)[0]);

      await waitFor(() => expect(onImageIdsChange).toHaveBeenCalledWith([20]));
    });

    it('선택 취소 시 onImagesChange가 호출되지 않는다', async () => {
      mockRequestCameraPermission.mockResolvedValue({ granted: true });
      mockLaunchCamera.mockResolvedValue({ canceled: true, assets: [] });

      const onImagesChange = jest.fn();
      const container = renderWithProviders(<ImageUploader onImagesChange={onImagesChange} />);
      fireEvent.press(getButtons(container)[0]);

      await waitFor(() => expect(mockLaunchCamera).toHaveBeenCalled());
      expect(onImagesChange).not.toHaveBeenCalled();
    });
  });

  describe('업로드 실패', () => {
    it('업로드 실패 시 hasFailedImages=true로 onUploadStateChange가 호출된다', async () => {
      setupUploadMock(jest.fn().mockRejectedValue(new Error('upload error')));
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const onUploadStateChange = jest.fn();
      const container = renderWithProviders(
        <StatefulImageUploader onUploadStateChange={onUploadStateChange} />
      );

      fireEvent.press(getButtons(container)[0]);

      await waitFor(() =>
        expect(onUploadStateChange).toHaveBeenCalledWith(
          expect.objectContaining({ hasFailedImages: true, hasUploadingImages: false })
        )
      );
    });

    it('업로드 실패 시 1.5초 뒤 실패한 이미지를 자동으로 제거한다', async () => {
      setupUploadMock(jest.fn().mockRejectedValue(new Error('upload error')));
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const onImagesChange = jest.fn();
      const container = renderWithProviders(
        <StatefulImageUploader onImagesChange={onImagesChange} />
      );

      fireEvent.press(getButtons(container)[0]);

      await waitFor(() => expect(onImagesChange).toHaveBeenCalledWith(['file://photo.jpg']));
      onImagesChange.mockClear();

      await waitFor(() => expect(onImagesChange).toHaveBeenCalledWith([]), { timeout: 3000 });
    });

    it('자동 제거 전에 실패한 이미지를 수동으로 이미 제거했다면 다시 제거를 시도하지 않는다', async () => {
      setupUploadMock(jest.fn().mockRejectedValue(new Error('upload error')));
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const onImagesChange = jest.fn();
      const container = renderWithProviders(
        <StatefulImageUploader onImagesChange={onImagesChange} />
      );

      fireEvent.press(getButtons(container)[0]);
      await waitFor(() => expect(onImagesChange).toHaveBeenCalledWith(['file://photo.jpg']));

      // 업로드 실패로 상태가 'failed'가 될 때까지 대기한 뒤, 자동 제거 타이머(1.5초)가
      // 실행되기 전에 사용자가 직접 이미지를 탭해 제거한다.
      await waitFor(() => expect(getButtons(container)).toHaveLength(2));
      onImagesChange.mockClear();
      fireEvent.press(getButtons(container)[0]);
      expect(onImagesChange).toHaveBeenCalledWith([]);
      onImagesChange.mockClear();

      // 자동 제거 타이머가 실행되어도(imagesRef에 이미 uri가 없으므로) 더 이상
      // onImagesChange가 호출되지 않는다.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1700));
      });
      expect(onImagesChange).not.toHaveBeenCalled();
    });

    it('Error 인스턴스가 아닌 값으로 거부되면 기본 에러 메시지로 상태를 기록한다', async () => {
      setupUploadMock(jest.fn().mockRejectedValue('문자열 거부 사유'));
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const onUploadStateChange = jest.fn();
      const container = renderWithProviders(
        <StatefulImageUploader onUploadStateChange={onUploadStateChange} />
      );

      fireEvent.press(getButtons(container)[0]);

      await waitFor(() =>
        expect(onUploadStateChange).toHaveBeenCalledWith(
          expect.objectContaining({ hasFailedImages: true })
        )
      );
      expect(logger.error).toHaveBeenCalledWith('Image upload failed', '문자열 거부 사유');
    });

    it('이미 다른 이미지가 존재할 때 새 이미지 업로드가 실패해도 기존 이미지 상태는 그대로 유지된다', async () => {
      setupUploadMock(jest.fn().mockRejectedValue(new Error('upload error')));
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://c.jpg' }],
      });

      const initialImages: ImageType[] = [
        { imageId: 1, imageUrl: 'file://a.jpg' },
        { imageId: 2, imageUrl: 'file://b.jpg' },
      ];
      const onUploadStateChange = jest.fn();
      const container = renderWithProviders(
        <StatefulImageUploader
          initialImages={initialImages}
          onUploadStateChange={onUploadStateChange}
        />
      );

      const buttons = getButtons(container);
      fireEvent.press(buttons[buttons.length - 1]);

      await waitFor(() =>
        expect(onUploadStateChange).toHaveBeenCalledWith(
          expect.objectContaining({ uploadedCount: 2, hasFailedImages: true })
        )
      );
    });
  });

  describe('이미지 제거', () => {
    it('이미지 탭 시 onImagesChange가 빈 배열로 호출된다', () => {
      const onImagesChange = jest.fn();
      const container = renderWithProviders(
        <ImageUploader images={['file://a.jpg']} onImagesChange={onImagesChange} />
      );

      // 첫 번째 버튼은 이미지 버튼
      fireEvent.press(getButtons(container)[0]);

      expect(onImagesChange).toHaveBeenCalledWith([]);
    });

    it('readonly=true이면 이미지 탭해도 onImagesChange가 호출되지 않는다', () => {
      const onImagesChange = jest.fn();
      const container = renderWithProviders(
        <ImageUploader images={['file://a.jpg']} readonly onImagesChange={onImagesChange} />
      );

      fireEvent.press(getButtons(container)[0]);

      expect(onImagesChange).not.toHaveBeenCalled();
    });
  });

  describe('onUploadStateChange', () => {
    it('업로드 완료 후 uploadedCount=1로 onUploadStateChange가 호출된다', async () => {
      setupUploadMock(
        jest.fn().mockResolvedValue({ imageId: 1, imageUrl: 'https://example.com/img.jpg' })
      );
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const onUploadStateChange = jest.fn();
      const container = renderWithProviders(
        <ImageUploader onUploadStateChange={onUploadStateChange} />
      );

      fireEvent.press(getButtons(container)[0]);

      await waitFor(() =>
        expect(onUploadStateChange).toHaveBeenCalledWith(
          expect.objectContaining({ uploadedCount: 1, hasUploadingImages: false })
        )
      );
    });
  });

  describe('initialImages 지연 업데이트', () => {
    it('마운트 이후 initialImages가 비동기로 채워지면 imageStatuses를 초기화한다', () => {
      const onUploadStateChange = jest.fn();
      const { rerender } = renderWithProviders(
        <ImageUploader initialImages={[]} onUploadStateChange={onUploadStateChange} />
      );

      const laterImages: ImageType[] = [{ imageId: 1, imageUrl: 'https://example.com/x.jpg' }];
      rerender(
        <ImageUploader initialImages={laterImages} onUploadStateChange={onUploadStateChange} />
      );

      expect(onUploadStateChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ uploadedCount: 1 })
      );
    });

    it('imageStatuses가 이미 채워져 있으면 initialImages 갱신을 다시 반영하지 않는다', () => {
      const onUploadStateChange = jest.fn();
      const initial: ImageType[] = [{ imageId: 1, imageUrl: 'https://example.com/a.jpg' }];
      const { rerender } = renderWithProviders(
        <ImageUploader initialImages={initial} onUploadStateChange={onUploadStateChange} />
      );

      const changed: ImageType[] = [
        { imageId: 1, imageUrl: 'https://example.com/a.jpg' },
        { imageId: 2, imageUrl: 'https://example.com/b.jpg' },
      ];
      rerender(<ImageUploader initialImages={changed} onUploadStateChange={onUploadStateChange} />);

      // 최초 마운트에서 이미 imageStatuses.length > 0이었으므로 effect의 재초기화 조건이 성립하지 않는다.
      expect(onUploadStateChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ uploadedCount: 1 })
      );
    });
  });

  describe('파일 크기 초과', () => {
    it('갤러리에서 선택한 파일이 10MB를 초과하면 Toast 에러를 표시하고 업로드하지 않는다', async () => {
      const Toast = require('react-native-toast-message');
      const mutateAsync = setupUploadMock();
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://big.jpg', fileSize: 11 * 1024 * 1024 }],
      });

      const onImagesChange = jest.fn();
      const container = renderWithProviders(<ImageUploader onImagesChange={onImagesChange} />);
      fireEvent.press(getButtons(container)[0]);

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error', text1: '파일 크기 초과' })
        )
      );
      expect(mutateAsync).not.toHaveBeenCalled();
      expect(onImagesChange).not.toHaveBeenCalled();
    });
  });

  describe('선택/촬영 중 예외 처리', () => {
    it('갤러리 실행 중 오류가 발생하면 logger.error로 기록한다', async () => {
      mockRequestGalleryPermission.mockResolvedValue({ granted: true });
      const galleryError = new Error('gallery boom');
      mockLaunchGallery.mockRejectedValue(galleryError);

      const container = renderWithProviders(<ImageUploader />);
      fireEvent.press(getButtons(container)[0]);

      await waitFor(() =>
        expect(logger.error).toHaveBeenCalledWith('이미지 선택 중 오류', galleryError)
      );
    });

    it('카메라 실행 중 오류가 발생하면 logger.error로 기록한다', async () => {
      mockActionSheetCamera();
      mockRequestCameraPermission.mockResolvedValue({ granted: true });
      const cameraError = new Error('camera boom');
      mockLaunchCamera.mockRejectedValue(cameraError);

      const container = renderWithProviders(<ImageUploader />);
      fireEvent.press(getButtons(container)[0]);

      await waitFor(() =>
        expect(logger.error).toHaveBeenCalledWith('카메라 촬영 중 오류', cameraError)
      );
    });
  });

  describe('안드로이드 사진 선택', () => {
    const originalOS = Platform.OS;

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    });

    it('안드로이드에서는 Alert.alert로 선택지를 표시한다', () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      const container = renderWithProviders(<ImageUploader />);
      fireEvent.press(getButtons(container)[0]);

      expect(alertSpy).toHaveBeenCalledWith(
        '사진 선택',
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ text: '취소' }),
          expect.objectContaining({ text: '갤러리에서 선택' }),
          expect.objectContaining({ text: '카메라로 촬영' }),
        ])
      );
    });
  });
});
