import { useState, useRef, useCallback } from 'react';
import { TextInput } from 'react-native';

interface UseCustomInputProps {
  onSubmit?: (value: string) => void;
}

export function useCustomInput({ onSubmit }: UseCustomInputProps = {}) {
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
  const customInputRef = useRef<TextInput>(null);

  const activateCustomInput = useCallback(() => {
    setIsAddingCustomItem(true);
  }, []);

  // 바텀시트 오픈 애니메이션 시작과 동시에 호출해, 카드 슬라이드업과 키보드
  // 상승이 같이 일어나도록 한다.
  const focusInput = useCallback(() => {
    customInputRef.current?.focus();
  }, []);

  const deactivateCustomInput = useCallback(() => {
    setIsAddingCustomItem(false);
  }, []);

  // 입력창의 텍스트는 CustomInputCard 내부 로컬 상태로 둔다. 타이핑마다 포털에 재등록되면
  // 한 프레임 지연으로 안드로이드 한글 조합 중 자소가 분리된다. 제출 시점의 텍스트만 받는다.
  const handleSubmitCustomItem = useCallback(
    (text: string) => {
      const newItem = text.trim();
      if (newItem === '') return;

      onSubmit?.(newItem);
      setIsAddingCustomItem(false);
    },
    [onSubmit]
  );

  return {
    isAddingCustomItem,
    customInputRef,
    activateCustomInput,
    focusInput,
    deactivateCustomInput,
    handleSubmitCustomItem,
  };
}
