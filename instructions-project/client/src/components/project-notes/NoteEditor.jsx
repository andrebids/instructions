import React, { useState, useEffect, useRef } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Chip, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function NoteEditor({ note, onSave, onDelete }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState(note.title || '');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const initialContentRef = useRef(note.content || '');
    const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();

    const editor = useEditor({
        content: note.content || '',
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg my-4',
                },
                inline: false,
                allowBase64: true,
            }),
            Placeholder.configure({
                placeholder: 'Start writing your note...',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Color,
            TextStyle,
            Highlight.configure({
                multicolor: true,
            }),
            Underline,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg mx-auto focus:outline-none min-h-[400px] p-4 max-w-full',
            },
        },
        onUpdate: () => {
            setHasUnsavedChanges(true);
            setSaveSuccess(false);
        },
    });

    // Reset when note changes
    useEffect(() => {
        setTitle(note.title || '');
        editor?.commands.setContent(note.content || '');
        initialContentRef.current = note.content || '';
        setHasUnsavedChanges(false);
        setSaveSuccess(false);
    }, [note.id, editor]);

    // Track title changes
    useEffect(() => {
        if (title !== note.title) {
            setHasUnsavedChanges(true);
            setSaveSuccess(false);
        }
    }, [title, note.title]);

    const handleSave = async () => {
        setIsSaving(true);
        const content = editor?.getHTML() || '';

        const success = await onSave({
            title,
            content,
        });

        setIsSaving(false);
        if (success) {
            setHasUnsavedChanges(false);
            setSaveSuccess(true);
            initialContentRef.current = content;

            // Hide success message after 2 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 2000);
        }
    };

    // Formatting functions
    const toggleBold = () => editor?.chain().focus().toggleBold().run();
    const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
    const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
    const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
    const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
    const toggleTaskList = () => editor?.chain().focus().toggleTaskList().run();
    const setHeading = (level) => {
        if (level === 0) {
            editor?.chain().focus().setParagraph().run();
        } else {
            editor?.chain().focus().toggleHeading({ level }).run();
        }
    };

    if (!editor) return null;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="px-6 py-4 border-b border-divider flex-shrink-0">
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Icon icon="lucide:folder" className="text-primary text-xl flex-shrink-0" />
                        <span className="text-sm text-default-500 flex-shrink-0">{note.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && !saveSuccess && (
                            <Chip size="sm" variant="flat" color="warning" startContent={<Icon icon="lucide:alert-circle" />}>
                                {t('pages.projectDetails.notesManager.unsavedChanges')}
                            </Chip>
                        )}
                        {saveSuccess && (
                            <Chip size="sm" variant="flat" color="success" startContent={<Icon icon="lucide:check" />}>
                                {t('pages.projectDetails.notesManager.saved')}
                            </Chip>
                        )}
                        <Button
                            color="danger"
                            variant="flat"
                            startContent={<Icon icon="lucide:trash-2" />}
                            onPress={onDeleteDialogOpen}
                        >
                            {t('pages.projectDetails.notesManager.deleteNote')}
                        </Button>
                        <Button
                            color="primary"
                            startContent={<Icon icon="lucide:save" />}
                            onPress={handleSave}
                            isLoading={isSaving}
                            isDisabled={!hasUnsavedChanges}
                        >
                            {isSaving ? t('pages.projectDetails.notesManager.saving') : t('pages.projectDetails.notesManager.saveNote')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="p-6 flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Title Input */}
                    <Input
                        label={t('pages.projectDetails.notesManager.noteTitle')}
                        placeholder={t('pages.projectDetails.notesManager.noteTitlePlaceholder')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mb-6"
                        size="lg"
                        variant="bordered"
                    />

                    {/* Editor Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-2 sm:p-3 border border-divider rounded-lg bg-content1 mb-4">
                        {/* Headings */}
                        <select
                            onChange={(e) => setHeading(parseInt(e.target.value))}
                            className="px-2 py-1 text-xs sm:text-sm border border-divider rounded bg-background"
                            value={
                                editor.isActive('heading', { level: 1 }) ? 1 :
                                    editor.isActive('heading', { level: 2 }) ? 2 :
                                        editor.isActive('heading', { level: 3 }) ? 3 : 0
                            }
                        >
                            <option value={0}>Paragraph</option>
                            <option value={1}>Heading 1</option>
                            <option value={2}>Heading 2</option>
                            <option value={3}>Heading 3</option>
                        </select>

                        <div className="w-px h-6 bg-divider" />

                        {/* Text formatting */}
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('bold') ? 'solid' : 'light'}
                            color={editor.isActive('bold') ? 'primary' : 'default'}
                            onPress={toggleBold}
                        >
                            <Icon icon="lucide:bold" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('italic') ? 'solid' : 'light'}
                            color={editor.isActive('italic') ? 'primary' : 'default'}
                            onPress={toggleItalic}
                        >
                            <Icon icon="lucide:italic" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('underline') ? 'solid' : 'light'}
                            color={editor.isActive('underline') ? 'primary' : 'default'}
                            onPress={toggleUnderline}
                        >
                            <Icon icon="lucide:underline" />
                        </Button>

                        <div className="w-px h-6 bg-divider" />

                        {/* Lists */}
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('bulletList') ? 'solid' : 'light'}
                            color={editor.isActive('bulletList') ? 'primary' : 'default'}
                            onPress={toggleBulletList}
                        >
                            <Icon icon="lucide:list" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('orderedList') ? 'solid' : 'light'}
                            color={editor.isActive('orderedList') ? 'primary' : 'default'}
                            onPress={toggleOrderedList}
                        >
                            <Icon icon="lucide:list-ordered" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('taskList') ? 'solid' : 'light'}
                            color={editor.isActive('taskList') ? 'primary' : 'default'}
                            onPress={toggleTaskList}
                        >
                            <Icon icon="lucide:check-square" />
                        </Button>
                    </div>

                    {/* Editor Content */}
                    <div className="border border-divider rounded-lg bg-background">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </CardBody>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={onDeleteDialogClose}
                onConfirm={() => onDelete?.()}
                title={t('pages.projectDetails.notesManager.deleteNote')}
                message={t('pages.projectDetails.notesManager.confirmDelete')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                confirmColor="danger"
                icon="lucide:trash-2"
            />
        </Card>
    );
}
