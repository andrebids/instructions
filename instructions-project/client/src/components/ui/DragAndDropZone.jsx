import React, { useState, useRef } from 'react';
import { Icon } from "@iconify/react";

export const DragAndDropZone = ({
    onFilesSelected,
    children,
    className = "",
    accept,
    multiple = false,
    isDisabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const dragCounter = useRef(0);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDisabled) return;

        dragCounter.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDisabled) return;

        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Necessary to allow dropping
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounter.current = 0;
        if (isDisabled) return;

        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files && files.length > 0) {
            validateAndPassFiles(files);
        }
    };

    const handleFileInputChange = (e) => {
        const files = Array.from(e.target.files);
        if (files && files.length > 0) {
            validateAndPassFiles(files);
        }
        // Reset value to allow selecting the same file again if needed
        e.target.value = '';
    };

    const validateAndPassFiles = (files) => {
        // Filter by accept prop if provided
        let validFiles = files;
        if (accept) {
            const acceptedTypes = accept.split(',').map(type => type.trim());
            validFiles = files.filter(file => {
                // Simple check for MIME type or extension
                return acceptedTypes.some(type => {
                    if (type.endsWith('/*')) {
                        const baseType = type.split('/')[0];
                        return file.type.startsWith(baseType + '/');
                    }
                    if (type.startsWith('.')) {
                        return file.name.toLowerCase().endsWith(type.toLowerCase());
                    }
                    return file.type === type;
                });
            });
        }

        if (!multiple && validFiles.length > 1) {
            validFiles = [validFiles[0]];
        }

        if (validFiles.length > 0) {
            onFilesSelected(validFiles);
        }
    };

    const handleClick = () => {
        if (!isDisabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`relative transition-all duration-200 ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                } ${className}`}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInputChange}
                disabled={isDisabled}
            />

            {children}

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-primary-50/90 border-2 border-primary border-dashed rounded-lg backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none">
                    <div className="p-4 rounded-full bg-primary/10 mb-2">
                        <Icon icon="lucide:upload-cloud" className="text-4xl text-primary" />
                    </div>
                    <p className="text-lg font-semibold text-primary">Drop files here</p>
                </div>
            )}
        </div>
    );
};
