import React from "react";
import {
    Modal,
    ModalContent,
    ModalBody,
    ModalHeader,
    Button
} from "@heroui/react";
import { Icon } from "@iconify/react";

import PlaygroundSidebar from "./PlaygroundSidebar";

export function AIAssistantChat({ isOpen, onClose, onSaveImage }) {
    const [generationStatus, setGenerationStatus] = React.useState('idle'); // 'idle', 'generating', 'complete'
    const [generatedImageUrl, setGeneratedImageUrl] = React.useState(null);
    const [generationType, setGenerationType] = React.useState(null); // 'video' or 'reveal'
    const [revealProgress, setRevealProgress] = React.useState(0);
    const [clearPromptTrigger, setClearPromptTrigger] = React.useState(0);
    const videoRef = React.useRef(null);

    const handleGenerate = (prompt, referenceImage) => {
        const normalizedPrompt = prompt?.trim().toLowerCase() || '';

        // Check which fake generation to use based on prompt
        if (normalizedPrompt === 'coelho azul') {
            setGenerationType('video');
            setGenerationStatus('generating');
            setGeneratedImageUrl('/AIGENERATOR/coelho.webp');

            // Fallback timeout if video doesn't trigger
            setTimeout(() => {
                setGenerationStatus('complete');
            }, 3000);
        } else if (normalizedPrompt === 'pai natal') {
            setGenerationType('reveal');
            setGenerationStatus('generating');
            setGeneratedImageUrl('/AIGENERATOR/PAINATAL.webp');
            setRevealProgress(0);

            // Progressive reveal animation
            let progress = 0;
            const interval = setInterval(() => {
                progress += 2;
                setRevealProgress(progress);

                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setGenerationStatus('complete');
                    }, 200);
                }
            }, 30); // Update every 30ms for smooth animation
        } else {
            // For other prompts, show a message or do nothing
            console.log('No fake generation available for this prompt:', prompt);
        }
    };

    const handleVideoEnded = () => {
        setGenerationStatus('complete');
    };

    const handleReset = () => {
        setGenerationStatus('idle');
        setGeneratedImageUrl(null);
        setGenerationType(null);
        setRevealProgress(0);
        setClearPromptTrigger(prev => prev + 1); // Trigger prompt clear in sidebar
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="5xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[90vh]",
                body: "p-0"
            }}
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <div className="flex h-[85vh] w-full overflow-hidden">
                        <PlaygroundSidebar onGenerate={handleGenerate} clearPromptTrigger={clearPromptTrigger} />
                        <div className="flex flex-1 flex-col">
                            <ModalHeader className="flex flex-col gap-1 px-6 py-4 border-b border-default-100">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <Icon icon="lucide:sparkles" className="w-5 h-5 text-default-500" />
                                        <span className="text-medium font-medium">Image Generation</span>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody className="p-6 flex-1 overflow-hidden bg-default-50/50">
                                {generationStatus === 'idle' && (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md">
                                            <div className="w-24 h-24 rounded-full bg-default-100 flex items-center justify-center mb-4">
                                                <Icon icon="solar:gallery-wide-bold" className="w-10 h-10 text-default-400" />
                                            </div>
                                            <h1 className="text-default-900 text-2xl font-bold">No images generated yet</h1>
                                            <p className="text-default-500">
                                                Enter a prompt in the sidebar and click Generate to see your results here.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {generationStatus === 'generating' && generationType === 'video' && (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            onEnded={handleVideoEnded}
                                            className="max-w-full max-h-full object-contain"
                                        >
                                            <source src="/AIGENERATOR/coelho.webm" type="video/webm" />
                                        </video>
                                    </div>
                                )}

                                {generationStatus === 'generating' && generationType === 'reveal' && generatedImageUrl && (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <div className="relative max-w-full max-h-full">
                                            <img
                                                src={generatedImageUrl}
                                                alt="Generating"
                                                className="max-w-full max-h-full object-contain"
                                                style={{
                                                    filter: `blur(${20 - (revealProgress * 0.2)}px)`,
                                                    clipPath: `inset(0 0 ${100 - revealProgress}% 0)`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {generationStatus === 'complete' && generatedImageUrl && (
                                    <div className="flex h-full w-full flex-col gap-4">
                                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={generatedImageUrl}
                                                alt="Generated"
                                                className="max-w-full max-h-full object-contain rounded-lg"
                                            />
                                        </div>
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                color="primary"
                                                variant="solid"
                                                startContent={<Icon icon="solar:download-linear" width={20} />}
                                                onPress={() => onSaveImage?.(generatedImageUrl)}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                onPress={handleReset}
                                                startContent={<Icon icon="solar:restart-bold" width={20} />}
                                            >
                                                Generate New
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                        </div>
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
}
