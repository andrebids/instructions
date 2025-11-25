import React, { useState, useRef, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Avatar, Chip, Tooltip, Popover, PopoverTrigger, PopoverContent, Select, SelectItem, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Accordion, AccordionItem, Switch } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { formatDistanceToNow } from 'date-fns';

import { projectsAPI } from '../../services/api';
import { translateText, LANGUAGES, getLanguageLabel } from '../../services/translationService';
import ImageAnnotationEditor from './ImageAnnotationEditor';

export function ProjectObservations({ projectId, instructions = [], results = [], designers = [], onNewMessage }) {
    const { t, i18n } = useTranslation();
    const { user } = useUser();
    const [observations, setObservations] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedInstruction, setSelectedInstruction] = useState(null);
    const [selectedResultImage, setSelectedResultImage] = useState(null);
    const [viewingInstruction, setViewingInstruction] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { isOpen: isResultModalOpen, onOpen: onResultModalOpen, onOpenChange: onResultModalOpenChange } = useDisclosure();
    const { isOpen: isInstructionModalOpen, onOpen: onInstructionModalOpen, onOpenChange: onInstructionModalOpenChange } = useDisclosure();
    const { isOpen: isAttachmentModalOpen, onOpen: onAttachmentModalOpen, onOpenChange: onAttachmentModalOpenChange } = useDisclosure();
    const { isOpen: isAnnotationModalOpen, onOpen: onAnnotationModalOpen, onOpenChange: onAnnotationModalOpenChange } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalOpenChange } = useDisclosure();
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [observationToDelete, setObservationToDelete] = useState(null);

    // Annotation state
    const [imageToAnnotate, setImageToAnnotate] = useState(null);
    const [annotatedImageData, setAnnotatedImageData] = useState(null);

    // Translation state
    const [translations, setTranslations] = useState({}); // { messageId: { targetLang: translatedText } }
    const [activeTranslations, setActiveTranslations] = useState({}); // { messageId: 'targetLang' or null }
    const [translatingMessages, setTranslatingMessages] = useState({}); // { messageId: boolean }
    const [globalTranslationLang, setGlobalTranslationLang] = useState(null); // 'pt', 'en', 'fr' or null
    const [isAutoTranslate, setIsAutoTranslate] = useState(true);

    // Helper to hydrate observations with local data (instructions/results)
    const hydrateObservations = (obsList) => {
        return obsList.map(obs => {
            // Hydrate linked instruction
            let linkedInstruction = null;
            if (obs.linkedInstructionId !== null && obs.linkedInstructionId !== undefined) {
                // Try to find by logoNumber
                linkedInstruction = instructions.find(i => i.logoNumber == obs.linkedInstructionId);

                // If not found by logoNumber, try to match by index if the ID looks like an index (number)
                if (!linkedInstruction && !isNaN(obs.linkedInstructionId)) {
                    const idx = parseInt(obs.linkedInstructionId);
                    if (idx >= 0 && idx < instructions.length) {
                        linkedInstruction = instructions[idx];
                    }
                }
            }

            // Hydrate linked result image
            let linkedResultImage = null;
            if (obs.linkedResultImageId) {
                linkedResultImage = results.find(r => r.id == obs.linkedResultImageId);
            }

            return {
                ...obs,
                linkedInstruction,
                linkedResultImage
            };
        });
    };

    // Fetch observations on mount
    useEffect(() => {
        const fetchObservations = async () => {
            try {
                const data = await projectsAPI.getObservations(projectId);
                const hydratedData = hydrateObservations(data);
                setObservations(hydratedData);
            } catch (error) {
                console.error('Error fetching observations:', error);
            }
        };

        if (projectId) {
            fetchObservations();
        }
    }, [projectId, instructions, results]); // Add dependencies to re-hydrate if props change

    // Poll for new messages every 10 seconds
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                const data = await projectsAPI.getObservations(projectId);

                // Get IDs of current observations
                const currentIds = new Set(observations.map(obs => obs.id));

                // Find truly new messages (messages that don't exist in current observations)
                const newMessages = data.filter(msg => !currentIds.has(msg.id));

                // Only process if there are genuinely new messages
                if (newMessages.length > 0) {
                    // Update observations with all data from server, hydrated
                    const hydratedData = hydrateObservations(data);
                    setObservations(hydratedData);

                    // Filter to only notify about messages from other users
                    const messagesFromOthers = newMessages.filter(msg =>
                        msg.author?.name !== user?.name
                    );

                    // Notify parent about new messages from other users
                    if (onNewMessage && messagesFromOthers.length > 0) {
                        console.log('🔔 New messages from others:', messagesFromOthers);
                        onNewMessage(messagesFromOthers);
                    }
                }
            } catch (error) {
                console.error('Error polling observations:', error);
            }
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(pollInterval);
    }, [projectId, observations, onNewMessage, user?.name]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [observations]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && attachments.length === 0 && !selectedResultImage && selectedInstruction === null) return;

        setIsSubmitting(true);

        try {
            // Check if there's an annotated image in the attachments
            const hasAnnotatedImage = attachments.some(att => att.name.startsWith('annotated_'));
            
            // If there's an annotated image, don't send the linkedResultImageId (original image)
            // Only send the annotated version in attachments
            const linkedResultId = hasAnnotatedImage ? null : selectedResultImage?.id;

            const observationData = {
                content: newMessage,
                attachments: attachments,
                linkedInstructionId: selectedInstruction,
                linkedResultImageId: linkedResultId,
            };

            const newObservation = await projectsAPI.addObservation(projectId, observationData);

            // Optimistically update or wait for re-fetch. 
            // Ideally the backend returns the full created object with author info.
            // If the backend returns just the ID or partial data, we might need to construct the object carefully
            // or re-fetch. For now, let's assume the backend returns the created observation.

            // If the backend doesn't return the full author object immediately, we might need to patch it in for display
            const displayObservation = {
                ...newObservation,
                author: newObservation.author || {
                    name: user?.name || 'User',
                    avatar: user?.avatar,
                    role: 'Project Creator'
                },
                // Ensure linked objects are available for display if the backend only returns IDs
                linkedInstruction: selectedInstruction !== null ? instructions.find(i => (i.logoNumber || instructions.indexOf(i)) === selectedInstruction) : null,
                linkedResultImage: hasAnnotatedImage ? null : selectedResultImage
            };

            setObservations(prev => [...prev, displayObservation]);
            setNewMessage('');
            setSelectedInstruction(null);
            setSelectedResultImage(null);
            setAnnotatedImageData(null);
            setAttachments([]);
        } catch (error) {
            console.error('Error sending observation:', error);
            // You might want to show a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteObservation = (observationId) => {
        setObservationToDelete(observationId);
        onDeleteModalOpen();
    };

    const confirmDeleteObservation = async () => {
        if (!observationToDelete) return;

        try {
            await projectsAPI.deleteObservation(projectId, observationToDelete);
            // Remove from local state
            setObservations(prev => prev.filter(obs => obs.id !== observationToDelete));
            onDeleteModalOpenChange(); // Close modal
            setObservationToDelete(null);
        } catch (error) {
            console.error('Error deleting observation:', error);
            // Keep modal open to show error - could add error state here if needed
        }
    };

    // Simulate designer typing and sending a message
    const simulateDesignerMessage = (designer, message, delay = 2000) => {
        setIsTyping(true);
        setTypingUser(designer);

        setTimeout(() => {
            const newObservation = {
                id: `mock-${Date.now()}`,
                content: message,
                author: {
                    name: designer.name,
                    avatar: designer.image,
                    role: 'Designer'
                },
                createdAt: new Date().toISOString(),
                attachments: [],
                linkedInstruction: null,
                linkedResultImage: null
            };

            setObservations(prev => [...prev, newObservation]);
            setIsTyping(false);
            setTypingUser(null);
        }, delay);
    };


    // Simulate designer messages when component mounts and there are no designer messages yet (for demo)
    useEffect(() => {
        // Check if there are any messages from designers already
        const hasDesignerMessages = observations.some(obs =>
            designers.some(d => d.name === obs.author?.name)
        );

        // Only simulate if we have designers and no designer messages yet
        // This creates a welcoming conversation when the chat is first opened
        if (designers.length > 0 && !hasDesignerMessages) {
            let timeoutIds = [];

            // First designer message after 3 seconds
            const timeout1 = setTimeout(() => {
                simulateDesignerMessage(
                    designers[0],
                    "Hi! I've reviewed the project requirements. The logo design looks great! I have a few suggestions for the color palette.",
                    3000
                );
            }, 3000);
            timeoutIds.push(timeout1);

            // Second designer message after 8 seconds
            if (designers.length > 1) {
                const timeout2 = setTimeout(() => {
                    simulateDesignerMessage(
                        designers[1],
                        "I agree! Also, I think we should consider adding a subtle gradient to make it more modern. What do you think?",
                        2500
                    );
                }, 11000);
                timeoutIds.push(timeout2);
            }

            // Cleanup function to clear timeouts if component unmounts
            return () => {
                timeoutIds.forEach(id => clearTimeout(id));
            };
        }
    }, [designers, observations]); // Depend on designers and observations


    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // In a real app, you'd upload this to a server and get a URL
            // For now, we'll just create a local object URL
            const fileUrl = URL.createObjectURL(file);
            setAttachments([...attachments, { name: file.name, type: file.type, url: fileUrl }]);
        }
    };

    const removeAttachment = (index) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const handleAttachmentClick = (attachment) => {
        setSelectedAttachment(attachment);
        onAttachmentModalOpen();
    };

    // Translation handlers
    const handleTranslateMessage = async (messageId, targetLang) => {
        const observation = observations.find(obs => obs.id === messageId);
        if (!observation || !observation.content) return;

        // Check if translation already exists in cache
        if (translations[messageId]?.[targetLang]) {
            setActiveTranslations(prev => ({ ...prev, [messageId]: targetLang }));
            return;
        }

        // Start translating
        setTranslatingMessages(prev => ({ ...prev, [messageId]: true }));

        try {
            const result = await translateText(observation.content, targetLang);

            // Cache the translation
            setTranslations(prev => ({
                ...prev,
                [messageId]: {
                    ...prev[messageId],
                    [targetLang]: result.translatedText
                }
            }));

            // Set as active translation
            setActiveTranslations(prev => ({ ...prev, [messageId]: targetLang }));
        } catch (error) {
            console.error('Translation error:', error);
            // Don't alert for auto-translation or if it's likely a same-language issue
            if (!globalTranslationLang && !error.message?.includes('same language')) {
                // Only alert if it's a manual action and a real error
                // alert('Failed to translate message. Please try again.'); 
                // Silently fail for now to avoid disrupting the user experience
            }
        } finally {
            setTranslatingMessages(prev => ({ ...prev, [messageId]: false }));
        }
    };

    const handleShowOriginal = (messageId) => {
        setActiveTranslations(prev => ({ ...prev, [messageId]: null }));
    };

    const handleGlobalTranslate = async (targetLang) => {
        setGlobalTranslationLang(targetLang);

        if (!targetLang) {
            // Reset all active translations
            setActiveTranslations({});
            return;
        }

        // Translate all messages that aren't already translated to the target lang
        const messagesToTranslate = observations.filter(obs =>
            obs.content &&
            (!translations[obs.id]?.[targetLang])
        );

        // Set active translation ONLY for messages that are already cached
        const newActiveTranslations = {};
        observations.forEach(obs => {
            if (obs.content && translations[obs.id]?.[targetLang]) {
                newActiveTranslations[obs.id] = targetLang;
            }
        });
        setActiveTranslations(prev => ({ ...prev, ...newActiveTranslations }));

        // Process translations in batches to avoid overwhelming the API
        for (const obs of messagesToTranslate) {
            await handleTranslateMessage(obs.id, targetLang);
        }
    };

    // Effect to auto-translate new messages when global translation is active
    useEffect(() => {
        if (globalTranslationLang && observations.length > 0) {
            observations.forEach(obs => {
                if (obs.content && activeTranslations[obs.id] !== globalTranslationLang) {
                    handleTranslateMessage(obs.id, globalTranslationLang);
                }
            });
        }
    }, [observations.length, globalTranslationLang]);

    // Handle Auto-Translate Toggle
    const handleAutoTranslateToggle = (isSelected) => {
        setIsAutoTranslate(isSelected);
        if (isSelected) {
            const currentLang = i18n.language?.split('-')[0] || 'en';
            // Ensure it's a supported language
            const supportedLang = Object.values(LANGUAGES || {}).find(l => l.code === currentLang)?.code || 'en';
            handleGlobalTranslate(supportedLang);
        } else {
            handleGlobalTranslate(null);
        }
    };

    // Update translation if page language changes while auto-translate is on
    useEffect(() => {
        if (isAutoTranslate) {
            const currentLang = i18n.language?.split('-')[0] || 'en';
            const supportedLang = Object.values(LANGUAGES || {}).find(l => l.code === currentLang)?.code || 'en';
            if (globalTranslationLang !== supportedLang) {
                handleGlobalTranslate(supportedLang);
            }
        }
    }, [i18n.language, isAutoTranslate]);

    // Annotation handlers
    const handleSaveAnnotation = (blob, dataUrl) => {
        // Create an attachment from the annotated image
        const annotatedAttachment = {
            name: `annotated_${imageToAnnotate.title}.png`,
            type: 'image/png',
            url: dataUrl,
            blob: blob
        };

        // Set the annotated image data
        setAnnotatedImageData({
            originalImage: imageToAnnotate,
            dataUrl: dataUrl,
            blob: blob
        });

        // Set as selected result image
        setSelectedResultImage(imageToAnnotate);

        // Add to attachments
        setAttachments(prev => [...prev, annotatedAttachment]);

        // Close annotation modal
        onAnnotationModalOpenChange();
    };

    const handleCancelAnnotation = () => {
        setImageToAnnotate(null);
        onAnnotationModalOpenChange();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Chat Feed */}
            <div className="lg:col-span-2 flex flex-col h-full">
                <Card className="flex-1 flex flex-col h-full shadow-sm border border-default-200">
                    <CardHeader className="px-6 py-4 border-b border-divider bg-default-50">
                        <div className="flex items-center justify-between gap-3 w-full">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Icon icon="lucide:message-square" width={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-default-900">{t('pages.projectDetails.tabs.observations', 'Project Chat')}</h3>
                                <p className="text-xs text-default-500">Discuss results, give feedback, and collaborate.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-default-700">
                                        {isAutoTranslate ? 'Auto Translate' : 'Original'}
                                    </span>
                                    {isAutoTranslate && globalTranslationLang && (
                                        <span className="text-[10px] text-default-500">
                                            To {getLanguageLabel(globalTranslationLang)}
                                        </span>
                                    )}
                                </div>
                                <Switch
                                    size="sm"
                                    color="secondary"
                                    isSelected={isAutoTranslate}
                                    onValueChange={handleAutoTranslateToggle}
                                    startContent={<Icon icon="lucide:languages" />}
                                />
                            </div>
                        </div>
                    </CardHeader>

                    {/* Messages Area */}
                    <CardBody className="flex-1 overflow-y-auto p-6 space-y-6 bg-default-50/50">
                        {observations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-default-400">
                                <Icon icon="lucide:messages-square" className="text-6xl mb-4 opacity-20" />
                                <p className="text-lg font-medium">No observations yet</p>
                                <p className="text-sm">Start the conversation by adding an observation below.</p>
                            </div>
                        ) : (
                            observations.map((obs) => (
                                <div key={obs.id} className={`flex gap-4 group ${obs.author.name === user?.name ? 'flex-row-reverse' : ''}`}>
                                    <Avatar
                                        src={obs.author.avatar}
                                        name={obs.author.name}
                                        className="flex-shrink-0"
                                        size="sm"
                                    />
                                    <div className={`flex flex-col max-w-[80%] ${obs.author.name === user?.name ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-foreground">{obs.author.name}</span>
                                            <span className="text-[10px] text-default-400">{formatDistanceToNow(new Date(obs.createdAt), { addSuffix: true })}</span>
                                            {/* Modification Request Badge */}
                                            {obs.linkedResultImage && (
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="warning"
                                                    startContent={<Icon icon="lucide:edit" width={12} />}
                                                    className="h-5 text-[10px]"
                                                >
                                                    Modification Request
                                                </Chip>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <div className={`flex-1 p-4 pb-8 rounded-2xl shadow-sm relative ${obs.author.name === user?.name
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-content2 text-foreground border border-divider rounded-tl-none'
                                                }`}>
                                                {/* Context: Linked Instruction */}
                                                {obs.linkedInstruction && (
                                                    <div
                                                        className={`mb-3 p-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${obs.author.name === user?.name ? 'bg-white/20' : 'bg-content3'}`}
                                                        onClick={() => setViewingInstruction(obs.linkedInstruction)}
                                                    >
                                                        <Icon icon="lucide:link" />
                                                        <span className="font-medium truncate max-w-[200px]">Re: {obs.linkedInstruction.logoName || 'Instruction'}</span>
                                                    </div>
                                                )}

                                                {/* Context: Linked Result Image */}
                                                {obs.linkedResultImage && (
                                                    <div className="mb-3 rounded-lg overflow-hidden border border-divider">
                                                        <img
                                                            src={obs.linkedResultImage.src}
                                                            alt="Reference"
                                                            className="w-full h-32 object-cover"
                                                        />
                                                        <div className={`p-1 text-[10px] truncate px-2 ${obs.author.name === user?.name ? 'bg-white/20' : 'bg-content3'
                                                            }`}>
                                                            Ref: {obs.linkedResultImage.title}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Message Content */}
                                                {obs.content && (
                                                    <>
                                                        {/* Translation Badge */}
                                                        {activeTranslations[obs.id] && (
                                                            <div className="absolute bottom-2 right-2">
                                                                <Tooltip content="Translated using the latest advanced artificial intelligence model" className="text-xs">
                                                                    <Chip
                                                                        size="sm"
                                                                        variant="solid"
                                                                        color="secondary"
                                                                        startContent={<Icon icon="lucide:sparkles" width={10} />}
                                                                        className="h-5 text-[10px] px-1 cursor-help opacity-90 hover:opacity-100"
                                                                    >
                                                                        AI Translated
                                                                    </Chip>
                                                                </Tooltip>
                                                            </div>
                                                        )}

                                                        {/* Message Text */}
                                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                            {activeTranslations[obs.id]
                                                                ? translations[obs.id]?.[activeTranslations[obs.id]] || obs.content
                                                                : obs.content
                                                            }
                                                        </p>
                                                    </>
                                                )}

                                                {/* Attachments */}
                                                {obs.attachments && obs.attachments.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {obs.attachments.map((att, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`rounded-lg cursor-pointer hover:opacity-80 transition-opacity overflow-hidden ${obs.author.name === user?.name ? 'bg-white/20' : 'bg-content3'}`}
                                                                onClick={() => handleAttachmentClick(att)}
                                                            >
                                                                {att.type.startsWith('image/') ? (
                                                                    <div className="relative group">
                                                                        <img 
                                                                            src={att.url} 
                                                                            alt={att.name}
                                                                            className="h-32 w-auto object-cover rounded-lg"
                                                                        />
                                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1 truncate">
                                                                            {att.name}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 p-2 text-xs">
                                                                        <Icon icon="lucide:file" />
                                                                        <span className="truncate max-w-[100px]">{att.name}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dropdown menu - show for all messages */}
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity ${obs.author.name === user?.name ? 'text-primary-foreground' : 'text-default-500'}`}
                                                    >
                                                        <Icon icon="lucide:more-vertical" width={16} />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu aria-label="Message actions">
                                                    {/* Translation Options - only show if auto-translate is off */}
                                                    {!isAutoTranslate && obs.content && (
                                                        <>
                                                            {activeTranslations[obs.id] ? (
                                                                <DropdownItem
                                                                    key="show-original"
                                                                    startContent={<Icon icon="lucide:undo" width={16} />}
                                                                    onPress={() => handleShowOriginal(obs.id)}
                                                                >
                                                                    Show Original
                                                                </DropdownItem>
                                                            ) : (
                                                                <>
                                                                    <DropdownItem
                                                                        key="translate-pt"
                                                                        startContent={<Icon icon="lucide:languages" width={16} />}
                                                                        onPress={() => handleTranslateMessage(obs.id, LANGUAGES?.PT?.code || 'pt')}
                                                                        isDisabled={translatingMessages[obs.id]}
                                                                    >
                                                                        Translate to {LANGUAGES?.PT?.label || 'Português'}
                                                                    </DropdownItem>
                                                                    <DropdownItem
                                                                        key="translate-en"
                                                                        startContent={<Icon icon="lucide:languages" width={16} />}
                                                                        onPress={() => handleTranslateMessage(obs.id, LANGUAGES?.EN?.code || 'en')}
                                                                        isDisabled={translatingMessages[obs.id]}
                                                                    >
                                                                        Translate to {LANGUAGES?.EN?.label || 'English'}
                                                                    </DropdownItem>
                                                                    <DropdownItem
                                                                        key="translate-fr"
                                                                        startContent={<Icon icon="lucide:languages" width={16} />}
                                                                        onPress={() => handleTranslateMessage(obs.id, LANGUAGES?.FR?.code || 'fr')}
                                                                        isDisabled={translatingMessages[obs.id]}
                                                                    >
                                                                        Translate to {LANGUAGES?.FR?.label || 'Français'}
                                                                    </DropdownItem>
                                                                </>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Delete Option - only for user's own messages */}
                                                    {obs.author.name === user?.name && (
                                                        <DropdownItem
                                                            key="delete"
                                                            className="text-danger"
                                                            color="danger"
                                                            startContent={<Icon icon="lucide:trash-2" width={16} />}
                                                            onPress={() => handleDeleteObservation(obs.id)}
                                                        >
                                                            Delete Message
                                                        </DropdownItem>
                                                    )}
                                                </DropdownMenu>
                                            </Dropdown>

                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Typing Indicator */}
                        {isTyping && typingUser && (
                            <div className="flex gap-4 animate-fade-in">
                                <Avatar
                                    src={typingUser.image}
                                    name={typingUser.name}
                                    className="flex-shrink-0"
                                    size="sm"
                                />
                                <div className="flex flex-col max-w-[80%] items-start">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-foreground">{typingUser.name}</span>
                                        <span className="text-[10px] text-default-400">typing...</span>
                                    </div>
                                    <div className="p-4 rounded-2xl shadow-sm bg-content2 border border-divider rounded-tl-none">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </CardBody>

                    {/* Input Area */}
                    <div className="p-4 bg-content1 border-t border-divider">
                        {/* Context Selection Preview */}
                        {(selectedInstruction !== null || selectedResultImage || attachments.length > 0) && (
                            <div className="flex flex-wrap gap-2 mb-3 p-2 bg-content2 rounded-lg border border-divider">
                                {selectedInstruction !== null && (
                                    <Chip
                                        onClose={() => setSelectedInstruction(null)}
                                        variant="flat"
                                        color="secondary"
                                        size="sm"
                                        startContent={<Icon icon="lucide:file-text" />}
                                    >
                                        Instruction: {instructions.find(i => (i.logoNumber || instructions.indexOf(i)) === selectedInstruction)?.logoName}
                                    </Chip>
                                )}
                                {selectedResultImage && (
                                    <Chip
                                        onClose={() => {
                                            setSelectedResultImage(null);
                                            setAnnotatedImageData(null);
                                        }}
                                        variant="flat"
                                        color="warning"
                                        size="sm"
                                        startContent={
                                            annotatedImageData ?
                                                <Icon icon="lucide:pencil" /> :
                                                <Icon icon="lucide:image" />
                                        }
                                    >
                                        {annotatedImageData ? 'Annotated: ' : 'Result: '}{selectedResultImage.title}
                                    </Chip>
                                )}
                                {attachments.map((att, idx) => (
                                    att.type.startsWith('image/') ? (
                                        <div key={idx} className="relative group rounded-lg overflow-hidden border-2 border-default-200">
                                            <img 
                                                src={att.url} 
                                                alt={att.name}
                                                className="h-20 w-auto object-cover"
                                            />
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                radius="full"
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-danger text-white"
                                                onPress={() => removeAttachment(idx)}
                                            >
                                                <Icon icon="lucide:x" className="text-sm" />
                                            </Button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1 truncate">
                                                {att.name}
                                            </div>
                                        </div>
                                    ) : (
                                        <Chip
                                            key={idx}
                                            onClose={() => removeAttachment(idx)}
                                            variant="flat"
                                            color="default"
                                            size="sm"
                                            startContent={<Icon icon="lucide:paperclip" />}
                                        >
                                            {att.name}
                                        </Chip>
                                    )
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            {/* Tools Popover */}
                            <Popover placement="top-start">
                                <PopoverTrigger>
                                    <Button isIconOnly variant="flat" className="text-default-500">
                                        <Icon icon="lucide:plus" className="text-xl" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-2">
                                    <div className="flex flex-col gap-1 min-w-[180px]">
                                        <Button
                                            variant="light"
                                            className="justify-start h-auto py-2"
                                            startContent={<Icon icon="lucide:image" className="text-warning" />}
                                            onPress={onResultModalOpen}
                                        >
                                            <div className="text-left">
                                                <span className="block text-sm font-medium">Link Result Image</span>
                                                <span className="block text-[10px] text-default-400">Reference a generated design</span>
                                            </div>
                                        </Button>
                                        <Button
                                            variant="light"
                                            className="justify-start h-auto py-2"
                                            startContent={<Icon icon="lucide:file-text" className="text-secondary" />}
                                            onPress={onInstructionModalOpen}
                                        >
                                            <div className="text-left">
                                                <span className="block text-sm font-medium">Link Instruction</span>
                                                <span className="block text-[10px] text-default-400">Reference a specific requirement</span>
                                            </div>
                                        </Button>
                                        <Button
                                            variant="light"
                                            className="justify-start h-auto py-2"
                                            startContent={<Icon icon="lucide:paperclip" className="text-primary" />}
                                            onPress={() => fileInputRef.current?.click()}
                                        >
                                            <div className="text-left">
                                                <span className="block text-sm font-medium">Attach File</span>
                                                <span className="block text-[10px] text-default-400">Upload image or document</span>
                                            </div>
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Hidden Triggers for Popovers/Inputs */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                                accept="image/*,.pdf"
                            />

                            {/* Result Image Selector Modal */}
                            <Modal isOpen={isResultModalOpen} onOpenChange={onResultModalOpenChange} size="2xl">
                                <ModalContent>
                                    {(onClose) => (
                                        <>
                                            <ModalHeader className="flex flex-col gap-1">
                                                <span>Select a Result Image</span>
                                                <p className="text-xs text-default-500 font-normal">Choose an image to reference or annotate</p>
                                            </ModalHeader>
                                            <ModalBody>
                                                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                                                    {results.length > 0 ? (
                                                        results.map(img => (
                                                            <div
                                                                key={img.id}
                                                                className="relative aspect-video rounded-lg overflow-hidden border-2 border-default-200 hover:border-primary transition-all group"
                                                            >
                                                                <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        color="primary"
                                                                        variant="solid"
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        startContent={<Icon icon="lucide:pencil" />}
                                                                        onPress={() => {
                                                                            setImageToAnnotate(img);
                                                                            onClose();
                                                                            onAnnotationModalOpen();
                                                                        }}
                                                                    >
                                                                        Annotate
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        color="secondary"
                                                                        variant="solid"
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        startContent={<Icon icon="lucide:check" />}
                                                                        onPress={() => {
                                                                            setSelectedResultImage(img);
                                                                            setAnnotatedImageData(null);
                                                                            onClose();
                                                                        }}
                                                                    >
                                                                        Select
                                                                    </Button>
                                                                </div>
                                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2 truncate">
                                                                    {img.title}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                                                            <Icon icon="lucide:image-off" className="text-6xl text-default-300 mb-4" />
                                                            <p className="text-sm font-medium text-default-600 mb-1">No result images available</p>
                                                            <p className="text-xs text-default-400">Designers haven't generated any results yet.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button color="danger" variant="light" onPress={onClose}>
                                                    Close
                                                </Button>
                                            </ModalFooter>
                                        </>
                                    )}
                                </ModalContent>
                            </Modal>

                            {/* Instruction Selector Modal */}
                            <Modal isOpen={isInstructionModalOpen} onOpenChange={onInstructionModalOpenChange} size="md">
                                <ModalContent>
                                    {(onClose) => (
                                        <>
                                            <ModalHeader className="flex flex-col gap-1">Select an Instruction</ModalHeader>
                                            <ModalBody>
                                                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto p-2">
                                                    {instructions.length > 0 ? (
                                                        instructions.map((inst, idx) => (
                                                            <Button
                                                                key={idx}
                                                                variant="flat"
                                                                className="justify-start h-auto py-3"
                                                                onPress={() => {
                                                                    setSelectedInstruction(inst.logoNumber || idx);
                                                                    onClose();
                                                                }}
                                                            >
                                                                <div className="text-left truncate w-full">
                                                                    <span className="block text-sm font-medium truncate">{inst.logoName || 'Unnamed Logo'}</span>
                                                                    <span className="block text-[10px] text-default-500">#{inst.logoNumber}</span>
                                                                </div>
                                                            </Button>
                                                        ))
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                                            <Icon icon="lucide:inbox" className="text-5xl text-default-300 mb-3" />
                                                            <p className="text-sm font-medium text-default-600 mb-1">No instructions available</p>
                                                            <p className="text-xs text-default-400">This project doesn't have any logo instructions yet.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button color="danger" variant="light" onPress={onClose}>
                                                    Close
                                                </Button>
                                            </ModalFooter>
                                        </>
                                    )}
                                </ModalContent>
                            </Modal>

                            {/* Attachment Preview Modal */}
                            <Modal
                                isOpen={isAttachmentModalOpen}
                                onOpenChange={onAttachmentModalOpenChange}
                                size={selectedAttachment?.type.startsWith('image/') ? '3xl' : 'md'}
                            >
                                <ModalContent>
                                    {(onClose) => (
                                        <>
                                            <ModalHeader className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Icon
                                                        icon={selectedAttachment?.type.startsWith('image/') ? 'lucide:image' : 'lucide:file'}
                                                        className="text-primary"
                                                    />
                                                    <span className="truncate">{selectedAttachment?.name}</span>
                                                </div>
                                            </ModalHeader>
                                            <ModalBody>
                                                {selectedAttachment?.type.startsWith('image/') ? (
                                                    <div className="flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                                                        <img
                                                            src={selectedAttachment.url}
                                                            alt={selectedAttachment.name}
                                                            className="max-w-full max-h-[60vh] object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-4 py-8">
                                                        <Icon icon="lucide:file-text" className="text-6xl text-default-300" />
                                                        <div className="text-center">
                                                            <p className="text-sm text-default-600">File type: {selectedAttachment?.type}</p>
                                                            <p className="text-xs text-default-400 mt-1">Click download to view this file</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button
                                                    color="primary"
                                                    variant="flat"
                                                    startContent={<Icon icon="lucide:download" />}
                                                    as="a"
                                                    href={selectedAttachment?.url}
                                                    download={selectedAttachment?.name}
                                                >
                                                    Download
                                                </Button>
                                                <Button color="danger" variant="light" onPress={onClose}>
                                                    Close
                                                </Button>
                                            </ModalFooter>
                                        </>
                                    )}
                                </ModalContent>
                            </Modal>

                            {/* Delete Confirmation Modal */}
                            <Modal
                                isOpen={isDeleteModalOpen}
                                onOpenChange={onDeleteModalOpenChange}
                                size="sm"
                            >
                                <ModalContent>
                                    {(onClose) => (
                                        <>
                                            <ModalHeader className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Icon
                                                        icon="lucide:alert-triangle"
                                                        className="text-danger"
                                                        width={24}
                                                    />
                                                    <span>Delete Message</span>
                                                </div>
                                            </ModalHeader>
                                            <ModalBody>
                                                <p className="text-sm text-default-600">
                                                    Are you sure you want to delete this observation? This action cannot be undone.
                                                </p>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button
                                                    color="default"
                                                    variant="light"
                                                    onPress={onClose}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    color="danger"
                                                    onPress={() => {
                                                        confirmDeleteObservation();
                                                        onClose();
                                                    }}
                                                    startContent={<Icon icon="lucide:trash-2" />}
                                                >
                                                    Delete
                                                </Button>
                                            </ModalFooter>
                                        </>
                                    )}
                                </ModalContent>
                            </Modal>

                            <Textarea
                                placeholder="Type your observation..."
                                minRows={1}
                                maxRows={4}
                                value={newMessage}
                                onValueChange={setNewMessage}
                                className="flex-1"
                                classNames={{
                                    input: "py-2"
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />

                            <Button
                                isIconOnly
                                color="primary"
                                className="self-end"
                                onPress={handleSendMessage}
                                isLoading={isSubmitting}
                            >
                                <Icon icon="lucide:send" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right Sidebar - Context Info */}
            <div className="lg:col-span-1 hidden lg:flex flex-col gap-6">
                <Card className="shadow-sm border border-default-200">
                    <CardHeader className="px-6 py-4 border-b border-divider">
                        <h3 className="text-base font-semibold">Active Participants</h3>
                    </CardHeader>
                    <CardBody className="p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Avatar src={user?.avatar} name={user?.name} size="sm" />
                                <div>
                                    <p className="text-sm font-medium">{user?.name} (You)</p>
                                    <p className="text-xs text-default-500">Project Creator</p>
                                </div>
                            </div>

                            {/* Assigned Designers */}
                            {designers.length > 0 ? (
                                designers.map((designer, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <Avatar
                                            src={designer.image}
                                            name={designer.name}
                                            className="bg-secondary text-secondary-foreground"
                                            size="sm"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">{designer.name}</p>
                                            <p className="text-xs text-default-500">{t('pages.projectDetails.designer', 'Designer')}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-default-400 italic px-2">
                                    {t('pages.projectDetails.noDesignersAssigned', 'No designers assigned')}
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                <Card className="shadow-sm border border-default-200 flex-1">
                    <CardHeader className="px-6 py-4 border-b border-divider">
                        <h3 className="text-base font-semibold">Quick Actions</h3>
                    </CardHeader>
                    <CardBody className="p-4 space-y-3">
                        <Tooltip
                            content={results.length === 0 ? "No result images available yet" : "Reference a generated design"}
                            placement="left"
                        >
                            <Button
                                variant="flat"
                                className="w-full justify-start"
                                startContent={<Icon icon="lucide:image" className="text-warning" />}
                                onPress={onResultModalOpen}
                                isDisabled={results.length === 0}
                            >
                                Reference Result Image
                            </Button>
                        </Tooltip>
                        <Tooltip
                            content={instructions.length === 0 ? "No instructions available in this project" : "Reference a specific instruction"}
                            placement="left"
                        >
                            <Button
                                variant="flat"
                                className="w-full justify-start"
                                startContent={<Icon icon="lucide:file-text" className="text-secondary" />}
                                onPress={onInstructionModalOpen}
                                isDisabled={instructions.length === 0}
                            >
                                Reference Instruction
                            </Button>
                        </Tooltip>
                    </CardBody>
                </Card>
            </div >

            {/* Instruction Details Modal */}
            <Modal
                isOpen={!!viewingInstruction}
                onOpenChange={(open) => !open && setViewingInstruction(null)}
                size="4xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    {(onClose) => {
                        // Helper to check if section has data
                        const logo = viewingInstruction || {};
                        const hasDimensions = logo.dimensions?.height?.value || logo.dimensions?.length?.value || logo.dimensions?.width?.value || logo.dimensions?.diameter?.value;
                        const hasSpecs = logo.fixationType || logo.mastDiameter || logo.lacqueredStructure || logo.maxWeightConstraint || logo.ballast || logo.controlReport || logo.usageOutdoor !== undefined;
                        const hasComposition = (logo.composition?.componentes?.filter(c => c.referencia).length > 0) || (logo.composition?.bolas?.length > 0);

                        return (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    Instruction Details
                                    <span className="text-sm font-normal text-default-500">
                                        {logo.logoName || 'Unnamed Instruction'}
                                    </span>
                                </ModalHeader>
                                <ModalBody className="p-6">
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
                                                            src={logo.generatedImage}
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
                                                                                        {bola.tamanhoNome && <span className="flex items-center gap-1"><Icon icon="lucide:ruler" width={10} />{bola.tamanhoNome}</span>}
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

                                                {/* Details & Description */}
                                                {logo.description && (
                                                    <Card className="shadow-sm border border-default-200 h-fit">
                                                        <CardHeader className="pb-0 pt-4 px-4 flex gap-3">
                                                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                                                                <Icon icon="lucide:file-text" width={20} />
                                                            </div>
                                                            <h4 className="text-medium font-bold text-default-700 uppercase tracking-wider">
                                                                {t('pages.projectDetails.details', 'Details')}
                                                            </h4>
                                                        </CardHeader>
                                                        <CardBody>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <span className="text-xs text-default-500 block mb-2 font-bold uppercase tracking-wider">{t('pages.projectDetails.description')}</span>
                                                                    <div className="bg-default-50 p-4 rounded-lg text-sm text-default-700 leading-relaxed whitespace-pre-wrap border border-default-200">
                                                                        {logo.description}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onPress={onClose}>
                                        Close
                                    </Button>
                                </ModalFooter>
                            </>
                        );
                    }}
                </ModalContent>
            </Modal>

            {/* Image Annotation Editor Modal */}
            <ImageAnnotationEditor
                image={imageToAnnotate}
                isOpen={isAnnotationModalOpen}
                onSave={handleSaveAnnotation}
                onCancel={handleCancelAnnotation}
            />
        </div >
    );
}
