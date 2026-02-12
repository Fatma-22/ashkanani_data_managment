import React from 'react';

interface FormatCurrencyProps {
  value: number;
  currency?: string;
  showCompact?: boolean;
}

const FormatCurrency: React.FC<FormatCurrencyProps> = ({
  value,
  currency = 'USD',
  showCompact = true
}) => {
  const formatValue = () => {
    if (showCompact) {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      }
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return <span>{formatValue()}</span>;
};

export default FormatCurrency;
