import { useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, value, onFocus, onBlur, ...props }: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="flex w-full gap-2">
      <Text className="text-label">{label}</Text>
      <TextInput
        className="max-h-[200px] min-h-[120px] w-full rounded-xl border border-gray-400 px-4 py-5 text-body5 focus:border-black"
        multiline
        textAlignVertical="top"
        textBreakStrategy="simple"
        // 포커스 중(입력 중)에는 `value`로 제어하지 않는다 — 타이핑할 때마다(onChangeText →
        // 상위 state → 리렌더) 같은 값이 다시 흘러 들어오면, 안드로이드의 한글 입력 조합(IME
        // composing) 상태가 끊겨 자소가 분리되어 보인다("하ㄴㄱㅜㅜㄱ"). 포커스가 없을 때만
        // (초기값, 폼 리셋 등 외부 변경) `value`를 강제해 동기화한다.
        value={isFocused ? undefined : value}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </View>
  );
}
