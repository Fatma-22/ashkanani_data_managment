import React from 'react';
import { Typography, Table } from 'antd';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export interface ReportColumn {
    title: string;
    dataIndex: string;
    key?: string;
    render?: (value: any, record: any) => React.ReactNode;
}

interface PrintableReportProps {
    title: string;
    subtitle?: string;
    columns: ReportColumn[];
    data: any[];
    summary?: { label: string; value: string | number }[];
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
    title,
    subtitle,
    columns,
    data,
    summary
}) => {
    const { t } = useTranslation();
    const printDate = dayjs().format('DD/MM/YYYY HH:mm');

    const content = (
        <div className="printable-report" style={{ display: 'none' }} dir={t('direction', { defaultValue: 'ltr' })}>
            {/* Header */}
            <div className="report-header">
                <div className={`flex justify-between items-center mb-8 border-b-2 border-[#C9A24D] pb-4 ${t('direction') === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#3F3F3F' }}>{title}</Title>
                        {subtitle && <Text type="secondary" style={{ fontSize: '14px' }}>{subtitle}</Text>}
                    </div>
                    <div className={t('direction') === 'rtl' ? 'text-left' : 'text-right'}>
                        <Title level={4} style={{ margin: 0, color: '#C9A24D' }}>
                            {t('common.title_part1', { defaultValue: 'ASHKANANI' })} {t('common.title_part2', { defaultValue: 'S.M.' })}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{t('common.generated_on')}: {printDate}</Text>
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            {summary && summary.length > 0 && (
                <div className="report-summary mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>{t('common.summary')}</Title>
                    <div className="grid grid-cols-2 gap-4">
                        {summary.map((item, index) => (
                            <div key={index} className="summary-item flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-white">
                                <Text type="secondary" className="text-sm uppercase font-semibold text-gray-500">{item.label}</Text>
                                <Text strong className="text-xl text-[#C9A24D]">{item.value}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="report-content">
                <Table
                    dataSource={data}
                    columns={columns}
                    pagination={false}
                    bordered
                    size="small"
                    rowKey={(record: any) => record.id || Math.random()}
                    className="print-table"
                />
            </div>

            {/* Footer */}
            <div className="report-footer mt-12 pt-4 border-t border-slate-200 text-center">
                <Text type="secondary" style={{ fontSize: '10px' }}>
                    {t('common.footer_copyright', { defaultValue: '© ' + new Date().getFullYear() + ' Ashkanani Sport Management. All rights reserved.' })}
                </Text>
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
};
