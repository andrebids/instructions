import React, { useState, useEffect, useRef } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Chip, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions/placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function NoteEditor({ note, onSave, onDelete }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState(note.title || '');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const initialContentRef = useRef(note.content || '');
    const isResettingRef = useRef(false); // Marca quando estamos resetando a nota para evitar race condition
    const previousNoteIdRef = useRef(note.id); // Rastreia o ID anterior da nota para detectar mudanças
    const previousNoteTitleRef = useRef(note.title || ''); // Rastreia o título anterior da nota para detectar mudanças
    const previousNoteContentRef = useRef(note.content || ''); // Rastreia o conteúdo anterior da nota para detectar mudanças
    const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();

    const editor = useEditor({
        content: note.content || '',
        extensions: [
            StarterKit.configure({
                // Link, ListKeymap, and Underline are now included by default
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

    // Reset when note changes (quando ID muda OU quando título muda com mesmo ID OU quando conteúdo muda)
    useEffect(() => {
        // Verificar se a nota realmente mudou (ID, título ou conteúdo)
        const noteIdChanged = previousNoteIdRef.current !== note.id;
        const noteTitleChanged = previousNoteTitleRef.current !== (note.title || '');
        const noteContentChanged = previousNoteContentRef.current !== (note.content || '');
        
        // Se nada mudou, não fazer nada
        if (!noteIdChanged && !noteTitleChanged && !noteContentChanged) {
            return;
        }
        
        // Atualizar refs sincronamente para evitar race conditions
        previousNoteIdRef.current = note.id;
        previousNoteTitleRef.current = note.title || '';
        previousNoteContentRef.current = note.content || '';
        
        // Marcar que estamos resetando para evitar race condition com o effect de tracking
        isResettingRef.current = true;
        
        // Usar setTimeout para evitar setState síncrono em effect
        const timeoutId = setTimeout(() => {
            setTitle(note.title || '');
            // Atualizar conteúdo se o ID mudou (nova nota) OU se o conteúdo mudou externamente
            // Não atualizar se apenas o título mudou (para evitar perder edições do usuário)
            if (noteIdChanged || noteContentChanged) {
                editor?.commands.setContent(note.content || '');
                initialContentRef.current = note.content || '';
            }
            setHasUnsavedChanges(false);
            setSaveSuccess(false);
            // Resetar a flag após a atualização ser concluída
            isResettingRef.current = false;
        }, 0);
        return () => {
            clearTimeout(timeoutId);
            // Se o effect for limpo antes do timeout executar, resetar a flag
            isResettingRef.current = false;
        };
    }, [note.id, note.title, note.content, editor]); // Incluir note.title e note.content para detectar mudanças

    // Track title changes (detecta quando o usuário edita o título manualmente)
    useEffect(() => {
        // Ignorar mudanças se a nota mudou (reset) ou se estamos no meio de um reset
        const noteIdChanged = previousNoteIdRef.current !== note.id;
        if (noteIdChanged || isResettingRef.current) {
            return;
        }
        
        // Verificar se o título do state difere do título da nota
        // Isso indica que o usuário editou o título manualmente
        let timeoutId = null;
        if (title !== (note.title || '')) {
            // Usar setTimeout para evitar setState síncrono em effect
            timeoutId = setTimeout(() => {
                // Verificar novamente se ainda não estamos resetando e a nota não mudou
                if (!isResettingRef.current && previousNoteIdRef.current === note.id) {
                    setHasUnsavedChanges(true);
                    setSaveSuccess(false);
                }
            }, 0);
        }
        // Sempre retornar cleanup, mesmo quando timeoutId é null
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [title, note.id, note.title]); // Incluir note.title para detectar quando a nota externa muda

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
                            aria-label="Bold"
                        >
                            <Icon icon="lucide:bold" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('italic') ? 'solid' : 'light'}
                            color={editor.isActive('italic') ? 'primary' : 'default'}
                            onPress={toggleItalic}
                            aria-label="Italic"
                        >
                            <Icon icon="lucide:italic" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('underline') ? 'solid' : 'light'}
                            color={editor.isActive('underline') ? 'primary' : 'default'}
                            onPress={toggleUnderline}
                            aria-label="Underline"
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
                            aria-label="Bullet list"
                        >
                            <Icon icon="lucide:list" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('orderedList') ? 'solid' : 'light'}
                            color={editor.isActive('orderedList') ? 'primary' : 'default'}
                            onPress={toggleOrderedList}
                            aria-label="Ordered list"
                        >
                            <Icon icon="lucide:list-ordered" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant={editor.isActive('taskList') ? 'solid' : 'light'}
                            color={editor.isActive('taskList') ? 'primary' : 'default'}
                            onPress={toggleTaskList}
                            aria-label="Task list"
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
