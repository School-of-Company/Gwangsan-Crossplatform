import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useCreateFeedback } from '~/entity/feedback';
import FeedbackWritePage from '../index';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  router: { back: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('~/shared/lib/axios', () => ({ instance: {} }));

jest.mock('~/entity/feedback', () => ({
  ...jest.requireActual('~/entity/feedback'),
  useCreateFeedback: jest.fn(),
}));

// 이미지 선택·업로드는 ImageUploader 자체 테스트가 맡으므로, 여기서는 상위로 올려주는
// 콜백만 테스트에서 직접 호출할 수 있게 바꿔둔다.
let uploaderProps: {
  onImageIdsChange?: (ids: number[]) => void;
  onUploadStateChange?: (state: Record<string, unknown>) => void;
} = {};
jest.mock('~/shared/ui/ImageUploader', () => ({
  __esModule: true,
  default: (props: typeof uploaderProps) => {
    uploaderProps = props;
    return null;
  },
}));

const mockUseCreateFeedback = useCreateFeedback as jest.Mock;
const mockCreateFeedback = jest.fn();

const uploadState = (overrides: Record<string, unknown> = {}) => ({
  totalImages: 1,
  uploadingCount: 0,
  uploadedCount: 1,
  hasUploadingImages: false,
  hasFailedImages: false,
  ...overrides,
});

const fillForm = (utils: ReturnType<typeof render>) => {
  fireEvent.press(utils.getByText('문의유형을 선택해주세요.'));
  fireEvent.press(utils.getByText('거래 관련'));
  fireEvent.changeText(
    utils.getByPlaceholderText('불편했던 점이나 개선 의견을 자유롭게 적어주세요'),
    '  예약 시간이 안 바뀌어요  '
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  uploaderProps = {};
  mockUseCreateFeedback.mockReturnValue({ createFeedback: mockCreateFeedback, isLoading: false });
});

describe('FeedbackWritePage', () => {
  it('문의유형, 내용, 스크린샷 입력과 보내기 버튼을 그린다', () => {
    const { getByText, getByPlaceholderText } = render(<FeedbackWritePage />);

    expect(getByText('문의/의견 보내기')).toBeTruthy();
    expect(getByText('문의유형을 선택해주세요.')).toBeTruthy();
    expect(getByPlaceholderText('불편했던 점이나 개선 의견을 자유롭게 적어주세요')).toBeTruthy();
    expect(getByText('보내기')).toBeTruthy();
  });

  it('유형과 내용이 없으면 보내지 않는다', () => {
    const { getByText } = render(<FeedbackWritePage />);

    fireEvent.press(getByText('보내기'));

    expect(mockCreateFeedback).not.toHaveBeenCalled();
  });

  it('유형과 내용을 채우면 앞뒤 공백을 지운 내용과 이미지 id로 전송한다', () => {
    const utils = render(<FeedbackWritePage />);
    fillForm(utils);
    act(() => uploaderProps.onImageIdsChange?.([4, 5]));

    fireEvent.press(utils.getByText('보내기'));

    expect(mockCreateFeedback).toHaveBeenCalledWith({
      type: 'TRADE',
      content: '예약 시간이 안 바뀌어요',
      imageIds: [4, 5],
    });
  });

  it('공백만 입력하면 보내지 않는다', () => {
    const utils = render(<FeedbackWritePage />);
    fireEvent.press(utils.getByText('문의유형을 선택해주세요.'));
    fireEvent.press(utils.getByText('기타'));
    fireEvent.changeText(
      utils.getByPlaceholderText('불편했던 점이나 개선 의견을 자유롭게 적어주세요'),
      '   '
    );

    fireEvent.press(utils.getByText('보내기'));

    expect(mockCreateFeedback).not.toHaveBeenCalled();
  });

  it('이미지 업로드 중에는 버튼 문구가 바뀌고 전송되지 않는다', () => {
    const utils = render(<FeedbackWritePage />);
    fillForm(utils);
    act(() => uploaderProps.onUploadStateChange?.(uploadState({ hasUploadingImages: true })));

    fireEvent.press(utils.getByText('이미지 업로드 중...'));

    expect(mockCreateFeedback).not.toHaveBeenCalled();
  });

  it('이미지 업로드가 실패하면 실패 문구를 보여주고 전송되지 않는다', () => {
    const utils = render(<FeedbackWritePage />);
    fillForm(utils);
    act(() => uploaderProps.onUploadStateChange?.(uploadState({ hasFailedImages: true })));

    fireEvent.press(utils.getByText('이미지 업로드 실패'));

    expect(mockCreateFeedback).not.toHaveBeenCalled();
  });

  it('전송 중에는 "전송 중..."을 보여준다', () => {
    mockUseCreateFeedback.mockReturnValue({ createFeedback: mockCreateFeedback, isLoading: true });

    const { getByText } = render(<FeedbackWritePage />);

    expect(getByText('전송 중...')).toBeTruthy();
  });

  it('전송에 성공하면 이전 화면(문의 목록)으로 돌아간다', () => {
    render(<FeedbackWritePage />);
    const onSuccess = mockUseCreateFeedback.mock.calls[0][0] as () => void;

    act(() => onSuccess());

    expect(mockBack).toHaveBeenCalled();
  });
});
