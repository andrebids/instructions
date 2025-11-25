import React, { useState, useRef, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, ButtonGroup, Tooltip, Divider } from '@heroui/react';
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

    // Redraw annotations only (no image reload!)
    useEffect(() => {
        if (!imageLoaded || !annotationCanvasRef.current) return;

        const annotationCanvas = annotationCanvasRef.current;
        const ctx = annotationCanvas.getContext('2d');

        // Clear annotation canvas
        ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

        // Draw all saved annotations
        annotations.forEach(annotation => {
            if (annotation.tool === TOOLS.RECTANGLE) {
                drawRectangle(
                    ctx,
                    annotation.startX,
                    annotation.startY,
                    annotation.endX,
                    annotation.endY,
                    annotation.color,
                    annotation.lineWidth
                );
            } else if (annotation.tool === TOOLS.ARROW) {
                drawArrow(
                    ctx,
                    annotation.startX,
                    annotation.startY,
                    annotation.endX,
                    annotation.endY,
                    annotation.color,
                    annotation.lineWidth
                );
            }
        });

        // Draw preview if currently drawing
        if (isDrawing) {
            if (activeTool === TOOLS.RECTANGLE) {
                drawRectangle(ctx, startPos.x, startPos.y, currentPos.x, currentPos.y, color, lineWidth);
            } else if (activeTool === TOOLS.ARROW) {
                drawArrow(ctx, startPos.x, startPos.y, currentPos.x, currentPos.y, color, lineWidth);
            }
        }
    }, [annotations, isDrawing, currentPos, imageLoaded, activeTool, color, lineWidth, startPos]);

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
        if (!isDrawing) return;
        const pos = getCanvasCoordinates(e);
        setCurrentPos(pos);
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
            lineWidth: lineWidth
        };

        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);

        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAnnotations);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        setIsDrawing(false);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setAnnotations(history[historyIndex - 1]);
        } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setAnnotations([]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setAnnotations(history[historyIndex + 1]);
        }
    };

    const handleClearAll = () => {
        setAnnotations([]);
        const newHistory = [...history, []];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
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

            onSave(blob, mergedDataUrl);
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
                                        onMouseLeave={() => setIsDrawing(false)}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <Icon icon="lucide:info" className="text-primary mt-0.5" />
                                <div className="text-sm text-default-700">
                                    <p className="font-medium mb-1">How to use:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Select a tool (Rectangle or Arrow)</li>
                                        <li>Click and drag on the image to draw</li>
                                        <li>Choose different colors and line widths</li>
                                        <li>Use Undo/Redo to adjust your annotations</li>
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
