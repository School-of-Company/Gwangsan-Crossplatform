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
  ...props 
}: ButtonProps) => {
  return (
    <TouchableOpacity
      className={`
        px-8 py-4 rounded-lg items-center justify-center min-h-[56px] w-full
        ${disabled 
          ? variant === 'primary' ? 'bg-[#CDCDCF]' : 'bg-white border-2 border-[#CDCDCF]' 
          : variant === 'primary' 
            ? 'bg-[#8FC31D]' 
            : 'bg-white border-2 border-[#8FC31D] active:bg-gray-50'
        }
      `}
      disabled={disabled}
      style={style}
      {...props}
    >
      <Text className={`
        text-lg font-semibold
        ${disabled 
          ? 'text-gray-500' 
          : variant === 'primary' 
            ? 'text-white' 
            : 'text-[#8FC31D]'
        }
      `}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};