import { NextButton, LastStepButton } from '~/entity/product/itemForm';

interface ItemFormRenderButtonProps {
  step: number;
  isStep1Valid: boolean;
  isStep2Valid: boolean;
  onNextStep: (step: number) => void;
  onEditPress: () => void;
  onCompletePress: () => void;
}

const ItemFormRenderButton = ({
  step,
  isStep1Valid,
  isStep2Valid,
  onNextStep,
  onEditPress,
  onCompletePress,
}: ItemFormRenderButtonProps) => {
  switch (step) {
    case 1:
      return <NextButton disabled={!isStep1Valid} onPress={() => onNextStep(2)} />;
    case 2:
      return <NextButton disabled={!isStep2Valid} onPress={() => onNextStep(3)} />;
    case 3:
      return <LastStepButton onEditPress={onEditPress} onCompletePress={onCompletePress} />;
    default:
      return null;
  }
};

export default ItemFormRenderButton;
