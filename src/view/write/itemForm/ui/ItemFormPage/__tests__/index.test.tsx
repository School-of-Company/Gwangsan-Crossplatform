import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { renderWithProviders } from '~/test-utils';
import { createItem } from '~/entity/write/itemForm/api/createItem';
import ItemFormPage from '../index';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

// ItemFormPage also wires up useGetItem/useEditPost (for the edit flow), which
// pull in '~/shared/lib/axios' -> setData/auth -> AsyncStorage & SecureStore.
// Those native modules aren't available under Jest, so stub them out.
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/entity/write/itemForm/api/createItem', () => ({
  createItem: jest.fn(),
}));

// The real '@/shared/ui' barrel also re-exports Footer, which pulls in the
// chat entity -> axios -> AsyncStorage chain (native module, unavailable in
// this test environment). Re-export the real, self-contained Header/Input/
// Button implementations directly to sidestep that chain while keeping
// real component behavior (placeholders, disabled handling, etc.).
jest.mock('@/shared/ui', () => ({
  Header: require('@/shared/ui/Header').Header,
  Input: require('@/shared/ui/Input').Input,
  Button: require('@/shared/ui/Button').Button,
}));

jest.mock('@/shared/ui/ImageUploader', () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ onImagesChange, onImageIdsChange, onUploadStateChange }: any) => (
      <View testID="image-uploader">
        <TouchableOpacity
          testID="add-image-button"
          onPress={() => {
            onImagesChange?.(['file://test-image.jpg']);
            onImageIdsChange?.([1]);
            onUploadStateChange?.({
              totalImages: 1,
              uploadingCount: 0,
              uploadedCount: 1,
              hasUploadingImages: false,
              hasFailedImages: false,
            });
          }}>
          <Text>이미지 추가</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockCreateItem = createItem as jest.Mock;
const mockToastShow = Toast.show as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

const fillRequiredFields = (getByPlaceholderText: any) => {
  fireEvent.changeText(getByPlaceholderText('주제를 작성해주세요'), '테스트 제목');
  fireEvent.changeText(getByPlaceholderText('내용을 작성해주세요'), '테스트 내용');
  fireEvent.changeText(getByPlaceholderText('광산을 입력해주세요'), '1000');
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({});
});

describe('ItemFormPage', () => {
  describe('초기 렌더링', () => {
    it('필수 입력 필드와 등록 버튼을 렌더링한다', () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(<ItemFormPage />);

      expect(getByPlaceholderText('주제를 작성해주세요')).toBeTruthy();
      expect(getByPlaceholderText('내용을 작성해주세요')).toBeTruthy();
      expect(getByPlaceholderText('광산을 입력해주세요')).toBeTruthy();
      expect(getByText('등록하기')).toBeTruthy();
    });
  });

  describe('폼 검증', () => {
    it('필수 값이 비어있으면 제출해도 등록 API가 호출되지 않는다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByText } = renderWithProviders(<ItemFormPage />);

      fireEvent.press(getByText('등록하기'));

      expect(mockCreateItem).not.toHaveBeenCalled();
    });

    it('일부 필드만 채워도 등록 버튼이 비활성화되어 제출되지 않는다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText, getByText } = renderWithProviders(<ItemFormPage />);

      fireEvent.changeText(getByPlaceholderText('주제를 작성해주세요'), '제목만 입력');
      fireEvent.press(getByText('등록하기'));

      expect(mockCreateItem).not.toHaveBeenCalled();
    });

    it('물건 나눔(OBJECT + GIVER)인 경우 이미지가 없으면 제출되지 않는다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'OBJECT', mode: 'GIVER' });
      const { getByPlaceholderText, getByText } = renderWithProviders(<ItemFormPage />);

      fillRequiredFields(getByPlaceholderText);
      fireEvent.press(getByText('등록하기'));

      expect(mockCreateItem).not.toHaveBeenCalled();
    });

    it('물건 나눔(OBJECT + GIVER)에서 이미지를 추가하면 제출할 수 있다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'OBJECT', mode: 'GIVER' });
      mockCreateItem.mockResolvedValue({ id: 1 });
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <ItemFormPage />
      );

      fillRequiredFields(getByPlaceholderText);
      fireEvent.press(getByTestId('add-image-button'));
      fireEvent.press(getByText('등록하기'));

      await waitFor(() => expect(mockCreateItem).toHaveBeenCalledTimes(1));
      expect(mockCreateItem).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'OBJECT', mode: 'GIVER', imageIds: [1] })
      );
    });

    it('광산 입력 시 숫자가 아닌 문자는 제거된다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText } = renderWithProviders(<ItemFormPage />);

      const gwangsanInput = getByPlaceholderText('광산을 입력해주세요');
      fireEvent.changeText(gwangsanInput, 'a1b2c3');

      expect(gwangsanInput.props.value).toBe('123');
    });
  });

  describe('등록 성공', () => {
    it('모든 필드를 채우고 제출하면 등록 API가 호출되고 성공 토스트와 함께 메인으로 이동한다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      mockCreateItem.mockResolvedValue({ id: 1 });
      const { getByPlaceholderText, getByText } = renderWithProviders(<ItemFormPage />);

      fillRequiredFields(getByPlaceholderText);
      fireEvent.press(getByText('등록하기'));

      await waitFor(() => expect(mockCreateItem).toHaveBeenCalledTimes(1));

      expect(mockCreateItem).toHaveBeenCalledWith({
        type: 'SERVICE',
        mode: 'GIVER',
        title: '테스트 제목',
        content: '테스트 내용',
        gwangsan: 1000,
        imageIds: undefined,
      });

      await waitFor(() =>
        expect(mockToastShow).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success', text1: '등록 완료' })
        )
      );
      expect(mockRouterReplace).toHaveBeenCalledWith({ pathname: '/main' });
    });
  });

  describe('등록 실패', () => {
    it('등록 API가 실패하면 에러 토스트를 표시하고 화면 이동은 하지 않는다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      mockCreateItem.mockRejectedValue(new Error('네트워크 오류'));
      const { getByPlaceholderText, getByText } = renderWithProviders(<ItemFormPage />);

      fillRequiredFields(getByPlaceholderText);
      fireEvent.press(getByText('등록하기'));

      await waitFor(() => expect(mockCreateItem).toHaveBeenCalledTimes(1));

      await waitFor(() =>
        expect(mockToastShow).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error', text1: '등록 실패' })
        )
      );
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });
});
