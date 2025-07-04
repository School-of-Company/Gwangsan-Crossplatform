import { useState, useRef, useCallback } from 'react';
import { TextInput } from 'react-native';

interface UseCustomInputProps {
  onSubmit?: (value: string) => void;
}

export function useCustomInput({ onSubmit }: UseCustomInputProps = {}) {
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
  const [customItemText, setCustomItemText] = useState('');
  const customInputRef = useRef<TextInput>(null);

  const activateCustomInput = useCallback(() => {
    setIsAddingCustomItem(true);
    setTimeout(() => {
      customInputRef.current?.focus();
    }, 100);
  }, []);

  const deactivateCustomInput = useCallback(() => {
    setIsAddingCustomItem(false);
    setCustomItemText('');
  }, []);

  const handleSubmitCustomItem = useCallback(() => {
    if (customItemText.trim() === '') return;
    
    const newItem = customItemText.trim();
    onSubmit?.(newItem);
    
    setCustomItemText('');
    setIsAddingCustomItem(false);
  }, [customItemText, onSubmit]);

  const updateCustomItemText = useCallback((text: string) => {
    setCustomItemText(text);
  }, []);

  return {
    isAddingCustomItem,
    customItemText,
    customInputRef,
    activateCustomInput,
    deactivateCustomInput,
    handleSubmitCustomItem,
    updateCustomItemText,
  };
} 