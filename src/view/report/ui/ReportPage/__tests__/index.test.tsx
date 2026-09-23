import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReport } from '~/entity/post/model/useReport';
import ReportPage from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('~/entity/post/model/useReport', () => ({
  useReport: jest.fn(),
}));

jest.mock('~/shared/ui', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return {
    Header: ({ headerTitle }: any) => <Text testID="header-title">{headerTitle}</Text>,
    Button: ({ children, onPress, disabled }: any) => (
      <TouchableOpacity
        testID="report-submit-button"
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ disabled: !!disabled }}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('~/shared/ui/Dropdown', () => ({
  Dropdown: ({ onSelect, placeholder }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="dropdown" onPress={() => onSelect('SPAM_AD')}>
        <Text>{placeholder}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('~/shared/ui/TextField', () => ({
  TextField: ({ value, onChangeText }: any) => {
    const { TextInput } = require('react-native');
    return <TextInput testID="report-text-field" value={value} onChangeText={onChangeText} />;
  },
}));

jest.mock('~/shared/ui/ImageUploader', () => ({
  __esModule: true,
  default: ({ onImageIdsChange, onUploadStateChange }: any) => {
    const { View, TouchableOpacity } = require('react-native');
    return (
      <View testID="image-uploader">
        <TouchableOpacity testID="image-ids-trigger" onPress={() => onImageIdsChange([1, 2])} />
        <TouchableOpacity
          testID="upload-state-trigger"
          onPress={() =>
            onUploadStateChange({
              hasUploadingImages: false,
              hasFailedImages: false,
            })
          }
        />
      </View>
    );
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseReport = useReport as jest.Mock;
const mockBack = jest.fn();

const makeUseReportReturn = (overrides = {}) => ({
  reportType: null,
  contents: '',
  imageIds: [],
  imageUploadState: undefined,
  setReportType: jest.fn(),
  setContents: jest.fn(),
  setImageIds: jest.fn(),
  setImageUploadState: jest.fn(),
  handleSubmit: jest.fn(),
  resetForm: jest.fn(),
  canSubmit: false,
  isLoading: false,
  error: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ productId: '1', memberId: '42' });
  mockUseRouter.mockReturnValue({ back: mockBack });
  mockUseReport.mockReturnValue(makeUseReportReturn());
});

describe('ReportPage', () => {
  it('"신고하기" 헤더를 표시한다', () => {
    const { getByTestId } = render(<ReportPage />);

    expect(getByTestId('header-title').props.children).toBe('신고하기');
  });

  it('쿼리 파라미터의 productId/memberId를 숫자로 바꿔 useReport에 전달한다', () => {
    render(<ReportPage />);

    expect(mockUseReport).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 1, memberId: 42 })
    );
  });

  it('memberId만 있으면 productId 없이 useReport를 호출한다', () => {
    mockUseLocalSearchParams.mockReturnValue({ memberId: '42' });

    render(<ReportPage />);

    expect(mockUseReport).toHaveBeenCalledWith(
      expect.objectContaining({ productId: undefined, memberId: 42 })
    );
  });

  it('신고가 성공하면 이전 화면으로 돌아간다', () => {
    render(<ReportPage />);

    const { onSuccess } = mockUseReport.mock.calls[0][0];
    onSuccess();

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('canSubmit=false이면 제출 버튼이 비활성화된다', () => {
    const { getByTestId } = render(<ReportPage />);

    expect(getByTestId('report-submit-button').props.accessibilityState.disabled).toBe(true);
  });

  it('canSubmit=true이면 제출 버튼이 활성화된다', () => {
    mockUseReport.mockReturnValue(makeUseReportReturn({ canSubmit: true }));

    const { getByTestId } = render(<ReportPage />);

    expect(getByTestId('report-submit-button').props.accessibilityState.disabled).toBe(false);
  });

  it('isLoading=true이면 "신고 처리 중..." 텍스트를 표시한다', () => {
    mockUseReport.mockReturnValue(makeUseReportReturn({ isLoading: true }));

    const { getByText } = render(<ReportPage />);

    expect(getByText('신고 처리 중...')).toBeTruthy();
  });

  it('이미지 업로드 중이면 "이미지 업로드 중..." 텍스트를 표시한다', () => {
    mockUseReport.mockReturnValue(
      makeUseReportReturn({
        imageUploadState: { hasUploadingImages: true, hasFailedImages: false },
      })
    );

    const { getByText } = render(<ReportPage />);

    expect(getByText('이미지 업로드 중...')).toBeTruthy();
  });

  it('이미지 업로드 실패 시 "이미지 업로드 실패" 텍스트를 표시한다', () => {
    mockUseReport.mockReturnValue(
      makeUseReportReturn({
        imageUploadState: { hasUploadingImages: false, hasFailedImages: true },
      })
    );

    const { getByText } = render(<ReportPage />);

    expect(getByText('이미지 업로드 실패')).toBeTruthy();
  });

  it('드롭다운 선택 시 setReportType이 호출된다', () => {
    const setReportType = jest.fn();
    mockUseReport.mockReturnValue(makeUseReportReturn({ setReportType }));

    const { getByTestId } = render(<ReportPage />);

    fireEvent.press(getByTestId('dropdown'));

    expect(setReportType).toHaveBeenCalledWith('SPAM_AD');
  });

  it('reportType과 contents가 모두 있으면 제출 시 trim된 내용으로 handleSubmit이 호출된다', () => {
    const handleSubmit = jest.fn();
    mockUseReport.mockReturnValue(
      makeUseReportReturn({
        reportType: 'SPAM_AD',
        contents: '  신고 내용입니다  ',
        canSubmit: true,
        handleSubmit,
      })
    );

    const { getByTestId } = render(<ReportPage />);

    fireEvent.press(getByTestId('report-submit-button'));

    expect(handleSubmit).toHaveBeenCalledWith('SPAM_AD', '신고 내용입니다');
  });

  it('reportType이 없으면 제출해도 handleSubmit이 호출되지 않는다', () => {
    const handleSubmit = jest.fn();
    mockUseReport.mockReturnValue(
      makeUseReportReturn({ reportType: null, contents: '내용', canSubmit: true, handleSubmit })
    );

    const { getByTestId } = render(<ReportPage />);

    fireEvent.press(getByTestId('report-submit-button'));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('contents가 공백뿐이면 제출해도 handleSubmit이 호출되지 않는다', () => {
    const handleSubmit = jest.fn();
    mockUseReport.mockReturnValue(
      makeUseReportReturn({
        reportType: 'SPAM_AD',
        contents: '   ',
        canSubmit: true,
        handleSubmit,
      })
    );

    const { getByTestId } = render(<ReportPage />);

    fireEvent.press(getByTestId('report-submit-button'));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('이미지 업로드 결과가 useReport로 전달된다', () => {
    const setImageIds = jest.fn();
    const setImageUploadState = jest.fn();
    mockUseReport.mockReturnValue(makeUseReportReturn({ setImageIds, setImageUploadState }));

    const { getByTestId } = render(<ReportPage />);

    fireEvent.press(getByTestId('image-ids-trigger'));
    fireEvent.press(getByTestId('upload-state-trigger'));

    expect(setImageIds).toHaveBeenCalledWith([1, 2]);
    expect(setImageUploadState).toHaveBeenCalledWith(
      expect.objectContaining({ hasUploadingImages: false, hasFailedImages: false })
    );
  });
});
