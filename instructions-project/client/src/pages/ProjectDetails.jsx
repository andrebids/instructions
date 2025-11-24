import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Button, Spinner, Tabs, Tab, Chip, Divider, Accordion, AccordionItem } from '@heroui/react';
import { Icon } from '@iconify/react';
import { projectsAPI } from '../services/api';
import { PageTitle } from '../components/layout/page-title';
import { useUser } from '../context/UserContext';
import { Scroller } from '../components/ui/scroller';
import { NotesManager } from '../components/project-notes/NotesManager';
import { useTranslation } from 'react-i18next';

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* Dimensions */}
            <div className="col-span-full">
                <h4 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Icon icon="lucide:ruler" />
                    {t('pages.projectDetails.dimensions')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-default-50 p-4 rounded-lg">
                    {logo.dimensions?.height?.value && (
                        <div>
                            <span className="text-xs text-default-500 block">{t('pages.projectDetails.height')}</span>
                            <span className="font-semibold text-lg">{logo.dimensions.height.value} cm</span>
                            {logo.dimensions.height.imperative && <Icon icon="lucide:lock" className="inline ml-1 text-xs text-warning" />}
                        </div>
                    )}
                    {logo.dimensions?.length?.value && (
                        <div>
                            <span className="text-xs text-default-500 block">{t('pages.projectDetails.length')}</span>
                            <span className="font-semibold text-lg">{logo.dimensions.length.value} cm</span>
                            {logo.dimensions.length.imperative && <Icon icon="lucide:lock" className="inline ml-1 text-xs text-warning" />}
                        </div>
                    )}
                    {logo.dimensions?.width?.value && (
                        <div>
                            <span className="text-xs text-default-500 block">{t('pages.projectDetails.width')}</span>
                            <span className="font-semibold text-lg">{logo.dimensions.width.value} cm</span>
                            {logo.dimensions.width.imperative && <Icon icon="lucide:lock" className="inline ml-1 text-xs text-warning" />}
                        </div>
                    )}
                    {logo.dimensions?.diameter?.value && (
                        <div>
                            <span className="text-xs text-default-500 block">{t('pages.projectDetails.diameter')}</span>
                            <span className="font-semibold text-lg">{logo.dimensions.diameter.value} cm</span>
                            {logo.dimensions.diameter.imperative && <Icon icon="lucide:lock" className="inline ml-1 text-xs text-warning" />}
                        </div>
                    )}
                </div>
            </div>

            {/* Technical Specs */}
            <div className="col-span-full md:col-span-2">
                <h4 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Icon icon="lucide:settings" />
                    {t('pages.projectDetails.technicalSpecs')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label={t('pages.projectDetails.fixationType')} value={logo.fixationType} />
                    <InfoField label={t('pages.projectDetails.mastDiameter')} value={logo.mastDiameter ? `${logo.mastDiameter} mm` : null} />

                    <div>
                        <div className="text-sm font-medium text-default-500 mb-1">{t('pages.projectDetails.lacquered')}</div>
                        <div className="flex items-center gap-2">
                            <Icon icon={logo.lacqueredStructure ? "lucide:check-circle" : "lucide:x-circle"}
                                className={logo.lacqueredStructure ? "text-success" : "text-default-300"} />
                            <span>{logo.lacqueredStructure ? logo.lacquerColor : t('common.no')}</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-medium text-default-500 mb-1">{t('pages.projectDetails.maxWeightConstraint')}</div>
                        <div className="flex items-center gap-2">
                            <Icon icon={logo.maxWeightConstraint ? "lucide:alert-triangle" : "lucide:check-circle"}
                                className={logo.maxWeightConstraint ? "text-warning" : "text-default-300"} />
                            <span>{logo.maxWeightConstraint ? `${logo.maxWeight} kg` : t('common.no')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="col-span-full md:col-span-1">
                <h4 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Icon icon="lucide:info" />
                    {t('pages.projectDetails.additionalInfo')}
                </h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-divider">
                        <span className="text-default-600">{t('pages.projectDetails.ballast')}</span>
                        <Icon icon={logo.ballast ? "lucide:check" : "lucide:x"} className={logo.ballast ? "text-success" : "text-default-300"} />
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-divider">
                        <span className="text-default-600">{t('pages.projectDetails.controlReport')}</span>
                        <Icon icon={logo.controlReport ? "lucide:check" : "lucide:x"} className={logo.controlReport ? "text-success" : "text-default-300"} />
                    </div>
                </div>
            </div>

            {/* Description/Criteria */}
            {(logo.description || logo.criteria) && (
                <div className="col-span-full mt-4">
                    <Divider className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {logo.description && (
                            <div>
                                <h4 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-2">{t('pages.projectDetails.description')}</h4>
                                <p className="text-default-700 whitespace-pre-wrap">{logo.description}</p>
                            </div>
                        )}
                        {logo.criteria && (
                            <div>
                                <h4 className="text-sm font-bold text-default-500 uppercase tracking-wider mb-2">{t('pages.projectDetails.criteria')}</h4>
                                <p className="text-default-700 whitespace-pre-wrap">{logo.criteria}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userName } = useUser();
    const { t } = useTranslation();
    const [project, setProject] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

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
        <div className="flex flex-col h-full bg-default-50">
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
                                <div className="flex items-center gap-2 text-default-500">
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
                                                <div className="flex items-center justify-center py-8 text-default-500">
                                                    <div className="text-center">
                                                        <Icon icon="lucide:construction" className="text-4xl mx-auto mb-2 opacity-50" />
                                                        <p>{t('pages.projectDetails.toBeDeveloped')}</p>
                                                    </div>
                                                </div>
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
                                                <div className="flex items-center justify-center py-8 text-default-500">
                                                    <div className="text-center">
                                                        <Icon icon="lucide:user" className="text-4xl mx-auto mb-2 opacity-50" />
                                                        <p>{t('pages.projectDetails.toBeDeveloped')}</p>
                                                    </div>
                                                </div>
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
            </Scroller>
        </div>
    );
}
