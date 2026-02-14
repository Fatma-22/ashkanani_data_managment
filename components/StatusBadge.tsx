import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { ContractStatus, DealStatus } from '../types';

interface StatusBadgeProps {
  status: ContractStatus | DealStatus | string;
  type?: 'contract' | 'deal';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'contract' }) => {
  const { t } = useTranslation();

  const getStatusStyles = () => {
    return {
      background: '#ffffff', // White
      color: '#3F3F3F',      // Soft Black
      border: '1px solid #3F3F3F',
      borderRadius: '4px',
      padding: '1px 6px',
      fontWeight: 700,
      fontSize: '11px',
      width: 'fit-content',
      display: 'inline-block'
    };
  };

  const getColor = () => {
    return undefined; // We use custom styles exclusively
  };

  const translatedStatus = t(`enums.${type === 'deal' ? 'DealStatus' : 'ContractStatus'}.${status}`, { defaultValue: status });

  return (
    <Tag
      color={getColor()}
      style={{
        fontWeight: 600,
        ...getStatusStyles()
      }}
    >
      {translatedStatus}
    </Tag>
  );
};

export default StatusBadge;
