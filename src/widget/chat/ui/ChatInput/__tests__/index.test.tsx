import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChatInput } from '../index';
import { useChatInput } from '~/widget/chat/model/useChatInput';

jest.mock('~/widget/chat/model/useChatInput', () => ({
  useChatInput: jest.fn(),
}));

const mockUseChatInput = useChatInput as jest.Mock;

const makeChatInputReturn = (overrides: Record<string, unknown> = {}) => ({
  textMessage: '',
  selectedImages: [],
  isUploading: false,
  isSending: false,
  canSend: false,
  updateMessage: jest.fn(),
  handleImagePicker: jest.fn(),
  removeImage: jest.fn(),
  handleSendMessage: jest.fn(),
  resetInput: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseChatInput.mockReturnValue(makeChatInputReturn());
});

describe('ChatInput', () => {
  it('textMessage 값을 TextInput에 표시한다', () => {
    mockUseChatInput.mockReturnValue(makeChatInputReturn({ textMessage: '안녕하세요' }));

    const { getByDisplayValue } = render(<ChatInput onSendMessage={jest.fn()} />);

    expect(getByDisplayValue('안녕하세요')).toBeTruthy();
  });

  it('텍스트 입력 시 updateMessage가 호출된다', () => {
    const updateMessage = jest.fn();
    mockUseChatInput.mockReturnValue(makeChatInputReturn({ updateMessage }));

    const { UNSAFE_getByType } = render(<ChatInput onSendMessage={jest.fn()} />);

    fireEvent.changeText(UNSAFE_getByType(TextInput), '새 메시지');

    expect(updateMessage).toHaveBeenCalledWith('새 메시지');
  });

  it('onFocus prop이 TextInput에 전달된다', () => {
    const onFocus = jest.fn();
    const { UNSAFE_getByType } = render(<ChatInput onSendMessage={jest.fn()} onFocus={onFocus} />);

    fireEvent(UNSAFE_getByType(TextInput), 'focus');

    expect(onFocus).toHaveBeenCalled();
  });

  it('canSend=true이면 전송 버튼을 눌렀을 때 handleSendMessage가 호출된다', () => {
    const handleSendMessage = jest.fn();
    mockUseChatInput.mockReturnValue(makeChatInputReturn({ canSend: true, handleSendMessage }));

    const { UNSAFE_getAllByType } = render(<ChatInput onSendMessage={jest.fn()} />);

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const sendButton = buttons[buttons.length - 1];
    expect(sendButton.props.disabled).toBe(false);

    fireEvent.press(sendButton);

    expect(handleSendMessage).toHaveBeenCalled();
  });

  it('canSend=false이면 전송 버튼이 비활성화된다', () => {
    mockUseChatInput.mockReturnValue(makeChatInputReturn({ canSend: false }));

    const { UNSAFE_getAllByType } = render(<ChatInput onSendMessage={jest.fn()} />);

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const sendButton = buttons[buttons.length - 1];

    expect(sendButton.props.disabled).toBe(true);
  });

  it('isSending=true이면 전송 버튼에 ActivityIndicator가 표시된다', () => {
    mockUseChatInput.mockReturnValue(makeChatInputReturn({ isSending: true, canSend: true }));

    const { UNSAFE_getAllByType } = render(<ChatInput onSendMessage={jest.fn()} />);

    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it('isUploading=true이면 이미지 버튼에 ActivityIndicator가 표시되고 입력이 비활성화된다', () => {
    mockUseChatInput.mockReturnValue(makeChatInputReturn({ isUploading: true }));

    const { UNSAFE_getAllByType, UNSAFE_getByType } = render(
      <ChatInput onSendMessage={jest.fn()} />
    );

    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
    expect(UNSAFE_getByType(TextInput).props.editable).toBe(false);
  });

  it('disabled prop이 true이면 TextInput이 비활성화된다', () => {
    const { UNSAFE_getByType } = render(<ChatInput onSendMessage={jest.fn()} disabled />);

    expect(UNSAFE_getByType(TextInput).props.editable).toBe(false);
  });

  it('이미지 버튼을 누르면 handleImagePicker가 호출된다', () => {
    const handleImagePicker = jest.fn();
    mockUseChatInput.mockReturnValue(makeChatInputReturn({ handleImagePicker }));

    const { UNSAFE_getAllByType } = render(<ChatInput onSendMessage={jest.fn()} />);

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[0]);

    expect(handleImagePicker).toHaveBeenCalled();
  });

  it('선택된 이미지가 5장이면 이미지 버튼이 비활성화된다', () => {
    const selectedImages = Array.from({ length: 5 }, (_, i) => ({
      imageId: i,
      imageUrl: `https://example.com/${i}.png`,
      localUri: `file://${i}.png`,
    }));
    mockUseChatInput.mockReturnValue(makeChatInputReturn({ selectedImages }));

    const { UNSAFE_getAllByType } = render(<ChatInput onSendMessage={jest.fn()} />);

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // 이미지 미리보기 제거 버튼(5개) 다음이 카메라 버튼이다.
    const cameraButton = buttons[selectedImages.length];
    expect(cameraButton.props.disabled).toBe(true);
  });

  it('onSendMessage와 disabled를 useChatInput에 전달한다', () => {
    const onSendMessage = jest.fn();
    render(<ChatInput onSendMessage={onSendMessage} disabled />);

    expect(mockUseChatInput).toHaveBeenCalledWith({ onSendMessage, disabled: true });
  });
});
