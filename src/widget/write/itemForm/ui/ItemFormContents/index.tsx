import { View } from 'react-native';
import { memo } from 'react';
import { Dropdown, Input } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';
import { MODE, ModeType } from '~/widget/write/model/mode';
import { ProductType, TYPE } from '~/widget/write/model/type';

interface Props {
  mode: ModeType;
  type: ProductType;
  title: string;
  content: string;
  readonly?: boolean;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
  onModeChange?: (mode: ModeType) => void;
  onTypeChange?: (mode: ProductType) => void;
}

const ItemFormContents = ({
  title,
  content,
  readonly = false,
  onTitleChange,
  onContentChange,
  onModeChange,
  onTypeChange,
  mode,
  type,
}: Props) => {
  return (
    <View className="px-6">
      <View className="gap-4">
        <View className="gap-8">
          <Dropdown
            onSelect={onTypeChange}
            selectedItem={type}
            items={Object.values(TYPE)}
            label="카테고리"
          />
          <Dropdown
            onSelect={onModeChange}
            selectedItem={mode}
            items={Object.values(MODE)}
            label="유형"
          />
          <Input
            label="주제"
            placeholder="주제를 작성해주세요"
            value={title}
            onChangeText={onTitleChange}
            editable={!readonly}
          />
          <TextField
            label="내용"
            placeholder="내용을 작성해주세요"
            value={content}
            onChangeText={onContentChange}
            editable={!readonly}
          />
        </View>
      </View>
    </View>
  );
};

export default memo(ItemFormContents);
