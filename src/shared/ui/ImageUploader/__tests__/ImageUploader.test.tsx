import React, { useState } from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { ActionSheetIOS, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { renderWithProviders } from '~/test-utils';
import ImageUploader from '../index';
import { useUploadImage } from '@/shared/model/useUploadImage';

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
}: {
  onImagesChange?: jest.Mock;
  onImageIdsChange?: jest.Mock;
  onUploadStateChange?: jest.Mock;
}) => {
  const [images, setImages] = useState<string[]>([]);
  return (
    <ImageUploader
      images={images}
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
});
