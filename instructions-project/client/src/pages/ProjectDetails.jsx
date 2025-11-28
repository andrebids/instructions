import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardBody, CardHeader, Button, Spinner, Tabs, Tab, Chip, Divider, Accordion, AccordionItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Icon } from '@iconify/react';
import { projectsAPI } from '../services/api';
import { PageTitle } from '../components/layout/page-title';
import { useUser } from '../context/UserContext';
import { Scroller } from '../components/ui/scroller';
import { NotesManager } from '../components/project-notes/NotesManager';
import { ProjectProgress } from '../components/ui/ProjectProgress';
import { useTranslation } from 'react-i18next';
import ProjectResultsModal, { LANDSCAPES } from "../components/projects/ProjectResultsModal";
import { ProjectObservations } from '../components/project-notes/ProjectObservations';
import { useNotifications } from '../context/NotificationContext';
import ProjectOrdersTab from '../components/orders/ProjectOrdersTab';

// Helper component to display a field value
const InfoField = ({ label, value, icon }) => (
    <div className="mb-4">
        <div className="flex items-center gap-2 text-default-500 mb-1">
            {icon && <Icon icon={icon} className="text-sm" />}
            <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="text-base font-medium">{value || '-'}</div>
    </div>
);

// Component to display logo details content (reused inside Accordion)
const LogoDetailsContent = ({ logo }) => {
    const { t } = useTranslation();

    // Helper to check if section has data
    const hasDimensions = logo.dimensions?.height?.value || logo.dimensions?.length?.value || logo.dimensions?.width?.value || logo.dimensions?.diameter?.value;
    const hasSpecs = logo.fixationType || logo.mastDiameter || logo.lacqueredStructure || logo.maxWeightConstraint || logo.ballast || logo.controlReport || logo.usageOutdoor !== undefined;
    const hasComposition = (logo.composition?.componentes?.filter(c => c.referencia).length > 0) || (logo.composition?.bolas?.length > 0);
    const hasContent = logo.description || logo.criteria || (logo.attachmentFiles?.length > 0);

    return (
        <div className="space-y-6">
            {/* Identity Card */}
            <Card className="shadow-sm border border-default-200">
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                <Icon icon="lucide:hash" width={20} />
                            </div>
                            <div>
                                <span className="text-xs text-default-500 font-medium uppercase tracking-wider block mb-1">{t('pages.projectDetails.logoNumber', 'Logo Number')}</span>
                                <span className="font-bold text-lg text-default-900">{logo.logoNumber || '—'}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                <Icon icon="lucide:type" width={20} />
                            </div>
                            <div>
                                <span className="text-xs text-default-500 font-medium uppercase tracking-wider block mb-1">{t('pages.projectDetails.logoName', 'Logo Name')}</span>
                                <span className="font-bold text-lg text-default-900">{logo.logoName || '—'}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                <Icon icon="lucide:user" width={20} />
                            </div>
                            <div>
                                <span className="text-xs text-default-500 font-medium uppercase tracking-wider block mb-1">{t('pages.projectDetails.requestedBy', 'Requested By')}</span>
                                <span className="font-bold text-lg text-default-900">{logo.requestedBy || '—'}</span>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* AI Generated Image */}
            {logo.generatedImage && (
                <Card className="shadow-sm border border-default-200">
                    <CardHeader className="pb-0 pt-4 px-4 flex gap-3">
                        <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                            <Icon icon="lucide:sparkles" width={20} />
                        </div>
                        <h4 className="text-medium font-bold text-default-700 uppercase tracking-wider">
                            {t('pages.projectDetails.aiGeneratedImage', 'AI Generated Image')}
                        </h4>
                    </CardHeader>
                    <CardBody>
                        <div className="relative aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50">
                            <img
                                src={logo.generatedImage}
                                alt={logo.logoName || 'AI Generated Logo'}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </CardBody>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Dimensions & Technical Specs */}
                <div className="col-span-1 lg:col-span-5 space-y-6">
                    {/* Dimensions */}
                    {hasDimensions && (
                        <Card className="shadow-sm border border-default-200 h-fit">
                            <CardHeader className="pb-0 pt-4 px-4 flex gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Icon icon="lucide:ruler" width={20} />
                                </div>
                                <h4 className="text-medium font-bold text-default-700 uppercase tracking-wider">
                                    {t('pages.projectDetails.dimensions')}
                                </h4>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-2 gap-4">
                                    {logo.dimensions?.height?.value && (
                                        <div className="bg-default-50 p-3 rounded-lg">
                                            <span className="text-xs text-default-500 block mb-1">{t('pages.projectDetails.height')}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold text-xl">{logo.dimensions.height.value}</span>
                                                <span className="text-xs text-default-400">m</span>
                                                {logo.dimensions.height.imperative && <Icon icon="lucide:lock" className="text-warning text-xs ml-1" />}
                                            </div>
                                        </div>
                                    )}
                                    {logo.dimensions?.length?.value && (
                                        <div className="bg-default-50 p-3 rounded-lg">
                                            <span className="text-xs text-default-500 block mb-1">{t('pages.projectDetails.length')}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold text-xl">{logo.dimensions.length.value}</span>
                                                <span className="text-xs text-default-400">m</span>
                                                {logo.dimensions.length.imperative && <Icon icon="lucide:lock" className="text-warning text-xs ml-1" />}
                                            </div>
                                        </div>
                                    )}
                                    {logo.dimensions?.width?.value && (
                                        <div className="bg-default-50 p-3 rounded-lg">
                                            <span className="text-xs text-default-500 block mb-1">{t('pages.projectDetails.width')}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold text-xl">{logo.dimensions.width.value}</span>
                                                <span className="text-xs text-default-400">m</span>
                                                {logo.dimensions.width.imperative && <Icon icon="lucide:lock" className="text-warning text-xs ml-1" />}
                                            </div>
                                        </div>
                                    )}
                                    {logo.dimensions?.diameter?.value && (
                                        <div className="bg-default-50 p-3 rounded-lg">
                                            <span className="text-xs text-default-500 block mb-1">{t('pages.projectDetails.diameter')}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold text-xl">{logo.dimensions.diameter.value}</span>
                                                <span className="text-xs text-default-400">m</span>
                                                {logo.dimensions.diameter.imperative && <Icon icon="lucide:lock" className="text-warning text-xs ml-1" />}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Technical Specs & Usage */}
                    {hasSpecs && (
                        <Card className="shadow-sm border border-default-200 h-fit">
                            <CardHeader className="pb-0 pt-4 px-4 flex gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Icon icon="lucide:settings-2" width={20} />
                                </div>
                                <h4 className="text-medium font-bold text-default-700 uppercase tracking-wider">
                                    {t('pages.projectDetails.technicalSpecs')}
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {/* Usage & Fixation */}
                                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-default-100">
                                    <div>
                                        <span className="text-xs text-default-500 block mb-1">{t('pages.projectDetails.usage', 'Usage')}</span>
                                        <div className="flex items-center gap-2">
                                            <Icon icon={logo.usageOutdoor ? "lucide:sun" : "lucide:home"} className="text-default-400" width={16} />
                                            <span className="font-semibold text-sm">{logo.usageOutdoor ? t('pages.projectDetails.outdoor') : t('pages.projectDetails.indoor')}</span>
                                        </div>
                                    </div>
                                    {logo.fixationType && (
                                        <div>
                                            <span className="text-xs text-default-500 block mb-1">{t('pages.projectDetails.fixation', 'Fixation')}</span>
                                            <div className="flex items-center gap-2">
                                                <Icon icon="lucide:anchor" className="text-default-400" width={16} />
                                                <span className="font-semibold text-sm capitalize">{logo.fixationType ? t(`pages.projectDetails.fixationTypes.${logo.fixationType}`) : ''}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Detailed Specs */}
                                <div className="space-y-3">
                                    {logo.mastDiameter && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-default-600">{t('pages.projectDetails.mastDiameter')}</span>
                                            <span className="font-medium">{logo.mastDiameter} mm</span>
                                        </div>
                                    )}
                                    {logo.lacqueredStructure && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-default-600">{t('pages.projectDetails.lacquered')}</span>
                                            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                                                {logo.lacquerColor || t('common.yes')}
                                            </span>
                                        </div>
                                    )}
                                    {logo.maxWeightConstraint && logo.maxWeight && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-default-600">{t('pages.projectDetails.maxWeightConstraint')}</span>
                                            <div className="flex items-center gap-1 text-warning-600">
                                                <Icon icon="lucide:scale" width={14} />
                                                <span className="font-medium">{logo.maxWeight} kg</span>
                                            </div>
                                        </div>
                                    )}
                                    {logo.ballast && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-default-600">{t('pages.projectDetails.ballast')}</span>
                                            <Icon icon="lucide:check-circle" className="text-success" width={18} />
                                        </div>
                                    )}
                                    {logo.controlReport && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-default-600">{t('pages.projectDetails.controlReport')}</span>
                                            <Icon icon="lucide:file-check" className="text-success" width={18} />
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Right Column - Composition & Content */}
                <div className="col-span-1 lg:col-span-7 space-y-6">
                    {/* Composition */}
                    {hasComposition && (
                        <Card className="shadow-sm border border-default-200 h-fit">
                            <CardHeader className="pb-0 pt-4 px-4 flex gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <Icon icon="lucide:layers" width={20} />
                                </div>
                                <h4 className="text-medium font-bold text-default-700 uppercase tracking-wider">
                                    {t('pages.projectDetails.composition')}
                                </h4>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Components List */}
                                    {logo.composition.componentes && logo.composition.componentes.filter(c => c.referencia).length > 0 && (
                                        <div>
                                            <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Icon icon="lucide:box" width={14} />
                                                {t('pages.projectDetails.components', 'Components')}
                                                <span className="bg-default-100 text-default-600 px-1.5 py-0.5 rounded text-[10px]">
                                                    {logo.composition.componentes.filter(c => c.referencia).length}
                                                </span>
                                            </h5>
                                            <div className="space-y-2">
                                                {logo.composition.componentes.filter(c => c.referencia).map((comp, idx) => (
                                                    <div key={idx} className="bg-default-50 p-3 rounded-lg border border-default-200 hover:border-default-300 transition-colors">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <span className="font-semibold text-sm text-default-900">{comp.componenteNome}</span>
                                                            {comp.referencia && (
                                                                <span className="text-[10px] font-mono bg-default-200 text-default-600 px-1.5 py-0.5 rounded">
                                                                    {comp.referencia}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 text-xs text-default-500">
                                                            {comp.corNome && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-default-400"></div>{comp.corNome}</span>}
                                                            {comp.acabamentoNome && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-default-400"></div>{comp.acabamentoNome}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Balls List */}
                                    {logo.composition.bolas && logo.composition.bolas.length > 0 && (
                                        <div>
                                            <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Icon icon="lucide:circle-dot" width={14} />
                                                {t('pages.projectDetails.balls', 'Balls')}
                                                <span className="bg-default-100 text-default-600 px-1.5 py-0.5 rounded text-[10px]">
                                                    {logo.composition.bolas.length}
                                                </span>
                                            </h5>
                                            <div className="space-y-2">
                                                {logo.composition.bolas.map((bola, idx) => (
                                                    <div key={idx} className="bg-default-50 p-3 rounded-lg border border-default-200 hover:border-default-300 transition-colors">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <span className="font-semibold text-sm text-default-900">{bola.bolaName}</span>
                                                            {bola.reference && (
                                                                <span className="text-[10px] font-mono bg-default-200 text-default-600 px-1.5 py-0.5 rounded">
                                                                    {bola.reference}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 text-xs text-default-500">
                                                            {bola.corNome && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-default-400"></div>{bola.corNome}</span>}
                                                            {bola.acabamentoNome && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-default-400"></div>{bola.acabamentoNome}</span>}
                                                            {bola.tamanhoName && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-default-400"></div>{bola.tamanhoName}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Description & Attachments */}
                    {hasContent && (
                        <Card className="shadow-sm border border-default-200 h-fit">
                            <CardHeader className="pb-0 pt-4 px-4 flex gap-3">
                                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                                    <Icon icon="lucide:file-text" width={20} />
                                </div>
                                <h4 className="text-medium font-bold text-default-700 uppercase tracking-wider">
                                    {t('pages.projectDetails.details')}
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                {/* Description & Criteria */}
                                {(logo.description || logo.criteria) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {logo.description && (
                                            <div>
                                                <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-2">{t('pages.projectDetails.description')}</h5>
                                                <p className="text-sm text-default-700 leading-relaxed whitespace-pre-wrap bg-default-50 p-3 rounded-lg border border-default-100">
                                                    {logo.description}
                                                </p>
                                            </div>
                                        )}
                                        {logo.criteria && (
                                            <div>
                                                <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-2">{t('pages.projectDetails.criteria')}</h5>
                                                <p className="text-sm text-default-700 leading-relaxed whitespace-pre-wrap bg-default-50 p-3 rounded-lg border border-default-100">
                                                    {logo.criteria}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Attachments */}
                                {logo.attachmentFiles && logo.attachmentFiles.length > 0 && (
                                    <div>
                                        {(logo.description || logo.criteria) && <Divider className="mb-4" />}
                                        <h5 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Icon icon="lucide:paperclip" width={14} />
                                            {t('pages.projectDetails.attachments')}
                                        </h5>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {logo.attachmentFiles.map((attachment, idx) => {
                                                const isImage = attachment.mimetype?.startsWith('image/');
                                                const fileUrl = attachment.url || `http://localhost:5000${attachment.path}`;

                                                return (
                                                    <a
                                                        key={idx}
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative aspect-square rounded-lg overflow-hidden border border-default-200 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                                                    >
                                                        {isImage ? (
                                                            <>
                                                                <img
                                                                    src={fileUrl}
                                                                    alt={attachment.name}
                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                            </>
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-default-50 p-2 group-hover:bg-default-100 transition-colors">
                                                                <Icon icon="lucide:file" className="w-8 h-8 text-default-400 mb-2 group-hover:text-primary transition-colors" />
                                                                <p className="text-[10px] text-center text-default-600 truncate w-full px-2 font-medium">
                                                                    {attachment.name}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userName } = useUser();
    const { t } = useTranslation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [unreadObservationsCount, setUnreadObservationsCount] = useState(0);
    const { addNotification } = useNotifications();

    // Handle tab switching from URL query parameters
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['overview', 'instructions', 'orders', 'observations', 'notes'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [location.search]);

    React.useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            setLoading(true);
            setError(null);
            const projectData = await projectsAPI.getById(id);
            setProject(projectData);
        } catch (err) {
            console.error('❌ Error loading project:', err);
            setError(t('pages.projectDetails.errorLoading'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        try {
            setIsDeleting(true);
            await projectsAPI.delete(id);
            setIsDeleteModalOpen(false);
            navigate('/');
        } catch (err) {
            console.error('❌ Error deleting project:', err);
            alert(t('pages.projectDetails.deleteModal.error', 'Erro ao eliminar projeto'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleNewMessage = (newMessages) => {
        // Only count if not on observations tab
        if (activeTab !== 'observations') {
            setUnreadObservationsCount(prev => prev + newMessages.length);

            // Show toast notification for each new message
            newMessages.forEach(msg => {
                // Check if it's a modification request
                const isModificationRequest = msg.linkedResultImage !== null && msg.linkedResultImage !== undefined;

                // Create notification title
                const notificationTitle = isModificationRequest
                    ? '🔧 Modification Request'
                    : '💬 New Message';

                // Create message preview
                let messagePreview = msg.content || '';
                if (messagePreview.length > 60) {
                    messagePreview = messagePreview.substring(0, 60) + '...';
                }

                // Add context if there's a linked image
                if (msg.linkedResultImage) {
                    messagePreview = `Re: ${msg.linkedResultImage.title} - ${messagePreview}`;
                }

                addNotification({
                    title: notificationTitle,
                    message: `${msg.author?.name || 'Designer'}: ${messagePreview}`,
                    type: isModificationRequest ? 'warning' : 'observation',
                    url: `/projects/${id}?tab=observations`
                });
            });
        }
    };

    const handleModificationSubmitted = () => {
        // Show success notification
        addNotification({
            title: '✓ Modification Request Sent',
            message: 'Your modification request has been sent to the designers.',
            type: 'success',
            url: `/projects/${id}?tab=observations`
        });

        // Switch to observations tab and clear unread count
        setActiveTab('observations');
        setUnreadObservationsCount(0);
    };

    // Clear unread count when switching to observations tab
    useEffect(() => {
        if (activeTab === 'observations') {
            setUnreadObservationsCount(0);
        }
    }, [activeTab]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" label={t('common.loading')} />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="p-6">
                <Card className="max-w-2xl mx-auto">
                    <CardBody>
                        <div className="text-center py-8">
                            <Icon icon="lucide:alert-circle" className="text-4xl text-danger mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">{t('pages.projectDetails.notFoundTitle')}</h2>
                            <p className="text-default-500 mb-4">{error || t('pages.projectDetails.notFoundMessage')}</p>
                            <Button color="primary" onPress={() => navigate('/')}>
                                {t('common.backToDashboard')}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const savedLogos = project.logoDetails?.logos || [];
    // If no saved logos but we have currentLogo details, show that
    const hasCurrentLogo = project.logoDetails?.currentLogo?.logoNumber || project.logoDetails?.logoNumber;
    const displayLogos = savedLogos.length > 0 ? savedLogos : (hasCurrentLogo ? [project.logoDetails.currentLogo || project.logoDetails] : []);

    return (
        <div className="flex flex-col h-full">
            <Scroller className="flex-1 min-h-0" hideScrollbar>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {/* Header */}
                    <div className="mb-6">
                        <Button
                            variant="light"
                            className="mb-4 pl-0 hover:bg-transparent text-default-500"
                            startContent={<Icon icon="lucide:arrow-left" />}
                            onPress={() => navigate('/')}
                        >
                            {t('common.backToDashboard')}
                        </Button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">{project.name}</h1>
                                <div className="flex items-center gap-2 text-default-500 flex-wrap">
                                    <Icon icon="lucide:building-2" />
                                    <span className="font-medium">{project.clientName}</span>
                                    <span className="mx-2">•</span>
                                    <Chip size="sm" variant="flat" color={
                                        project.status === 'approved' ? 'success' :
                                            project.status === 'in_progress' ? 'primary' :
                                                project.status === 'cancelled' ? 'danger' : 'default'
                                    }>
                                        {t(`pages.dashboard.projectTable.statusLabels.${project.status}`, project.status)}
                                    </Chip>
                                    {project.category === 'ao_tender' && (
                                        <>
                                            <span className="mx-2">•</span>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color="secondary"
                                                startContent={<Icon icon="lucide:star" className="text-sm" />}
                                            >
                                                {t('pages.projectDetails.aoTender', 'AO/Tender')}
                                            </Chip>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    color="primary"
                                    variant="flat"
                                    startContent={<Icon icon="lucide:edit-2" />}
                                    onPress={() => navigate(`/projects/${id}/edit`)}
                                >
                                    {t('common.edit')}
                                </Button>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    startContent={<Icon icon="lucide:trash-2" />}
                                    onPress={() => setIsDeleteModalOpen(true)}
                                >
                                    {t('common.delete')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <Tabs
                        aria-label="Project Details"
                        color="primary"
                        variant="underlined"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-primary font-medium text-default-500"
                        }}
                        selectedKey={activeTab}
                        onSelectionChange={setActiveTab}
                    >
                        <Tab
                            key="overview"
                            title={
                                <div className="flex items-center gap-2">
                                    <Icon icon="lucide:layout-dashboard" />
                                    <span>{t('pages.projectDetails.tabs.overview')}</span>
                                </div>
                            }
                        >
                            <div className="py-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left Column - Main Info & Progress */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Project Info */}
                                        <Card>
                                            <CardHeader className="px-6 py-4 border-b border-divider">
                                                <h3 className="text-lg font-semibold">{t('pages.projectDetails.projectInfo')}</h3>
                                            </CardHeader>
                                            <CardBody className="p-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <InfoField
                                                        label={t('pages.projectDetails.budget')}
                                                        value={project.budget ? `€ ${parseFloat(project.budget).toLocaleString()}` : null}
                                                        icon="lucide:euro"
                                                    />
                                                    <InfoField
                                                        label={t('pages.projectDetails.startDate')}
                                                        value={project.startDate ? new Date(project.startDate).toLocaleDateString() : null}
                                                        icon="lucide:calendar"
                                                    />
                                                    <InfoField
                                                        label={t('pages.projectDetails.endDate')}
                                                        value={project.endDate ? new Date(project.endDate).toLocaleDateString() : null}
                                                        icon="lucide:calendar-clock"
                                                    />
                                                    <InfoField
                                                        label={t('pages.projectDetails.type')}
                                                        value={project.projectType}
                                                        icon="lucide:tag"
                                                    />
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {/* Project Progress */}
                                        <Card>
                                            <CardHeader className="px-6 py-4 border-b border-divider">
                                                <h3 className="text-lg font-semibold">{t('pages.projectDetails.projectProgress')}</h3>
                                            </CardHeader>
                                            <CardBody className="p-6">
                                                <ProjectProgress
                                                    status={project.status}
                                                    endDate={project.endDate}
                                                    showLabel={false}
                                                    size="lg"
                                                />
                                            </CardBody>
                                        </Card>
                                    </div>

                                    {/* Right Column - Designer Info */}
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader className="px-6 py-4 border-b border-divider">
                                                <h3 className="text-lg font-semibold">{t('pages.projectDetails.designerInfo')}</h3>
                                            </CardHeader>
                                            <CardBody className="p-6">
                                                {project.assignedDesigners && project.assignedDesigners.length > 0 ? (
                                                    <div className="space-y-6">
                                                        <div>
                                                            <span className="text-sm text-default-500 font-medium block mb-3">
                                                                {t('pages.projectDetails.assignedDesigners')}
                                                            </span>
                                                            <div className="flex flex-wrap gap-4">
                                                                {project.assignedDesigners.map((designer, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 bg-default-50 p-2 pr-4 rounded-full border border-default-200">
                                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                                            {designer.image ? (
                                                                                <img src={designer.image} alt={designer.name} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <Icon icon="lucide:user" className="text-primary" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-semibold">{designer.name}</span>
                                                                            <span className="text-xs text-default-500">{t('pages.projectDetails.designer')}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-3">
                                                            <Button
                                                                color="primary"
                                                                variant="flat"
                                                                className="w-full justify-start"
                                                                startContent={<Icon icon="lucide:eye" />}
                                                                onPress={() => setIsResultsModalOpen(true)}
                                                            >
                                                                {t('pages.projectDetails.showResults')}
                                                            </Button>
                                                            <Button
                                                                color="secondary"
                                                                variant="flat"
                                                                className="w-full justify-start"
                                                                startContent={<Icon icon="lucide:message-square" />}
                                                                onPress={() => setActiveTab("observations")}
                                                            >
                                                                {t('pages.projectDetails.chatWithDesigner')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6">
                                                        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-3">
                                                            <Icon icon="lucide:user-x" className="text-2xl text-default-400" />
                                                        </div>
                                                        <p className="text-default-500 mb-4">{t('pages.projectDetails.noDesignersAssigned')}</p>
                                                        {/* Optional: Add button to assign designer if user has permission */}
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </Tab>

                        <Tab
                            key="instructions"
                            title={
                                <div className="flex items-center gap-2">
                                    <Icon icon="lucide:list-checks" />
                                    <span>{t('pages.projectDetails.tabs.instructions')}</span>
                                    <Chip size="sm" variant="flat">{displayLogos.length}</Chip>
                                </div>
                            }
                        >
                            <div className="py-6">
                                {displayLogos.length > 0 ? (
                                    <Accordion variant="splitted" selectionMode="multiple">
                                        {displayLogos.map((logo, idx) => (
                                            <AccordionItem
                                                key={idx}
                                                aria-label={logo.logoName || `Logo ${idx + 1}`}
                                                title={
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 p-2 rounded-full text-primary">
                                                            <Icon icon="lucide:box" className="text-xl" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold">{logo.logoName || t('pages.projectDetails.logoDefaultName', { index: idx + 1 })}</h3>
                                                            <div className="flex items-center gap-2 text-small text-default-500">
                                                                <span className="font-mono">{logo.logoNumber}</span>
                                                                {logo.requestedBy && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{t('pages.projectDetails.requestedBy')}: {logo.requestedBy}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                                subtitle={
                                                    <Chip size="sm" variant="flat" color="primary" className="mt-2">
                                                        {logo.usageOutdoor ? t('pages.projectDetails.outdoor') : t('pages.projectDetails.indoor')}
                                                    </Chip>
                                                }
                                            >
                                                <div className="py-2">
                                                    <LogoDetailsContent logo={logo} />
                                                </div>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center py-12 text-default-500">
                                        <Icon icon="lucide:clipboard-list" className="text-5xl mx-auto mb-4 opacity-20" />
                                        <p className="text-lg">{t('pages.projectDetails.noInstructions')}</p>
                                    </div>
                                )}
                            </div>
                        </Tab>

                        <Tab
                            key="orders"
                            title={
                                <div className="flex items-center gap-2">
                                    <Icon icon="lucide:shopping-cart" />
                                    <span>{t('pages.projectDetails.tabs.orders', 'Encomendas')}</span>
                                </div>
                            }
                        >
                            <ProjectOrdersTab
                                projectId={id}
                                budget={project.budget}
                                canvasDecorations={project.canvasDecorations || []}
                            />
                        </Tab>

                        <Tab
                            key="observations"
                            title={
                                <div className="flex items-center gap-2">
                                    <Icon icon="lucide:messages-square" />
                                    <span>{t('pages.projectDetails.tabs.observations', 'Project Chat')}</span>
                                    {unreadObservationsCount > 0 && (
                                        <Chip
                                            size="sm"
                                            color="danger"
                                            variant="solid"
                                            className="min-w-5 h-5 px-1 text-[10px]"
                                        >
                                            {unreadObservationsCount}
                                        </Chip>
                                    )}
                                </div>
                            }
                        >
                            <div className="h-[calc(100vh-280px)]">
                                <ProjectObservations
                                    projectId={id}
                                    instructions={displayLogos}
                                    results={LANDSCAPES}
                                    designers={project.assignedDesigners || []}
                                    onNewMessage={handleNewMessage}
                                />
                            </div>
                        </Tab>

                        <Tab
                            key="notes"
                            title={
                                <div className="flex items-center gap-2">
                                    <Icon icon="lucide:sticky-note" />
                                    <span>{t('pages.projectDetails.tabs.notes')}</span>
                                </div>
                            }
                        >
                            <div className="py-6 h-full">
                                <NotesManager projectId={id} />
                            </div>
                        </Tab>
                    </Tabs>
                </div>
                <ProjectResultsModal
                    isOpen={isResultsModalOpen}
                    onOpenChange={setIsResultsModalOpen}
                    projectId={id}
                    onModificationSubmitted={handleModificationSubmitted}
                />

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    placement="center"
                    backdrop="blur"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <Icon icon="lucide:alert-triangle" className="text-danger" width={24} />
                                        <span>{t('pages.projectDetails.deleteModal.title')}</span>
                                    </div>
                                </ModalHeader>
                                <ModalBody>
                                    <p dangerouslySetInnerHTML={{
                                        __html: t('pages.projectDetails.deleteModal.description', { name: project?.name || '' })
                                    }} />
                                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 mt-2">
                                        <div className="flex items-start gap-2">
                                            <Icon icon="lucide:alert-circle" className="text-danger mt-0.5" width={18} />
                                            <p className="text-sm text-danger-700">
                                                {t('pages.projectDetails.deleteModal.warning')}
                                            </p>
                                        </div>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        variant="light"
                                        onPress={onClose}
                                        isDisabled={isDeleting}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        color="danger"
                                        onPress={handleDeleteProject}
                                        isLoading={isDeleting}
                                    >
                                        {isDeleting ? t('pages.projectDetails.deleteModal.deleting') : t('common.delete')}
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </Scroller>
        </div>
    );
}
