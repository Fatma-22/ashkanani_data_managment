import React, { useState, useEffect } from 'react';
import { 
    Card, Row, Col, Typography, Avatar, Button, Divider, Space, Tag, 
    Select, Skeleton, Empty, Tabs, Modal, Form, Input, InputNumber, 
    Upload, message, DatePicker, Table, Tooltip, Popconfirm, Pagination, Image, Radio
} from 'antd';
import { 
    MedicineBoxOutlined, 
    ArrowRightOutlined, 
    CheckOutlined, 
    CalendarOutlined, 
    TeamOutlined, 
    FileTextOutlined,
    StarOutlined,
    PlusOutlined,
    SearchOutlined,
    UserOutlined,
    CloudUploadOutlined,
    HistoryOutlined,
    ThunderboltOutlined,
    DeleteOutlined,
    EyeOutlined,
    EditOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { nutritionService } from '../../services/nutritionService';
import { playerService } from '../../services/playerService';
import { ProfileRole, ContractStatus } from '../../types';
import PlayerCard from '../../components/PlayerCard';
import { generateNutritionPdf } from '../../utils/pdfExport';
import dayjs from 'dayjs';
import { useStickyState } from '../../utils/hooks';
import { useRef } from 'react';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const norm = (s: string) => (s || '').toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي');

// Reusable Icon wrapper to avoid pointer capture prop noise
const Icon = (Component: any) => (props: any) => <Component onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} {...props} />;
const MedicineBoxIcon = Icon(MedicineBoxOutlined);
const ArrowRightIcon = Icon(ArrowRightOutlined);
const CheckIcon = Icon(CheckOutlined);
const CalendarIcon = Icon(CalendarOutlined);
const TeamIcon = Icon(TeamOutlined);
const FileTextIcon = Icon(FileTextOutlined);
const StarIcon = Icon(StarOutlined);
const PlusIcon = Icon(PlusOutlined);
const SearchIcon = Icon(SearchOutlined);
const UserIcon = Icon(UserOutlined);
const UploadIcon = Icon(CloudUploadOutlined);
const HistoryIcon = Icon(HistoryOutlined);
const ThunderboltIcon = Icon(ThunderboltOutlined);
const DeleteIcon = Icon(DeleteOutlined);
const TrashIcon = DeleteIcon;
const EyeIcon = Icon(EyeOutlined);
const EditIcon = Icon(EditOutlined);

export const Nutrition: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useStickyState<string | null>(null, 'Admin_Nutrition_selectedPlayerId');
    const [playerFile, setPlayerFile] = useState<any>(null);
    const [fileLoading, setFileLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [nutritionPage, setNutritionPage] = useState(1);
    const [trainingPage, setTrainingPage] = useState(1);
    const pageSize = 6;

    // Modals
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
    const [isPhotoEditModalOpen, setIsPhotoEditModalOpen] = useState(false);
    const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);
    const [selectedUploadFile, setSelectedUploadFile] = useState<any>(null);
    const [recordFilter, setRecordFilter] = useStickyState<'all' | 'with' | 'without'>('all', 'Admin_Nutrition_recordFilter');
    
    // Pagination for Main Directory
    const [currentPage, setCurrentPage] = useStickyState(1, 'Admin_Nutrition_currentPage');
    const directoryPageSize = 8;
    const isFirstRender = useRef(true);

    // Editing State
    const [editingItem, setEditingItem] = useState<any>(null);
    const [reportFileList, setReportFileList] = useState<any[]>([]);
    const [reportImageFileList, setReportImageFileList] = useState<any[]>([]);
    const [nutritionFileList, setNutritionFileList] = useState<any[]>([]);
    const [nutritionImageFileList, setNutritionImageFileList] = useState<any[]>([]);
    const [trainingFileList, setTrainingFileList] = useState<any[]>([]);
    const [trainingImageFileList, setTrainingImageFileList] = useState<any[]>([]);
    
    const [reportForm] = Form.useForm();
    const [nutritionForm] = Form.useForm();
    const [trainingForm] = Form.useForm();
    const [photoForm] = Form.useForm();
    const [photoUploadForm] = Form.useForm();

    useEffect(() => {
        loadData();
    }, [recordFilter]);

    useEffect(() => {
        if (selectedPlayerId) {
            loadPlayerFile(selectedPlayerId);
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, playersRes] = await Promise.all([
                nutritionService.getStats(),
                playerService.getAll({ 
                    role: [ProfileRole.PLAYER],
                    contractStatus: recordFilter === 'with' ? undefined : [ContractStatus.ACTIVE],
                    isApproved: recordFilter === 'with' ? undefined : true,
                    isVisible: recordFilter === 'with' ? undefined : true,
                    hasNutrition: recordFilter === 'all' ? undefined : recordFilter === 'with'
                }, 1, 1000)
            ]);
            setStats(statsRes);
            const allPlayers = playersRes.players || [];
            
            // Rely on backend filtering for robustness
            setPlayers(allPlayers);
        } catch (error) {
            console.error('Error loading nutrition data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPlayerFile = async (playerId: string) => {
        setFileLoading(true);
        try {
            const res = await nutritionService.getPlayerFile(playerId);
            setPlayerFile(res);
        } catch (error) {
            message.error(t('messages.error_loading_data'));
        } finally {
            setFileLoading(false);
        }
    };

    const handlePlayerChange = (value: string) => {
        setSelectedPlayerId(value);
        loadPlayerFile(value);
    };

    const quickStats = [
        { title: t('owner.dashboard.players'), value: stats?.active_players_count || '0', icon: <TeamIcon />, color: '#1890ff' },
        { title: t('owner.nutrition.physical_reports'), value: stats?.reports_count || '0', icon: <FileTextIcon />, color: '#C9A24D' },
        { title: t('owner.nutrition.nutrition_plans'), value: stats?.nutrition_programs_count || '0', icon: <MedicineBoxIcon />, color: '#52c41a' },
        { title: t('owner.nutrition.training_plans'), value: stats?.training_programs_count || '0', icon: <StarIcon />, color: '#722ed1' }
    ];

    // Form Handlers
    const onFinishReport = async (values: any) => {
        if (!selectedPlayerId) return;
        try {
            const formData = new FormData();
            formData.append('player_id', selectedPlayerId);
            formData.append('report_date', values.report_date.format('YYYY-MM-DD'));
            if (values.weight !== undefined && values.weight !== null) formData.append('weight', values.weight);
            if (values.height !== undefined && values.height !== null) formData.append('height', values.height);
            if (values.fat_percentage !== undefined && values.fat_percentage !== null) formData.append('fat_percentage', values.fat_percentage);
            if (values.muscle_mass !== undefined && values.muscle_mass !== null) formData.append('muscle_mass', values.muscle_mass);
            if (values.physical_assessment !== undefined && values.physical_assessment !== null) formData.append('physical_assessment', values.physical_assessment);

            if (reportFileList.length > 0 && reportFileList[0].originFileObj) {
                formData.append('report_file', reportFileList[0].originFileObj);
            } else if (editingItem?.file_url && reportFileList.length === 0) {
                formData.append('remove_file', '1');
            }

            if (reportImageFileList.length > 0 && reportImageFileList[0].originFileObj) {
                formData.append('report_image', reportImageFileList[0].originFileObj);
            } else if (editingItem?.image_url && reportImageFileList.length === 0) {
                formData.append('remove_image', '1');
            }

            if (editingItem) {
                await nutritionService.updatePhysicalReport(editingItem.id, formData);
                message.success(t('messages.success_update'));
            } else {
                await nutritionService.savePhysicalReport(formData);
                message.success(t('messages.saved_successfully'));
            }
            
            setIsReportModalOpen(false);
            setEditingItem(null);
            setReportFileList([]);
            setReportImageFileList([]);
            loadPlayerFile(selectedPlayerId);
            reportForm.resetFields();
        } catch (error) {
            message.error(t('messages.error_saving'));
        }
    };

    const handleEditReport = (record: any) => {
        setEditingItem(record);
        reportForm.setFieldsValue({
            ...record,
            report_date: dayjs(record.report_date)
        });
        if (record.file_url) {
            setReportFileList([{
                uid: '-1',
                name: isAr ? 'الملف المرفق (PDF)' : 'Attached File (PDF)',
                status: 'done',
                url: record.file_url,
            }]);
        } else {
            setReportFileList([]);
        }
        if (record.image_url) {
            setReportImageFileList([{
                uid: '-2',
                name: isAr ? 'الصورة المرفقة' : 'Attached Image',
                status: 'done',
                url: record.image_url,
            }]);
        } else {
            setReportImageFileList([]);
        }
        setIsReportModalOpen(true);
    };

    const onDeleteReport = async (id: string) => {
        try {
            await nutritionService.deletePhysicalReport(id);
            message.success(t('messages.deleted_successfully'));
            if (selectedPlayerId) loadPlayerFile(selectedPlayerId);
        } catch (error) {
            message.error(t('messages.error_deleting'));
        }
    };

    const onDeleteNutrition = async (id: string) => {
        try {
            await nutritionService.deleteNutritionProgram(id);
            message.success(t('messages.deleted_successfully'));
            if (selectedPlayerId) loadPlayerFile(selectedPlayerId);
        } catch (error) {
            message.error(t('messages.error_deleting'));
        }
    };

    const onDeleteTraining = async (id: string) => {
        try {
            await nutritionService.deleteTrainingProgram(id);
            message.success(t('messages.deleted_successfully'));
            if (selectedPlayerId) loadPlayerFile(selectedPlayerId);
        } catch (error) {
            message.error(t('messages.error_deleting'));
        }
    };

    const onDeletePhoto = async (id: string) => {
        try {
            await nutritionService.deleteProgressPhoto(id);
            message.success(t('messages.deleted_successfully'));
            if (selectedPlayerId) loadPlayerFile(selectedPlayerId);
        } catch (error) {
            message.error(t('messages.error_deleting'));
        }
    };

    const onFinishNutrition = async (values: any) => {
        if (!selectedPlayerId) return;
        try {
            const formData = new FormData();
            formData.append('player_id', selectedPlayerId);
            formData.append('title', values.title);
            if (values.daily_calories !== undefined && values.daily_calories !== null) formData.append('daily_calories', values.daily_calories);
            if (values.protein_grams !== undefined && values.protein_grams !== null) formData.append('protein_grams', values.protein_grams);
            if (values.carbs_grams !== undefined && values.carbs_grams !== null) formData.append('carbs_grams', values.carbs_grams);
            if (values.fat_grams !== undefined && values.fat_grams !== null) formData.append('fat_grams', values.fat_grams);
            if (values.meal_details) formData.append('meal_details', values.meal_details);
            if (values.supplements) formData.append('supplements', values.supplements);
            formData.append('start_date', values.start_date.format('YYYY-MM-DD'));
            if (values.end_date) formData.append('end_date', values.end_date.format('YYYY-MM-DD'));
            formData.append('is_active', values.is_active ? '1' : '0');

            if (nutritionFileList.length > 0 && nutritionFileList[0].originFileObj) {
                formData.append('program_file', nutritionFileList[0].originFileObj);
            } else if (editingItem?.file_url && nutritionFileList.length === 0) {
                formData.append('remove_file', '1');
            }

            if (nutritionImageFileList.length > 0 && nutritionImageFileList[0].originFileObj) {
                formData.append('program_image', nutritionImageFileList[0].originFileObj);
            } else if (editingItem?.image_url && nutritionImageFileList.length === 0) {
                formData.append('remove_image', '1');
            }

            if (editingItem) {
                await nutritionService.updateNutritionProgram(editingItem.id, formData);
                message.success(t('messages.success_update'));
            } else {
                await nutritionService.saveNutritionProgram(formData);
                message.success(t('messages.saved_successfully'));
            }

            setIsNutritionModalOpen(false);
            setEditingItem(null);
            setNutritionFileList([]);
            setNutritionImageFileList([]);
            loadPlayerFile(selectedPlayerId);
            nutritionForm.resetFields();
        } catch (error) {
            message.error(t('messages.error_saving'));
        }
    };

    const handleEditNutrition = (item: any) => {
        setEditingItem(item);
        nutritionForm.setFieldsValue({
            ...item,
            start_date: dayjs(item.start_date),
            end_date: item.end_date ? dayjs(item.end_date) : null
        });
        if (item.file_url) {
            setNutritionFileList([{
                uid: '-1',
                name: isAr ? 'الملف المرفق (PDF)' : 'Attached File (PDF)',
                status: 'done',
                url: item.file_url,
            }]);
        } else {
            setNutritionFileList([]);
        }
        if (item.image_url) {
            setNutritionImageFileList([{
                uid: '-2',
                name: isAr ? 'الصورة المرفقة' : 'Attached Image',
                status: 'done',
                url: item.image_url,
            }]);
        } else {
            setNutritionImageFileList([]);
        }
        setIsNutritionModalOpen(true);
    };

    const onFinishTraining = async (values: any) => {
        if (!selectedPlayerId) return;
        try {
            const formData = new FormData();
            formData.append('player_id', selectedPlayerId);
            formData.append('title', values.title);
            if (values.workout_plan) formData.append('workout_plan', values.workout_plan);
            if (values.recovery_plan) formData.append('recovery_plan', values.recovery_plan);
            formData.append('start_date', values.start_date.format('YYYY-MM-DD'));
            if (values.end_date) formData.append('end_date', values.end_date.format('YYYY-MM-DD'));
            formData.append('is_active', values.is_active ? '1' : '0');

            if (trainingFileList.length > 0 && trainingFileList[0].originFileObj) {
                formData.append('program_file', trainingFileList[0].originFileObj);
            } else if (editingItem?.file_url && trainingFileList.length === 0) {
                formData.append('remove_file', '1');
            }

            if (trainingImageFileList.length > 0 && trainingImageFileList[0].originFileObj) {
                formData.append('program_image', trainingImageFileList[0].originFileObj);
            } else if (editingItem?.image_url && trainingImageFileList.length === 0) {
                formData.append('remove_image', '1');
            }

            if (editingItem) {
                await nutritionService.updateTrainingProgram(editingItem.id, formData);
                message.success(t('messages.success_update'));
            } else {
                await nutritionService.saveTrainingProgram(formData);
                message.success(t('messages.saved_successfully'));
            }

            setIsTrainingModalOpen(false);
            setEditingItem(null);
            setTrainingFileList([]);
            setTrainingImageFileList([]);
            loadPlayerFile(selectedPlayerId);
            trainingForm.resetFields();
        } catch (error) {
            message.error(t('messages.error_saving'));
        }
    };

    const handleEditTraining = (item: any) => {
        setEditingItem(item);
        trainingForm.setFieldsValue({
            ...item,
            start_date: dayjs(item.start_date),
            end_date: item.end_date ? dayjs(item.end_date) : null
        });
        if (item.file_url) {
            setTrainingFileList([{
                uid: '-1',
                name: isAr ? 'الملف المرفق (PDF)' : 'Attached File (PDF)',
                status: 'done',
                url: item.file_url,
            }]);
        } else {
            setTrainingFileList([]);
        }
        if (item.image_url) {
            setTrainingImageFileList([{
                uid: '-2',
                name: isAr ? 'الصورة المرفقة' : 'Attached Image',
                status: 'done',
                url: item.image_url,
            }]);
        } else {
            setTrainingImageFileList([]);
        }
        setIsTrainingModalOpen(true);
    };

    const onFinishPhotoEdit = async (values: any) => {
        if (!selectedPlayerId || !editingItem) return;
        try {
            await nutritionService.updateProgressPhoto(editingItem.id, {
                ...values,
                captured_at: values.captured_at.format('YYYY-MM-DD')
            });
            message.success(t('messages.success_update'));
            setIsPhotoEditModalOpen(false);
            setEditingItem(null);
            loadPlayerFile(selectedPlayerId);
            photoForm.resetFields();
        } catch (error) {
            message.error(t('messages.error_saving'));
        }
    };

    const onFinishPhotoUpload = async (values: any) => {
        if (!selectedPlayerId) return;
        if (!selectedUploadFile) {
            message.error(isAr ? 'الرجاء اختيار صورة' : 'Please select a photo');
            return;
        }
        
        const fileObj = selectedUploadFile.originFileObj || selectedUploadFile;
        const formData = new FormData();
        formData.append('photo', fileObj);
        formData.append('player_id', selectedPlayerId);
        formData.append('captured_at', values.captured_at.format('YYYY-MM-DD'));
        formData.append('view_type', values.view_type || 'OTHER');
        if (values.stage) formData.append('stage', values.stage);
        if (values.notes) formData.append('notes', values.notes);
        
        try {
            await nutritionService.uploadProgressPhoto(formData);
            message.success(t('messages.uploaded_successfully'));
            setIsPhotoUploadModalOpen(false);
            photoUploadForm.resetFields();
            setSelectedUploadFile(null);
            loadPlayerFile(selectedPlayerId);
        } catch (error) {
            message.error(t('messages.error_uploading'));
        }
    };

    const selectedPlayer = playerFile?.player;

    return (
        <div className="p-4 md:p-8">
            <Row gutter={[24, 24]}>
                {/* Header Section */}
                <Col span={24}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                        <div>
                            <Title level={2} className="m-0 text-slate-800">
                                {t('owner.nutrition.title')}
                            </Title>
                            <Text type="secondary" className="text-lg">
                                {t('owner.nutrition.subtitle')}
                            </Text>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Select
                                showSearch
                                className="w-full md:w-72 custom-select"
                                placeholder={isAr ? 'ابحث عن لاعب...' : 'Search for a player...'}
                                optionFilterProp="children"
                                onChange={handlePlayerChange}
                                filterOption={(input, option) => {
                                    const searchStr = norm(input).trim();
                                    if (!searchStr) return true;
                                    const parts = searchStr.split(/\s+/);
                                    const label = norm((option?.label ?? '').toString());
                                    
                                    // Rule 1: First word must match start of name
                                    if (!label.startsWith(parts[0])) return false;
                                    
                                    // Rule 2: Subsequent words must appear in order
                                    let lastIndex = parts[0].length;
                                    for (let i = 1; i < parts.length; i++) {
                                        const nextIndex = label.indexOf(parts[i], lastIndex);
                                        if (nextIndex === -1) return false;
                                        lastIndex = nextIndex + parts[i].length;
                                    }
                                    return true;
                                }}
                                options={players.map(p => ({
                                    value: p.id,
                                    label: isAr ? (p.nameAr || p.name) : p.name
                                }))}
                            />
                            <Button 
                                type="primary" 
                                size="large" 
                                icon={<PlusIcon />}
                                disabled={!selectedPlayerId}
                                onClick={() => {
                                    setEditingItem(null);
                                    reportForm.resetFields();
                                    setIsReportModalOpen(true);
                                }}
                                className="bg-gold-600 hover:bg-gold-700 border-none px-6 h-10 rounded-lg font-bold shadow-lg flex-shrink-0"
                            >
                                {t('common.add', { defaultValue: 'Add New' })}
                            </Button>
                            {selectedPlayerId && (
                                <Button 
                                    type="default"
                                    size="large"
                                    icon={<ArrowRightIcon className={isAr ? "" : "rotate-180"} />}
                                    onClick={() => setSelectedPlayerId(null)}
                                    className="border-slate-200 hover:border-gold-400 hover:text-gold-600 h-10 rounded-lg font-bold"
                                >
                                    {isAr ? 'العودة للقائمة' : 'Back to List'}
                                </Button>
                            )}
                        </div>
                    </div>
                </Col>

                {/* Quick Stats */}
                {quickStats.map((stat, idx) => (
                    <Col xs={24} sm={12} lg={6} key={idx}>
                        <Card className="shadow-sm border-none rounded-2xl hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                    {stat.icon}
                                </div>
                                <Skeleton loading={loading} active paragraph={{ rows: 1 }} title={false}>
                                    <div>
                                        <div className="text-gray-400 text-xs uppercase tracking-wider">{stat.title}</div>
                                        <div className="text-2xl font-black text-slate-700">{stat.value}</div>
                                    </div>
                                </Skeleton>
                            </div>
                        </Card>
                    </Col>
                ))}

                {/* Main Content Area */}
                {!selectedPlayerId ? (
                    <Col span={24}>
                        <Card className="shadow-sm border-none rounded-3xl p-6 text-center">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                                <Title level={3} className="text-slate-800 m-0">
                                    {isAr ? 'قائمة الرياضيين' : 'Athletes Directory'}
                                </Title>
                                <Radio.Group 
                                    value={recordFilter} 
                                    onChange={(e) => {
                                        setRecordFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    buttonStyle="solid"
                                    className="custom-radio-group"
                                >
                                    <Radio.Button value="all">{isAr ? 'الكل' : 'All'}</Radio.Button>
                                    <Radio.Button value="with" className="with-records-btn">
                                        {isAr ? 'لديهم سجلات' : 'With Records'}
                                    </Radio.Button>
                                    <Radio.Button value="without" className="without-records-btn">
                                        {isAr ? 'بدون سجلات' : 'Without Records'}
                                    </Radio.Button>
                                </Radio.Group>
                            </div>
                            <Row gutter={[16, 16]}>
                                {players.slice((currentPage - 1) * directoryPageSize, currentPage * directoryPageSize).map(p => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
                                        <PlayerCard 
                                            player={p}
                                            onClick={() => handlePlayerChange(p.id)}
                                            showActions={false}
                                        />
                                    </Col>
                                ))}
                            </Row>
                            {players.length > directoryPageSize && (
                                <div className="mt-8 flex justify-center">
                                    <Pagination 
                                        current={currentPage}
                                        pageSize={directoryPageSize}
                                        total={players.length}
                                        onChange={(page) => setCurrentPage(page)}
                                        showSizeChanger={false}
                                    />
                                </div>
                            )}
                        </Card>
                    </Col>
                ) : (
                    <Col span={24}>
                        <Card 
                            className="shadow-sm border-none rounded-3xl overflow-hidden"
                            styles={{ body: { padding: 0 } }}
                        >
                            {/* Player Info Header */}
                             <div className="bg-slate-900 p-6 md:p-8 text-white flex flex-row items-center gap-4 md:gap-6">
                                <div className="relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-2xl overflow-hidden border-2 md:border-4 border-gold-400 bg-slate-800 shadow-xl group shrink-0">
                                    {(selectedPlayer?.mainPhoto?.url || selectedPlayer?.photos?.find((p: any) => p.isMain)?.url) ? (
                                        <img 
                                            src={selectedPlayer?.mainPhoto?.url || selectedPlayer?.photos?.find((p: any) => p.isMain)?.url} 
                                            alt={selectedPlayer.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                                            <UserIcon size={32} className="md:w-10 md:h-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-start flex-1 min-w-0">
                                    <Title level={2} className="!text-white !mb-1 text-lg md:text-2xl truncate">
                                        {isAr ? (selectedPlayer?.nameAr || selectedPlayer?.name) : selectedPlayer?.name}
                                    </Title>
                                    <Space wrap className="mt-1 md:mt-2">
                                        <Tag color="gold" className="m-0 text-xs md:text-sm">
                                            {t(`enums.Sport.${selectedPlayer?.sport}`, { defaultValue: selectedPlayer?.sport })}
                                        </Tag>
                                        <Tag className="m-0 bg-slate-800 text-slate-300 border-none text-xs md:text-sm">{isAr ? (selectedPlayer?.nationalityAr || selectedPlayer?.nationality) : selectedPlayer?.nationality}</Tag>
                                        <Tag className="m-0 bg-slate-800 text-slate-300 border-none text-xs md:text-sm">{selectedPlayer?.age} {isAr ? 'سنة' : 'Years'}</Tag>
                                    </Space>
                                </div>
                                    <Button 
                                        onClick={async () => {
                                            try {
                                                setPdfLoading(true);
                                                await generateNutritionPdf(selectedPlayer, playerFile?.data || playerFile, t, isAr);
                                            } catch (error) {
                                                message.error(isAr ? 'فشل تصدير التقرير' : 'Failed to export report');
                                            } finally {
                                                setPdfLoading(false);
                                            }
                                        }} 
                                        type="primary" 
                                        loading={pdfLoading}
                                        className="bg-slate-900 hover:bg-slate-800 border-none h-10 px-6 font-bold rounded-lg" 
                                        icon={<FileTextIcon />}
                                    >
                                        {isAr ? 'تصدير تقرير PDF' : 'Export PDF'}
                                    </Button>
                            </div>

                            <Tabs 
                                className="nutrition-tabs bg-white"
                                defaultActiveKey="reports"
                                centered
                                size="large"
                                items={[
                                    {
                                        key: 'reports',
                                        label: <span className="px-4 font-bold flex items-center gap-2"><FileTextIcon /> {t('owner.nutrition.physical_reports')}</span>,
                                        children: (
                                            <div className="p-6">
                                                <div className="mb-4 flex justify-end">
                                                    <Button type="primary" className="bg-gold-600 border-none font-bold rounded-lg" icon={<PlusIcon />} onClick={() => {
                                                        setEditingItem(null);
                                                        setReportFileList([]);
                                                        reportForm.resetFields();
                                                        setIsReportModalOpen(true);
                                                    }}>
                                                        {t('owner.nutrition.add_physical_report')}
                                                    </Button>
                                                </div>
                                                {fileLoading ? <Skeleton active /> : (
                                                    <Table 
                                                        dataSource={playerFile?.physical_reports} 
                                                        pagination={false}
                                                        rowKey="id"
                                                        locale={{ emptyText: t('owner.nutrition.no_reports') }}
                                                        columns={[
                                                            { title: t('common.date'), dataIndex: 'report_date', key: 'report_date', render: d => dayjs(d).format('YYYY-MM-DD') },
                                                            { title: t('owner.nutrition.weight'), dataIndex: 'weight', key: 'weight' },
                                                            { title: t('common.height_label'), dataIndex: 'height', key: 'height' },
                                                            { title: t('owner.nutrition.fat_percentage_label'), dataIndex: 'fat_percentage', key: 'fat_percentage', render: v => v ? `${v}%` : '-' },
                                                            { title: t('owner.nutrition.muscle_mass_label'), dataIndex: 'muscle_mass', key: 'muscle_mass' },
                                                            { 
                                                                title: t('common.actions'), 
                                                                key: 'actions', 
                                                                render: (_, record: any) => (
                                                                    <Space>
                                                                        {record.file_url && (
                                                                            <Tooltip title={isAr ? 'عرض الملف' : 'View File'}>
                                                                                <Button type="text" icon={<FileTextIcon className="text-blue-600" />} onClick={() => window.open(record.file_url, '_blank')} />
                                                                            </Tooltip>
                                                                        )}
                                                                        <Button type="text" icon={<EyeIcon className="text-gold-600" />} onClick={() => {
                                                                            Modal.info({
                                                                                title: isAr ? 'تفاصيل التقرير' : 'Report Details',
                                                                                content: (
                                                                                    <div className="mt-4 space-y-4">
                                                                                        <div><Text strong>{t('owner.nutrition.physical_assessment')}:</Text><Paragraph>{record.physical_assessment || '-'}</Paragraph></div>
                                                                                    </div>
                                                                                ),
                                                                                width: 600,
                                                                                centered: true
                                                                            });
                                                                        }} />
                                                                        <Button type="text" icon={<EditIcon className="text-gold-600" />} onClick={() => handleEditReport(record)} />
                                                                        <Popconfirm
                                                                            title={t('messages.confirm_delete_title')}
                                                                            description={t('messages.confirm_delete_text')}
                                                                            onConfirm={() => onDeleteReport(record.id)}
                                                                            okText={t('common.yes')}
                                                                            cancelText={t('common.no')}
                                                                        >
                                                                            <Button type="text" danger icon={<TrashIcon />} />
                                                                        </Popconfirm>
                                                                    </Space>
                                                                ) 
                                                            }
                                                        ]}
                                                    />
                                                )}
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'nutrition',
                                        label: <span className="px-4 font-bold flex items-center gap-2"><MedicineBoxIcon /> {t('owner.nutrition.nutrition_plans')}</span>,
                                        children: (
                                            <div className="p-6">
                                                <div className="mb-4 flex justify-end">
                                                    <Button type="primary" className="bg-gold-600 border-none font-bold rounded-lg" icon={<PlusIcon />} onClick={() => {
                                                        setEditingItem(null);
                                                        setNutritionFileList([]);
                                                        nutritionForm.resetFields();
                                                        setIsNutritionModalOpen(true);
                                                    }}>
                                                        {t('owner.nutrition.nutrition_program')}
                                                    </Button>
                                                </div>
                                                <Table 
                                                    dataSource={playerFile?.nutrition_programs} 
                                                    pagination={{ pageSize: pageSize, current: nutritionPage, onChange: setNutritionPage }}
                                                    rowKey="id"
                                                    locale={{ emptyText: t('owner.nutrition.no_nutrition') }}
                                                    columns={[
                                                        { title: t('common.title', { defaultValue: 'Title' }), dataIndex: 'title', key: 'title' },
                                                        { title: t('common.start_date', { defaultValue: 'Start Date' }), dataIndex: 'start_date', key: 'start_date' },
                                                        { title: t('common.end_date', { defaultValue: 'End Date' }), dataIndex: 'end_date', key: 'end_date', render: (v) => v || (isAr ? 'مستمر' : 'Ongoing') },
                                                        { title: t('owner.nutrition.calories'), dataIndex: 'daily_calories', key: 'daily_calories' },
                                                        { 
                                                            title: t('common.status', { defaultValue: 'Status' }), 
                                                            key: 'status', 
                                                            render: (_, prog: any) => {
                                                                if (!prog.is_active) return <Tag className="m-0">{isAr ? 'مؤرشف' : 'Archived'}</Tag>;
                                                                if (!prog.end_date || dayjs(prog.end_date).isAfter(dayjs().subtract(1, 'day'))) {
                                                                    return <Tag color="success" className="m-0">{isAr ? 'نشط' : 'Active'}</Tag>;
                                                                }
                                                                return <Tag color="error" className="m-0">{isAr ? 'منتهي' : 'Expired'}</Tag>;
                                                            }
                                                        },
                                                        { 
                                                            title: t('common.actions'), 
                                                            key: 'actions', 
                                                            render: (_, prog: any) => (
                                                                <Space>
                                                                    {prog.file_url && (
                                                                        <Tooltip title={isAr ? 'عرض ملف البرنامج' : 'View Program File'}>
                                                                            <Button type="text" icon={<FileTextIcon className="text-red-600" />} onClick={() => window.open(prog.file_url, '_blank')} />
                                                                        </Tooltip>
                                                                    )}
                                                                    <Tooltip title={t('owner.nutrition.view_details', { defaultValue: isAr ? 'عرض التفاصيل' : 'View Details' })}>
                                                                        <Button type="text" icon={<EyeIcon className="text-blue-600" />} onClick={() => {
                                                                            Modal.info({
                                                                                title: isAr ? 'تفاصيل البرنامج الغذائي' : 'Nutrition Plan Details',
                                                                                content: (
                                                                                    <div className="mt-4 space-y-4">
                                                                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                                                                                            <div><Text type="secondary" style={{ fontSize: '12px' }}>{t('owner.nutrition.calories')}:</Text> <Text strong>{prog.daily_calories} {t('owner.nutrition.unit_calories')}</Text></div>
                                                                                            <div><Text type="secondary" style={{ fontSize: '12px' }}>{t('owner.nutrition.protein_label')}:</Text> <Text strong>{prog.protein_grams} {t('owner.nutrition.unit_gram')}</Text></div>
                                                                                            <div><Text type="secondary" style={{ fontSize: '12px' }}>{t('owner.nutrition.carbs_label')}:</Text> <Text strong>{prog.carbs_grams} {t('owner.nutrition.unit_gram')}</Text></div>
                                                                                            <div><Text type="secondary" style={{ fontSize: '12px' }}>{t('owner.nutrition.fats_label')}:</Text> <Text strong>{prog.fat_grams} {t('owner.nutrition.unit_gram')}</Text></div>
                                                                                        </div>
                                                                                        <div><Text strong>{t('owner.nutrition.meal_details')}:</Text><Paragraph className="whitespace-pre-wrap mt-1">{prog.meal_details || '-'}</Paragraph></div>
                                                                                        <div><Text strong>{t('owner.nutrition.supplements_list')}:</Text><Paragraph className="whitespace-pre-wrap mt-1">{prog.supplements || '-'}</Paragraph></div>
                                                                                    </div>
                                                                                ),
                                                                                width: 600,
                                                                                centered: true
                                                                            });
                                                                        }} />
                                                                    </Tooltip>
                                                                    <Tooltip title={t('common.edit')}>
                                                                        <Button type="text" icon={<EditIcon className="text-gold-600" />} onClick={() => handleEditNutrition(prog)} />
                                                                    </Tooltip>
                                                                    <Popconfirm
                                                                        title={t('messages.confirm_delete_title')}
                                                                        description={t('messages.confirm_delete_text')}
                                                                        onConfirm={() => onDeleteNutrition(prog.id)}
                                                                        okText={t('common.yes')}
                                                                        cancelText={t('common.no')}
                                                                    >
                                                                        <Tooltip title={t('common.delete')}>
                                                                            <Button danger type="text" icon={<TrashIcon />} />
                                                                        </Tooltip>
                                                                    </Popconfirm>
                                                                </Space>
                                                            ) 
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'training',
                                        label: <span className="px-4 font-bold flex items-center gap-2"><StarIcon /> {t('owner.nutrition.training_plans')}</span>,
                                        children: (
                                            <div className="p-6">
                                                <div className="mb-4 flex justify-end">
                                                    <Button type="primary" className="bg-gold-600 border-none font-bold rounded-lg" icon={<PlusIcon />} onClick={() => {
                                                        setEditingItem(null);
                                                        setTrainingFileList([]);
                                                        trainingForm.resetFields();
                                                        setIsTrainingModalOpen(true);
                                                    }}>
                                                        {t('owner.nutrition.training_program')}
                                                    </Button>
                                                </div>
                                                <Table 
                                                    dataSource={playerFile?.training_programs} 
                                                    pagination={{ pageSize: pageSize, current: trainingPage, onChange: setTrainingPage }}
                                                    rowKey="id"
                                                    locale={{ emptyText: t('owner.nutrition.no_training', { defaultValue: 'No training plans' }) }}
                                                    columns={[
                                                        { title: t('common.title', { defaultValue: 'Title' }), dataIndex: 'title', key: 'title' },
                                                        { title: t('common.start_date', { defaultValue: 'Start Date' }), dataIndex: 'start_date', key: 'start_date' },
                                                        { title: t('common.end_date', { defaultValue: 'End Date' }), dataIndex: 'end_date', key: 'end_date', render: (v) => v || (isAr ? 'مستمر' : 'Ongoing') },
                                                        { 
                                                            title: t('common.status', { defaultValue: 'Status' }), 
                                                            key: 'status', 
                                                            render: (_, prog: any) => {
                                                                if (!prog.is_active) return <Tag className="m-0">{isAr ? 'مؤرشف' : 'Archived'}</Tag>;
                                                                if (!prog.end_date || dayjs(prog.end_date).isAfter(dayjs().subtract(1, 'day'))) {
                                                                    return <Tag color="success" className="m-0">{isAr ? 'نشط' : 'Active'}</Tag>;
                                                                }
                                                                return <Tag color="error" className="m-0">{isAr ? 'منتهي' : 'Expired'}</Tag>;
                                                            }
                                                        },
                                                        { 
                                                            title: t('common.actions'), 
                                                            key: 'actions', 
                                                            render: (_, prog: any) => (
                                                                <Space>
                                                                    {prog.file_url && (
                                                                        <Tooltip title={isAr ? 'عرض ملف البرنامج' : 'View Program File'}>
                                                                            <Button type="text" icon={<FileTextIcon className="text-red-600" />} onClick={() => window.open(prog.file_url, '_blank')} />
                                                                        </Tooltip>
                                                                    )}
                                                                    <Tooltip title={t('owner.nutrition.view_details', { defaultValue: isAr ? 'عرض التفاصيل' : 'View Details' })}>
                                                                        <Button type="text" icon={<EyeIcon className="text-blue-600" />} onClick={() => {
                                                                            Modal.info({
                                                                                title: isAr ? 'تفاصيل البرنامج التدريبي' : 'Training Plan Details',
                                                                                content: (
                                                                                    <div className="mt-4 space-y-4">
                                                                                        {prog.workout_plan && <div><Text strong>{t('owner.nutrition.workout_details')}:</Text><Paragraph className="whitespace-pre-wrap mt-1 bg-slate-50 p-3 rounded-lg">{prog.workout_plan}</Paragraph></div>}
                                                                                        {prog.recovery_plan && <div><Text strong>{t('owner.nutrition.recovery_details')}:</Text><Paragraph className="whitespace-pre-wrap mt-1 bg-slate-50 p-3 rounded-lg">{prog.recovery_plan}</Paragraph></div>}
                                                                                    </div>
                                                                                ),
                                                                                width: 600,
                                                                                centered: true
                                                                            });
                                                                        }} />
                                                                    </Tooltip>
                                                                    <Tooltip title={t('common.edit')}>
                                                                        <Button type="text" icon={<EditIcon className="text-gold-600" />} onClick={() => handleEditTraining(prog)} />
                                                                    </Tooltip>
                                                                    <Popconfirm
                                                                        title={t('messages.confirm_delete_title')}
                                                                        description={t('messages.confirm_delete_text')}
                                                                        onConfirm={() => onDeleteTraining(prog.id)}
                                                                        okText={t('common.yes')}
                                                                        cancelText={t('common.no')}
                                                                    >
                                                                        <Tooltip title={t('common.delete')}>
                                                                            <Button danger type="text" icon={<TrashIcon />} />
                                                                        </Tooltip>
                                                                    </Popconfirm>
                                                                </Space>
                                                            ) 
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'photos',
                                        label: <span className="px-4 font-bold flex items-center gap-2"><CalendarIcon /> {t('owner.nutrition.progress_photos')}</span>,
                                        children: (
                                            <div className="p-6">
                                                <div className="mb-6 flex justify-end">
                                                    <Button 
                                                        type="primary" 
                                                        icon={<UploadIcon />} 
                                                        className="bg-slate-900 hover:bg-slate-800 border-none rounded-lg h-10 font-bold px-6 shadow-md"
                                                        onClick={() => {
                                                            photoUploadForm.resetFields();
                                                            setSelectedUploadFile(null);
                                                            setIsPhotoUploadModalOpen(true);
                                                        }}
                                                    >
                                                        {isAr ? 'رفع صورة جديدة' : 'Upload Photo'}
                                                    </Button>
                                                </div>
                                                <Row gutter={[16, 16]}>
                                                    {playerFile?.progress_photos?.map((photo: any) => (
                                                        <Col xs={12} sm={8} md={6} key={photo.id}>
                                                            <div className="group relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 aspect-square">
                                                                <Image src={photo.photo_url} alt="Progress" width="100%" height="100%" rootClassName="w-full h-full" className="object-cover transition-transform duration-500 group-hover:scale-110 [&_.ant-image-mask]:hidden" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end pointer-events-none">
                                                                    <div className="flex justify-between items-center pointer-events-auto">
                                                                        <div>
                                                                            <Text className="text-white text-xs font-bold">{dayjs(photo.captured_at).format('YYYY-MM-DD')}</Text>
                                                                            <Space className="mt-1" wrap>
                                                                                <Tag className="m-0 bg-gold-600 border-none text-[10px] text-white font-bold">
                                                                                    {photo.view_type === 'FRONT' ? (isAr ? 'أمامي' : 'Front') :
                                                                                     photo.view_type === 'SIDE' ? (isAr ? 'جانبي' : 'Side') :
                                                                                     photo.view_type === 'BACK' ? (isAr ? 'خلفي' : 'Back') :
                                                                                     (isAr ? 'أخرى' : 'Other')}
                                                                                </Tag>
                                                                                {photo.stage && (
                                                                                    <Tag className="m-0 bg-red-500 border-none text-[10px] text-white font-bold">
                                                                                        {photo.stage === 'BEFORE' ? (isAr ? 'قبل البرنامج' : 'Before') :
                                                                                         photo.stage === 'AFTER' ? (isAr ? 'بعد البرنامج' : 'After') :
                                                                                         (isAr ? 'أثناء البرنامج' : 'During')}
                                                                                    </Tag>
                                                                                )}
                                                                            </Space>
                                                                        </div>
                                                                        <Space>
                                                                            <Button size="small" icon={<EditIcon />} onClick={() => {
                                                                                setEditingItem(photo);
                                                                                photoForm.setFieldsValue({
                                                                                    ...photo,
                                                                                    captured_at: dayjs(photo.captured_at)
                                                                                });
                                                                                setIsPhotoEditModalOpen(true);
                                                                            }} />
                                                                            <Popconfirm
                                                                                title={t('messages.confirm_delete_title')}
                                                                                description={t('messages.confirm_delete_text')}
                                                                                onConfirm={() => onDeletePhoto(photo.id)}
                                                                                okText={t('common.yes')}
                                                                                cancelText={t('common.no')}
                                                                            >
                                                                                <Button size="small" danger icon={<TrashIcon />} />
                                                                            </Popconfirm>
                                                                        </Space>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-center font-semibold text-slate-700 text-sm mt-2 mb-1">
                                                                {dayjs(photo.captured_at).format('YYYY-MM-DD')}
                                                            </div>
                                                        </Col>
                                                    ))}
                                                </Row>
                                                {playerFile?.progress_photos?.length === 0 && !fileLoading && <Empty description={t('owner.nutrition.no_progress_photos')} />}
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Modals */}
            <Modal
                title={editingItem ? (isAr ? 'تعديل التقرير' : 'Edit Physical Report') : t('owner.nutrition.add_physical_report')}
                open={isReportModalOpen}
                onCancel={() => {
                    setIsReportModalOpen(false);
                    setEditingItem(null);
                    setReportFileList([]);
                    setReportImageFileList([]);
                    reportForm.resetFields();
                }}
                onOk={() => reportForm.submit()}
                centered
                width={700}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
            >
                <Form form={reportForm} layout="vertical" onFinish={onFinishReport} initialValues={{ report_date: dayjs() }}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="report_date" label={t('owner.nutrition.report_date')} rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item></Col>
                        <Col span={6}><Form.Item name="weight" label={t('owner.nutrition.weight')}><InputNumber className="w-full" suffix="kg" /></Form.Item></Col>
                        <Col span={6}><Form.Item name="height" label={t('common.height_label')}><InputNumber className="w-full" suffix="cm" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="fat_percentage" label={t('owner.nutrition.fat_percentage_label')}><InputNumber className="w-full" suffix="%" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="muscle_mass" label={t('owner.nutrition.muscle_mass_label')}><InputNumber className="w-full" suffix="kg" /></Form.Item></Col>
                        <Col span={24}><Form.Item name="physical_assessment" label={t('owner.nutrition.physical_assessment')}><Input.TextArea rows={4} /></Form.Item></Col>
                        <Col span={12}>
                            <Form.Item label={isAr ? 'ملف التقرير المرفق (PDF)' : 'Attached Report Form (PDF)'}>
                                <Upload
                                    beforeUpload={(file) => {
                                        if (file.type !== 'application/pdf') {
                                            message.error(isAr ? 'يجب إرفاق ملف بصيغة PDF' : 'File must be PDF format');
                                            return Upload.LIST_IGNORE;
                                        }
                                        return false;
                                    }}
                                    fileList={reportFileList}
                                    onChange={({ fileList }) => setReportFileList(fileList)}
                                    maxCount={1}
                                    accept=".pdf,application/pdf"
                                >
                                    <Button icon={<UploadIcon />}>{isAr ? 'إرفاق ملف' : 'Attach File'}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label={isAr ? 'صورة التقرير المرفقة' : 'Attached Report Image'}>
                                <Upload
                                    beforeUpload={(file) => {
                                        if (!file.type.startsWith('image/')) {
                                            message.error(isAr ? 'يجب إرفاق ملف بصيغة صورة' : 'File must be an image');
                                            return Upload.LIST_IGNORE;
                                        }
                                        return false;
                                    }}
                                    fileList={reportImageFileList}
                                    onChange={({ fileList }) => setReportImageFileList(fileList)}
                                    maxCount={1}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadIcon />}>{isAr ? 'إرفاق صورة' : 'Attach Image'}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title={editingItem ? (isAr ? 'تعديل البرنامج الغذائي' : 'Edit Nutrition Plan') : t('owner.nutrition.add_nutrition_plan')}
                open={isNutritionModalOpen}
                onCancel={() => {
                    setIsNutritionModalOpen(false);
                    setEditingItem(null);
                    setNutritionFileList([]);
                    setNutritionImageFileList([]);
                    nutritionForm.resetFields();
                }}
                onOk={() => nutritionForm.submit()}
                centered
                width={800}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
            >
                <Form form={nutritionForm} layout="vertical" onFinish={onFinishNutrition} initialValues={{ start_date: dayjs() }}>
                    <Form.Item name="title" label={isAr ? 'عنوان البرنامج' : 'Plan Title'} rules={[{ required: true }]}><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={6}><Form.Item name="daily_calories" label={t('owner.nutrition.calories_count')}><InputNumber className="w-full" /></Form.Item></Col>
                        <Col span={6}><Form.Item name="protein_grams" label={t('owner.nutrition.protein')}><InputNumber className="w-full" /></Form.Item></Col>
                        <Col span={6}><Form.Item name="carbs_grams" label={t('owner.nutrition.carbs')}><InputNumber className="w-full" /></Form.Item></Col>
                        <Col span={6}><Form.Item name="fat_grams" label={t('owner.nutrition.fat')}><InputNumber className="w-full" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="start_date" label={t('common.start_date')} rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label={t('common.end_date')}><DatePicker className="w-full" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="meal_details" label={t('owner.nutrition.meal_details')}><Input.TextArea rows={6} placeholder={isAr ? 'أدخل تفاصيل الوجبات (فطور، غداء، عشاء...)' : 'Enter meal details...'} /></Form.Item>
                    <Form.Item name="supplements" label={t('owner.nutrition.supplements_list')}><Input.TextArea rows={3} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label={isAr ? 'ملف البرنامج المرفق (PDF)' : 'Attached Program File (PDF)'}>
                                <Upload
                                    beforeUpload={(file) => {
                                        if (file.type !== 'application/pdf') {
                                            message.error(isAr ? 'يجب إرفاق ملف بصيغة PDF' : 'File must be PDF format');
                                            return Upload.LIST_IGNORE;
                                        }
                                        return false;
                                    }}
                                    fileList={nutritionFileList}
                                    onChange={({ fileList }) => setNutritionFileList(fileList)}
                                    maxCount={1}
                                    accept=".pdf,application/pdf"
                                >
                                    <Button icon={<UploadIcon />}>{isAr ? 'إرفاق ملف' : 'Attach File'}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label={isAr ? 'صورة البرنامج المرفقة' : 'Attached Program Image'}>
                                <Upload
                                    beforeUpload={(file) => {
                                        if (!file.type.startsWith('image/')) {
                                            message.error(isAr ? 'يجب إرفاق ملف بصيغة صورة' : 'File must be an image');
                                            return Upload.LIST_IGNORE;
                                        }
                                        return false;
                                    }}
                                    fileList={nutritionImageFileList}
                                    onChange={({ fileList }) => setNutritionImageFileList(fileList)}
                                    maxCount={1}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadIcon />}>{isAr ? 'إرفاق صورة' : 'Attach Image'}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title={editingItem ? (isAr ? 'تعديل البرنامج التدريبي' : 'Edit Training Plan') : t('owner.nutrition.add_training_plan')}
                open={isTrainingModalOpen}
                onCancel={() => {
                    setIsTrainingModalOpen(false);
                    setEditingItem(null);
                    setTrainingFileList([]);
                    setTrainingImageFileList([]);
                    trainingForm.resetFields();
                }}
                onOk={() => trainingForm.submit()}
                centered
                width={800}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
            >
                <Form form={trainingForm} layout="vertical" onFinish={onFinishTraining} initialValues={{ start_date: dayjs() }}>
                    <Form.Item name="title" label={isAr ? 'عنوان البرنامج' : 'Plan Title'} rules={[{ required: true }]}><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="start_date" label={t('common.start_date')} rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label={t('common.end_date')}><DatePicker className="w-full" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="workout_plan" label={t('owner.nutrition.workout_details')}><Input.TextArea rows={8} /></Form.Item>
                    <Form.Item name="recovery_plan" label={t('owner.nutrition.recovery_details')}><Input.TextArea rows={4} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label={isAr ? 'ملف البرنامج المرفق (PDF)' : 'Attached Program File (PDF)'}>
                                <Upload
                                    beforeUpload={(file) => {
                                        if (file.type !== 'application/pdf') {
                                            message.error(isAr ? 'يجب إرفاق ملف بصيغة PDF' : 'File must be PDF format');
                                            return Upload.LIST_IGNORE;
                                        }
                                        return false;
                                    }}
                                    fileList={trainingFileList}
                                    onChange={({ fileList }) => setTrainingFileList(fileList)}
                                    maxCount={1}
                                    accept=".pdf,application/pdf"
                                >
                                    <Button icon={<UploadIcon />}>{isAr ? 'إرفاق ملف' : 'Attach File'}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label={isAr ? 'صورة البرنامج المرفقة' : 'Attached Program Image'}>
                                <Upload
                                    beforeUpload={(file) => {
                                        if (!file.type.startsWith('image/')) {
                                            message.error(isAr ? 'يجب إرفاق ملف بصيغة صورة' : 'File must be an image');
                                            return Upload.LIST_IGNORE;
                                        }
                                        return false;
                                    }}
                                    fileList={trainingImageFileList}
                                    onChange={({ fileList }) => setTrainingImageFileList(fileList)}
                                    maxCount={1}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadIcon />}>{isAr ? 'إرفاق صورة' : 'Attach Image'}</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Photo Upload Modal */}
            <Modal
                title={isAr ? 'إضافة صورة جديدة' : 'Upload New Photo'}
                open={isPhotoUploadModalOpen}
                onCancel={() => {
                    setIsPhotoUploadModalOpen(false);
                    photoUploadForm.resetFields();
                    setSelectedUploadFile(null);
                }}
                onOk={() => photoUploadForm.submit()}
                centered
                okText={isAr ? 'رفع الصورة' : 'Upload Photo'}
                cancelText={t('common.cancel')}
            >
                <Form form={photoUploadForm} layout="vertical" onFinish={onFinishPhotoUpload} initialValues={{ captured_at: dayjs(), view_type: 'OTHER' }}>
                    <Form.Item label={isAr ? 'الصورة' : 'Photo'} required>
                        <Upload 
                            beforeUpload={(file) => {
                                setSelectedUploadFile(file);
                                return false; // prevent default upload action
                            }}
                            maxCount={1}
                            onRemove={() => setSelectedUploadFile(null)}
                            accept="image/*"
                            listType="picture"
                        >
                            <Button icon={<UploadIcon />}>{isAr ? 'اختر صورة من جهازك' : 'Select Photo from your device'}</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item name="captured_at" label={t('common.date')} rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
                    <Form.Item name="view_type" label={isAr ? 'نوع المشهد' : 'View Type'}><Select options={[
                        { value: 'FRONT', label: isAr ? 'أمامي' : 'Front' },
                        { value: 'SIDE', label: isAr ? 'جانبي' : 'Side' },
                        { value: 'BACK', label: isAr ? 'خلفي' : 'Back' },
                        { value: 'OTHER', label: isAr ? 'أخرى' : 'Other' },
                    ]} /></Form.Item>
                    <Form.Item name="stage" label={isAr ? 'المرحلة' : 'Stage'}><Select allowClear options={[
                        { value: 'BEFORE', label: isAr ? 'قبل البرنامج' : 'Before Program' },
                        { value: 'DURING', label: isAr ? 'أثناء البرنامج' : 'During Program' },
                        { value: 'AFTER', label: isAr ? 'بعد البرنامج' : 'After Program' },
                    ]} /></Form.Item>
                    <Form.Item name="notes" label={t('common.notes')}><Input.TextArea rows={3} /></Form.Item>
                </Form>
            </Modal>

            {/* Photo Metadata Edit Modal */}
            <Modal
                title={isAr ? 'تعديل بيانات الصورة' : 'Edit Photo Details'}
                open={isPhotoEditModalOpen}
                onCancel={() => {
                    setIsPhotoEditModalOpen(false);
                    setEditingItem(null);
                    photoForm.resetFields();
                }}
                onOk={() => photoForm.submit()}
                centered
                okText={t('common.save')}
                cancelText={t('common.cancel')}
            >
                <Form form={photoForm} layout="vertical" onFinish={onFinishPhotoEdit}>
                    <Form.Item name="captured_at" label={t('common.date')} rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
                    <Form.Item name="view_type" label={isAr ? 'نوع المشهد' : 'View Type'}><Select options={[
                        { value: 'FRONT', label: isAr ? 'أمامي' : 'Front' },
                        { value: 'SIDE', label: isAr ? 'جانبي' : 'Side' },
                        { value: 'BACK', label: isAr ? 'خلفي' : 'Back' },
                        { value: 'OTHER', label: isAr ? 'أخرى' : 'Other' },
                    ]} /></Form.Item>
                    <Form.Item name="stage" label={isAr ? 'المرحلة' : 'Stage'}><Select allowClear options={[
                        { value: 'BEFORE', label: isAr ? 'قبل البرنامج' : 'Before Program' },
                        { value: 'DURING', label: isAr ? 'أثناء البرنامج' : 'During Program' },
                        { value: 'AFTER', label: isAr ? 'بعد البرنامج' : 'After Program' },
                    ]} /></Form.Item>
                    <Form.Item name="notes" label={t('common.notes')}><Input.TextArea rows={3} /></Form.Item>
                </Form>
            </Modal>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #pdf-report-container, #pdf-report-container * {
                        visibility: visible;
                    }
                    #pdf-report-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        z-index: 9999 !important;
                        background: white !important;
                    }
                    /* Ensure images render properly in print */
                    #pdf-report-container img {
                        max-width: 100% !important;
                        page-break-inside: avoid;
                    }
                }
                .custom-radio-group .ant-radio-button-wrapper {
                    background: #1e293b !important;
                    border-color: #334155 !important;
                    color: rgba(255, 255, 255, 0.7) !important;
                    font-weight: 700;
                    height: 38px;
                    line-height: 36px;
                }
                .custom-radio-group .ant-radio-button-wrapper:not(.ant-radio-button-wrapper-checked):hover {
                    color: #C9A24D !important;
                    border-color: #C9A24D !important;
                }
                .custom-radio-group .ant-radio-button-wrapper-checked:hover {
                    color: #1a1a1a !important;
                }
                .custom-radio-group .ant-radio-button-wrapper-checked {
                    background: #C9A24D !important;
                    border-color: #C9A24D !important;
                    color: #1a1a1a !important;
                    box-shadow: 0 4px 15px rgba(201, 162, 77, 0.4) !important;
                }
                .custom-radio-group .ant-radio-button-wrapper-checked::before {
                    background-color: transparent !important;
                }
                .with-records-btn.ant-radio-button-wrapper-checked {
                    background: #C9A24D !important;
                }
                .without-records-btn.ant-radio-button-wrapper-checked {
                    background: #C9A24D !important;
                }
            `}</style>

            {/* Hidden PDF Report Container */}
            {selectedPlayerId && (
                <div id="pdf-report-container" className="bg-white p-12" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px', zIndex: -100 }}>
                    <div className="text-center mb-8 border-b pb-6">
                        <h1 className="text-4xl font-black text-slate-800 mb-2">{isAr ? (selectedPlayer?.nameAr || selectedPlayer?.name) : selectedPlayer?.name}</h1>
                        <p className="text-lg text-slate-500">
                            {t(`enums.Sport.${selectedPlayer?.sport}`)} | {selectedPlayer?.age} {isAr ? 'سنة' : 'Years'}
                        </p>
                    </div>

                    {playerFile?.nutrition_programs?.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold bg-slate-100 p-3 rounded-lg mb-4">{t('owner.nutrition.nutrition_plans')}</h2>
                            {playerFile.nutrition_programs.map((prog: any, i: number) => (
                                <div key={i} className="mb-4 border p-4 rounded-xl">
                                    <h3 className="text-lg font-bold flex justify-between">
                                        <span>{prog.title}</span>
                                        <span className="text-sm font-normal text-slate-500">{prog.start_date} - {prog.end_date || (isAr ? 'مستمر' : 'Ongoing')}</span>
                                    </h3>
                                    <div className="flex gap-4 mt-2 text-sm">
                                        <div><strong>Calories:</strong> {prog.daily_calories}</div>
                                        <div><strong>Protein:</strong> {prog.protein_grams}g</div>
                                        <div><strong>Carbs:</strong> {prog.carbs_grams}g</div>
                                        <div><strong>Fats:</strong> {prog.fat_grams}g</div>
                                    </div>
                                    {prog.meal_details && <div className="mt-3"><strong className="block text-sm">Meals:</strong><p className="whitespace-pre-wrap text-sm">{prog.meal_details}</p></div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {playerFile?.training_programs?.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold bg-slate-100 p-3 rounded-lg mb-4">{t('owner.nutrition.training_plans')}</h2>
                            {playerFile.training_programs.map((prog: any, i: number) => (
                                <div key={i} className="mb-4 border p-4 rounded-xl">
                                    <h3 className="text-lg font-bold flex justify-between">
                                        <span>{prog.title}</span>
                                        <span className="text-sm font-normal text-slate-500">{prog.start_date} - {prog.end_date || (isAr ? 'مستمر' : 'Ongoing')}</span>
                                    </h3>
                                    {prog.workout_plan && <div className="mt-3"><strong className="block text-sm">Workout:</strong><p className="whitespace-pre-wrap text-sm">{prog.workout_plan}</p></div>}
                                    {prog.recovery_plan && <div className="mt-3"><strong className="block text-sm">Recovery:</strong><p className="whitespace-pre-wrap text-sm">{prog.recovery_plan}</p></div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {playerFile?.progress_photos?.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold bg-slate-100 p-3 rounded-lg mb-4">{t('owner.nutrition.progress_photos')}</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {playerFile.progress_photos.map((photo: any, i: number) => (
                                    <div key={i} className="text-center">
                                        <img src={photo.photo_url} className="w-full h-48 object-cover object-top rounded-lg border shadow-sm mb-2" />
                                        <div className="text-sm font-bold">{dayjs(photo.captured_at).format('YYYY-MM-DD')}</div>
                                        <div className="text-xs text-slate-500">{photo.view_type} {photo.stage ? `| ${photo.stage}` : ''}</div>
                                        {photo.notes && <div className="text-xs mt-1 italic">{photo.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Nutrition;
