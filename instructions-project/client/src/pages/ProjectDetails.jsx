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
                                src={(() => {
                                    // Construir URL - sempre usar caminhos relativos para o proxy do Vite funcionar
                                    let imageUrl = logo.generatedImage;
                                    
                                    // Se for URL absoluta, extrair apenas o caminho
                                    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
                                        try {
                                            const urlObj = new URL(imageUrl);
                                            imageUrl = urlObj.pathname; // Usar apenas o caminho (proxy do Vite resolve)
                                        } catch (e) {
                                            const match = imageUrl.match(/\/api\/[^\s]+/);
                                            if (match) imageUrl = match[0];
                                        }
                                    }
                                    
                                    // Se for caminho UNC do Windows, extrair nome do arquivo
                                    if (imageUrl && (imageUrl.startsWith('\\\\') || imageUrl.startsWith('//'))) {
                                        const filename = imageUrl.split(/[\\/]/).pop();
                                        if (filename) imageUrl = `/api/files/${filename}`;
                                    }
                                    
                                    // Garantir que começa com /api/
                                    if (imageUrl && !imageUrl.startsWith('/api/') && imageUrl.startsWith('/')) {
                                        imageUrl = `/api${imageUrl}`;
                                    } else if (imageUrl && !imageUrl.startsWith('/')) {
                                        imageUrl = `/api/files/${imageUrl}`;
                                    }
                                    
                                    return imageUrl;
                                })()}
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
                                                
                                                // Construir URL - sempre usar caminhos relativos para o proxy do Vite funcionar
                                                let fileUrl = attachment.url || attachment.path;
                                                
                                                // Se for URL absoluta com localhost:5000, extrair apenas o caminho
                                                if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
                                                    try {
                                                        const urlObj = new URL(fileUrl);
                                                        fileUrl = urlObj.pathname; // Usar apenas o caminho (proxy do Vite resolve)
                                                    } catch (e) {
                                                        // Se falhar, tentar extrair manualmente
                                                        const match = fileUrl.match(/\/api\/[^\s]+/);
                                                        if (match) fileUrl = match[0];
                                                    }
                                                }
                                                
                                                // Se for caminho UNC do Windows, extrair nome do arquivo
                                                if (fileUrl && (fileUrl.startsWith('\\\\') || fileUrl.startsWith('//'))) {
                                                    const filename = fileUrl.split(/[\\/]/).pop();
                                                    if (filename) fileUrl = `/api/files/${filename}`;
                                                }
                                                
                                                // Garantir que começa com /api/
                                                if (fileUrl && !fileUrl.startsWith('/api/') && fileUrl.startsWith('/')) {
                                                    fileUrl = `/api${fileUrl}`;
                                                } else if (fileUrl && !fileUrl.startsWith('/')) {
                                                    fileUrl = `/api/files/${fileUrl}`;
                                                }

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
                        attachmentFiles: []
                    }
                };
                await projectsAPI.updateCanvas(id, { logoDetails: updatedLogoDetails });
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
                setEditingLogoIndex(foundIndex);
                setLogoEditModalOpen(true);
            } else {
                // Se não encontrou, usar o último índice (onde o currentLogo deveria estar)
                setEditingLogoIndex(logoInstructions.length - 1);
                setLogoEditModalOpen(true);
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
                    setEditingLogoIndex(foundIndex);
                    setLogoEditModalOpen(true);
                } else {
                    // Se não encontrou, usar o índice original (deve ser o mesmo)
                    setEditingLogoIndex(logoIndex);
                    setLogoEditModalOpen(true);
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
                                    <Icon icon="lucide:file-text" />
                                    <span>{t('pages.projectDetails.tabs.instructions', 'Instruções')}</span>
                                </div>
                            }
                        >
                            <InstructionsTab
                                project={project}
                                onEditLogo={(logoIndex, isCurrent, logo) => {
                                    handleEditLogoFromOrders(logoIndex, isCurrent);
                                }}
                                onEditSimulation={() => {
                                    setSimulationEditModalOpen(true);
                                }}
                                onDeleteLogo={handleDeleteLogo}
                                onSave={loadProject}
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
