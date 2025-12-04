import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardBody, Select, SelectItem, Button, Spinner } from '@heroui/react';
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

export default function InstructionsTab({ project, onEditLogo, onEditSimulation, onDeleteLogo, onSave }) {
    const { t } = useTranslation();
    const [selectedInstructionKey, setSelectedInstructionKey] = useState(null);

    // Combine and sort instructions
    const allInstructions = useMemo(() => {
        if (!project) return [];

        const logoDetails = project.logoDetails || {};
        const savedLogos = logoDetails.logos || [];
        const currentLogo = logoDetails.currentLogo || logoDetails;

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
                logoInstructions.push(currentLogo);
            }
        }

        // Fallback: if no saved logos and no valid currentLogo, but currentLogo has data, show it
        if (logoInstructions.length === 0 && currentLogo && (currentLogo.logoNumber || currentLogo.logoName)) {
            logoInstructions = [currentLogo];
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
                return {
                    ...instruction,
                    key: `logo-${sortedLogos.indexOf(instruction)}`,
                    index: sortedLogos.indexOf(instruction)
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

    // Handle edit button click
    const handleEdit = () => {
        if (!selectedInstruction) return;

        if (selectedInstruction.isSimulation) {
            if (onEditSimulation) {
                onEditSimulation();
            }
        } else {
            // Use the same logic as handleEditLogoFromOrders
            const logoDetails = project.logoDetails || {};
            const savedLogos = logoDetails.logos || [];
            const currentLogo = logoDetails.currentLogo || {};
            
            // Build logoInstructions the same way as in display
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
            
            // Check if selected instruction is the current logo
            const isCurrent = (selectedInstruction.id && currentLogo.id && selectedInstruction.id === currentLogo.id) ||
                (selectedInstruction.logoNumber && currentLogo.logoNumber && 
                 selectedInstruction.logoNumber.trim() === currentLogo.logoNumber.trim());
            
            if (isCurrent) {
                // It's the current logo - find its index in logoInstructions
                const foundIndex = logoInstructions.findIndex((logo) => {
                    // Compare by ID first (more reliable)
                    if (logo.id && currentLogo.id) {
                        return logo.id === currentLogo.id;
                    }
                    // Compare by logoNumber
                    if (logo.logoNumber && currentLogo.logoNumber) {
                        return logo.logoNumber.trim() === currentLogo.logoNumber.trim();
                    }
                    return false;
                });
                
                if (onEditLogo) {
                    onEditLogo(foundIndex >= 0 ? foundIndex : logoInstructions.length - 1, true, selectedInstruction);
                }
            } else {
                // It's a saved logo - find its index in savedLogos first
                const savedLogoIndex = savedLogos.findIndex(logo =>
                    (logo.id && selectedInstruction.id && logo.id === selectedInstruction.id) ||
                    (logo.logoNumber && selectedInstruction.logoNumber && 
                     logo.logoNumber.trim() === selectedInstruction.logoNumber.trim())
                );
                
                if (savedLogoIndex >= 0) {
                    // Find the index in logoInstructions
                    const logoToEdit = savedLogos[savedLogoIndex];
                    const foundIndex = logoInstructions.findIndex((logo) => {
                        // Compare by ID first (more reliable)
                        if (logo.id && logoToEdit.id) {
                            return logo.id === logoToEdit.id;
                        }
                        // Compare by logoNumber
                        if (logo.logoNumber && logoToEdit.logoNumber) {
                            return logo.logoNumber.trim() === logoToEdit.logoNumber.trim();
                        }
                        return false;
                    });
                    
                    if (onEditLogo) {
                        onEditLogo(foundIndex >= 0 ? foundIndex : savedLogoIndex, false, selectedInstruction);
                    }
                }
            }
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
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
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
                        {selectedInstruction && (
                            <div className="flex gap-2">
                                <Button
                                    color="primary"
                                    variant="flat"
                                    startContent={<Icon icon="lucide:edit-2" />}
                                    onPress={handleEdit}
                                >
                                    {t('common.edit', 'Editar')}
                                </Button>
                                {!selectedInstruction.isSimulation && (
                                    <Button
                                        color="danger"
                                        variant="flat"
                                        startContent={<Icon icon="lucide:trash-2" />}
                                        onPress={async () => {
                                            if (onDeleteLogo) {
                                                const logoDetails = project.logoDetails || {};
                                                const savedLogos = logoDetails.logos || [];
                                                const currentLogo = logoDetails.currentLogo || {};
                                                
                                                // Check if it's the current logo
                                                const isCurrent = (selectedInstruction.id && currentLogo.id && selectedInstruction.id === currentLogo.id) ||
                                                    (selectedInstruction.logoNumber && currentLogo.logoNumber && 
                                                     selectedInstruction.logoNumber.trim() === currentLogo.logoNumber.trim());
                                                
                                                const logoName = selectedInstruction.logoName || selectedInstruction.logoNumber || t('pages.projectDetails.instructions.thisInstruction', 'esta instrução');
                                                
                                                if (window.confirm(t('pages.projectDetails.instructions.confirmDelete', 'Tem certeza que deseja eliminar "{{name}}"?', { name: logoName }))) {
                                                    if (isCurrent) {
                                                        // For current logo, find index in savedLogos or use -1
                                                        const foundIndex = savedLogos.findIndex(logo =>
                                                            (logo.id && selectedInstruction.id && logo.id === selectedInstruction.id) ||
                                                            (logo.logoNumber && selectedInstruction.logoNumber && 
                                                             logo.logoNumber.trim() === selectedInstruction.logoNumber.trim())
                                                        );
                                                        await onDeleteLogo(foundIndex >= 0 ? foundIndex : -1, true);
                                                    } else {
                                                        // It's a saved logo
                                                        const logoIndex = savedLogos.findIndex(logo =>
                                                            (logo.id && selectedInstruction.id && logo.id === selectedInstruction.id) ||
                                                            (logo.logoNumber && selectedInstruction.logoNumber && 
                                                             logo.logoNumber.trim() === selectedInstruction.logoNumber.trim())
                                                        );
                                                        if (logoIndex >= 0) {
                                                            await onDeleteLogo(logoIndex, false);
                                                        }
                                                    }
                                                    
                                                    // Reset selection after delete
                                                    setSelectedInstructionKey(null);
                                                    
                                                    // Reload project to update instructions list
                                                    if (onSave) {
                                                        await onSave();
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        {t('common.delete', 'Eliminar')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Selected Instruction Details */}
            {selectedInstruction && (
                <Card>
                    <CardBody>
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
        </div>
    );
}

