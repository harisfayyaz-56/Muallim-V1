import React from 'react';
import { formatPrice } from '@/utils/preferences';

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
}

/**
 * Currency Display Component
 * Shows prices in AED (UAE market default)
 */
export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  className = '',
}) => {
  return (
    <span className={className} title={`Amount in AED: ${amount}`}>
      {formatPrice(amount)}
    </span>
  );
};

export default CurrencyDisplay;
