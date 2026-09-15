import { useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, value, onChangeText, ...props }: TextFieldProps) {
  // 입력 중에는 `value`로 제어하지 않는다(defaultValue만 사용) — 타이핑할 때마다
  // (onChangeText → 상위 state → 리렌더) 같은 값이 `value`로 다시 흘러 들어오면, 안드로이드의
  // 한글 입력 조합(IME composing) 상태가 끊겨 자소가 분리되어 보인다("하ㄴㄱㅜㅜㄱ").
  //
  // 이전에는 포커스 여부로 `value`를 undefined 처리했지만(#642), 포커스되는 순간 곧바로
  // uncontrolled로 전환되며 defaultValue가 없어 기존 내용이 그대로 사라졌다 — 게시글 수정처럼
  // 기존 값을 이어서 고치는 화면에서 특히 눈에 띄는 회귀였다.
  //
  // 대신 "이 값 변경이 우리 자신의 onChangeText로 인한 것인지"를 추적해, 정말 외부에서 값이
  // 바뀐 경우(비동기 데이터 로딩, 폼 리셋 등)에만 `key`를 바꿔 새 defaultValue로 다시 마운트한다.
  // 타이핑 도중에는 value/key가 전혀 건드려지지 않으므로 IME 조합도 깨지지 않고, 포커스만으로
  // 값이 사라지지도 않는다.
  const [lastKnownValue, setLastKnownValue] = useState(value);
  const [instanceKey, setInstanceKey] = useState(0);

  if (value !== lastKnownValue) {
    setLastKnownValue(value);
    setInstanceKey((key) => key + 1);
  }

  return (
    <View className="flex w-full gap-2">
      <Text className="text-label">{label}</Text>
      <TextInput
        key={instanceKey}
        className="max-h-[200px] min-h-[120px] w-full rounded-xl border border-gray-400 px-4 py-5 text-body5 focus:border-black"
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
