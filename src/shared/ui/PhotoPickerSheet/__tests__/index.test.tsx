import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import Toast from 'react-native-toast-message';
import { PhotoPickerSheet } from '../index';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockGetAssets = MediaLibrary.getAssetsAsync as jest.Mock;
const mockGetPermissions = MediaLibrary.getPermissionsAsync as jest.Mock;
const mockPresentPicker = MediaLibrary.presentPermissionsPickerAsync as jest.Mock;

const photos = ['p1', 'p2', 'p3', 'p4'].map((id) => ({ id, uri: `ph://${id}` }));

const renderSheet = (props: Partial<React.ComponentProps<typeof PhotoPickerSheet>> = {}) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const utils = render(
    <PhotoPickerSheet
      visible
      maxSelection={3}
      initialSelectedIds={[]}
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...props}
    />
  );
  return { ...utils, onConfirm, onCancel };
};

const isSelected = (getByTestId: (id: string) => any, id: string) =>
  getByTestId(`photo-tile-${id}`).props.accessibilityState?.selected;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAssets.mockResolvedValue({ assets: photos, endCursor: 'end', hasNextPage: false });
  mockGetPermissions.mockResolvedValue({ granted: true, accessPrivileges: 'all' });
});

describe('PhotoPickerSheet', () => {
  it('최신 사진을 불러와 그리드로 보여준다', async () => {
    const { getByTestId } = renderSheet();

    await waitFor(() => expect(getByTestId('photo-tile-p1')).toBeTruthy());
    expect(mockGetAssets).toHaveBeenCalledWith(
      expect.objectContaining({ mediaType: 'photo', sortBy: [['creationTime', false]] })
    );
  });

  it('이미 첨부한 사진은 선택된 상태로 보이고 순서 번호가 붙는다', async () => {
    const { getByTestId, getByText } = renderSheet({ initialSelectedIds: ['p3', 'p1'] });

    await waitFor(() => expect(getByTestId('photo-tile-p3')).toBeTruthy());
    expect(isSelected(getByTestId, 'p3')).toBe(true);
    expect(isSelected(getByTestId, 'p1')).toBe(true);
    expect(isSelected(getByTestId, 'p2')).toBe(false);
    expect(getByTestId('photo-tile-p3').props.accessibilityLabel).toBe('1번째로 선택된 사진');
    expect(getByText('2장 선택 완료')).toBeTruthy();
  });

  it('누른 순서대로 번호를 붙이고, 완료하면 선택 순서대로 돌려준다', async () => {
    const { getByTestId, onConfirm } = renderSheet({ initialSelectedIds: ['p2'] });
    await waitFor(() => expect(getByTestId('photo-tile-p4')).toBeTruthy());

    fireEvent.press(getByTestId('photo-tile-p4'));
    fireEvent.press(getByTestId('photo-tile-p1'));
    fireEvent.press(getByTestId('photo-picker-confirm'));

    expect(onConfirm).toHaveBeenCalledWith(['p2', 'p4', 'p1']);
  });

  it('선택된 사진을 다시 누르면 해제되고 뒤 번호가 당겨진다', async () => {
    const { getByTestId, onConfirm } = renderSheet({ initialSelectedIds: ['p1', 'p2'] });
    await waitFor(() => expect(getByTestId('photo-tile-p1')).toBeTruthy());

    fireEvent.press(getByTestId('photo-tile-p1'));

    expect(isSelected(getByTestId, 'p1')).toBe(false);
    expect(getByTestId('photo-tile-p2').props.accessibilityLabel).toBe('1번째로 선택된 사진');
    fireEvent.press(getByTestId('photo-picker-confirm'));
    expect(onConfirm).toHaveBeenCalledWith(['p2']);
  });

  it('최대 장수를 넘기면 더 고르지 않고 안내한다', async () => {
    const { getByTestId } = renderSheet({ maxSelection: 2, initialSelectedIds: ['p1', 'p2'] });
    await waitFor(() => expect(getByTestId('photo-tile-p3')).toBeTruthy());

    fireEvent.press(getByTestId('photo-tile-p3'));

    expect(isSelected(getByTestId, 'p3')).toBe(false);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: '사진은 최대 2장까지 고를 수 있어요' })
    );
  });

  it('모두 해제하고 완료하면 빈 선택을 돌려준다(첨부에서 모두 빠짐)', async () => {
    const { getByTestId, getByText, onConfirm } = renderSheet({ initialSelectedIds: ['p1'] });
    await waitFor(() => expect(getByTestId('photo-tile-p1')).toBeTruthy());

    fireEvent.press(getByTestId('photo-tile-p1'));
    fireEvent.press(getByText('선택 완료'));

    expect(onConfirm).toHaveBeenCalledWith([]);
  });

  it('닫기를 누르면 선택을 반영하지 않고 onCancel을 부른다', async () => {
    const { getByTestId, onCancel, onConfirm } = renderSheet();
    await waitFor(() => expect(getByTestId('photo-tile-p1')).toBeTruthy());

    fireEvent.press(getByTestId('photo-tile-p1'));
    fireEvent.press(getByTestId('photo-picker-close'));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('"선택한 사진만 허용" 상태면 안내하고 더 선택하기를 누르면 시스템 선택창을 연다', async () => {
    mockGetPermissions.mockResolvedValue({ granted: true, accessPrivileges: 'limited' });
    const { getByTestId } = renderSheet();

    await waitFor(() => expect(getByTestId('photo-picker-select-more')).toBeTruthy());
    fireEvent.press(getByTestId('photo-picker-select-more'));

    expect(mockPresentPicker).toHaveBeenCalledWith(['photo']);
  });

  it('다음 페이지가 있으면 끝까지 스크롤할 때 이어서 불러온다', async () => {
    mockGetAssets
      .mockResolvedValueOnce({ assets: photos.slice(0, 2), endCursor: 'c1', hasNextPage: true })
      .mockResolvedValueOnce({ assets: photos.slice(2), endCursor: 'c2', hasNextPage: false });
    const { getByTestId } = renderSheet();
    await waitFor(() => expect(getByTestId('photo-tile-p2')).toBeTruthy());

    fireEvent(getByTestId('photo-picker-grid'), 'endReached');

    await waitFor(() => expect(getByTestId('photo-tile-p4')).toBeTruthy());
    expect(mockGetAssets).toHaveBeenLastCalledWith(expect.objectContaining({ after: 'c1' }));
  });
});
