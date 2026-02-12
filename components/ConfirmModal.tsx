import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmModalProps {
    title: string;
    content: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    okText?: string;
    cancelText?: string;
    okType?: 'primary' | 'danger';
}

const showConfirmModal = ({
    title,
    content,
    onConfirm,
    onCancel,
    okText = 'Confirm',
    cancelText = 'Cancel',
    okType = 'primary',
}: ConfirmModalProps) => {
    Modal.confirm({
        title,
        icon: <ExclamationCircleOutlined />,
        content,
        okText,
        cancelText,
        okType,
        onOk: onConfirm,
        onCancel,
    });
};

export default showConfirmModal;
