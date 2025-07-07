import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button = ({
  children,
  disabled = false,
  variant = 'primary',
  style,
  className,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      className={`
        min-h-[56px] ${className} flex-1 items-center justify-center rounded-lg px-8 py-4
        ${
          disabled
            ? variant === 'primary'
              ? 'bg-[#CDCDCF]'
              : 'border-2 border-[#CDCDCF] bg-white'
            : variant === 'primary'
              ? 'bg-[#8FC31D]'
              : 'border-2 border-[#8FC31D] bg-white active:bg-gray-50'
        }
      `}
      disabled={disabled}
      style={style}
      {...props}>
      <Text
        className={`
        text-lg font-semibold
        ${disabled ? 'text-gray-500' : variant === 'primary' ? 'text-white' : 'text-[#8FC31D]'}
      `}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};
