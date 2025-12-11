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
import LogoEditModal from '../components/projects/LogoEditModal';
import SimulationEditModal from '../components/projects/SimulationEditModal';
import InstructionsTab from '../components/projects/InstructionsTab';

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
export const LogoDetailsContent = ({ logo }) => {
    const { t } = useTranslation();
    const [previewAttachment, setPreviewAttachment] = useState(null);

    const hasDimensions = logo.dimensions?.height?.value || logo.dimensions?.length?.value || logo.dimensions?.width?.value || logo.dimensions?.diameter?.value;
    const hasSpecs = logo.fixationType || logo.mastDiameter || logo.lacqueredStructure || logo.maxWeightConstraint || logo.ballast || logo.controlReport || logo.usageOutdoor !== undefined;
    const componentList = (logo.composition?.componentes || []).filter(c => c.referencia);
    const ballsList = logo.composition?.bolas || [];
    const hasComposition = componentList.length > 0 || ballsList.length > 0;
    const hasAttachments = logo.attachmentFiles && logo.attachmentFiles.length > 0;
    const hasDetails = logo.description || logo.criteria;

    const buildImageUrl = (imageUrl) => {
        if (!imageUrl) return '';
        
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            try {
                const urlObj = new URL(imageUrl);
                imageUrl = urlObj.pathname;
            } catch (e) {
                const match = imageUrl.match(/\/api\/[^\s]+/);
                if (match) imageUrl = match[0];
            }
        }
        
        if (imageUrl.startsWith('\\\\') || imageUrl.startsWith('//')) {
            const filename = imageUrl.split(/[\\/]/).pop();
            if (filename) imageUrl = `/api/files/${filename}`;
        }
        
        if (imageUrl && !imageUrl.startsWith('/api/') && imageUrl.startsWith('/')) {
            imageUrl = `/api${imageUrl}`;
        } else if (imageUrl && !imageUrl.startsWith('/')) {
            imageUrl = `/api/files/${imageUrl}`;
        }
        
        return imageUrl;
    };

    const handleOpenPreview = (attachment) => {
        setPreviewAttachment(attachment);
    };

    const handleClosePreview = () => {
        setPreviewAttachment(null);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-default-200 dark:border-default-100/40 bg-content1 dark:bg-[#0d0f14] text-default-900 dark:text-default-200 shadow-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.04),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.03),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_40%)]" />

            <div className="relative space-y-8 p-6 lg:p-8">
                <div className="grid gap-8 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-5">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-300">
                                <Icon icon="lucide:hash" width={18} />
                                <span>{t('pages.projectDetails.logoNumber', 'Logo Number')}</span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-2xl font-bold leading-tight text-default-900 dark:text-white">{logo.logoNumber || '—'}</p>
                                <p className="text-xl font-semibold leading-tight text-default-700 dark:text-default-100">{logo.logoName || '—'}</p>
                                <div className="flex items-center gap-2 text-sm text-default-500 dark:text-default-400">
                                    <Icon icon="lucide:user" width={16} />
                                    <span>{logo.requestedBy || t('common.notInformed', 'Não informado')}</span>
                                </div>
                            </div>
                        </div>

                        {hasDimensions && (
                            <div className="space-y-3 rounded-xl border border-default-200/80 dark:border-white/10 bg-default-50/80 dark:bg-white/5 p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-200">
                                    <Icon icon="lucide:ruler" width={18} />
                                    <span>{t('pages.projectDetails.dimensions')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'height', label: t('pages.projectDetails.height'), value: logo.dimensions?.height?.value, locked: logo.dimensions?.height?.imperative },
                                        { key: 'length', label: t('pages.projectDetails.length'), value: logo.dimensions?.length?.value, locked: logo.dimensions?.length?.imperative },
                                        { key: 'width', label: t('pages.projectDetails.width'), value: logo.dimensions?.width?.value, locked: logo.dimensions?.width?.imperative },
                                        { key: 'diameter', label: t('pages.projectDetails.diameter'), value: logo.dimensions?.diameter?.value, locked: logo.dimensions?.diameter?.imperative },
                                    ].filter(item => item.value).map(item => (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between rounded-lg border border-default-200 dark:border-white/10 bg-white dark:bg-black/40 p-3"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-default-500 dark:text-default-400">{item.label}</p>
                                                <p className="text-lg font-bold text-default-900 dark:text-white">
                                                    {item.value}
                                                    <span className="ml-1 text-xs font-semibold text-default-500 dark:text-default-500">m</span>
                                                </p>
                                            </div>
                                            {item.locked && <Icon icon="lucide:lock" className="text-warning-300" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {hasSpecs && (
                            <div className="space-y-3 rounded-xl border border-default-200/80 dark:border-white/10 bg-default-50/80 dark:bg-white/5 p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-purple-700 dark:text-purple-200">
                                    <Icon icon="lucide:settings-2" width={18} />
                                    <span>{t('pages.projectDetails.technicalSpecs')}</span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {[
                                        logo.usageOutdoor !== undefined && {
                                            key: 'usage',
                                            icon: logo.usageOutdoor ? 'lucide:sun' : 'lucide:home',
                                            label: t('pages.projectDetails.usage', 'Uso'),
                                            value: logo.usageOutdoor ? t('pages.projectDetails.outdoor') : t('pages.projectDetails.indoor')
                                        },
                                        logo.fixationType && {
                                            key: 'fixation',
                                            icon: 'lucide:anchor',
                                            label: t('pages.projectDetails.fixation', 'Fixação'),
                                            value: t(`pages.projectDetails.fixationTypes.${logo.fixationType}`, logo.fixationType)
                                        },
                                        logo.maxWeightConstraint && logo.maxWeight && {
                                            key: 'maxWeight',
                                            icon: 'lucide:scale',
                                            label: t('pages.projectDetails.maxWeightConstraint'),
                                            value: `${logo.maxWeight} kg`
                                        },
                                        logo.controlReport && {
                                            key: 'controlReport',
                                            icon: 'lucide:file-check',
                                            label: t('pages.projectDetails.controlReport'),
                                            value: t('common.yes', 'Sim')
                                        },
                                        logo.lacqueredStructure && {
                                            key: 'lacquered',
                                            icon: 'lucide:sparkles',
                                            label: t('pages.projectDetails.lacquered', 'Lacado'),
                                            value: logo.lacquerColor || t('common.yes', 'Sim')
                                        },
                                        logo.ballast && {
                                            key: 'ballast',
                                            icon: 'lucide:check-circle',
                                            label: t('pages.projectDetails.ballast', 'Balastro'),
                                            value: t('common.yes', 'Sim')
                                        },
                                        logo.mastDiameter && {
                                            key: 'mast',
                                            icon: 'lucide:ruler',
                                            label: t('pages.projectDetails.mastDiameter', 'Diâmetro mastro'),
                                            value: `${logo.mastDiameter} mm`
                                        }
                                    ].filter(Boolean).map(item => (
                                        <div key={item.key} className="flex items-start gap-3 rounded-lg border border-default-200 dark:border-white/10 bg-white dark:bg-black/40 p-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-default-100 dark:bg-white/10">
                                                <Icon icon={item.icon} className="text-default-700 dark:text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-default-500 dark:text-default-400">{item.label}</p>
                                                <p className="text-sm font-semibold text-default-900 dark:text-white">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 lg:col-span-3">
                        {logo.generatedImage && (
                            <div className="space-y-3 rounded-xl border border-default-200/80 dark:border-white/10 bg-default-50/80 dark:bg-white/5 p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-700 dark:text-primary-200">
                                    <Icon icon="lucide:sparkles" width={16} />
                                    <span>{t('pages.projectDetails.aiGeneratedImage', 'AI Generated Image')}</span>
                                </div>
                                <div className="relative aspect-square overflow-hidden rounded-lg border border-default-200 dark:border-white/10 bg-white dark:bg-black/40">
                                    <img
                                        src={buildImageUrl(logo.generatedImage)}
                                        alt={logo.logoName || 'AI Generated Logo'}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 rounded-xl border border-default-200/80 dark:border-white/10 bg-default-50/80 dark:bg-white/5 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-200">
                                <Icon icon="lucide:paperclip" width={16} />
                                <span>{t('pages.projectDetails.attachments', 'Anexos')}</span>
                                {hasAttachments && (
                                    <span className="ml-1 rounded-full bg-default-200 px-2 py-0.5 text-[11px] font-semibold text-default-800 dark:bg-white/10 dark:text-white">
                                        {logo.attachmentFiles.length}
                                    </span>
                                )}
                            </div>
                            {hasAttachments ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {logo.attachmentFiles.map((attachment, idx) => {
                                        const isImage = attachment.mimetype?.startsWith('image/');
                                        const fileUrl = buildImageUrl(attachment.url || attachment.path);

                                        return (
                                            <div
                                                key={idx}
                                            className="group relative overflow-hidden rounded-lg border border-default-200 dark:border-white/10 bg-white dark:bg-black/40"
                                            >
                                                {isImage ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPreview(attachment)}
                                                        className="block h-full w-full"
                                                    >
                                                        <img
                                                            src={fileUrl}
                                                            alt={attachment.name}
                                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                                                    </button>
                                                ) : (
                                                    <a
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-default-600 dark:text-default-200 transition-colors hover:bg-default-100/70 dark:hover:bg-white/5"
                                                    >
                                                        <Icon icon="lucide:file" className="text-default-500 dark:text-default-400" />
                                                        <span className="line-clamp-2 w-full font-medium">{attachment.name}</span>
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-default-500 dark:text-default-500">
                                    {t('pages.projectDetails.attachmentsEmpty', 'Sem anexos adicionados')}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 lg:col-span-4">
                        {hasComposition && (
                            <div className="space-y-4 rounded-xl border border-default-200/80 dark:border-white/10 bg-default-50/80 dark:bg-white/5 p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-200">
                                    <Icon icon="lucide:layers" width={18} />
                                    <span>{t('pages.projectDetails.composition')}</span>
                                </div>

                                {componentList.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-default-600 dark:text-default-300">
                                            <Icon icon="lucide:box" width={14} />
                                            <span>{t('pages.projectDetails.components', 'Componentes')}</span>
                                            <span className="rounded-full bg-default-200 px-2 py-0.5 text-[11px] text-default-800 dark:bg-white/10 dark:text-white">
                                                {componentList.length}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {componentList.map((comp, idx) => (
                                                <div key={idx} className="rounded-lg border border-default-200 dark:border-white/10 bg-white dark:bg-black/40 p-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-semibold text-default-900 dark:text-white">{comp.componenteNome}</span>
                                                        {comp.referencia && (
                                                            <span className="text-[11px] font-mono rounded-full bg-default-100 px-2 py-0.5 text-orange-700 dark:bg-white/10 dark:text-orange-200">
                                                                {comp.referencia}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-default-500 dark:text-default-400">
                                                        {comp.corNome && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-orange-500 dark:bg-orange-400" />
                                                                <span>{comp.corNome}</span>
                                                            </span>
                                                        )}
                                                        {comp.acabamentoNome && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-orange-400 dark:bg-orange-300" />
                                                                <span>{comp.acabamentoNome}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {ballsList.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-default-600 dark:text-default-300">
                                            <Icon icon="lucide:circle-dot" width={14} />
                                            <span>{t('pages.projectDetails.balls', 'Bolas')}</span>
                                            <span className="rounded-full bg-default-200 px-2 py-0.5 text-[11px] text-default-800 dark:bg-white/10 dark:text-white">
                                                {ballsList.length}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {ballsList.map((bola, idx) => (
                                                <div key={idx} className="rounded-lg border border-default-200 dark:border-white/10 bg-white dark:bg-black/40 p-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-semibold text-default-900 dark:text-white">{bola.bolaName}</span>
                                                        {bola.reference && (
                                                            <span className="text-[11px] font-mono rounded-full bg-default-100 px-2 py-0.5 text-orange-700 dark:bg-white/10 dark:text-orange-200">
                                                                {bola.reference}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-default-500 dark:text-default-400">
                                                        {bola.corNome && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-orange-500 dark:bg-orange-400" />
                                                                <span>{bola.corNome}</span>
                                                            </span>
                                                        )}
                                                        {bola.acabamentoNome && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-orange-400 dark:bg-orange-300" />
                                                                <span>{bola.acabamentoNome}</span>
                                                            </span>
                                                        )}
                                                        {bola.tamanhoName && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-orange-300 dark:bg-orange-200" />
                                                                <span>{bola.tamanhoName}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {hasDetails && (
                    <div className="space-y-4 rounded-xl border border-default-200/80 dark:border-white/10 bg-default-50/80 dark:bg-white/5 p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-200">
                            <Icon icon="lucide:file-text" width={16} />
                            <span>{t('pages.projectDetails.details')}</span>
                        </div>
                        {logo.description && (
                            <div className="space-y-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-default-600 dark:text-default-400">
                                    {t('pages.projectDetails.description')}
                                </p>
                                <p className="text-sm leading-relaxed text-default-800 dark:text-default-100 whitespace-pre-wrap">{logo.description}</p>
                            </div>
                        )}
                        {logo.criteria && (
                            <div className="space-y-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-default-600 dark:text-default-400">
                                    {t('pages.projectDetails.criteria')}
                                </p>
                                <p className="text-sm leading-relaxed text-default-800 dark:text-default-100 whitespace-pre-wrap">{logo.criteria}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!previewAttachment}
                onOpenChange={(open) => {
                    if (!open) handleClosePreview();
                }}
                size="xl"
                placement="center"
            >
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Icon icon="lucide:image" className="text-primary" />
                                    <span>{previewAttachment?.name || t('common.preview', 'Preview')}</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                {previewAttachment && (
                                    <div className="space-y-4">
                                        <div className="w-full">
                                            <img
                                                src={buildImageUrl(previewAttachment.url || previewAttachment.path)}
                                                alt={previewAttachment.name}
                                                className="h-auto w-full max-h-[70vh] rounded-lg border border-default-200 object-contain"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-default-500">
                                            <span>{previewAttachment.name}</span>
                                            {previewAttachment.size && (
                                                <span>{(previewAttachment.size / 1024).toFixed(1)} KB</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="flat"
                                    onPress={handleClosePreview}
                                >
                                    {t('common.close', 'Fechar')}
                                </Button>
                                {previewAttachment && (
                                    <Button
                                        as="a"
                                        href={buildImageUrl(previewAttachment.url || previewAttachment.path)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        color="primary"
                                    >
                                        {t('common.openNewTab', 'Abrir em nova aba')}
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

// Helper function to calculate unique decorations count
const getUniqueDecorationsCount = (decorations) => {
    if (!decorations || decorations.length === 0) return 0;
    
    // Função para normalizar a chave de agrupamento
    const normalizeKey = (value) => {
        if (!value) return 'unknown';
        return String(value)
            .toLowerCase()
            .replace(/^prd-/, '') // Remove prefixo "prd-"
            .replace(/[-\s]/g, '') // Remove hífens e espaços
            .trim();
    };

    // Remover duplicados por canvas ID
    const seenCanvasIds = new Set();
    const uniqueByCanvasId = decorations.filter(dec => {
        const canvasId = dec.id;
        if (seenCanvasIds.has(canvasId)) return false;
        seenCanvasIds.add(canvasId);
        return true;
    });

    // Agrupar por referência normalizada
    const grouped = uniqueByCanvasId.reduce((acc, dec) => {
        const originalValue = dec.decorationId || dec.name || dec.id || 'unknown';
        const normalizedKey = normalizeKey(originalValue);
        if (!acc[normalizedKey]) {
            acc[normalizedKey] = true;
        }
        return acc;
    }, {});

    return Object.keys(grouped).length;
};

// Helper function to calculate total quantity of all decorations (sum of all quantities)
const getTotalDecorationsQuantity = (decorations) => {
    if (!decorations || decorations.length === 0) return 0;
    
    // Função para normalizar a chave de agrupamento
    const normalizeKey = (value) => {
        if (!value) return 'unknown';
        return String(value)
            .toLowerCase()
            .replace(/^prd-/, '') // Remove prefixo "prd-"
            .replace(/[-\s]/g, '') // Remove hífens e espaços
            .trim();
    };

    // Remover duplicados por canvas ID
    const seenCanvasIds = new Set();
    const uniqueByCanvasId = decorations.filter(dec => {
        const canvasId = dec.id;
        if (seenCanvasIds.has(canvasId)) return false;
        seenCanvasIds.add(canvasId);
        return true;
    });

    // Agrupar por referência normalizada e contar quantidades
    const grouped = uniqueByCanvasId.reduce((acc, dec) => {
        const originalValue = dec.decorationId || dec.name || dec.id || 'unknown';
        const normalizedKey = normalizeKey(originalValue);
        if (!acc[normalizedKey]) {
            acc[normalizedKey] = 0;
        }
        acc[normalizedKey] += 1; // Contar cada instância
        return acc;
    }, {});

    // Somar todas as quantidades
    return Object.values(grouped).reduce((sum, quantity) => sum + quantity, 0);
};

// Component to display simulation content (AI Designer)
export const SimulationContent = ({ simulation, projectId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const decorations = simulation.canvasDecorations || [];
    const images = simulation.canvasImages || [];
    const sourceImages = images.filter(img => img.isSourceImage);
    const previewImage = simulation.canvasPreviewImage; // Imagem exportada com decorações
    
    // Calcular número de decorações únicas (para outros usos)
    const uniqueDecorationsCount = getUniqueDecorationsCount(decorations);
    // Calcular quantidade total de produtos (soma de todas as quantidades)
    const totalDecorationsQuantity = getTotalDecorationsQuantity(decorations);
    
    return (
        <div className="space-y-6">
            {/* Resumo da Simulação */}
            <Card className="shadow-sm border border-default-200">
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-secondary/10 rounded-lg text-secondary mt-1">
                                <Icon icon="lucide:image" width={20} />
                            </div>
                            <div>
                                <span className="text-xs text-default-500 font-medium uppercase tracking-wider block mb-1">
                                    {t('pages.projectDetails.simulation.images', 'Imagens')}
                                </span>
                                <span className="font-bold text-lg text-default-900">{sourceImages.length}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-secondary/10 rounded-lg text-secondary mt-1">
                                <Icon icon="lucide:sparkles" width={20} />
                            </div>
                            <div>
                                <span className="text-xs text-default-500 font-medium uppercase tracking-wider block mb-1">
                                    {t('pages.projectDetails.simulation.decorations', 'Decorações')}
                                </span>
                                <span className="font-bold text-lg text-default-900">{totalDecorationsQuantity}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-secondary/10 rounded-lg text-secondary mt-1">
                                <Icon icon="lucide:calendar" width={20} />
                            </div>
                            <div>
                                <span className="text-xs text-default-500 font-medium uppercase tracking-wider block mb-1">
                                    {t('pages.projectDetails.simulation.savedAt', 'Guardado em')}
                                </span>
                                <span className="font-bold text-lg text-default-900">
                                    {simulation.savedAt ? new Date(simulation.savedAt).toLocaleDateString() : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Preview Principal (Canvas com Decorações) */}
            {previewImage && (
                <Card className="shadow-sm border border-default-200">
                    <CardHeader className="px-4 py-3 border-b border-default-200">
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:sparkles" className="text-secondary" />
                            <span className="font-semibold">{t('pages.projectDetails.simulation.decoratedPreview', 'Preview com Decorações')}</span>
                        </div>
                    </CardHeader>
                    <CardBody className="p-4">
                        <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-default-100">
                            <img
                                src={previewImage}
                                alt="Simulation Preview with Decorations"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Preview das Imagens Source (fallback ou complemento) */}
            {sourceImages.length > 0 && !previewImage && (
                <Card className="shadow-sm border border-default-200">
                    <CardHeader className="px-4 py-3 border-b border-default-200">
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:image" className="text-secondary" />
                            <span className="font-semibold">{t('pages.projectDetails.simulation.imagePreview', 'Preview das Imagens')}</span>
                        </div>
                    </CardHeader>
                    <CardBody className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sourceImages.slice(0, 6).map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-default-100 group">
                                    <img
                                        src={img.src || img.url}
                                        alt={`Simulation ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {img.cartouche?.hasCartouche && (
                                        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                                            {img.cartouche.streetOrZone || img.cartouche.projectName}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {sourceImages.length > 6 && (
                            <p className="text-center text-default-500 mt-4">
                                +{sourceImages.length - 6} {t('pages.projectDetails.simulation.moreImages', 'mais imagens')}
                            </p>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Lista de Decorações */}
            {decorations.length > 0 && (() => {
                // Função para normalizar a chave de agrupamento
                // Remove hífens, espaços, prefixos comuns e converte para minúsculas
                const normalizeKey = (value) => {
                    if (!value) return 'unknown';
                    return String(value)
                        .toLowerCase()
                        .replace(/^prd-/, '') // Remove prefixo "prd-"
                        .replace(/[-\s]/g, '') // Remove hífens e espaços
                        .trim();
                };

                // Remover decorações duplicadas baseado no ID único do canvas (dec.id)
                // Se duas decorações têm o mesmo decorationId/nome mas IDs diferentes, são instâncias diferentes no canvas
                // Mas se têm o mesmo ID do canvas, são duplicados que devem ser removidos
                const seenCanvasIds = new Set();
                const uniqueDecorationsByCanvasId = decorations.filter(dec => {
                    const canvasId = dec.id; // ID único da decoração no canvas
                    if (seenCanvasIds.has(canvasId)) {
                        // Duplicado - remover
                        return false;
                    }
                    seenCanvasIds.add(canvasId);
                    return true;
                });

                // Agrupar decorações por referência/nome normalizado
                // Prioridade: decorationId > name > id
                const groupedDecorations = uniqueDecorationsByCanvasId.reduce((acc, dec) => {
                    // Obter valor original para exibição
                    const originalValue = dec.decorationId || dec.name || dec.id || 'unknown';
                    // Normalizar para agrupamento
                    const normalizedKey = normalizeKey(originalValue);
                    
                    if (!acc[normalizedKey]) {
                        acc[normalizedKey] = {
                            ...dec,
                            quantity: 0,
                            // Guardar a referência original para exibição (sem prefixo prd-)
                            reference: originalValue.replace(/^prd-/, '')
                        };
                    }
                    acc[normalizedKey].quantity += 1;
                    return acc;
                }, {});

                const uniqueDecorations = Object.values(groupedDecorations);

                return (
                    <Card className="shadow-sm border border-default-200">
                        <CardHeader className="px-4 py-3 border-b border-default-200">
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:sparkles" className="text-secondary" />
                                <span className="font-semibold">{t('pages.projectDetails.simulation.decorationsList', 'Decorações Utilizadas')}</span>
                            </div>
                        </CardHeader>
                        <CardBody className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {uniqueDecorations.map((dec, idx) => {
                                    const displayReference = dec.reference || dec.decorationId || dec.name || dec.id || 'Decoração';
                                    const uniqueKey = normalizeKey(displayReference) + '-' + idx;
                                    
                                    return (
                                        <div key={uniqueKey} className="text-center relative">
                                            <div className="relative w-16 h-16 mx-auto mb-2">
                                                <div className="w-16 h-16 rounded-lg bg-default-100 overflow-hidden flex items-center justify-center">
                                                    {dec.dayUrl || dec.src || dec.imageUrl ? (
                                                        <img
                                                            src={dec.dayUrl || dec.src || dec.imageUrl}
                                                            alt={displayReference}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <Icon icon="lucide:sparkles" className="text-2xl text-default-400" />
                                                    )}
                                                </div>
                                                {/* Badge com quantidade (sempre visível, posicionado fora do container da imagem) */}
                                                <div className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center z-10 shadow-sm">
                                                    {dec.quantity}
                                                </div>
                                            </div>
                                            <span 
                                                className="text-xs text-default-600 truncate block" 
                                                title={displayReference}
                                            >
                                                {displayReference}
                                            </span>
                                            <span className="text-[10px] text-default-500 block mt-0.5">
                                                {t('pages.projectDetails.simulation.quantity', 'Quantidade')}: {dec.quantity}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardBody>
                    </Card>
                );
            })()}

            {/* Botão para editar simulação */}
            <div className="flex justify-center">
                <Button
                    color="secondary"
                    variant="flat"
                    startContent={<Icon icon="lucide:edit-2" />}
                    onPress={() => navigate(`/projects/${projectId}/edit?step=ai-designer`)}
                >
                    {t('pages.projectDetails.simulation.editSimulation', 'Editar Simulação')}
                </Button>
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
    const [logoEditModalOpen, setLogoEditModalOpen] = useState(false);
    const [editingLogoIndex, setEditingLogoIndex] = useState(null);
    const [simulationEditModalOpen, setSimulationEditModalOpen] = useState(false);
    const [isAddingDesigner, setIsAddingDesigner] = useState(false);

    // Definir todos os callbacks ANTES de qualquer useEffect (regra dos hooks)
    const loadProject = React.useCallback(async () => {
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
    }, [id, t]);

    const handleLogoEditModalClose = React.useCallback(() => {
        setLogoEditModalOpen(false);
        setEditingLogoIndex(null);
    }, []);

    const handleLogoEditModalSave = React.useCallback(() => {
        loadProject(); // Recarregar projeto apenas após salvar
    }, [loadProject]);

    const handleEditSimulation = React.useCallback(() => {
        navigate(`/projects/${id}/edit?step=ai-designer`);
    }, [id, navigate]);

    const handleDeleteSimulation = React.useCallback(async () => {
        try {
            await projectsAPI.updateCanvas(id, {
                canvasDecorations: [],
                canvasImages: [],
                decorationsByImage: {},
                canvasPreviewImage: null,
                snapZonesByImage: {},
                cartoucheByImage: {},
                simulationState: null,
                uploadedImages: [],
                lastEditedStep: 'ai-designer'
            });

            addNotification({
                type: 'success',
                message: t('pages.projectDetails.instructions.deleteSimulationSuccess', 'Simulação eliminada com sucesso'),
            });

            await loadProject();
        } catch (error) {
            console.error('Erro ao eliminar simulação:', error);
            addNotification({
                type: 'error',
                message: t('pages.projectDetails.instructions.deleteSimulationError', 'Erro ao eliminar simulação'),
            });
        }
    }, [id, loadProject, addNotification, t]);

    const handleDeleteLogo = React.useCallback(async (logoIndex, isCurrent) => {
        try {
            const currentProject = await projectsAPI.getById(id);
            const logoDetails = currentProject.logoDetails || {};
            let savedLogos = logoDetails.logos || [];
            const currentLogo = logoDetails.currentLogo || {};

            console.log('🔍 [handleDeleteLogo] Iniciando exclusão:', {
                logoIndex,
                isCurrent,
                totalLogos: savedLogos.length,
                logoParaExcluir: isCurrent ? currentLogo : (savedLogos[logoIndex] || null)
            });

            if (isCurrent) {
                // Reset current logo
                const updatedLogoDetails = {
                    ...logoDetails,
                    currentLogo: {
                        logoNumber: "",
                        logoName: "",
                        requestedBy: "",
                        dimensions: {},
                        usageOutdoor: false,
                        usageIndoor: true,
                        fixationType: "",
                        lacqueredStructure: false,
                        lacquerColor: "",
                        mastDiameter: "",
                        maxWeightConstraint: false,
                        maxWeight: "",
                        ballast: false,
                        controlReport: false,
                        criteria: "",
                        description: "",
                        composition: {
                            componentes: [],
                            bolas: []
                        },
                        attachmentFiles: [],
                        isModification: false,
                        baseProductId: null,
                        baseProduct: null,
                        relatedProducts: [],
                        productSizes: []
                    }
                };
                
                console.log('✅ [handleDeleteLogo] Resetting current logo');
                
                const updateResult = await projectsAPI.updateCanvas(id, { logoDetails: updatedLogoDetails });
                
                // Verificar se a atualização foi bem-sucedida antes de recarregar
                if (updateResult) {
                    // Recarregar projeto para garantir sincronização
                    await loadProject();
                } else {
                    console.error('❌ [handleDeleteLogo] Falha ao atualizar current logo no servidor');
                    addNotification({
                        type: 'error',
                        message: t('pages.projectDetails.errorDeleteLogo', 'Erro ao eliminar logo: falha ao atualizar no servidor'),
                    });
                }
            } else {
                // Remove from saved logos
                // Verificar se o índice é válido
                if (logoIndex < 0 || logoIndex >= savedLogos.length) {
                    console.error('❌ [handleDeleteLogo] Índice inválido:', {
                        logoIndex,
                        totalLogos: savedLogos.length,
                        savedLogos: savedLogos.map((l, i) => ({
                            index: i,
                            id: l.id,
                            logoNumber: l.logoNumber,
                            logoName: l.logoName
                        }))
                    });
                    addNotification({
                        type: 'error',
                        message: t('pages.projectDetails.errorDeleteLogo', 'Erro ao eliminar logo: índice inválido'),
                    });
                    return;
                }
                
                const logoParaExcluir = savedLogos[logoIndex];
                
                console.log('🔍 [handleDeleteLogo] Tentando excluir logo:', {
                    logoIndex,
                    totalLogosAntes: savedLogos.length,
                    logoParaExcluir: {
                        id: logoParaExcluir?.id,
                        logoNumber: logoParaExcluir?.logoNumber,
                        logoName: logoParaExcluir?.logoName,
                        hasLogoName: logoParaExcluir?.logoName?.trim() !== ""
                    }
                });
                
                // IMPORTANTE: Filtrar também logos inválidos (sem logoName) ao excluir
                // Primeiro remover o logo no índice especificado, depois filtrar logos inválidos
                const newSavedLogos = savedLogos
                    .filter((_, i) => i !== logoIndex)
                    .filter(logo => {
                        // Remover também logos inválidos (sem logoName) que possam ter sido criados por engano
                        const hasLogoName = logo.logoName?.trim() !== "";
                        if (!hasLogoName) {
                            console.warn('⚠️ [handleDeleteLogo] Removendo logo inválido (sem logoName) durante exclusão:', {
                                logoId: logo.id,
                                logoNumber: logo.logoNumber
                            });
                        }
                        return hasLogoName;
                    });
                
                const updatedLogoDetails = {
                    ...logoDetails,
                    logos: newSavedLogos
                };
                
                console.log('✅ [handleDeleteLogo] Logo excluído com sucesso:', {
                    logoIndex,
                    totalLogosAntes: savedLogos.length,
                    totalLogosDepois: newSavedLogos.length,
                    logoExcluido: logoParaExcluir ? {
                        id: logoParaExcluir.id,
                        logoNumber: logoParaExcluir.logoNumber,
                        logoName: logoParaExcluir.logoName
                    } : null
                });
                
                const updateResult = await projectsAPI.updateCanvas(id, { logoDetails: updatedLogoDetails });
                
                console.log('✅ [handleDeleteLogo] Projeto atualizado no servidor:', {
                    success: !!updateResult,
                    totalLogosEnviados: newSavedLogos.length
                });
                
                // Verificar se a atualização foi bem-sucedida antes de recarregar
                if (updateResult) {
                    // Recarregar projeto para garantir sincronização
                    await loadProject();
                } else {
                    console.error('❌ [handleDeleteLogo] Falha ao atualizar projeto no servidor');
                    addNotification({
                        type: 'error',
                        message: t('pages.projectDetails.errorDeleteLogo', 'Erro ao eliminar logo: falha ao atualizar no servidor'),
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao eliminar logo:', error);
            addNotification({
                type: 'error',
                message: t('pages.projectDetails.errorDeleteLogo', 'Erro ao eliminar logo'),
            });
        }
    }, [id, loadProject, addNotification, t]);

    const handleEditLogoFromOrders = React.useCallback((logoIndex, isCurrent) => {
        const currentProject = project;
        const logoDetails = currentProject?.logoDetails || {};
        const savedLogos = logoDetails.logos || [];
        const currentLogo = logoDetails.currentLogo || {};
        
        // Construir logoInstructions da mesma forma que é feito na exibição (linha 1058)
        let logoInstructions = [...savedLogos];
        const isCurrentLogoValid = currentLogo?.logoNumber?.trim() && currentLogo?.logoName?.trim();
        if (isCurrentLogoValid && currentLogo) {
            const alreadyInSaved = savedLogos.some(logo => 
                (logo.id && currentLogo.id && logo.id === currentLogo.id) ||
                (logo.logoNumber && currentLogo.logoNumber && logo.logoNumber === currentLogo.logoNumber)
            );
            if (!alreadyInSaved) {
                logoInstructions.push(currentLogo);
            }
        }
        
        if (isCurrent) {
            // Se é o currentLogo, encontrar o índice nos logoInstructions
            const foundIndex = logoInstructions.findIndex((logo, idx) => {
                // Comparar por ID primeiro (mais confiável)
                if (logo.id && currentLogo.id) {
                    return logo.id === currentLogo.id;
                }
                // Comparar por logoNumber
                if (logo.logoNumber && currentLogo.logoNumber) {
                    return logo.logoNumber.trim() === currentLogo.logoNumber.trim();
                }
                return false;
            });
            
            if (foundIndex >= 0) {
                const logoId = currentLogo.id ? `&logoId=${encodeURIComponent(currentLogo.id)}` : '';
                const logoNumber = currentLogo.logoNumber ? `&logoNumber=${encodeURIComponent(currentLogo.logoNumber)}` : '';
                navigate(`/projects/${project.id}/edit?step=logo-instructions&logoIndex=${foundIndex}${logoId}${logoNumber}`);
            } else {
                // Se não encontrou, usar o último índice (onde o currentLogo deveria estar)
                const logoId = currentLogo.id ? `&logoId=${encodeURIComponent(currentLogo.id)}` : '';
                const logoNumber = currentLogo.logoNumber ? `&logoNumber=${encodeURIComponent(currentLogo.logoNumber)}` : '';
                navigate(`/projects/${project.id}/edit?step=logo-instructions&logoIndex=${logoInstructions.length - 1}${logoId}${logoNumber}`);
            }
        } else {
            // Se é um logo salvo, o índice já corresponde diretamente
            if (logoIndex < savedLogos.length) {
                const logoToEdit = savedLogos[logoIndex];
                // Encontrar o índice nos logoInstructions
                const foundIndex = logoInstructions.findIndex((logo, idx) => {
                    // Comparar por ID primeiro (mais confiável)
                    if (logo.id && logoToEdit.id) {
                        return logo.id === logoToEdit.id;
                    }
                    // Comparar por logoNumber
                    if (logo.logoNumber && logoToEdit.logoNumber) {
                        return logo.logoNumber.trim() === logoToEdit.logoNumber.trim();
                    }
                    return false;
                });
                
                if (foundIndex >= 0) {
                    const logoId = logoToEdit.id ? `&logoId=${encodeURIComponent(logoToEdit.id)}` : '';
                    const logoNumber = logoToEdit.logoNumber ? `&logoNumber=${encodeURIComponent(logoToEdit.logoNumber)}` : '';
                    navigate(`/projects/${project.id}/edit?step=logo-instructions&logoIndex=${foundIndex}${logoId}${logoNumber}`);
                } else {
                    // Se não encontrou, usar o índice original (deve ser o mesmo)
                    const logoId = logoToEdit.id ? `&logoId=${encodeURIComponent(logoToEdit.id)}` : '';
                    const logoNumber = logoToEdit.logoNumber ? `&logoNumber=${encodeURIComponent(logoToEdit.logoNumber)}` : '';
                    navigate(`/projects/${project.id}/edit?step=logo-instructions&logoIndex=${logoIndex}${logoId}${logoNumber}`);
                }
            }
        }
    }, [project]);

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
    }, [loadProject]);

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

    const handleAddRandomDesigner = React.useCallback(async () => {
        try {
            setIsAddingDesigner(true);
            const updatedProject = await projectsAPI.addRandomDesigner(id);
            setProject(updatedProject);
            addNotification({
                type: 'success',
                message: t('pages.projectDetails.designerAdded', 'Designer adicionado com sucesso!'),
            });
        } catch (error) {
            console.error('❌ Erro ao adicionar designer:', error);
            addNotification({
                type: 'error',
                message: error.response?.data?.error || t('pages.projectDetails.errorAddingDesigner', 'Erro ao adicionar designer'),
            });
        } finally {
            setIsAddingDesigner(false);
        }
    }, [id, addNotification, t]);

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
    const currentLogo = project.logoDetails?.currentLogo || project.logoDetails;
    
    // Verificar se currentLogo é válido
    const hasLogoNumber = currentLogo?.logoNumber?.trim() !== "";
    const hasLogoName = currentLogo?.logoName?.trim() !== "";
    const hasRequestedBy = currentLogo?.requestedBy?.trim() !== "";
    const dimensions = currentLogo?.dimensions || {};
    const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "";
    const hasLength = dimensions.length?.value != null && dimensions.length.value !== "";
    const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "";
    const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "";
    const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
    const isCurrentLogoValid = hasLogoNumber && hasLogoName && hasRequestedBy && hasAtLeastOneDimension;
    
    // Combinar savedLogos com currentLogo válido (se não estiver já nos savedLogos)
    let logoInstructions = [...savedLogos];
    if (isCurrentLogoValid && currentLogo) {
      // Verificar se currentLogo já está nos savedLogos
      const alreadyInSaved = savedLogos.some(logo => 
        (logo.id && currentLogo.id && logo.id === currentLogo.id) ||
        (logo.logoNumber && currentLogo.logoNumber && logo.logoNumber === currentLogo.logoNumber)
      );
      
      if (!alreadyInSaved) {
        logoInstructions.push(currentLogo);
      }
    }
    
    // Fallback: se não há logos salvos nem currentLogo válido, mas há currentLogo com dados, mostrar
    if (logoInstructions.length === 0 && currentLogo && (currentLogo.logoNumber || currentLogo.logoName)) {
      logoInstructions = [currentLogo];
    }
    
    // Also check for simulation data (AI Designer) - create a "simulation instruction" if there are decorations
    const hasSimulation = (project.canvasDecorations && project.canvasDecorations.length > 0) ||
                          (project.canvasImages && project.canvasImages.length > 0) ||
                          (project.decorationsByImage && Object.keys(project.decorationsByImage).length > 0);
    
    const simulationInstruction = hasSimulation ? [{
        isSimulation: true,
        logoName: t('pages.projectDetails.simulationInstruction', 'Simulação AI Designer'),
        logoNumber: 'SIM-001',
        canvasImages: project.canvasImages || [],
        canvasDecorations: project.canvasDecorations || [],
        decorationsByImage: project.decorationsByImage || {},
        canvasPreviewImage: project.canvasPreviewImage || null, // Imagem exportada com decorações
        savedAt: project.updatedAt || project.createdAt
    }] : [];
    
    // Combine logo instructions with simulation instructions
    const displayLogos = [...logoInstructions, ...simulationInstruction];
    
    // Calculate total instructions count for badge
    const instructionsCount = displayLogos.length;

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
                                            <CardHeader className="px-6 py-4 border-b border-divider flex justify-between items-center">
                                                <h3 className="text-lg font-semibold">{t('pages.projectDetails.designerInfo')}</h3>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    isIconOnly
                                                    onPress={handleAddRandomDesigner}
                                                    isLoading={isAddingDesigner}
                                                    aria-label={t('pages.projectDetails.addRandomDesigner', 'Adicionar designer aleatório')}
                                                >
                                                    <Icon icon="lucide:user-plus" className="w-4 h-4" />
                                                </Button>
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
                                                        <Button
                                                            color="primary"
                                                            variant="flat"
                                                            onPress={handleAddRandomDesigner}
                                                            isLoading={isAddingDesigner}
                                                            startContent={<Icon icon="lucide:user-plus" />}
                                                        >
                                                            {t('pages.projectDetails.addRandomDesigner', 'Adicionar Designer Aleatório')}
                                                        </Button>
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
                                    <Icon icon="lucide:file-text" />
                                    <span>{t('pages.projectDetails.tabs.instructions', 'Instruções')}</span>
                                    {instructionsCount > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-default-200 dark:bg-default-100 text-default-700 dark:text-default-600 text-xs font-medium">
                                            {instructionsCount}
                                        </span>
                                    )}
                                </div>
                            }
                        >
                            <InstructionsTab
                                project={project}
                                onEditLogo={handleEditLogoFromOrders}
                                onDeleteLogo={handleDeleteLogo}
                                onEditSimulation={handleEditSimulation}
                                onDeleteSimulation={handleDeleteSimulation}
                            />
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
                                decorationsByImage={project.decorationsByImage || {}}
                                projectType={project.projectType}
                                logoDetails={project.logoDetails}
                                onEditLogo={handleEditLogoFromOrders}
                                onDeleteLogo={handleDeleteLogo}
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
                    projectType={project?.projectType}
                    onModificationSubmitted={handleModificationSubmitted}
                />

                {/* Logo Edit Modal */}
                <LogoEditModal
                    isOpen={logoEditModalOpen}
                    onClose={handleLogoEditModalClose}
                    projectId={id}
                    logoIndex={editingLogoIndex}
                    onSave={handleLogoEditModalSave}
                />

                {/* Simulation Edit Modal */}
                <SimulationEditModal
                    isOpen={simulationEditModalOpen}
                    onClose={() => setSimulationEditModalOpen(false)}
                    projectId={id}
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
