import React, { useState, useRef, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Avatar, Chip, Tooltip, Popover, PopoverTrigger, PopoverContent, Select, SelectItem, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { formatDistanceToNow } from 'date-fns';

import { projectsAPI } from '../../services/api';

export function ProjectObservations({ projectId, instructions = [], results = [], designers = [] }) {
    const { t } = useTranslation();
    const { user } = useUser();
    const [observations, setObservations] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedInstruction, setSelectedInstruction] = useState(null);
    const [selectedResultImage, setSelectedResultImage] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { isOpen: isResultModalOpen, onOpen: onResultModalOpen, onOpenChange: onResultModalOpenChange } = useDisclosure();
    const { isOpen: isInstructionModalOpen, onOpen: onInstructionModalOpen, onOpenChange: onInstructionModalOpenChange } = useDisclosure();

    // Fetch observations on mount
    useEffect(() => {
        const fetchObservations = async () => {
            try {
                const data = await projectsAPI.getObservations(projectId);
                setObservations(data);
            } catch (error) {
                console.error('Error fetching observations:', error);
            }
        };

        if (projectId) {
            fetchObservations();
        }
    }, [projectId]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [observations]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && attachments.length === 0 && !selectedResultImage) return;

        setIsSubmitting(true);

        try {
            const observationData = {
                content: newMessage,
                attachments: attachments,
                linkedInstructionId: selectedInstruction,
                linkedResultImageId: selectedResultImage?.id,
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
                linkedInstruction: selectedInstruction ? instructions.find(i => i.id === selectedInstruction) : null,
                linkedResultImage: selectedResultImage
            };

            setObservations(prev => [...prev, displayObservation]);
            setNewMessage('');
            setSelectedInstruction(null);
            setSelectedResultImage(null);
            setAttachments([]);
        } catch (error) {
            console.error('Error sending observation:', error);
            // You might want to show a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Chat Feed */}
            <div className="lg:col-span-2 flex flex-col h-full">
                <Card className="flex-1 flex flex-col h-full shadow-sm border border-default-200">
                    <CardHeader className="px-6 py-4 border-b border-divider bg-default-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Icon icon="lucide:message-square" width={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-default-900">Project Observations</h3>
                                <p className="text-xs text-default-500">Discuss results, give feedback, and collaborate.</p>
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
                                <div key={obs.id} className={`flex gap-4 ${obs.author.name === user?.name ? 'flex-row-reverse' : ''}`}>
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
                                        </div>

                                        <div className={`p-4 rounded-2xl shadow-sm ${obs.author.name === user?.name
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-content2 text-foreground border border-divider rounded-tl-none'
                                            }`}>
                                            {/* Context: Linked Instruction */}
                                            {obs.linkedInstruction && (
                                                <div className={`mb-3 p-2 rounded-lg text-xs flex items-center gap-2 ${obs.author.name === user?.name ? 'bg-white/20' : 'bg-content3'
                                                    }`}>
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
                                            {obs.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{obs.content}</p>}

                                            {/* Attachments */}
                                            {obs.attachments && obs.attachments.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {obs.attachments.map((att, idx) => (
                                                        <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${obs.author.name === user?.name ? 'bg-white/20' : 'bg-content3'
                                                            }`}>
                                                            {att.type.startsWith('image/') ? (
                                                                <Icon icon="lucide:image" />
                                                            ) : (
                                                                <Icon icon="lucide:file" />
                                                            )}
                                                            <span className="truncate max-w-[100px]">{att.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </CardBody>

                    {/* Input Area */}
                    <div className="p-4 bg-content1 border-t border-divider">
                        {/* Context Selection Preview */}
                        {(selectedInstruction || selectedResultImage || attachments.length > 0) && (
                            <div className="flex flex-wrap gap-2 mb-3 p-2 bg-content2 rounded-lg border border-divider">
                                {selectedInstruction && (
                                    <Chip
                                        onClose={() => setSelectedInstruction(null)}
                                        variant="flat"
                                        color="secondary"
                                        size="sm"
                                        startContent={<Icon icon="lucide:file-text" />}
                                    >
                                        Instruction: {instructions.find(i => i.id === selectedInstruction)?.logoName}
                                    </Chip>
                                )}
                                {selectedResultImage && (
                                    <Chip
                                        onClose={() => setSelectedResultImage(null)}
                                        variant="flat"
                                        color="warning"
                                        size="sm"
                                        startContent={<Icon icon="lucide:image" />}
                                    >
                                        Result: {selectedResultImage.title}
                                    </Chip>
                                )}
                                {attachments.map((att, idx) => (
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
                                            <ModalHeader className="flex flex-col gap-1">Select a Result Image</ModalHeader>
                                            <ModalBody>
                                                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                                                    {results.map(img => (
                                                        <div
                                                            key={img.id}
                                                            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all group"
                                                            onClick={() => {
                                                                setSelectedResultImage(img);
                                                                onClose();
                                                            }}
                                                        >
                                                            <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {img.title}
                                                            </div>
                                                        </div>
                                                    ))}
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
                                                    {instructions.map(inst => (
                                                        <Button
                                                            key={inst.id}
                                                            variant="flat"
                                                            className="justify-start h-auto py-3"
                                                            onPress={() => {
                                                                setSelectedInstruction(inst.id);
                                                                onClose();
                                                            }}
                                                        >
                                                            <div className="text-left truncate w-full">
                                                                <span className="block text-sm font-medium truncate">{inst.logoName || 'Unnamed Logo'}</span>
                                                                <span className="block text-[10px] text-default-500">#{inst.logoNumber}</span>
                                                            </div>
                                                        </Button>
                                                    ))}
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
                        <Button
                            variant="flat"
                            className="w-full justify-start"
                            startContent={<Icon icon="lucide:image" className="text-warning" />}
                            onPress={onResultModalOpen}
                        >
                            Reference Result Image
                        </Button>
                        <Button
                            variant="flat"
                            className="w-full justify-start"
                            startContent={<Icon icon="lucide:file-text" className="text-secondary" />}
                            onPress={onInstructionModalOpen}
                        >
                            Reference Instruction
                        </Button>
                    </CardBody>
                </Card>
            </div >
        </div >
    );
}
