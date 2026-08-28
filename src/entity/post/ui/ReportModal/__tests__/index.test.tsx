import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ReportModal from '../index';
import { useReport } from '~/entity/post/model/useReport';

jest.mock('~/entity/post/model/useReport', () => ({
  useReport: jest.fn(),
}));

jest.mock('~/shared/ui', () => ({
  BottomSheetModalWrapper: ({ isVisible, children, title, onClose }: any) => {
    if (!isVisible) return null;
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity testID="modal-close-button" onPress={onClose} />
        {children}
      </View>
    );
  },
}));

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

jest.mock('~/shared/ui/Button', () => ({
  Button: ({ children, onPress, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        testID="report-submit-button"
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ disabled: !!disabled }}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
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
              totalImages: 0,
              uploadingCount: 0,
              uploadedCount: 0,
            })
          }
        />
      </View>
    );
  },
}));

const mockUseReport = useReport as jest.Mock;

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

const defaultProps = {
  productId: 1,
  memberId: 42,
  isVisible: true,
  onClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseReport.mockReturnValue(makeUseReportReturn());
});

describe('ReportModal', () => {
  it('isVisible=false이면 렌더링하지 않는다', () => {
    const { queryByText } = render(<ReportModal {...defaultProps} isVisible={false} />);

    expect(queryByText('신고하기')).toBeNull();
  });

  it('isVisible=true이면 "신고하기" 타이틀을 표시한다', () => {
    const { getAllByText } = render(<ReportModal {...defaultProps} />);

    expect(getAllByText('신고하기').length).toBeGreaterThan(0);
  });

  it('canSubmit=false이면 제출 버튼이 비활성화된다', () => {
    mockUseReport.mockReturnValue(makeUseReportReturn({ canSubmit: false }));

    const { getByTestId } = render(<ReportModal {...defaultProps} />);

    expect(getByTestId('report-submit-button').props.accessibilityState.disabled).toBe(true);
  });

  it('canSubmit=true이면 제출 버튼이 활성화된다', () => {
    mockUseReport.mockReturnValue(makeUseReportReturn({ canSubmit: true }));

    const { getByTestId } = render(<ReportModal {...defaultProps} />);

    expect(getByTestId('report-submit-button').props.accessibilityState.disabled).toBe(false);
  });

  it('isLoading=true이면 "신고 처리 중..." 텍스트를 표시한다', () => {
    mockUseReport.mockReturnValue(makeUseReportReturn({ isLoading: true }));

    const { getByText } = render(<ReportModal {...defaultProps} />);

    expect(getByText('신고 처리 중...')).toBeTruthy();
  });

  it('이미지 업로드 중이면 "이미지 업로드 중..." 텍스트를 표시한다', () => {
    mockUseReport.mockReturnValue(
      makeUseReportReturn({
        imageUploadState: { hasUploadingImages: true, hasFailedImages: false },
      })
    );

    const { getByText } = render(<ReportModal {...defaultProps} />);

    expect(getByText('이미지 업로드 중...')).toBeTruthy();
  });

  it('이미지 업로드 실패 시 "이미지 업로드 실패" 텍스트를 표시한다', () => {
    mockUseReport.mockReturnValue(
      makeUseReportReturn({
        imageUploadState: { hasUploadingImages: false, hasFailedImages: true },
      })
    );

    const { getByText } = render(<ReportModal {...defaultProps} />);

    expect(getByText('이미지 업로드 실패')).toBeTruthy();
  });

  it('모달 닫기 시 resetForm과 onClose가 호출된다', () => {
    const resetForm = jest.fn();
    const onClose = jest.fn();
    mockUseReport.mockReturnValue(makeUseReportReturn({ resetForm }));

    const { getByTestId } = render(<ReportModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByTestId('modal-close-button'));

    expect(resetForm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('productId와 memberId를 useReport에 전달한다', () => {
    render(<ReportModal {...defaultProps} productId={5} memberId={99} />);

    expect(mockUseReport).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 5, memberId: 99 })
    );
  });

  it('드롭다운 선택 시 setReportType이 호출된다', () => {
    const setReportType = jest.fn();
    mockUseReport.mockReturnValue(makeUseReportReturn({ setReportType }));

    const { getByTestId } = render(<ReportModal {...defaultProps} />);

    fireEvent.press(getByTestId('dropdown'));

    expect(setReportType).toHaveBeenCalledWith('SPAM_AD');
  });

  it('reportType과 contents가 모두 있으면 제출 시 handleSubmit이 trim된 내용으로 호출된다', () => {
    const handleSubmit = jest.fn();
    mockUseReport.mockReturnValue(
      makeUseReportReturn({
        reportType: 'SPAM_AD',
        contents: '  신고 내용입니다  ',
        canSubmit: true,
        handleSubmit,
      })
    );

    const { getByTestId } = render(<ReportModal {...defaultProps} />);

    fireEvent.press(getByTestId('report-submit-button'));

    expect(handleSubmit).toHaveBeenCalledWith('SPAM_AD', '신고 내용입니다');
  });

  it('reportType이 없으면 제출해도 handleSubmit이 호출되지 않는다', () => {
    const handleSubmit = jest.fn();
    mockUseReport.mockReturnValue(
      makeUseReportReturn({
        reportType: null,
        contents: '내용',
        canSubmit: true,
        handleSubmit,
      })
    );

    const { getByTestId } = render(<ReportModal {...defaultProps} />);

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

    const { getByTestId } = render(<ReportModal {...defaultProps} />);

    fireEvent.press(getByTestId('report-submit-button'));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('이미지 ID 변경 시 setImageIds가 호출된다', () => {
    const setImageIds = jest.fn();
    mockUseReport.mockReturnValue(makeUseReportReturn({ setImageIds }));

    const { getByTestId } = render(<ReportModal {...defaultProps} />);

    fireEvent.press(getByTestId('image-ids-trigger'));

    expect(setImageIds).toHaveBeenCalledWith([1, 2]);
  });

  it('업로드 상태 변경 시 setImageUploadState가 호출된다', () => {
    const setImageUploadState = jest.fn();
    mockUseReport.mockReturnValue(makeUseReportReturn({ setImageUploadState }));

    const { getByTestId } = render(<ReportModal {...defaultProps} />);

    fireEvent.press(getByTestId('upload-state-trigger'));

    expect(setImageUploadState).toHaveBeenCalledWith(
      expect.objectContaining({ hasUploadingImages: false, hasFailedImages: false })
    );
  });
});
