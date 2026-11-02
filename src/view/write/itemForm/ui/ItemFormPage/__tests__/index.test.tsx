import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { renderWithProviders } from '~/test-utils';
import { createItem } from '~/entity/write/itemForm/api/createItem';
import { getItem } from '~/entity/post/api/getItem';
import { editPost } from '~/entity/post/api/editPost';
import ItemFormPage from '../index';

const mockNavigation = {
  setOptions: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
  useNavigation: () => mockNavigation,
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

jest.mock('~/entity/post/api/getItem', () => ({
  getItem: jest.fn(),
}));

jest.mock('~/entity/post/api/editPost', () => ({
  editPost: jest.fn(),
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
const mockGetItem = getItem as jest.Mock;
const mockEditPost = editPost as jest.Mock;
const mockToastShow = Toast.show as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

const makePostDetail = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 5,
  type: 'SERVICE',
  mode: 'GIVER',
  title: '기존 제목',
  content: '기존 내용',
  gwangsan: 5000,
  isCompletable: false,
  isCompleted: false,
  isReserved: false,
  images: [],
  member: { memberId: 1, nickname: '닉네임', placeName: '광산구', light: 0 },
  ...overrides,
});

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

    it('필수 값이 비어 있으면 버튼 위에 첫 번째로 부족한 항목을 알려준다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText, getByTestId, queryByTestId } = renderWithProviders(
        <ItemFormPage />
      );

      expect(getByTestId('item-form-disabled-reason').props.children).toBe('주제를 입력해 주세요.');

      fireEvent.changeText(getByPlaceholderText('주제를 작성해주세요'), '제목');
      expect(getByTestId('item-form-disabled-reason').props.children).toBe('내용을 입력해 주세요.');

      fillRequiredFields(getByPlaceholderText);
      expect(queryByTestId('item-form-disabled-reason')).toBeNull();
    });

    it('물건 나눔에서 사진이 없으면 사진이 필요하다고 알려준다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'OBJECT', mode: 'GIVER' });
      const { getByPlaceholderText, getByTestId } = renderWithProviders(<ItemFormPage />);

      fillRequiredFields(getByPlaceholderText);

      expect(getByTestId('item-form-disabled-reason').props.children).toBe(
        '물건 나눔 글에는 사진을 1장 이상 올려 주세요.'
      );
    });

    it('광산이 음수여도 제출된다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText, getByText, queryByTestId } = renderWithProviders(
        <ItemFormPage />
      );

      fillRequiredFields(getByPlaceholderText);
      fireEvent.changeText(getByPlaceholderText('광산을 입력해주세요'), '-500');
      fireEvent.press(getByText('등록하기'));

      expect(queryByTestId('gwangsan-error')).toBeNull();
      await waitFor(() => expect(mockCreateItem).toHaveBeenCalledTimes(1));
      expect(mockCreateItem).toHaveBeenCalledWith(expect.objectContaining({ gwangsan: -500 }));
    });

    it('광산에 "-"만 입력하면 오류 문구를 보여주고 제출되지 않는다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText, getByTestId, getByText } = renderWithProviders(
        <ItemFormPage />
      );

      fillRequiredFields(getByPlaceholderText);
      fireEvent.changeText(getByPlaceholderText('광산을 입력해주세요'), '-');
      fireEvent.press(getByText('등록하기'));

      expect(getByTestId('gwangsan-error').props.children).toBe('광산을 숫자로 입력해 주세요.');
      expect(mockCreateItem).not.toHaveBeenCalled();
    });

    it('광산이 서버 최댓값(2,147,483,647)을 넘으면 제출되지 않는다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText, getByTestId, getByText } = renderWithProviders(
        <ItemFormPage />
      );

      fillRequiredFields(getByPlaceholderText);
      fireEvent.changeText(getByPlaceholderText('광산을 입력해주세요'), '2147483648');
      fireEvent.press(getByText('등록하기'));

      expect(getByTestId('gwangsan-error')).toBeTruthy();
      expect(mockCreateItem).not.toHaveBeenCalled();
    });

    it('주제 입력은 서버 제한인 20자로 제한된다', () => {
      const { getByPlaceholderText } = renderWithProviders(<ItemFormPage />);

      expect(getByPlaceholderText('주제를 작성해주세요').props.maxLength).toBe(20);
    });

    it('광산 입력 시 숫자가 아닌 문자는 제거된다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText } = renderWithProviders(<ItemFormPage />);

      const gwangsanInput = getByPlaceholderText('광산을 입력해주세요');
      fireEvent.changeText(gwangsanInput, 'a1b2c3');

      expect(gwangsanInput.props.value).toBe('123');
    });

    it('광산 입력은 맨 앞의 "-" 하나만 남긴다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText } = renderWithProviders(<ItemFormPage />);

      const gwangsanInput = getByPlaceholderText('광산을 입력해주세요');
      fireEvent.changeText(gwangsanInput, '--1-2');

      expect(gwangsanInput.props.value).toBe('-12');
    });

    it('광산 입력에 포커스가 가면 스크롤을 맨 아래로 이동시킨다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText } = renderWithProviders(<ItemFormPage />);

      const gwangsanInput = getByPlaceholderText('광산을 입력해주세요');

      expect(() => fireEvent(gwangsanInput, 'focus')).not.toThrow();
    });
  });

  describe('작성 중 이탈 확인', () => {
    const getBeforeRemoveListener = () => {
      const calls = mockNavigation.addListener.mock.calls as unknown as [
        string,
        (event: unknown) => void,
      ][];
      return calls.filter(([name]) => name === 'beforeRemove').at(-1)?.[1];
    };

    it('입력한 내용이 있으면 뒤로가기를 막고 확인 모달을 띄운다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      const { getByPlaceholderText, getByText } = renderWithProviders(<ItemFormPage />);

      fireEvent.changeText(getByPlaceholderText('주제를 작성해주세요'), '제목');

      const preventDefault = jest.fn();
      act(() => {
        getBeforeRemoveListener()?.({ preventDefault, data: { action: { type: 'GO_BACK' } } });
      });

      expect(preventDefault).toHaveBeenCalled();
      expect(getByText('나가기')).toBeTruthy();

      fireEvent.press(getByText('나가기'));
      expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
    });

    it('아무것도 입력하지 않았으면 확인 없이 나간다', () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      renderWithProviders(<ItemFormPage />);

      const preventDefault = jest.fn();
      act(() => {
        getBeforeRemoveListener()?.({ preventDefault, data: { action: { type: 'GO_BACK' } } });
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('수정 모드에서 기존 값 그대로면 확인 없이 나간다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockGetItem.mockResolvedValue(makePostDetail());
      const { findByDisplayValue } = renderWithProviders(<ItemFormPage />);

      await findByDisplayValue('기존 제목');

      const preventDefault = jest.fn();
      act(() => {
        getBeforeRemoveListener()?.({ preventDefault, data: { action: { type: 'GO_BACK' } } });
      });

      expect(preventDefault).not.toHaveBeenCalled();
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

  describe('연타 방지', () => {
    it('등록 버튼을 같은 프레임에 연타해도 등록 API는 한 번만 호출된다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ type: 'SERVICE', mode: 'GIVER' });
      let resolveCreate: (value: unknown) => void = () => {};
      mockCreateItem.mockReturnValue(new Promise((resolve) => (resolveCreate = resolve)));
      const { getByPlaceholderText, getByText } = renderWithProviders(<ItemFormPage />);

      fillRequiredFields(getByPlaceholderText);
      const submitButton = getByText('등록하기');
      // 하나의 act 안에서 누르면 그 사이에 리렌더가 없어 같은 프레임의 연타와 같다
      act(() => {
        fireEvent.press(submitButton);
        fireEvent.press(submitButton);
        fireEvent.press(submitButton);
      });

      await waitFor(() => expect(mockCreateItem).toHaveBeenCalledTimes(1));
      resolveCreate({ id: 1 });
      await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledTimes(1));
      expect(mockCreateItem).toHaveBeenCalledTimes(1);
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

  // NOTE ON COVERAGE: handleSubmit's own `imageUploadState?.hasUploadingImages` /
  // `hasFailedImages` guards (with their Toast + early-return) are dead code reachable
  // only if handleSubmit runs while either flag is true. But `isFormValid` already folds
  // `imagesReady` (`!hasUploadingImages && !hasFailedImages`) into its result regardless
  // of `mustHaveImage`, and the submit Button is `disabled={!isFormValid || isSubmitting}`
  // — TouchableOpacity's native `disabled` blocks onPress entirely. So by the time either
  // flag is true, the button is already disabled and handleSubmit can never run with that
  // state through any user-reachable path. Confirmed by pressing the (still-enabled-looking)
  // button after setting each flag via the ImageUploader mock: the button silently no-ops
  // rather than reaching these branches. Left uncovered rather than forcing an artificial
  // direct call into a non-exported handler.

  describe('수정 모드 (id 파라미터가 있는 경우)', () => {
    it('게시글 조회 중에는 로딩 스피너를 보여준다', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockGetItem.mockReturnValue(new Promise(() => {})); // never resolves
      const { queryByText, UNSAFE_root } = renderWithProviders(<ItemFormPage />);

      expect(queryByText('등록하기')).toBeNull();
      expect(UNSAFE_root.findAllByType(require('react-native').ActivityIndicator)).toHaveLength(1);
    });

    it('게시글 조회에 실패하면 에러 문구를 보여준다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockGetItem.mockRejectedValue(new Error('not found'));

      const { findByText } = renderWithProviders(<ItemFormPage />);

      expect(await findByText('게시글을 불러오는데 실패했습니다.')).toBeTruthy();
    });

    it('게시글 조회 실패 화면에서 다시 시도를 누르면 다시 조회한다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockGetItem.mockRejectedValue(new Error('not found'));

      const { findByText } = renderWithProviders(<ItemFormPage />);
      fireEvent.press(await findByText('다시 시도'));

      await waitFor(() => expect(mockGetItem).toHaveBeenCalledTimes(2));
    });

    it('게시글 조회에 성공하면 기존 값으로 폼을 채우고 "수정하기" 버튼을 보여준다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockGetItem.mockResolvedValue(
        makePostDetail({
          images: [{ imageId: 10, imageUrl: 'https://example.com/a.jpg' }],
        })
      );

      const { findByText, getByPlaceholderText } = renderWithProviders(<ItemFormPage />);

      expect(await findByText('수정하기')).toBeTruthy();
      expect(getByPlaceholderText('주제를 작성해주세요').props.value).toBe('기존 제목');
      // TextField는 IME 조합 끊김/포커스 시 값 유실을 막기 위해 `value`가 아니라
      // `defaultValue`로 값을 반영한다(School-of-Company/Gwangsan-Crossplatform#642).
      expect(getByPlaceholderText('내용을 작성해주세요').props.defaultValue).toBe('기존 내용');
      expect(getByPlaceholderText('광산을 입력해주세요').props.value).toBe('5000');
    });

    it('수정 모드에서 제출하면 editPost API를 호출하고 createItem은 호출하지 않는다', async () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '5' });
      mockGetItem.mockResolvedValue(makePostDetail());
      mockEditPost.mockResolvedValue({ id: 5 });

      const { findByText, getByText } = renderWithProviders(<ItemFormPage />);
      await findByText('수정하기');

      fireEvent.press(getByText('수정하기'));

      await waitFor(() => expect(mockEditPost).toHaveBeenCalledTimes(1));
      expect(mockEditPost).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({ title: '기존 제목' })
      );
      expect(mockCreateItem).not.toHaveBeenCalled();
      await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith({ pathname: '/main' }));
    });
  });
});
