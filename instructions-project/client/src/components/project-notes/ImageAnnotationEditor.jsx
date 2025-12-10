import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, ButtonGroup, Tooltip, Divider, Input, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { Icon } from '@iconify/react';
import { drawRectangle, drawArrow, mergeImageWithAnnotations, canvasToBlob, calculateCanvasDimensions } from '../../utils/canvasUtils';

const TOOLS = {
    RECTANGLE: 'rectangle',
    ARROW: 'arrow'
};

const COLORS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'White', value: '#ffffff' }
];

const LINE_WIDTHS = [
    { name: 'Thin', value: 2 },
    { name: 'Medium', value: 4 },
    { name: 'Thick', value: 6 }
];

export default function ImageAnnotationEditor({ image, onSave, onCancel, isOpen }) {
    const baseCanvasRef = useRef(null); // Static canvas for the image
    const annotationCanvasRef = useRef(null); // Dynamic canvas for annotations
    const containerRef = useRef(null);
    const baseImageRef = useRef(null); // Cache the loaded image
    const [activeTool, setActiveTool] = useState(TOOLS.RECTANGLE);
    const [color, setColor] = useState(COLORS[0].value);
    const [lineWidth, setLineWidth] = useState(LINE_WIDTHS[1].value);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [annotations, setAnnotations] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);
    const [editingAnnotationIndex, setEditingAnnotationIndex] = useState(null);
    const [annotationText, setAnnotationText] = useState('');

    // Reset all annotation states when a new image is opened or modal is closed
    useEffect(() => {
        let timeoutId = null;
        if (!isOpen) {
            // Clear everything when modal closes - usar setTimeout para evitar setState síncrono
            timeoutId = setTimeout(() => {
                setAnnotations([]);
                setHistory([]);
                setHistoryIndex(-1);
                setIsDrawing(false);
                setImageLoaded(false);
                setHoveredAnnotationIndex(null);
                setEditingAnnotationIndex(null);
                setAnnotationText('');
                baseImageRef.current = null;
            }, 0);
        }
        // Sempre limpar o timeout, mesmo quando isOpen é true, para evitar memory leaks
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isOpen]);

    // Reset annotations when image changes (new image opened)
    useEffect(() => {
        if (image) {
            // Usar setTimeout para evitar setState síncrono em effect
            const timeoutId = setTimeout(() => {
                setAnnotations([]);
                setHistory([]);
                setHistoryIndex(-1);
                setIsDrawing(false);
                setImageLoaded(false);
                setHoveredAnnotationIndex(null);
                setEditingAnnotationIndex(null);
                setAnnotationText('');
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [image?.id, image?.src]);

    // Load image and setup base canvas (only once)
    useEffect(() => {
        if (!isOpen || !image || !baseCanvasRef.current) return;

        const baseCanvas = baseCanvasRef.current;
        const baseCtx = baseCanvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Calculate dimensions to fit in modal
            const maxWidth = window.innerWidth * 0.8;
            const maxHeight = window.innerHeight * 0.6;
            const dimensions = calculateCanvasDimensions(img.width, img.height, maxWidth, maxHeight);

            setCanvasDimensions(dimensions);
            baseCanvas.width = dimensions.width;
            baseCanvas.height = dimensions.height;

            // Draw the image on base canvas (only once)
            baseCtx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

            // Cache the image for later use
            baseImageRef.current = img;
            setImageLoaded(true);
        };

        img.src = image.src;
    }, [isOpen, image]);

    // Setup annotation canvas dimensions
    useEffect(() => {
        if (!imageLoaded || !annotationCanvasRef.current) return;

        const annotationCanvas = annotationCanvasRef.current;
        annotationCanvas.width = canvasDimensions.width;
        annotationCanvas.height = canvasDimensions.height;
    }, [imageLoaded, canvasDimensions]);

    // Funções de undo/redo movidas para antes de serem usadas
    const handleUndo = React.useCallback(() => {
        setHistoryIndex(prev => {
            if (prev > 0) {
                const newIndex = prev - 1;
                setAnnotations(history[newIndex]);
                return newIndex;
            } else if (prev === 0) {
                setAnnotations([]);
                return -1;
            }
            return prev;
        });
    }, [history]);

    const handleRedo = React.useCallback(() => {
        setHistoryIndex(prev => {
            if (prev < history.length - 1) {
                const newIndex = prev + 1;
                setAnnotations(history[newIndex]);
                return newIndex;
            }
            return prev;
        });
    }, [history]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            // Don't trigger shortcuts if editing text
            if (editingAnnotationIndex !== null) return;

            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, editingAnnotationIndex, handleUndo, handleRedo]);

    // Memoize drawing dependencies to prevent unnecessary rerenders
    const drawingState = useMemo(() => ({
        annotations,
        isDrawing,
        currentPos,
        imageLoaded,
        activeTool,
        color,
        lineWidth,
        startPos,
        hoveredAnnotationIndex
    }), [annotations, isDrawing, currentPos, imageLoaded, activeTool, color, lineWidth, startPos, hoveredAnnotationIndex]);

    // Redraw annotations only (no image reload!)
    useEffect(() => {
        if (!drawingState.imageLoaded || !annotationCanvasRef.current) return;

        const annotationCanvas = annotationCanvasRef.current;
        const ctx = annotationCanvas.getContext('2d');

        // Clear annotation canvas
        ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

        // Draw all saved annotations
        drawingState.annotations.forEach((annotation, index) => {
            const isHovered = drawingState.hoveredAnnotationIndex === index;
            const annotationColor = isHovered ? '#ffcc00' : annotation.color;
            const annotationWidth = isHovered ? annotation.lineWidth + 2 : annotation.lineWidth;

            if (annotation.tool === TOOLS.RECTANGLE) {
                drawRectangle(
                    ctx,
                    annotation.startX,
                    annotation.startY,
                    annotation.endX,
                    annotation.endY,
                    annotationColor,
                    annotationWidth
                );
            } else if (annotation.tool === TOOLS.ARROW) {
                drawArrow(
                    ctx,
                    annotation.startX,
                    annotation.startY,
                    annotation.endX,
                    annotation.endY,
                    annotationColor,
                    annotationWidth
                );
            }

            // Draw number badge if annotation has text
            if (annotation.text) {
                const badgeX = Math.min(annotation.startX, annotation.endX);
                const badgeY = Math.min(annotation.startY, annotation.endY) - 5;
                
                ctx.fillStyle = annotation.color;
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, 12, 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((index + 1).toString(), badgeX, badgeY);
            }
        });

        // Draw preview if currently drawing
        if (drawingState.isDrawing && drawingState.startPos && drawingState.currentPos) {
            if (drawingState.activeTool === TOOLS.RECTANGLE) {
                drawRectangle(ctx, drawingState.startPos.x, drawingState.startPos.y, drawingState.currentPos.x, drawingState.currentPos.y, drawingState.color, drawingState.lineWidth);
            } else if (drawingState.activeTool === TOOLS.ARROW) {
                drawArrow(ctx, drawingState.startPos.x, drawingState.startPos.y, drawingState.currentPos.x, drawingState.currentPos.y, drawingState.color, drawingState.lineWidth);
            }
        }
    }, [drawingState]);

    const getCanvasCoordinates = (e) => {
        const canvas = annotationCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e) => {
        const pos = getCanvasCoordinates(e);
        setStartPos(pos);
        setCurrentPos(pos);
        setIsDrawing(true);
    };

    const handleMouseMove = (e) => {
        const pos = getCanvasCoordinates(e);
        
        if (isDrawing) {
            setCurrentPos(pos);
        } else {
            // Check if hovering over any annotation
            const hoveredIndex = annotations.findIndex(ann => isPointInAnnotation(pos, ann));
            setHoveredAnnotationIndex(hoveredIndex >= 0 ? hoveredIndex : null);
        }
    };

    // Helper function to check if a point is near an annotation
    const isPointInAnnotation = (point, annotation) => {
        const padding = 10; // Padding for easier hover detection
        const minX = Math.min(annotation.startX, annotation.endX) - padding;
        const maxX = Math.max(annotation.startX, annotation.endX) + padding;
        const minY = Math.min(annotation.startY, annotation.endY) - padding;
        const maxY = Math.max(annotation.startY, annotation.endY) + padding;
        
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    };

    const handleMouseUp = (e) => {
        if (!isDrawing) return;

        const pos = getCanvasCoordinates(e);
        const newAnnotation = {
            tool: activeTool,
            startX: startPos.x,
            startY: startPos.y,
            endX: pos.x,
            endY: pos.y,
            color: color,
            lineWidth: lineWidth,
            text: '' // Initialize with empty text
        };

        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);

        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAnnotations);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        setIsDrawing(false);
        
        // Open text editor for the new annotation
        setEditingAnnotationIndex(newAnnotations.length - 1);
        setAnnotationText('');
    };

    const handleClearAll = () => {
        setAnnotations([]);
        const newHistory = [...history, []];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleSaveAnnotationText = () => {
        if (editingAnnotationIndex === null) return;
        
        const updatedAnnotations = [...annotations];
        updatedAnnotations[editingAnnotationIndex].text = annotationText;
        setAnnotations(updatedAnnotations);
        
        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updatedAnnotations);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        setEditingAnnotationIndex(null);
        setAnnotationText('');
    };

    const handleCancelAnnotationText = () => {
        setEditingAnnotationIndex(null);
        setAnnotationText('');
    };

    const handleAnnotationClick = (index) => {
        setEditingAnnotationIndex(index);
        setAnnotationText(annotations[index].text || '');
    };

    const handleSave = async () => {
        try {
            // Create a temporary canvas to merge both layers
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = canvasDimensions.width;
            mergedCanvas.height = canvasDimensions.height;
            const mergedCtx = mergedCanvas.getContext('2d');

            // Draw base image
            mergedCtx.drawImage(baseCanvasRef.current, 0, 0);

            // Draw annotations on top
            mergedCtx.drawImage(annotationCanvasRef.current, 0, 0);

            // Convert to data URL and blob
            const mergedDataUrl = mergedCanvas.toDataURL('image/png');
            const response = await fetch(mergedDataUrl);
            const blob = await response.blob();

            // Pass annotations with text for legend display
            console.log('💾 Saving image with annotations:', annotations);
            onSave(blob, mergedDataUrl, annotations);
        } catch (error) {
            console.error('Error saving annotated image:', error);
            alert('Failed to save annotated image. Please try again.');
        }
    };

    const handleClose = () => {
        // Reset state
        setAnnotations([]);
        setHistory([]);
        setHistoryIndex(-1);
        setIsDrawing(false);
        setImageLoaded(false);
        setHoveredAnnotationIndex(null);
        setEditingAnnotationIndex(null);
        setAnnotationText('');
        onCancel();
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={handleClose}
            size="5xl"
            backdrop="blur"
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[95vh]"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:pencil" className="text-primary" />
                                <span>Annotate Image: {image?.title}</span>
                            </div>
                            <p className="text-xs text-default-500 font-normal">
                                Draw rectangles and arrows to highlight areas of interest
                            </p>
                        </ModalHeader>

                        <ModalBody className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center gap-4 p-4 bg-default-100 rounded-lg border border-default-200 mb-4">
                                {/* Tools */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-default-700">Tool:</span>
                                    <ButtonGroup>
                                        <Tooltip content="Rectangle">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant={activeTool === TOOLS.RECTANGLE ? 'solid' : 'flat'}
                                                color={activeTool === TOOLS.RECTANGLE ? 'primary' : 'default'}
                                                onPress={() => setActiveTool(TOOLS.RECTANGLE)}
                                                aria-label="Rectangle tool"
                                            >
                                                <Icon icon="lucide:square" className="text-lg" />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Arrow">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant={activeTool === TOOLS.ARROW ? 'solid' : 'flat'}
                                                color={activeTool === TOOLS.ARROW ? 'primary' : 'default'}
                                                onPress={() => setActiveTool(TOOLS.ARROW)}
                                                aria-label="Arrow tool"
                                            >
                                                <Icon icon="lucide:arrow-right" className="text-lg" />
                                            </Button>
                                        </Tooltip>
                                    </ButtonGroup>
                                </div>

                                <Divider orientation="vertical" className="h-8" />

                                {/* Colors */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-default-700">Color:</span>
                                    <div className="flex gap-1">
                                        {COLORS.map((c) => (
                                            <Tooltip key={c.value} content={c.name}>
                                                <button
                                                    className={`w-7 h-7 rounded-md border-2 transition-all ${color === c.value
                                                        ? 'border-primary scale-110'
                                                        : 'border-default-300 hover:scale-105'
                                                        }`}
                                                    style={{ backgroundColor: c.value }}
                                                    onClick={() => setColor(c.value)}
                                                />
                                            </Tooltip>
                                        ))}
                                    </div>
                                </div>

                                <Divider orientation="vertical" className="h-8" />

                                {/* Line Width */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-default-700">Width:</span>
                                    <ButtonGroup size="sm">
                                        {LINE_WIDTHS.map((w) => (
                                            <Button
                                                key={w.value}
                                                size="sm"
                                                variant={lineWidth === w.value ? 'solid' : 'flat'}
                                                color={lineWidth === w.value ? 'primary' : 'default'}
                                                onPress={() => setLineWidth(w.value)}
                                            >
                                                {w.name}
                                            </Button>
                                        ))}
                                    </ButtonGroup>
                                </div>

                                <Divider orientation="vertical" className="h-8" />

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <Tooltip content="Undo (Ctrl+Z)">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="flat"
                                            isDisabled={historyIndex < 0}
                                            onPress={handleUndo}
                                            aria-label="Undo annotation"
                                        >
                                            <Icon icon="lucide:undo" className="text-lg" />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Redo (Ctrl+Y)">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="flat"
                                            isDisabled={historyIndex >= history.length - 1}
                                            onPress={handleRedo}
                                            aria-label="Redo annotation"
                                        >
                                            <Icon icon="lucide:redo" className="text-lg" />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Clear All">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                            isDisabled={annotations.length === 0}
                                            onPress={handleClearAll}
                                            aria-label="Clear all annotations"
                                        >
                                            <Icon icon="lucide:trash-2" className="text-lg" />
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Canvas */}
                            <div
                                ref={containerRef}
                                className="flex items-center justify-center bg-default-50 rounded-lg border-2 border-dashed border-default-300 p-4"
                            >
                                <div
                                    className="relative"
                                    style={{
                                        width: canvasDimensions.width || 'auto',
                                        height: canvasDimensions.height || 'auto',
                                        maxWidth: '100%',
                                        maxHeight: '60vh'
                                    }}
                                >
                                    {/* Base canvas with the image (static) */}
                                    <canvas
                                        ref={baseCanvasRef}
                                        className="shadow-lg rounded-lg"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                    {/* Annotation canvas (dynamic) */}
                                    <canvas
                                        ref={annotationCanvasRef}
                                        className="cursor-crosshair shadow-lg rounded-lg"
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={() => {
                                            setIsDrawing(false);
                                            setHoveredAnnotationIndex(null);
                                        }}
                                        onClick={(e) => {
                                            if (!isDrawing && hoveredAnnotationIndex !== null) {
                                                handleAnnotationClick(hoveredAnnotationIndex);
                                            }
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                    
                                    {/* Tooltip for hovered annotation with text */}
                                    {hoveredAnnotationIndex !== null && annotations[hoveredAnnotationIndex]?.text && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: Math.min(annotations[hoveredAnnotationIndex].startX, annotations[hoveredAnnotationIndex].endX),
                                                top: Math.min(annotations[hoveredAnnotationIndex].startY, annotations[hoveredAnnotationIndex].endY) - 40,
                                                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                                color: 'white',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                maxWidth: '200px',
                                                zIndex: 1000,
                                                pointerEvents: 'none',
                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                                            }}
                                        >
                                            <div className="font-semibold mb-1">Note #{hoveredAnnotationIndex + 1}</div>
                                            <div>{annotations[hoveredAnnotationIndex].text}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Text Editor for Annotation */}
                            {editingAnnotationIndex !== null && (
                                <div className="p-4 bg-warning/10 border-2 border-warning rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon icon="lucide:message-square-text" className="text-warning" />
                                        <h4 className="font-semibold text-foreground">
                                            Add Note to Annotation #{editingAnnotationIndex + 1}
                                        </h4>
                                    </div>
                                    <Input
                                        autoFocus
                                        placeholder="Enter a description or note for this annotation..."
                                        value={annotationText}
                                        onValueChange={setAnnotationText}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveAnnotationText();
                                            } else if (e.key === 'Escape') {
                                                handleCancelAnnotationText();
                                            }
                                        }}
                                        classNames={{
                                            input: "text-sm"
                                        }}
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            size="sm"
                                            color="primary"
                                            onPress={handleSaveAnnotationText}
                                            startContent={<Icon icon="lucide:check" />}
                                        >
                                            Save Note
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            onPress={handleCancelAnnotationText}
                                            startContent={<Icon icon="lucide:x" />}
                                        >
                                            Skip
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Annotations List */}
                            {annotations.length > 0 && (
                                <div className="p-3 bg-content2 rounded-lg border border-default-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon icon="lucide:list" className="text-default-600" />
                                        <h4 className="font-semibold text-foreground text-sm">Annotations ({annotations.length})</h4>
                                    </div>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {annotations.map((ann, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                                    hoveredAnnotationIndex === idx ? 'bg-primary/20' : 'bg-content1 hover:bg-content3'
                                                }`}
                                                onClick={() => handleAnnotationClick(idx)}
                                            >
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                    style={{ backgroundColor: ann.color }}
                                                >
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs text-default-600 capitalize">{ann.tool}</div>
                                                    {ann.text ? (
                                                        <div className="text-sm text-foreground truncate">{ann.text}</div>
                                                    ) : (
                                                        <div className="text-sm text-default-500 italic">No note</div>
                                                    )}
                                                </div>
                                                <Icon icon="lucide:pencil" className="text-default-500 text-sm flex-shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30">
                                <Icon icon="lucide:info" className="text-primary mt-0.5" />
                                <div className="text-sm text-foreground">
                                    <p className="font-medium mb-1">How to use:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-default-700">
                                        <li>Draw rectangles or arrows to highlight areas</li>
                                        <li>Add notes/legends to each annotation</li>
                                        <li>Hover over annotations to see notes</li>
                                        <li>Click on annotations to edit their notes</li>
                                        <li>Use Undo/Redo to adjust your work</li>
                                    </ul>
                                </div>
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={handleClose}
                                startContent={<Icon icon="lucide:x" />}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSave}
                                isDisabled={annotations.length === 0}
                                startContent={<Icon icon="lucide:check" />}
                            >
                                Use Annotated Image
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
