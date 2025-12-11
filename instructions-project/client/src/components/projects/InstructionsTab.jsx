import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardBody, Select, SelectItem, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { LogoDetailsContent, SimulationContent } from '../../pages/ProjectDetails';

// Helper function to get unique decorations count
const getUniqueDecorationsCount = (decorations) => {
    if (!decorations || decorations.length === 0) return 0;
    const uniqueIds = new Set(decorations.map(dec => dec.decorationId || dec.id || dec.name));
    return uniqueIds.size;
};

// Helper function to get total decorations quantity
const getTotalDecorationsQuantity = (decorations) => {
    if (!decorations || decorations.length === 0) return 0;
    return decorations.reduce((sum, dec) => sum + (dec.quantity || 1), 0);
};

export default function InstructionsTab({
    project,
    onEditLogo,
    onDeleteLogo,
    onEditSimulation,
    onDeleteSimulation
}) {
    const { t } = useTranslation();
    const [selectedInstructionKey, setSelectedInstructionKey] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Combine and sort instructions
    const allInstructions = useMemo(() => {
        if (!project) return [];

        const logoDetails = project.logoDetails || {};
        const savedLogos = (logoDetails.logos || []).map((logo, idx) => ({
            ...logo,
            _originalIndex: idx,
            isCurrent: false
        }));
        const currentLogo = { ...(logoDetails.currentLogo || logoDetails) };

        // Check if currentLogo is valid
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

        // Combine savedLogos with currentLogo if valid
        let logoInstructions = [...savedLogos];
        if (isCurrentLogoValid && currentLogo) {
            const alreadyInSaved = savedLogos.some(logo =>
                (logo.id && currentLogo.id && logo.id === currentLogo.id) ||
                (logo.logoNumber && currentLogo.logoNumber && logo.logoNumber === currentLogo.logoNumber)
            );

            if (!alreadyInSaved) {
                logoInstructions.push({
                    ...currentLogo,
                    _originalIndex: savedLogos.length, // current ficará no fim
                    isCurrent: true
                });
            }
        }

        // Fallback: if no saved logos and no valid currentLogo, but currentLogo has data, show it
        if (logoInstructions.length === 0 && currentLogo && (currentLogo.logoNumber || currentLogo.logoName)) {
            logoInstructions = [{
                ...currentLogo,
                _originalIndex: 0,
                isCurrent: true
            }];
        }

        // Check for simulation data
        const hasSimulation = (project.canvasDecorations && project.canvasDecorations.length > 0) ||
            (project.canvasImages && project.canvasImages.length > 0) ||
            (project.decorationsByImage && Object.keys(project.decorationsByImage).length > 0);

        const simulationInstructions = hasSimulation ? [{
            isSimulation: true,
            logoName: t('pages.projectDetails.simulationInstruction', 'Simulação AI Designer'),
            logoNumber: 'SIM-001',
            canvasImages: project.canvasImages || [],
            canvasDecorations: project.canvasDecorations || [],
            decorationsByImage: project.decorationsByImage || {},
            canvasPreviewImage: project.canvasPreviewImage || null,
            savedAt: project.updatedAt || project.createdAt
        }] : [];

        // Sort logos by logoNumber (alphanumeric)
        const sortedLogos = logoInstructions.sort((a, b) => {
            const aNum = a.logoNumber || '';
            const bNum = b.logoNumber || '';
            return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Sort simulations by savedAt (most recent first)
        const sortedSimulations = simulationInstructions.sort((a, b) => {
            const aDate = new Date(a.savedAt || 0);
            const bDate = new Date(b.savedAt || 0);
            return bDate - aDate;
        });

        // Combine: logos first, then simulations
        const combined = [...sortedLogos, ...sortedSimulations];

        return combined.map((instruction, index) => {
            if (instruction.isSimulation) {
                return {
                    ...instruction,
                    key: 'sim-0',
                    index: sortedLogos.length + sortedSimulations.indexOf(instruction)
                };
            } else {
                const idx = typeof instruction._originalIndex === 'number'
                    ? instruction._originalIndex
                    : sortedLogos.indexOf(instruction);
                return {
                    ...instruction,
                    key: `logo-${idx}`,
                    index: idx,
                    _originalIndex: idx,
                    isCurrent: instruction.isCurrent || false
                };
            }
        });
    }, [project, t]);

    // Set default selection to first instruction if available
    useEffect(() => {
        if (allInstructions.length > 0 && !selectedInstructionKey) {
            setSelectedInstructionKey(allInstructions[0].key);
        }
    }, [allInstructions, selectedInstructionKey]);

    // Get selected instruction
    const selectedInstruction = useMemo(() => {
        if (!selectedInstructionKey) return null;
        return allInstructions.find(inst => inst.key === selectedInstructionKey) || null;
    }, [selectedInstructionKey, allInstructions]);

    const getLogoIndexInfo = (instruction) => {
        if (!instruction) return { index: null, isCurrent: false };
        const index = typeof instruction._originalIndex === 'number'
            ? instruction._originalIndex
            : (typeof instruction.index === 'number' ? instruction.index : null);
        return { index, isCurrent: !!instruction.isCurrent };
    };

    // Format instruction display text for dropdown
    const getInstructionDisplayText = (instruction) => {
        if (instruction.isSimulation) {
            const decorationsCount = getUniqueDecorationsCount(instruction.canvasDecorations);
            const imagesCount = instruction.canvasImages?.length || 0;
            return `${instruction.logoName} | ${decorationsCount} decorações | ${imagesCount} imagens`;
        } else {
            const dimensions = instruction.dimensions || {};
            const dims = [];
            if (dimensions.height?.value) dims.push(`H:${dimensions.height.value}m`);
            if (dimensions.length?.value) dims.push(`L:${dimensions.length.value}m`);
            if (dimensions.width?.value) dims.push(`W:${dimensions.width.value}m`);
            if (dimensions.diameter?.value) dims.push(`D:${dimensions.diameter.value}m`);
            const dimsStr = dims.length > 0 ? ` | ${dims.join(', ')}` : '';
            return `${instruction.logoNumber || 'N/A'} | ${instruction.logoName || 'Sem nome'} | ${instruction.requestedBy || 'N/A'}${dimsStr}`;
        }
    };

    const handleEdit = () => {
        if (!selectedInstruction) return;
        if (selectedInstruction.isSimulation) {
            onEditSimulation?.();
            return;
        }

        const { index, isCurrent } = getLogoIndexInfo(selectedInstruction);
        if (index !== null) {
            onEditLogo?.(index, isCurrent);
        }
    };

    const handleDelete = async () => {
        if (!selectedInstruction) return;
        setActionLoading(true);
        try {
            if (selectedInstruction.isSimulation) {
                await onDeleteSimulation?.();
            } else {
                const { index, isCurrent } = getLogoIndexInfo(selectedInstruction);
                if (index !== null) {
                    await onDeleteLogo?.(index, isCurrent);
                }
            }
            setIsDeleteModalOpen(false);
            setSelectedInstructionKey(null);
        } finally {
            setActionLoading(false);
        }
    };


    if (!project) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" label={t('common.loading', 'Carregando...')} />
            </div>
        );
    }

    if (allInstructions.length === 0) {
        return (
            <div className="py-6">
                <Card>
                    <CardBody className="text-center py-12">
                        <Icon icon="lucide:file-text" className="text-4xl text-default-300 mx-auto mb-4" />
                        <p className="text-default-500 text-lg">
                            {t('pages.projectDetails.instructions.noInstructions', 'Nenhuma instrução disponível')}
                        </p>
                        <p className="text-default-400 text-sm mt-2">
                            {t('pages.projectDetails.instructions.noInstructionsDescription', 'Adicione instruções de logo ou simulação ao projeto.')}
                        </p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="py-6 space-y-6">
            {/* Dropdown Selector */}
            <Card>
                <CardBody className="space-y-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex-1 min-w-[260px]">
                                <Select
                                    label={t('pages.projectDetails.instructions.selectInstruction', 'Selecionar Instrução')}
                                    placeholder={t('pages.projectDetails.instructions.selectInstructionPlaceholder', 'Escolha uma instrução')}
                                    selectedKeys={selectedInstructionKey ? [selectedInstructionKey] : []}
                                    onSelectionChange={(keys) => {
                                        const selected = Array.from(keys)[0];
                                        if (selected) {
                                            setSelectedInstructionKey(selected);
                                        }
                                    }}
                                    classNames={{
                                        trigger: "h-14",
                                    }}
                                >
                                    {allInstructions.map((instruction) => (
                                        <SelectItem
                                            key={instruction.key}
                                            value={instruction.key}
                                            textValue={getInstructionDisplayText(instruction)}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Icon
                                                        icon={instruction.isSimulation ? "lucide:sparkles" : "lucide:package"}
                                                        className="text-primary"
                                                    />
                                                    <span className="font-semibold">
                                                        {instruction.isSimulation
                                                            ? instruction.logoName
                                                            : `${instruction.logoNumber || 'N/A'} - ${instruction.logoName || 'Sem nome'}`}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-default-500 pl-6">
                                                    {instruction.isSimulation ? (
                                                        <>
                                                            {getUniqueDecorationsCount(instruction.canvasDecorations)} decorações •{' '}
                                                            {instruction.canvasImages?.length || 0} imagens
                                                            {instruction.savedAt && (
                                                                <> • {new Date(instruction.savedAt).toLocaleDateString()}</>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {instruction.requestedBy && (
                                                                <>Solicitado por: {instruction.requestedBy} • </>
                                                            )}
                                                            {instruction.dimensions && (
                                                                <>
                                                                    {[
                                                                        instruction.dimensions.height?.value && `Alt: ${instruction.dimensions.height.value}m`,
                                                                        instruction.dimensions.length?.value && `Comp: ${instruction.dimensions.length.value}m`,
                                                                        instruction.dimensions.width?.value && `Larg: ${instruction.dimensions.width.value}m`,
                                                                        instruction.dimensions.diameter?.value && `Diam: ${instruction.dimensions.diameter.value}m`
                                                                    ].filter(Boolean).join(' • ')}
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="md"
                                    variant="flat"
                                    color="secondary"
                                    startContent={<Icon icon="lucide:edit-2" className="w-4 h-4" />}
                                    onPress={handleEdit}
                                    isDisabled={!selectedInstruction}
                                >
                                    {t('common.edit', 'Editar')}
                                </Button>
                                <Button
                                    size="md"
                                    variant="flat"
                                    color="danger"
                                    startContent={<Icon icon="lucide:trash-2" className="w-4 h-4" />}
                                    onPress={() => setIsDeleteModalOpen(true)}
                                    isDisabled={!selectedInstruction}
                                >
                                    {t('common.delete', 'Eliminar')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Selected Instruction Details */}
            {selectedInstruction && (
                <Card className="border-none bg-transparent p-0 shadow-none">
                    <CardBody className="p-0">
                        {selectedInstruction.isSimulation ? (
                            <SimulationContent
                                simulation={selectedInstruction}
                                projectId={project.id}
                            />
                        ) : (
                            <LogoDetailsContent logo={selectedInstruction} />
                        )}
                    </CardBody>
                </Card>
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                placement="center"
                size="md"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <Icon icon="lucide:alert-triangle" className="text-danger" />
                                <span>{t('pages.projectDetails.instructions.confirmDelete', 'Confirmar eliminação')}</span>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    {selectedInstruction?.isSimulation
                                        ? t('pages.projectDetails.instructions.confirmDeleteSimulation', 'Deseja eliminar esta simulação? Esta ação não pode ser desfeita.')
                                        : t('pages.projectDetails.instructions.confirmDeleteLogo', 'Deseja eliminar esta instrução de logo? Esta ação não pode ser desfeita.')}
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="flat"
                                    onPress={onClose}
                                    isDisabled={actionLoading}
                                >
                                    {t('common.cancel', 'Cancelar')}
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={handleDelete}
                                    isLoading={actionLoading}
                                    startContent={<Icon icon="lucide:trash-2" />}
                                >
                                    {t('common.delete', 'Eliminar')}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

        </div>
    );
}

