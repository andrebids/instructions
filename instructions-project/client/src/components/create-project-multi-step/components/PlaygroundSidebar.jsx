import React from "react";
import {
    Textarea,
    Button,
    ScrollShadow,
    cn
} from "@heroui/react";
import { Icon } from "@iconify/react";

import PromptInput from "./PromptInput";
import ShinyText from "./ShinyText";

export default function PlaygroundSidebar({ 
    onGenerate, 
    clearPromptTrigger,
    // Props para persistência de estado
    initialPrompt = "",
    initialReferenceImage = null,
    initialNegativePrompt = "",
    onPromptChange = null,
    onReferenceImageChange = null,
    onNegativePromptChange = null
}) {
    const [prompt, setPrompt] = React.useState(initialPrompt);
    const [selectedImage, setSelectedImage] = React.useState(initialReferenceImage);
    const [negativePrompt, setNegativePrompt] = React.useState(initialNegativePrompt);
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef(null);

    // Carregar estado inicial quando as props mudam
    React.useEffect(() => {
        if (initialPrompt !== undefined) {
            setPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    React.useEffect(() => {
        if (initialReferenceImage !== undefined) {
            setSelectedImage(initialReferenceImage);
        }
    }, [initialReferenceImage]);

    React.useEffect(() => {
        if (initialNegativePrompt !== undefined) {
            setNegativePrompt(initialNegativePrompt);
        }
    }, [initialNegativePrompt]);

    // Clear prompt when clearPromptTrigger changes
    React.useEffect(() => {
        if (clearPromptTrigger > 0) {
            setPrompt("");
            if (onPromptChange) {
                onPromptChange("");
            }
        }
    }, [clearPromptTrigger, onPromptChange]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target.result);
                if (onReferenceImageChange) {
                    onReferenceImageChange(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        if (onReferenceImageChange) {
            onReferenceImageChange(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex h-full w-80 flex-col gap-4 border-r border-default-100 p-4">
            <div className="flex items-center gap-2">
                <Icon icon="lucide:sparkles" className="w-5 h-5 text-primary" />
                <ShinyText
                    text="AI Assistant"
                    speed={3}
                    className="text-medium font-semibold"
                />
            </div>

            <ScrollShadow className="flex flex-col gap-6 h-full pr-2">
                <div
                    className={cn(
                        "flex flex-col gap-2 rounded-medium transition-colors p-2 -m-2",
                        isDragging ? "bg-primary-50 border-2 border-dashed border-primary" : "border-2 border-transparent"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <label className="text-small font-medium text-default-700">Prompt</label>
                    <PromptInput
                        classNames={{
                            inputWrapper: "bg-default-100",
                            input: "text-small",
                        }}
                        minRows={4}
                        radius="lg"
                        value={prompt}
                        variant="flat"
                        onValueChange={(value) => {
                            setPrompt(value);
                            if (onPromptChange) {
                                onPromptChange(value);
                            }
                        }}
                        placeholder="Describe the image you want to generate..."
                    />

                    {selectedImage && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-default-200 group">
                            <img src={selectedImage} alt="Reference" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    isIconOnly
                                    color="danger"
                                    variant="flat"
                                    size="sm"
                                    onPress={handleRemoveImage}
                                    aria-label="Remove image"
                                >
                                    <Icon icon="solar:trash-bin-trash-linear" width={20} />
                                </Button>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            startContent={
                                <Icon className="text-default-500" icon="solar:paperclip-linear" width={16} />
                            }
                            variant="flat"
                            className="flex-1"
                            onPress={() => fileInputRef.current?.click()}
                        >
                            Attach
                        </Button>
                        <Button
                            size="sm"
                            startContent={
                                <Icon className="text-default-500" icon="solar:magic-stick-3-linear" width={16} />
                            }
                            variant="flat"
                            className="flex-1"
                            onPress={() => {
                                const randomPrompts = ["Coelho azul", "Pai Natal"];
                                const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
                                setPrompt(randomPrompt);
                                if (onPromptChange) {
                                    onPromptChange(randomPrompt);
                                }
                            }}
                        >
                            Random
                        </Button>
                    </div>

                </div>

                <div className="flex flex-col gap-2">
                    <Textarea
                        label="System / Negative Prompt"
                        placeholder="Enter negative prompt or system instructions..."
                        variant="faded"
                        minRows={2}
                        value={negativePrompt}
                        onValueChange={(value) => {
                            setNegativePrompt(value);
                            if (onNegativePromptChange) {
                                onNegativePromptChange(value);
                            }
                        }}
                    />
                    <Button
                        color="primary"
                        className="w-full mt-2"
                        onPress={() => onGenerate?.(prompt, selectedImage)}
                    >
                        Generate
                    </Button>
                </div>
            </ScrollShadow>
        </div>
    );
}
