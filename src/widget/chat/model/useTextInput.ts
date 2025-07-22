import { useState, useCallback } from 'react';

interface UseTextInputProps {
  onSendText: (message: string) => void;
  disabled?: boolean;
}

export const useTextInput = ({ onSendText, disabled = false }: UseTextInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendText = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) return;

    setIsSending(true);
    try {
      onSendText(trimmedMessage);
      setMessage('');
    } finally {
      setTimeout(() => setIsSending(false));
    }
  }, [message, onSendText, disabled, isSending]);

  const updateMessage = useCallback((text: string) => {
    setMessage(text);
  }, []);

  const canSendText = message.trim().length > 0 && !disabled && !isSending;

  return {
    message,
    isSending,
    canSendText,
    updateMessage,
    handleSendText,
  };
};
