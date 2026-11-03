import { useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, value, onChangeText, ...props }: TextFieldProps) {
  // 입력 중에는 `value`로 제어하지 않는다(defaultValue만 사용) — 타이핑할 때마다
  // (onChangeText → 상위 state → 리렌더) 같은 값이 `value`로 다시 흘러 들어오면, 안드로이드의
  // 한글 입력 조합(IME composing) 상태가 끊겨 자소가 분리되어 보인다("하ㄴㄱㅜㅜㄱ").
  // 그래서 값 변경이 자신의 onChangeText 때문인지 추적해, 외부에서 바뀐 경우(데이터 로딩·폼 리셋)에만
  // `key`를 바꿔 새 defaultValue로 다시 마운트한다.
  const [lastKnownValue, setLastKnownValue] = useState(value);
  const [instanceKey, setInstanceKey] = useState(0);

  if (value !== lastKnownValue) {
    setLastKnownValue(value);
    setInstanceKey((key) => key + 1);
  }

  return (
    <View className="flex w-full gap-2">
      <Text className="text-label text-foreground">{label}</Text>
      <TextInput
        key={instanceKey}
        className="max-h-[200px] min-h-[120px] w-full rounded-xl border border-gray-400 px-4 py-5 text-body5 text-gray-900 focus:border-foreground"
        multiline
        textAlignVertical="top"
        textBreakStrategy="simple"
        defaultValue={value}
        onChangeText={(text) => {
          setLastKnownValue(text);
          onChangeText?.(text);
        }}
        {...props}
      />
    </View>
  );
}
