import { render } from '@testing-library/react-native';
import { ChatConnectionBanner } from '..';

describe('ChatConnectionBanner', () => {
  it('연결돼 있으면 아무것도 표시하지 않는다', () => {
    const { queryByTestId } = render(<ChatConnectionBanner connectionState="connected" />);

    expect(queryByTestId('chat-connection-banner')).toBeNull();
  });

  it('연결 중이면 연결 중 문구를 표시한다', () => {
    const { getByText } = render(<ChatConnectionBanner connectionState="connecting" />);

    expect(getByText('채팅 서버에 연결하는 중이에요.')).toBeTruthy();
  });

  it('연결이 끊기면 메시지가 재연결 후 전송된다는 안내를 표시한다', () => {
    const { getByText } = render(<ChatConnectionBanner connectionState="disconnected" />);

    expect(getByText('연결이 끊겼어요. 보낸 메시지는 다시 연결되면 전송돼요.')).toBeTruthy();
  });
});
