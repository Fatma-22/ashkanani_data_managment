import html2pdf from 'html2pdf.js';
import dayjs from 'dayjs';
import { Player, Deal, FinancialRecord, Employee } from '../types';
import { getCountryNameAr } from './flags';
import { isHandSport } from './sports';

export interface PdfFieldOption {
    key: string;
    labelAr: string;
    labelEn: string;
    getValue: (player: Player, t: any, isAr: boolean) => string;
}

export const PDF_FIELD_OPTIONS: PdfFieldOption[] = [
    {
        key: 'name',
        labelAr: 'الاسم',
        labelEn: 'Name',
        getValue: (p, t, isAr) => isAr ? (p.nameAr || p.name || '') : (p.name || p.nameAr || ''),
    },
    {
        key: 'sport',
        labelAr: 'الرياضة',
        labelEn: 'Sport',
        getValue: (p, t) => t(`enums.Sport.${p.sport}`, { defaultValue: p.sport || '' }),
    },
    {
        key: 'positions',
        labelAr: 'المراكز',
        labelEn: 'Positions',
        getValue: (p, t) => p.positions?.map(pos => t(`enums.Position.${pos}`, { defaultValue: pos })).join(', ') || '',
    },
    {
        key: 'nationality',
        labelAr: 'الجنسية',
        labelEn: 'Nationality',
        getValue: (p, t, isAr) => isAr ? (p.nationalityAr || p.nationality || '') : (p.nationality || p.nationalityAr || ''),
    },
    {
        key: 'club',
        labelAr: 'النادي',
        labelEn: 'Club',
        getValue: (p, t, isAr) => {
            const getClubName = (isAr: boolean) => {
                if (typeof p.club === 'object' && p.club) return isAr ? ((p.club as any).name_ar || p.club.name) : p.club.name;
                return isAr ? (p.clubAr || p.club || '') : (p.club || p.clubAr || '');
            };
            return String(getClubName(isAr));
        },
    },
    {
        key: 'age',
        labelAr: 'العمر',
        labelEn: 'Age',
        getValue: (p) => p.age ? String(p.age) : '',
    },
    {
        key: 'dateOfBirth',
        labelAr: 'سنة الميلاد',
        labelEn: 'Year of Birth',
        getValue: (p) => p.dateOfBirth ? String(p.dateOfBirth) : '',
    },
    {
        key: 'marketValue',
        labelAr: 'القيمة السوقية',
        labelEn: 'Market Value',
        getValue: (p) => p.marketValue ? `${p.marketValue.toLocaleString()} KWD` : '',
    },
    {
        key: 'preferredFoot',
        labelAr: 'القدم المفضلة',
        labelEn: 'Preferred Foot',
        getValue: (p, t) => p.preferredFoot ? (isHandSport(p.sport) ? t(`enums.PreferredHand.${p.preferredFoot}`, { defaultValue: p.preferredFoot }) : t(`enums.PreferredFoot.${p.preferredFoot}`, { defaultValue: p.preferredFoot })) : '',
    },
    {
        key: 'height',
        labelAr: 'الطول',
        labelEn: 'Height',
        getValue: (p) => p.height ? `${p.height} cm` : '',
    },
    {
        key: 'weight',
        labelAr: 'الوزن',
        labelEn: 'Weight',
        getValue: (p) => p.weight ? `${p.weight} kg` : '',
    },
    {
        key: 'jerseyNumber',
        labelAr: 'رقم القميص',
        labelEn: 'Jersey #',
        getValue: (p) => p.jerseyNumber ? String(p.jerseyNumber) : '',
    },
    {
        key: 'dealStatus',
        labelAr: 'حالة الصفقة',
        labelEn: 'Deal Status',
        getValue: (p, t) => p.dealStatus ? t(`enums.DealStatus.${p.dealStatus}`, { defaultValue: p.dealStatus }) : '',
    },
    {
        key: 'contractStatus',
        labelAr: 'حالة العقد',
        labelEn: 'Contract Status',
        getValue: (p, t) => p.contractStatus ? t(`enums.ContractStatus.${p.contractStatus}`, { defaultValue: p.contractStatus }) : '',
    },
    {
        key: 'contractNature',
        labelAr: 'طبيعة العقد',
        labelEn: 'Contract Nature',
        getValue: (p, t) => p.contractNature ? t(`enums.ContractNature.${p.contractNature}`, { defaultValue: p.contractNature }) : '',
    },
    {
        key: 'contractStartDate',
        labelAr: 'بداية العقد',
        labelEn: 'Contract Start',
        getValue: (p) => p.contractStartDate ? p.contractStartDate.toString().split('T')[0] : '',
    },
    {
        key: 'contractEndDate',
        labelAr: 'نهاية العقد',
        labelEn: 'Contract End',
        getValue: (p) => p.contractEndDate ? p.contractEndDate.toString().split('T')[0] : '',
    },
    {
        key: 'phone',
        labelAr: 'رقم الهاتف',
        labelEn: 'Phone',
        getValue: (p) => p.phone || '',
    },
    {
        key: 'email',
        labelAr: 'البريد الإلكتروني',
        labelEn: 'Email',
        getValue: (p) => p.email || '',
    },
    {
        key: 'nationalId',
        labelAr: 'رقم الهوية',
        labelEn: 'National ID',
        getValue: (p) => p.nationalId || '',
    },
    {
        key: 'gender',
        labelAr: 'الجنس',
        labelEn: 'Gender',
        getValue: (p, t) => p.gender ? t(`common.${p.gender === 'MALE' ? 'male' : 'female'}`, { defaultValue: p.gender }) : '',
    },
    {
        key: 'placeOfBirth',
        labelAr: 'محل الميلاد',
        labelEn: 'Place of Birth',
        getValue: (p, t, isAr) => p.bornInKuwait ? (isAr ? 'الكويت' : 'Kuwait') : (isAr ? (getCountryNameAr(p.nationalityAr || p.nationality) || p.nationalityAr || p.nationality || '') : (p.nationality || p.nationalityAr || '')),
    },
    {
        key: 'previousClubs',
        labelAr: 'الأندية السابقة',
        labelEn: 'Previous Clubs',
        getValue: (p) => p.previousClubs?.join(', ') || '',
    },
];

export const DEFAULT_PDF_FIELDS = ['name', 'sport', 'positions', 'nationality', 'club', 'age', 'marketValue', 'contractStatus'];

export function generatePlayersPdf(
    players: Player[],
    selectedFields: string[],
    t: any,
    isAr: boolean,
    filterSummary?: string
) {
    const fields = selectedFields
        .map(key => PDF_FIELD_OPTIONS.find(f => f.key === key))
        .filter(Boolean) as PdfFieldOption[];

    const now = new Date();
    const dateStr = now.toLocaleDateString(isAr ? 'ar-KW' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const n = fields.length;

    // Decide container width based on column count.
    // Each column needs roughly 70-90px; give enough horizontal room
    // so nothing clips, then let html2pdf scale it to the page.
    const minColWidthPx = n > 18 ? 60 : n > 14 ? 68 : n > 10 ? 78 : 90;
    const contentWidthPx = Math.max(860, n * minColWidthPx + 80); // 80px for padding
    const containerWidthPx = contentWidthPx;

    // Always use landscape for many columns (> 8)
    const isLandscape = n > 8;
    const orientation: 'portrait' | 'landscape' = isLandscape ? 'landscape' : 'portrait';

    // A4 dimensions in mm: portrait 210×297, landscape 297×210
    const pageWidthMm  = isLandscape ? 297 : 210;
    const pageHeightMm = isLandscape ? 210 : 297;

    // Scale PDF page to container width so nothing gets cut
    // (use contentWidthPx → mm, keep aspect ratio)
    const pxPerMm = 96 / 25.4; // 96 dpi
    const containerWidthMm = containerWidthPx / pxPerMm;
    // If container is wider than A4, expand page width to match; otherwise use A4
    const finalPageWidthMm  = Math.max(pageWidthMm, containerWidthMm);
    const finalPageHeightMm = pageHeightMm; // height stays A4
    const fontSize   = n > 18 ? '7px' : n > 14 ? '7.5px' : n > 10 ? '8.5px' : n > 8 ? '9.5px' : '11px';
    const cellPad    = n > 18 ? '4px 3px' : n > 14 ? '5px 3px' : n > 8 ? '7px 5px' : '10px 8px';
    const thFontSize = n > 18 ? '6.5px' : n > 14 ? '7px' : n > 8 ? '8px' : '10px';

    // Build and save the PDF, optionally with an embedded logo
    const buildPdf = (logoDataUrl: string) => {
        const container = document.createElement('div');
        container.setAttribute('dir', isAr ? 'rtl' : 'ltr');
        container.style.padding = '40px';
        container.style.backgroundColor = '#ffffff';
        container.style.fontFamily = isAr ? "'Cairo', 'Almarai', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        container.style.width = `${containerWidthPx}px`;
        container.style.boxSizing = 'border-box';

        const logoHtml = logoDataUrl
            ? `<img src="${logoDataUrl}" style="height:55px;width:auto;object-fit:contain;display:block;" alt="logo" />`
            : '';

        const headerDir = isAr ? 'row-reverse' : 'row';
        const reportSideAlign = isAr ? 'left' : 'right';

        const headerHtml = `
            <div style="background:#1a1a1a;padding:22px 30px;border-bottom:3px solid #C9A24D;margin:-40px -40px 28px -40px;color:white;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-direction:${headerDir};">
                    <div style="display:flex;align-items:center;gap:14px;flex-direction:${headerDir};">
                        ${logoHtml}
                        <div>
                            <h1 style="margin:0;font-size:22px;color:white;${!isAr ? 'letter-spacing:2px;' : ''}">
                                <span style="color:#fff;">${t('common.title_part1')}</span>
                                <span style="color:#C9A24D;"> ${t('common.title_part2')}</span>
                            </h1>
                            <p style="margin:3px 0 0 0;color:#C9A24D;font-size:11px;text-transform:uppercase;">
                                ${t('common.company_subtitle', { defaultValue: 'Athlete Management' })}
                            </p>
                        </div>
                    </div>
                    <div style="text-align:${reportSideAlign};">
                        <h2 style="margin:0;font-size:15px;color:#C9A24D;">${t('common.pdf_export.report_title', { defaultValue: 'Comprehensive Report' })}</h2>
                        <p style="margin:4px 0 0 0;font-size:10px;color:#888;">${t('common.generated_on', { defaultValue: 'Generated' })}: ${dateStr}</p>
                    </div>
                </div>
            </div>
        `;

        const statsHtml = `
            <div style="display:flex;gap:16px;margin-bottom:22px;">
                <div style="background:#fdfaf0;border:1px solid #eee7d5;padding:12px 20px;border-radius:10px;flex:1;">
                    <p style="margin:0;font-size:10px;color:#8a7340;text-transform:uppercase;font-weight:bold;">${t('common.total', { defaultValue: 'Total' })}</p>
                    <p style="margin:4px 0 0 0;font-size:22px;font-weight:800;color:#1a1a1a;">${players.length}</p>
                </div>
                ${filterSummary ? `
                <div style="background:#f5f5f5;border:1px solid #eee;padding:12px 20px;border-radius:10px;flex:2;">
                    <p style="margin:0;font-size:10px;color:#666;text-transform:uppercase;font-weight:bold;">${t('common.pdf_export.active_filters', { defaultValue: 'Active Filters' })}</p>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#1a1a1a;">${filterSummary}</p>
                </div>
                ` : ''}
            </div>
        `;

        // Calculate column widths: name column gets 2x, others get 1x
        const hasName = fields.some(f => f.key === 'name');
        const baseColPct = hasName
            ? (100 / (fields.length + 1)).toFixed(2)   // +1 because name counts double
            : (100 / fields.length).toFixed(2);
        const nameColPct = hasName ? (2 * parseFloat(baseColPct)).toFixed(2) : baseColPct;

        const colgroupHtml = `
            <colgroup>
                ${fields.map(f => `
                    <col style="width:${f.key === 'name' ? nameColPct : baseColPct}%;" />
                `).join('')}
            </colgroup>
        `;

        const tableHtml = `
            <table style="width:100%;border-collapse:collapse;font-size:${fontSize};table-layout:auto;">
                ${colgroupHtml}
                <thead>
                    <tr style="background:#1a1a1a;">
                        ${fields.map(f => `
                            <th style="padding:${cellPad};border:1px solid #2d2d2d;color:#C9A24D;text-align:${isAr ? 'right' : 'left'};font-weight:800;text-transform:uppercase;font-size:${thFontSize};word-break:normal;overflow-wrap:break-word;">
                                ${f.key === 'preferredFoot' && players.some(p => isHandSport(p.sport))
                                    ? (isAr ? 'اليد المفضلة' : 'Preferred Hand')
                                    : (isAr ? f.labelAr : f.labelEn)}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${players.map((p, idx) => `
                        <tr style="background-color:${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'};page-break-inside:avoid;break-inside:avoid;">
                            ${fields.map(f => `
                                <td style="padding:${cellPad};border:1px solid #eee;color:#000;line-height:1.4;word-break:${isAr ? 'keep-all' : 'normal'};overflow-wrap:break-word;font-size:${fontSize};">
                                    ${f.getValue(p, t, isAr)}
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const footerHtml = `
            <div style="margin-top:36px;padding-top:14px;border-top:1px solid #eee;display:flex;justify-content:space-between;color:#999;font-size:9px;">
                <p style="margin:0;">${t('common.footer_copyright', { defaultValue: 'Ashkanani Sport for Athlete Management - © 2026' })}</p>
                <p style="margin:0;">www.ashkananisports.com</p>
            </div>
        `;

        container.innerHTML = `${headerHtml}${statsHtml}${tableHtml}${footerHtml}`;

        const opt = {
            margin: 0,
            filename: `ashkanani_report_${now.toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 3,
                useCORS: true,
                letterRendering: false,
                // Tell html2canvas the virtual window width equals the container width
                // so it never clips content that's wider than the browser viewport
                windowWidth: containerWidthPx,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc: Document) => {
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        :root {
                            --primary: #C9A24D !important;
                            --color-asm-gold: #C9A24D !important;
                            --color-gold-500: #C9A24D !important;
                        }
                        * { box-shadow: none !important; transition: none !important; animation: none !important; }
                    `;
                    clonedDoc.head.appendChild(style);

                    // Smart Color Substitution instead of aggressive deletion
                    try {
                        const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
                        styleTags.forEach(tag => {
                            if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
                                tag.innerHTML = tag.innerHTML
                                    .replace(/oklch\([^)]+\)/g, '#C9A24D')
                                    .replace(/oklab\([^)]+\)/g, '#1a1a1a');
                            }
                        });
                    } catch (e) {}
                }
            },
            jsPDF: {
                unit: 'mm' as const,
                // Use a custom page size sized to the container — nothing will be cut
                format: [finalPageWidthMm, finalPageHeightMm] as [number, number],
                orientation
            }
        };

        html2pdf().set(opt).from(container).save();
    };

    // Fetch /logo.png and embed as base64 — works when dev server or CDN serves it.
    // Falls back to no logo if the file is missing.
    fetch('/logo.png')
        .then(res => {
            if (!res.ok) throw new Error('logo not found');
            return res.blob();
        })
        .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => buildPdf(reader.result as string);
            reader.readAsDataURL(blob);
        })
        .catch(() => buildPdf(''));
}

// ─── Generic PDF Field Option ───────────────────────────────────────────────
export interface GenericPdfFieldOption {
    key: string;
    labelAr: string;
    labelEn: string;
    getValue: (row: any, t: any, isAr: boolean) => string;
}

// ─── DEALS ──────────────────────────────────────────────────────────────────
export const DEAL_PDF_FIELDS: GenericPdfFieldOption[] = [
    { key: 'player', labelAr: 'اللاعب', labelEn: 'Player', getValue: (d, t, isAr) => isAr ? (d.player?.nameAr || d.player?.name || d.manualPlayerNameAr || d.manualPlayerName || '') : (d.player?.name || d.player?.nameAr || d.manualPlayerName || d.manualPlayerNameAr || '') },
    { key: 'type', labelAr: 'نوع الصفقة', labelEn: 'Deal Type', getValue: (d, t) => d.type ? t(`enums.DealType.${d.type}`, { defaultValue: d.type }) : '' },
    { key: 'status', labelAr: 'الحالة', labelEn: 'Status', getValue: (d, t) => d.status ? t(`enums.DealStatus.${d.status}`, { defaultValue: d.status }) : '' },
    { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', getValue: (d) => d.amount ? `${Number(d.amount).toLocaleString()} ${d.currency || 'USD'}` : '' },
    { key: 'startDate', labelAr: 'تاريخ البداية', labelEn: 'Start Date', getValue: (d) => d.startDate ? d.startDate.toString().split('T')[0] : (d.start_date ? d.start_date.toString().split('T')[0] : '') },
    { key: 'endDate', labelAr: 'تاريخ النهاية', labelEn: 'End Date', getValue: (d) => d.endDate ? d.endDate.toString().split('T')[0] : (d.end_date ? d.end_date.toString().split('T')[0] : '') },
    { key: 'club', labelAr: 'النادي', labelEn: 'Club', getValue: (d, t, isAr) => isAr ? (d.clubAr || d.club || '') : (d.club || d.clubAr || '') },
    { key: 'agent', labelAr: 'الوكيل', labelEn: 'Agent', getValue: (d) => d.agent?.name || d.agentName || '' },
    { key: 'notes', labelAr: 'ملاحظات', labelEn: 'Notes', getValue: (d, t, isAr) => isAr ? (d.notesAr || d.notes || '') : (d.notes || d.notesAr || '') },
];
export const DEFAULT_DEAL_PDF_FIELDS = ['player', 'type', 'status', 'amount', 'startDate', 'endDate', 'club'];

// ─── FINANCIALS ─────────────────────────────────────────────────────────────
export const FINANCIAL_PDF_FIELDS: GenericPdfFieldOption[] = [
    { key: 'type', labelAr: 'النوع', labelEn: 'Type', getValue: (r, t) => r.type ? t(`owner.financials.${r.type}`, { defaultValue: r.type }) : '' },
    { key: 'category', labelAr: 'الفئة', labelEn: 'Category', getValue: (r, t, isAr) => isAr ? (r.categoryAr || r.category || '') : (r.category || r.categoryAr || '') },
    { key: 'description', labelAr: 'الوصف', labelEn: 'Description', getValue: (r, t, isAr) => isAr ? (r.descriptionAr || r.description || '') : (r.description || r.descriptionAr || '') },
    { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', getValue: (r) => r.amount ? `${Number(r.amount).toLocaleString()} ${r.currency || 'USD'}` : '' },
    { key: 'date', labelAr: 'التاريخ', labelEn: 'Date', getValue: (r) => r.date ? r.date.toString().split('T')[0] : '' },
    { key: 'related_to', labelAr: 'متعلق بـ', labelEn: 'Related To', getValue: (r) => r.relatedTo || r.related_to || '' },
];
export const DEFAULT_FINANCIAL_PDF_FIELDS = ['type', 'category', 'description', 'amount', 'date', 'related_to'];

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export const EMPLOYEE_PDF_FIELDS: GenericPdfFieldOption[] = [
    { key: 'name', labelAr: 'الاسم', labelEn: 'Name', getValue: (e, t, isAr) => isAr ? (e.nameAr || e.name || '') : (e.name || e.nameAr || '') },
    { key: 'position', labelAr: 'المنصب', labelEn: 'Position', getValue: (e, t, isAr) => isAr ? (e.positionAr || e.position || '') : (e.position || e.positionAr || '') },
    { key: 'nationality', labelAr: 'الجنسية', labelEn: 'Nationality', getValue: (e, t, isAr) => isAr ? (e.nationalityAr || e.nationality || '') : (e.nationality || e.nationalityAr || '') },
    { key: 'salary', labelAr: 'الراتب', labelEn: 'Salary', getValue: (e) => e.salary ? `${Number(e.salary).toLocaleString()} USD` : '' },
    { key: 'phone', labelAr: 'الهاتف', labelEn: 'Phone', getValue: (e) => e.phone || '' },
    { key: 'email', labelAr: 'البريد الإلكتروني', labelEn: 'Email', getValue: (e) => e.email || '' },
    { key: 'nationalId', labelAr: 'رقم الهوية', labelEn: 'National ID', getValue: (e) => e.nationalId || e.national_id || '' },
    { key: 'status', labelAr: 'الحالة', labelEn: 'Status', getValue: (e, t, isAr) => e.isActive !== undefined ? (e.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')) : '' },
    { key: 'contractStartDate', labelAr: 'بداية العقد', labelEn: 'Contract Start', getValue: (e) => e.contractStartDate ? e.contractStartDate.toString().split('T')[0] : '' },
    { key: 'contractEndDate', labelAr: 'نهاية العقد', labelEn: 'Contract End', getValue: (e) => e.contractEndDate ? e.contractEndDate.toString().split('T')[0] : '' },
    { key: 'yearOfBirth', labelAr: 'سنة الميلاد', labelEn: 'Year of Birth', getValue: (e) => e.yearOfBirth ? String(e.yearOfBirth) : '' },
    { key: 'address', labelAr: 'العنوان', labelEn: 'Address', getValue: (e) => e.address || '' },
];
export const DEFAULT_EMPLOYEE_PDF_FIELDS = ['name', 'position', 'nationality', 'salary', 'phone', 'status', 'contractStartDate', 'contractEndDate'];

// ─── Generic PDF Generator ──────────────────────────────────────────────────
export function generateGenericPdf(
    rows: any[],
    fields: GenericPdfFieldOption[],
    selectedFieldKeys: string[],
    t: any,
    isAr: boolean,
    reportTitle: string,
    reportTitleAr: string,
    filterSummary?: string
) {
    const selectedFields = selectedFieldKeys
        .map(key => fields.find(f => f.key === key))
        .filter(Boolean) as GenericPdfFieldOption[];

    const now = new Date();
    const dateStr = now.toLocaleDateString(isAr ? 'ar-KW' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const n = selectedFields.length;
    const minColWidthPx = n > 18 ? 60 : n > 14 ? 68 : n > 10 ? 78 : 90;
    const contentWidthPx = Math.max(860, n * minColWidthPx + 80);
    const isLandscape = n > 8;
    const orientation: 'portrait' | 'landscape' = isLandscape ? 'landscape' : 'portrait';
    const pageWidthMm = isLandscape ? 297 : 210;
    const pageHeightMm = isLandscape ? 210 : 297;
    const pxPerMm = 96 / 25.4;
    const finalPageWidthMm = Math.max(pageWidthMm, contentWidthPx / pxPerMm);
    const fontSize = n > 18 ? '7px' : n > 14 ? '7.5px' : n > 10 ? '8.5px' : n > 8 ? '9.5px' : '11px';
    const cellPad = n > 18 ? '4px 3px' : n > 14 ? '5px 3px' : n > 8 ? '7px 5px' : '10px 8px';
    const thFontSize = n > 18 ? '6.5px' : n > 14 ? '7px' : n > 8 ? '8px' : '10px';

    const buildPdf = (logoDataUrl: string) => {
        const container = document.createElement('div');
        container.setAttribute('dir', isAr ? 'rtl' : 'ltr');
        container.style.padding = '40px';
        container.style.backgroundColor = '#ffffff';
        container.style.fontFamily = isAr ? "'Cairo', 'Almarai', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        container.style.width = `${contentWidthPx}px`;
        container.style.boxSizing = 'border-box';

        const logoHtml = logoDataUrl
            ? `<img src="${logoDataUrl}" style="height:55px;width:auto;object-fit:contain;display:block;" alt="logo" />`
            : '';
        const headerDir = isAr ? 'row-reverse' : 'row';
        const reportSideAlign = isAr ? 'left' : 'right';
        const title = isAr ? reportTitleAr : reportTitle;

        const headerHtml = `
            <div style="background:#1a1a1a;padding:22px 30px;border-bottom:3px solid #C9A24D;margin:-40px -40px 28px -40px;color:white;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-direction:${headerDir};">
                    <div style="display:flex;align-items:center;gap:14px;flex-direction:${headerDir};">
                        ${logoHtml}
                        <div>
                            <h1 style="margin:0;font-size:22px;color:white;">
                                <span style="color:#fff;">${t('common.title_part1')}</span>
                                <span style="color:#C9A24D;"> ${t('common.title_part2')}</span>
                            </h1>
                            <p style="margin:3px 0 0 0;color:#C9A24D;font-size:11px;text-transform:uppercase;">
                                ${t('common.company_subtitle', { defaultValue: 'Athlete Management' })}
                            </p>
                        </div>
                    </div>
                    <div style="text-align:${reportSideAlign};">
                        <h2 style="margin:0;font-size:15px;color:#C9A24D;">${title}</h2>
                        <p style="margin:4px 0 0 0;font-size:10px;color:#888;">${t('common.generated_on', { defaultValue: 'Generated' })}: ${dateStr}</p>
                    </div>
                </div>
            </div>
        `;

        const statsHtml = `
            <div style="display:flex;gap:16px;margin-bottom:22px;">
                <div style="background:#fdfaf0;border:1px solid #eee7d5;padding:12px 20px;border-radius:10px;flex:1;">
                    <p style="margin:0;font-size:10px;color:#8a7340;text-transform:uppercase;font-weight:bold;">${t('common.total', { defaultValue: 'Total' })}</p>
                    <p style="margin:4px 0 0 0;font-size:22px;font-weight:800;color:#1a1a1a;">${rows.length}</p>
                </div>
                ${filterSummary ? `
                <div style="background:#f5f5f5;border:1px solid #eee;padding:12px 20px;border-radius:10px;flex:2;">
                    <p style="margin:0;font-size:10px;color:#666;text-transform:uppercase;font-weight:bold;">${t('common.pdf_export.active_filters', { defaultValue: 'Active Filters' })}</p>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#1a1a1a;">${filterSummary}</p>
                </div>
                ` : ''}
            </div>
        `;

        const tableHtml = `
            <table style="width:100%;border-collapse:collapse;font-size:${fontSize};table-layout:auto;">
                <thead>
                    <tr style="background:#1a1a1a;">
                        ${selectedFields.map(f => `
                            <th style="padding:${cellPad};border:1px solid #2d2d2d;color:#C9A24D;text-align:${isAr ? 'right' : 'left'};font-weight:800;text-transform:uppercase;font-size:${thFontSize};">
                                ${isAr ? f.labelAr : f.labelEn}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((row, idx) => `
                        <tr style="background-color:${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'};page-break-inside:avoid;">
                            ${selectedFields.map(f => `
                                <td style="padding:${cellPad};border:1px solid #eee;color:#000;line-height:1.4;">
                                    ${f.getValue(row, t, isAr)}
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const footerHtml = `
            <div style="margin-top:36px;padding-top:14px;border-top:1px solid #eee;display:flex;justify-content:space-between;color:#999;font-size:9px;">
                <p style="margin:0;">${t('common.footer_copyright', { defaultValue: 'Ashkanani Sport for Athlete Management - © 2026' })}</p>
                <p style="margin:0;">www.ashkananisports.com</p>
            </div>
        `;

        container.innerHTML = `${headerHtml}${statsHtml}${tableHtml}${footerHtml}`;

        const opt = {
            margin: 0,
            filename: `ashkanani_${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
                scale: 3, 
                useCORS: true, 
                letterRendering: false, 
                windowWidth: contentWidthPx, 
                scrollX: 0, 
                scrollY: 0,
                onclone: (clonedDoc: Document) => {
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        :root {
                            --primary: #C9A24D !important;
                            --color-asm-gold: #C9A24D !important;
                        }
                        * { box-shadow: none !important; transition: none !important; animation: none !important; }
                    `;
                    clonedDoc.head.appendChild(style);

                    // Smart Color Substitution
                    try {
                        const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
                        styleTags.forEach(tag => {
                            if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
                                tag.innerHTML = tag.innerHTML
                                    .replace(/oklch\([^)]+\)/g, '#C9A24D')
                                    .replace(/oklab\([^)]+\)/g, '#1a1a1a');
                            }
                        });
                    } catch (e) {}
                }
            },
            jsPDF: { unit: 'mm' as const, format: [finalPageWidthMm, pageHeightMm] as [number, number], orientation }
        };
        html2pdf().set(opt).from(container).save();
    };

    fetch('/logo.png')
        .then(res => { if (!res.ok) throw new Error('logo not found'); return res.blob(); })
        .then(blob => { const reader = new FileReader(); reader.onloadend = () => buildPdf(reader.result as string); reader.readAsDataURL(blob); })
        .catch(() => buildPdf(''));
}

export function generateNutritionPdf(
    player: any,
    nutritionData: any,
    t: any,
    isAr: boolean
) {
    const now = new Date();
    const dateStr = now.toLocaleDateString(isAr ? 'ar-KW' : 'en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const dir = isAr ? 'rtl' : 'ltr';

    // A4 width at 96dpi is ~794px. We'll use 800px and adjust the page format to fit.
    const containerWidthPx = 800;
    const pxPerMm = 96 / 25.4;
    const containerWidthMm = containerWidthPx / pxPerMm;

    const buildPdf = (logoDataUrl: string) => {
        const container = document.createElement('div');
        container.setAttribute('dir', dir);
        container.style.padding = '40px';
        container.style.backgroundColor = '#ffffff';
        container.style.fontFamily = isAr ? "'Cairo', 'Almarai', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        container.style.width = `${containerWidthPx}px`;
        container.style.boxSizing = 'border-box';
        container.style.color = '#000';

        const logoHtml = logoDataUrl ? `<img src="${logoDataUrl}" style="height:55px;width:auto;object-fit:contain;display:block;" alt="logo" />` : '';
        const headerDir = isAr ? 'row-reverse' : 'row';
        const align = isAr ? 'right' : 'left';
        const oppAlign = isAr ? 'left' : 'right';

        const headerHtml = `
            <div style="background:#1a1a1a;padding:22px 30px;border-bottom:3px solid #C9A24D;margin:-40px -40px 28px -40px;color:white;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-direction:${headerDir};">
                    <div style="display:flex;align-items:center;gap:14px;flex-direction:${headerDir};">
                        ${logoHtml}
                        <div>
                            <h1 style="margin:0;font-size:22px;color:white;">
                                <span style="color:#fff;">${t('common.title_part1')}</span>
                                <span style="color:#C9A24D;"> ${t('common.title_part2')}</span>
                            </h1>
                            <p style="margin:3px 0 0 0;color:#C9A24D;font-size:11px;text-transform:uppercase;">
                                ${t('common.company_subtitle', { defaultValue: 'Athlete Management' })}
                            </p>
                        </div>
                    </div>
                    <div style="text-align:${oppAlign};">
                        <h2 style="margin:0;font-size:15px;color:#C9A24D;">${t('owner.nutrition.title', { defaultValue: 'Nutrition Department' })}</h2>
                        <p style="margin:4px 0 0 0;font-size:10px;color:#888;">${t('common.generated_on', { defaultValue: 'Generated' })}: ${dateStr}</p>
                    </div>
                </div>
            </div>
        `;

        const pName = player ? (isAr ? player.name_ar || player.nameAr || player.name : player.name || player.name_ar || player.nameAr) : '';
        const playerPhotoUrl = player?.mainPhoto?.url || (player?.photos && player?.photos.find((p: any) => p.isMain)?.url);
        const playerPhotoHtml = playerPhotoUrl
            ? `<img src="${playerPhotoUrl}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;object-position:top;border:2px solid #C9A24D;" crossorigin="anonymous"/>`
            : `<div style="width:64px;height:64px;border-radius:50%;background:#e2e8f0;border:2px solid #C9A24D;display:flex;align-items:center;justify-content:center;font-size:24px;color:#94a3b8;font-weight:bold;">${pName ? pName.charAt(0) : ''}</div>`;

        // Calculate age if missing but dateOfBirth exists
        let displayAge = player.age;
        if (!displayAge && (player.dateOfBirth || player.date_of_birth)) {
            const dob = player.dateOfBirth || player.date_of_birth;
            displayAge = dayjs().diff(dayjs(dob), 'year');
        }

        const playerHtml = `
            <div style="display:flex;gap:16px;margin-bottom:22px;align-items:center;background:#fdfaf0;border:1px solid #eee7d5;padding:16px;border-radius:10px;flex-direction:${headerDir};">
                ${playerPhotoHtml}
                <div style="flex:1;text-align:${align}">
                    <h2 style="margin:0;font-size:20px;color:#1a1a1a;">${pName}</h2>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#8a7340;">${displayAge || '-'} ${isAr ? 'سنة' : 'Years'} | ${player.sport ? t('enums.Sport.' + player.sport) : ''}</p>
                </div>
            </div>
        `;

        let contentHtml = '';

        if (nutritionData.physical_reports && nutritionData.physical_reports.length > 0) {
            contentHtml += `<div class="pdf-section" style="page-break-inside: avoid; break-inside: avoid;"><h3 style="margin-top:20px;color:#1a1a1a;border-bottom:2px solid #C9A24D;padding-bottom:5px;text-align:${align}">${t('owner.nutrition.physical_reports', {defaultValue: 'Physical Reports'})}</h3></div>`;
            nutritionData.physical_reports.forEach((rep: any) => {
                let imgHtml = '';
                if (rep.image_url) {
                    const imgUrlStr = rep.image_url.startsWith('http') ? rep.image_url : 'http://127.0.0.1:8000/storage/' + rep.image_url.replace('/storage/', '');
                    imgHtml = `<div style="margin-top:15px;text-align:center; page-break-inside: avoid; break-inside: avoid; display: block;"><img src="${imgUrlStr}" style="max-width:100%;max-height:400px;border-radius:8px;object-fit:contain;box-shadow:0 2px 8px rgba(0,0,0,0.1);" crossorigin="anonymous"/></div>`;
                }
                contentHtml += `
                <div class="pdf-item" style="background:#fcfcfc;border:1px solid #f0f0f0;padding:12px;margin-bottom:8px;border-radius:10px;text-align:${align}; display: block;">
                    <div style="page-break-inside: avoid; break-inside: avoid; display: block;">
                        <div style="font-weight:bold;margin-bottom:6px;color:#C9A24D">${rep.report_date || ''}</div>
                        <div style="display:flex;flex-wrap:wrap;gap:15px;flex-direction:${headerDir};font-size:13px;">
                            <div style="min-width:110px;"><strong>${t('owner.nutrition.weight')}:</strong> ${rep.weight || '-'} kg</div>
                            <div style="min-width:110px;"><strong>${t('owner.nutrition.fat_percentage_label')}:</strong> ${rep.fat_percentage || '-'}%</div>
                            <div style="min-width:110px;"><strong>${t('owner.nutrition.muscle_mass_label')}:</strong> ${rep.muscle_mass || '-'} kg</div>
                        </div>
                    </div>
                    ${imgHtml}
                </div>`;
            });
        }

        if (nutritionData.nutrition_programs && nutritionData.nutrition_programs.length > 0) {
            contentHtml += `<div class="pdf-section" style="page-break-inside: avoid; break-inside: avoid;"><h3 style="margin-top:30px;color:#1a1a1a;border-bottom:2px solid #C9A24D;padding-bottom:5px;text-align:${align}">${t('owner.nutrition.nutrition_plans', {defaultValue: 'Nutrition Plans'})}</h3></div>`;
            nutritionData.nutrition_programs.forEach((prog: any) => {
                let imgHtml = '';
                if (prog.image_url) {
                    const imgUrlStr = prog.image_url.startsWith('http') ? prog.image_url : 'http://127.0.0.1:8000/storage/' + prog.image_url.replace('/storage/', '');
                    imgHtml = `<div style="margin-top:15px;text-align:center; page-break-inside: avoid; break-inside: avoid; display: block;"><img src="${imgUrlStr}" style="max-width:100%;max-height:400px;border-radius:8px;object-fit:contain;box-shadow:0 2px 8px rgba(0,0,0,0.1);" crossorigin="anonymous"/></div>`;
                }
                contentHtml += `
                <div class="pdf-item" style="background:#fcfcfc;border:1px solid #f0f0f0;padding:12px;margin-bottom:10px;border-radius:10px;text-align:${align}; display: block;">
                    <div style="page-break-inside: avoid; break-inside: avoid; display: block;">
                        <div style="font-weight:bold;margin-bottom:6px;color:#C9A24D">${prog.title || ''} (${prog.start_date || ''}${prog.end_date ? ' - ' + prog.end_date : ''})</div>
                        <div style="display:flex;flex-wrap:wrap;gap:15px;margin-bottom:10px;flex-direction:${headerDir};font-size:12px;background:#fff;padding:8px;border-radius:8px;border:1px solid #f5f5f5;">
                            <div style="min-width:100px;"><strong>${t('owner.nutrition.calories_count')}:</strong> ${prog.daily_calories || '-'}</div>
                            <div style="min-width:100px;"><strong>${t('owner.nutrition.protein')}:</strong> ${prog.protein_grams || '-'} ${t('owner.nutrition.unit_gram')}</div>
                            <div style="min-width:100px;"><strong>${t('owner.nutrition.carbs')}:</strong> ${prog.carbs_grams || '-'} ${t('owner.nutrition.unit_gram')}</div>
                            <div style="min-width:100px;"><strong>${t('owner.nutrition.fat')}:</strong> ${prog.fat_grams || '-'} ${t('owner.nutrition.unit_gram')}</div>
                        </div>
                    </div>
                    <div style="margin-bottom:10px; page-break-inside: avoid; break-inside: avoid; display: block;"><strong style="font-size:11px;color:#666;">${t('owner.nutrition.meal_details')}:</strong><br/><div style="white-space:pre-wrap;margin-top:4px;font-size:12px;line-height:1.4;background:#fff;padding:8px;border-radius:8px;">${prog.meal_details || '-'}</div></div>
                    <div style="page-break-inside: avoid; break-inside: avoid; display: block;"><strong style="font-size:11px;color:#666;">${t('owner.nutrition.supplements_list')}:</strong><br/><div style="white-space:pre-wrap;margin-top:4px;font-size:12px;line-height:1.4;background:#fff;padding:8px;border-radius:8px;">${prog.supplements || '-'}</div></div>
                    ${imgHtml}
                </div>`;
            });
        }

        if (nutritionData.training_programs && nutritionData.training_programs.length > 0) {
            contentHtml += `<div class="pdf-section" style="page-break-inside: avoid; break-inside: avoid;"><h3 style="margin-top:30px;color:#1a1a1a;border-bottom:2px solid #C9A24D;padding-bottom:5px;text-align:${align}">${t('owner.nutrition.training_plans', {defaultValue: 'Training Plans'})}</h3></div>`;
            nutritionData.training_programs.forEach((prog: any) => {
                let imgHtml = '';
                if (prog.image_url) {
                    const imgUrlStr = prog.image_url.startsWith('http') ? prog.image_url : 'http://127.0.0.1:8000/storage/' + prog.image_url.replace('/storage/', '');
                    imgHtml = `<div style="margin-top:15px;text-align:center; page-break-inside: avoid; break-inside: avoid; display: block;"><img src="${imgUrlStr}" style="max-width:100%;max-height:400px;border-radius:8px;object-fit:contain;box-shadow:0 2px 8px rgba(0,0,0,0.1);" crossorigin="anonymous"/></div>`;
                }
                contentHtml += `
                <div class="pdf-item" style="background:#fcfcfc;border:1px solid #f0f0f0;padding:12px;margin-bottom:8px;border-radius:10px;text-align:${align}; display: block;">
                    <div style="page-break-inside: avoid; break-inside: avoid; display: block;">
                        <div style="font-weight:bold;margin-bottom:6px;color:#C9A24D">${prog.title || ''} (${prog.start_date || ''}${prog.end_date ? ' - ' + prog.end_date : ''})</div>
                    </div>
                    <div style="margin-bottom:10px; page-break-inside: avoid; break-inside: avoid; display: block;"><strong style="font-size:11px;color:#666;">${t('owner.nutrition.workout_details')}:</strong><br/><div style="white-space:pre-wrap;margin-top:4px;font-size:12px;line-height:1.4;background:#fff;padding:8px;border-radius:8px;">${prog.workout_plan || prog.workout_details || '-'}</div></div>
                    <div style="page-break-inside: avoid; break-inside: avoid; display: block;"><strong style="font-size:11px;color:#666;">${t('owner.nutrition.recovery_details')}:</strong><br/><div style="white-space:pre-wrap;margin-top:4px;font-size:12px;line-height:1.4;background:#fff;padding:8px;border-radius:8px;">${prog.recovery_plan || prog.recovery_details || '-'}</div></div>
                    ${imgHtml}
                </div>`;
            });
        }

        if (nutritionData.progress_photos && nutritionData.progress_photos.length > 0) {
            let photosHtml = `<h3 style="margin-top:30px;color:#1a1a1a;border-bottom:2px solid #C9A24D;padding-bottom:5px;text-align:${align}">${t('owner.nutrition.progress_photos', {defaultValue: 'Progress Photos'})}</h3>`;
            photosHtml += `<div style="display:flex; flex-wrap:wrap; gap:15px; direction:${dir}">`;
            
            nutritionData.progress_photos.forEach((photo: any) => {
                const imgUrlStr = photo.photo_url || (photo.photo_path ? (photo.photo_path.startsWith('http') ? photo.photo_path : 'http://127.0.0.1:8000/storage/' + photo.photo_path) : '');
                
                let vtName = photo.view_type || '';
                if (vtName === 'FRONT') vtName = isAr ? 'أمامي (Front)' : 'Front';
                else if (vtName === 'SIDE') vtName = isAr ? 'جانبي (Side)' : 'Side';
                else if (vtName === 'BACK') vtName = isAr ? 'خلفي (Back)' : 'Back';
                
                let stgName = photo.stage || '';
                if (stgName === 'BEFORE') stgName = isAr ? 'قبل البرنامج' : 'Before';
                else if (stgName === 'DURING') stgName = isAr ? 'أثناء البرنامج' : 'During';
                else if (stgName === 'AFTER') stgName = isAr ? 'بعد البرنامج' : 'After';
                
                const combinedStage = stgName ? (' - ' + stgName) : '';
                const titleStr = photo.captured_at || photo.report_date || '';
                
                photosHtml += `
                <div style="width:230px; background:#f9f9f9; border:1px solid #ddd; padding:10px; border-radius:8px; text-align:center; page-break-inside: avoid; break-inside: avoid;">
                    <img src="${imgUrlStr}" style="width:100%;height:200px;object-fit:cover;border-radius:5px;margin-bottom:8px;" crossorigin="anonymous"/>
                    <div style="font-size:12px;font-weight:bold;">${titleStr}</div>
                    <div style="font-size:10px;margin-top:4px;">${vtName || ''} ${combinedStage}</div>
                </div>`;
            });
            photosHtml += '</div>';
            contentHtml += photosHtml;
        }

        const footerHtml = `
            <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;display:flex;justify-content:space-between;color:#999;font-size:10px;margin-bottom:10px;">
                <p style="margin:0;">${t('common.footer_copyright', { defaultValue: 'Ashkanani Sport for Athlete Management - © 2026' })}</p>
                <p style="margin:0;">www.ashkananisports.com</p>
            </div>
        `;

        container.innerHTML = `${headerHtml}${playerHtml}${contentHtml}${footerHtml}`;

        const opt = {
            margin: [10, 0, 15, 0] as [number, number, number, number],
            pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-section', 'h3'] },
            filename: `${pName}_Nutrition_Report.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
                scale: 3, 
                useCORS: true, 
                letterRendering: false, 
                logging: false,
                windowWidth: containerWidthPx,
                onclone: (clonedDoc: Document) => {
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        :root {
                            --primary: #C9A24D !important;
                            --color-asm-gold: #C9A24D !important;
                        }
                        * { box-shadow: none !important; transition: none !important; animation: none !important; }
                    `;
                    clonedDoc.head.appendChild(style);

                    // Smart Color Substitution
                    try {
                        const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
                        styleTags.forEach(tag => {
                            if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
                                tag.innerHTML = tag.innerHTML
                                    .replace(/oklch\([^)]+\)/g, '#C9A24D')
                                    .replace(/oklab\([^)]+\)/g, '#1a1a1a');
                            }
                        });
                    } catch (e) {}
                }
            },
            jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
        };

        // Preload all images in memory so they are cached when html2canvas runs
        const images = Array.from(container.querySelectorAll('img'));
        const promises = images.map(img => {
            return new Promise(resolve => {
                const tempImg = new Image();
                tempImg.onload = () => resolve(null);
                tempImg.onerror = () => resolve(null);
                tempImg.src = img.src;
            });
        });

        Promise.all(promises).then(() => {
            html2pdf().set(opt).from(container).save();
        });
    };

    fetch('/logo.png')
        .then(res => { if (!res.ok) throw new Error('logo not found'); return res.blob(); })
        .then(blob => { const reader = new FileReader(); reader.onloadend = () => buildPdf(reader.result as string); reader.readAsDataURL(blob); })
        .catch(() => buildPdf(''));
}

