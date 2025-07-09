import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'error';
  width?: string;
}

export const Button = ({
  children,
  disabled = false,
  variant = 'primary',
  style,
  width = 'w-full',
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      className={`
        min-h-[56px] ${width} items-center justify-center rounded-lg px-8 py-4
        ${
          disabled
            ? variant === 'primary'
              ? 'bg-[#CDCDCF]'
              : variant === 'secondary'
                ? 'border-2 border-[#CDCDCF] bg-white'
                : 'bg-[#CDCDCF]'
            : variant === 'primary'
              ? 'bg-[#8FC31D]'
              : variant === 'secondary'
                ? 'border-2 border-[#8FC31D] bg-white active:bg-gray-50'
                : 'bg-[#DF454A]'
        }
      `}
      disabled={disabled}
      style={style}
      {...props}>
      <Text
        className={`
        text-lg font-semibold
        ${
          disabled
            ? 'text-gray-500'
            : variant === 'primary'
              ? 'text-white'
              : variant === 'secondary'
                ? 'text-[#8FC31D]'
                : 'text-white'
        }
      `}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};
