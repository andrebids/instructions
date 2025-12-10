import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { NoteEditor } from './NoteEditor';
import { projectsAPI } from '../../services/api';

// ID da nota padrão (deve corresponder ao SimpleEditor)
const DEFAULT_NOTE_ID = 'default-note';

export function NotesManager({ projectId }) {
    const { t } = useTranslation();
    const [notes, setNotes] = useState([]);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [newTopicName, setNewTopicName] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [loading, setLoading] = useState(true);

    // Load notes from project
    useEffect(() => {
        loadNotes();
    }, [projectId]);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const project = await projectsAPI.getById(projectId);
            setNotes(project.notes || []);
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTopic = async () => {
        if (!newTopicName.trim()) return;

        const newNote = {
            id: `note-${Date.now()}`,
            topic: newTopicName.trim(),
            title: '',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        setSelectedNoteId(newNote.id);
        setNewTopicName('');
        onClose();

        // Save to backend
        try {
            await projectsAPI.update(projectId, { notes: updatedNotes });
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    const handleDeleteNote = async (noteId) => {
        const updatedNotes = notes.filter(n => n.id !== noteId);
        setNotes(updatedNotes);

        if (selectedNoteId === noteId) {
            setSelectedNoteId(null);
        }

        // Save to backend
        try {
            await projectsAPI.update(projectId, { notes: updatedNotes });
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const handleSaveNote = async (noteId, updatedData) => {
        const updatedNotes = notes.map(note =>
            note.id === noteId
                ? { ...note, ...updatedData, updatedAt: new Date().toISOString() }
                : note
        );
        setNotes(updatedNotes);

        // Save to backend
        try {
            await projectsAPI.update(projectId, { notes: updatedNotes });
            return true;
        } catch (error) {
            console.error('Error saving note:', error);
            return false;
        }
    };

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Icon icon="lucide:loader-2" className="text-4xl animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left sidebar - Topics list */}
            <div className="lg:col-span-1">
                <Card className="h-full">
                    <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-divider">
                        <h3 className="text-lg font-semibold">{t('pages.projectDetails.tabs.notes')}</h3>
                        <Button
                            size="sm"
                            color="primary"
                            startContent={<Icon icon="lucide:plus" />}
                            onPress={onOpen}
                        >
                            {t('pages.projectDetails.notesManager.addTopic')}
                        </Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        {notes.length === 0 ? (
                            <div className="p-6 text-center text-default-500">
                                <Icon icon="lucide:sticky-note" className="text-4xl mx-auto mb-2 opacity-50" />
                                <p className="text-sm">{t('pages.projectDetails.notesManager.noTopics')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-divider">
                                {notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={`p-4 cursor-pointer hover:bg-default-100 transition-colors ${selectedNoteId === note.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                                            }`}
                                        onClick={() => setSelectedNoteId(note.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon icon="lucide:folder" className="text-primary flex-shrink-0" />
                                                    <h4 className="font-semibold text-sm truncate">{note.topic}</h4>
                                                </div>
                                                {note.title && (
                                                    <p className="text-xs text-default-500 truncate">{note.title}</p>
                                                )}
                                                <p className="text-xs text-default-400 mt-1">
                                                    {new Date(note.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Right content - Note editor */}
            <div className="lg:col-span-2">
                {selectedNote ? (
                    <NoteEditor
                        note={selectedNote}
                        onSave={(updatedData) => handleSaveNote(selectedNote.id, updatedData)}
                        onDelete={() => handleDeleteNote(selectedNote.id)}
                    />
                ) : (
                    <Card className="h-full">
                        <CardBody className="flex items-center justify-center">
                            <div className="text-center text-default-500">
                                <Icon icon="lucide:file-text" className="text-6xl mx-auto mb-4 opacity-20" />
                                <p>{notes.length === 0
                                    ? t('pages.projectDetails.notesManager.noTopics')
                                    : 'Select a topic to view or edit notes'
                                }</p>
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* Add Topic Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>{t('pages.projectDetails.notesManager.newTopic')}</ModalHeader>
                    <ModalBody>
                        <Input
                            label={t('pages.projectDetails.notesManager.topicName')}
                            placeholder={t('pages.projectDetails.notesManager.enterTopicName')}
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddTopic();
                                }
                            }}
                            autoFocus
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button color="primary" onPress={handleAddTopic} isDisabled={!newTopicName.trim()}>
                            {t('pages.projectDetails.notesManager.addTopic')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
