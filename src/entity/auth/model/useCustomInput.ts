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

  // 바텀시트 오픈 애니메이션이 끝난 뒤 호출해야 한다. 애니메이션 도중 포커스를 주면
  // 안드로이드에서 한글 입력 조합 중 자소가 분리되는 문제가 있다.
  const focusInput = useCallback(() => {
    customInputRef.current?.focus();
  }, []);

  const deactivateCustomInput = useCallback(() => {
    setIsAddingCustomItem(false);
  }, []);

  // 입력창의 텍스트는 CustomInputCard 내부에서 로컬 상태로 관리한다(타이핑마다 이
  // 훅과 부모 컴포넌트를 거쳐 포털에 재등록되면, 그 한 프레임 지연 때문에 안드로이드
  // 한글 입력 조합 중 자소가 분리되는 문제가 있었다). 제출 시점의 최종 텍스트만
  // 여기로 전달받는다.
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
