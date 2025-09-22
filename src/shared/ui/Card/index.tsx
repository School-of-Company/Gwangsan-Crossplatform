import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'primary';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<View, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', ...props }, ref) => {
    let cardClasses = 'rounded-xl border bg-white';

    switch (variant) {
      case 'primary':
        cardClasses += ' border-[#8FC31D] bg-green-50';
        break;
      default:
        cardClasses += ' border-[#CDCDCF]';
        break;
    }

    switch (padding) {
      case 'sm':
        cardClasses += ' p-3';
        break;
      case 'md':
        cardClasses += ' p-4';
        break;
      case 'lg':
        cardClasses += ' p-6';
        break;
      case 'none':
        break;
    }

    if (className) {
      cardClasses += ` ${className}`;
    }

    return <View ref={ref} className={cardClasses} {...props} />;
  }
);

Card.displayName = 'Card';
