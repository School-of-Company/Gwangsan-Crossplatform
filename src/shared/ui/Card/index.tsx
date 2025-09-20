import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'primary' | 'warning' | 'error';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<View, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', shadow = 'sm', ...props }, ref) => {
    let cardClasses = 'rounded-xl border bg-white';

    switch (variant) {
      case 'primary':
        cardClasses += ' border-green-200 bg-green-50';
        break;
      case 'warning':
        cardClasses += ' border-orange-200 bg-orange-50';
        break;
      case 'error':
        cardClasses += ' border-red-200 bg-red-50';
        break;
      default:
        cardClasses += ' border-gray-200';
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

    switch (shadow) {
      case 'sm':
        cardClasses += ' shadow-sm';
        break;
      case 'md':
        cardClasses += ' shadow-md';
        break;
      case 'lg':
        cardClasses += ' shadow-lg';
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
