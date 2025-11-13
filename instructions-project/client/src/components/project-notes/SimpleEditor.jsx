import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useCallback, useEffect, useMemo } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export function SimpleEditor({ documentName, hocuspocusUrl }) {
  // Criar provider Hocuspocus para sincronização colaborativa
  const provider = useMemo(() => {
    return new HocuspocusProvider({
      url: hocuspocusUrl || 'ws://localhost:1234',
      name: documentName,
      onConnect: () => {
        console.log('✅ [Editor] Conectado ao Hocuspocus');
      },
      onDisconnect: () => {
        console.log('❌ [Editor] Desconectado do Hocuspocus');
      },
    });
  }, [documentName, hocuspocusUrl]);

  // Configurar editor Tiptap com colaboração
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Desabilitar heading se quiser usar apenas texto simples
        // heading: false,
      }),
      Collaboration.configure({
        document: provider.document,
      }),
      CollaborationCursor.configure({
        provider,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever as suas notas...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  }, [provider]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (provider) {
        provider.destroy();
      }
    };
  }, [provider]);

  // Funções de formatação
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  // Underline não está disponível no StarterKit por padrão
  // Removido por enquanto

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const setHeading = useCallback((level) => {
    if (level === 0) {
      editor?.chain().focus().setParagraph().run();
    } else {
      editor?.chain().focus().toggleHeading({ level }).run();
    }
  }, [editor]);

  const setTextAlign = useCallback((align) => {
    editor?.chain().focus().setTextAlign(align).run();
  }, [editor]);

  const toggleLink = useCallback(() => {
    const url = window.prompt('URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    } else {
      editor?.chain().focus().unsetLink().run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL da imagem:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  if (!editor) {
    return <div className="p-4">A carregar editor...</div>;
  }

  return (
    <div className="w-full border border-divider rounded-lg bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-divider bg-content1">
        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={undo}
            isDisabled={!editor.can().undo()}
            aria-label="Desfazer"
          >
            <Icon icon="lucide:undo" className="text-lg" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={redo}
            isDisabled={!editor.can().redo()}
            aria-label="Refazer"
          >
            <Icon icon="lucide:redo" className="text-lg" />
          </Button>
        </div>

        <div className="w-px h-6 bg-divider" />

        {/* Headings */}
        <select
          onChange={(e) => setHeading(parseInt(e.target.value))}
          className="px-2 py-1 text-sm border border-divider rounded bg-background"
          value={
            editor.isActive('heading', { level: 1 }) ? 1 :
            editor.isActive('heading', { level: 2 }) ? 2 :
            editor.isActive('heading', { level: 3 }) ? 3 : 0
          }
        >
          <option value={0}>Parágrafo</option>
          <option value={1}>Título 1</option>
          <option value={2}>Título 2</option>
          <option value={3}>Título 3</option>
        </select>

        <div className="w-px h-6 bg-divider" />

        {/* Text formatting */}
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('bold') ? 'solid' : 'light'}
          color={editor.isActive('bold') ? 'primary' : 'default'}
          onPress={toggleBold}
          aria-label="Negrito"
        >
          <Icon icon="lucide:bold" className="text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('italic') ? 'solid' : 'light'}
          color={editor.isActive('italic') ? 'primary' : 'default'}
          onPress={toggleItalic}
          aria-label="Itálico"
        >
          <Icon icon="lucide:italic" className="text-lg" />
        </Button>
        <div className="w-px h-6 bg-divider" />

        {/* Lists */}
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('bulletList') ? 'solid' : 'light'}
          color={editor.isActive('bulletList') ? 'primary' : 'default'}
          onPress={toggleBulletList}
          aria-label="Lista com marcadores"
        >
          <Icon icon="lucide:list" className="text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('orderedList') ? 'solid' : 'light'}
          color={editor.isActive('orderedList') ? 'primary' : 'default'}
          onPress={toggleOrderedList}
          aria-label="Lista numerada"
        >
          <Icon icon="lucide:list-ordered" className="text-lg" />
        </Button>

        <div className="w-px h-6 bg-divider" />

        {/* Alignment */}
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive({ textAlign: 'left' }) ? 'solid' : 'light'}
          color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
          onPress={() => setTextAlign('left')}
          aria-label="Alinhar à esquerda"
        >
          <Icon icon="lucide:align-left" className="text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive({ textAlign: 'center' }) ? 'solid' : 'light'}
          color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
          onPress={() => setTextAlign('center')}
          aria-label="Alinhar ao centro"
        >
          <Icon icon="lucide:align-center" className="text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive({ textAlign: 'right' }) ? 'solid' : 'light'}
          color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
          onPress={() => setTextAlign('right')}
          aria-label="Alinhar à direita"
        >
          <Icon icon="lucide:align-right" className="text-lg" />
        </Button>

        <div className="w-px h-6 bg-divider" />

        {/* Link & Image */}
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('link') ? 'solid' : 'light'}
          color={editor.isActive('link') ? 'primary' : 'default'}
          onPress={toggleLink}
          aria-label="Adicionar link"
        >
          <Icon icon="lucide:link" className="text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={addImage}
          aria-label="Adicionar imagem"
        >
          <Icon icon="lucide:image" className="text-lg" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  );
}

