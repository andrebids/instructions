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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { editorAPI, projectsAPI } from '../../services/api';

export function SimpleEditor({ projectId = null, saveStatus = null }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const canvasRef = useRef(null);
  const { isOpen: isLinkModalOpen, onOpen: onLinkModalOpen, onClose: onLinkModalClose } = useDisclosure();
  const { isOpen: isImageModalOpen, onOpen: onImageModalOpen, onClose: onImageModalClose } = useDisclosure();
  const [linkUrl, setLinkUrl] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingCanvasRef = useRef(null);
  const drawingContextRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const lastSavedContentRef = useRef('');
  const saveAbortControllerRef = useRef(null);

  // Configure Tiptap editor
  const editor = useEditor({
    content: '',
    extensions: [
      StarterKit.configure({
        // Keep all default features
      }),
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
        placeholder: 'Start writing your notes...',
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
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 max-w-full',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      console.error('Invalid file type');
      return;
    }

    setIsUploading(true);
    try {
      const response = await editorAPI.uploadImage(file);
      if (response.success && response.url) {
        // Use absolute URL if needed
        const imageUrl = response.url.startsWith('http') 
          ? response.url 
          : `${window.location.origin}${response.url}`;
        
        editor?.chain().focus().setImage({ src: imageUrl }).run();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Fallback: use base64
      const reader = new FileReader();
      reader.onload = (e) => {
        editor?.chain().focus().setImage({ src: e.target.result }).run();
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  }, [editor]);

  // Handle file input change
  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  }, [handleImageUpload]);

  // Handle camera capture
  const handleCameraCapture = useCallback(() => {
    cameraInputRef.current?.click();
    onImageModalClose();
  }, [onImageModalClose]);

  // Handle gallery selection
  const handleGallerySelect = useCallback(() => {
    galleryInputRef.current?.click();
    onImageModalClose();
  }, [onImageModalClose]);

  // Formatting functions
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const toggleTaskList = useCallback(() => {
    editor?.chain().focus().toggleTaskList().run();
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

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    onLinkModalOpen();
  }, [editor, onLinkModalOpen]);

  const applyLink = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    onLinkModalClose();
    setLinkUrl('');
  }, [editor, linkUrl, onLinkModalClose]);

  const unsetLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    onLinkModalClose();
    setLinkUrl('');
  }, [editor, onLinkModalClose]);

  const addImage = useCallback(() => {
    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                     (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    
    if (isMobile) {
      // Show modal with options on mobile
      onImageModalOpen();
    } else {
      // Direct file input on desktop
      fileInputRef.current?.click();
    }
  }, [onImageModalOpen]);

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const setColor = useCallback((color) => {
    editor?.chain().focus().setColor(color).run();
  }, [editor]);

  const setHighlight = useCallback((color) => {
    editor?.chain().focus().toggleHighlight({ color }).run();
  }, [editor]);

  // Drawing functionality
  const toggleDrawing = useCallback(() => {
    setDrawingMode(!drawingMode);
  }, [drawingMode]);

  useEffect(() => {
    if (drawingMode && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext('2d');
      drawingContextRef.current = ctx;
      
      // Set canvas size with proper scaling for retina displays
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      // Set drawing style
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }, [drawingMode]);

  const handleDrawingMouseDown = useCallback((e) => {
    if (!drawingMode || !drawingContextRef.current) return;
    setIsDrawing(true);
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    drawingContextRef.current.beginPath();
    drawingContextRef.current.moveTo(x, y);
  }, [drawingMode]);

  const handleDrawingMouseMove = useCallback((e) => {
    if (!isDrawing || !drawingContextRef.current) return;
    e.preventDefault();
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    drawingContextRef.current.lineTo(x, y);
    drawingContextRef.current.stroke();
  }, [isDrawing]);

  const handleDrawingMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const insertDrawing = useCallback(() => {
    if (!drawingCanvasRef.current) return;
    // Create a temporary canvas to export at original size
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    tempCanvas.width = rect.width;
    tempCanvas.height = rect.height;
    tempCtx.drawImage(drawingCanvasRef.current, 0, 0, rect.width, rect.height);
    
    const dataUrl = tempCanvas.toDataURL('image/png');
    editor?.chain().focus().setImage({ src: dataUrl }).run();
    setDrawingMode(false);
    setIsDrawing(false);
    // Clear canvas
    const ctx = drawingContextRef.current;
    if (ctx && drawingCanvasRef.current) {
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }, [editor]);

  // Carregar conteúdo existente quando projectId fornecido
  useEffect(() => {
    if (!projectId || !editor || hasLoadedRef.current) return;

    const loadContent = async () => {
      try {
        console.log('📖 [NOTES EDITOR] ===== CARREGANDO NOTAS DO PROJETO =====');
        console.log('📖 [NOTES EDITOR] Project ID:', projectId);
        console.log('📖 [NOTES EDITOR] Buscando projeto na API...');
        
        const project = await projectsAPI.getById(projectId);
        
        console.log('📖 [NOTES EDITOR] Projeto encontrado:', {
          id: project.id,
          name: project.name,
          hasDescription: !!project.description,
          descriptionLength: project.description ? project.description.length : 0
        });
        
        if (project?.description) {
          console.log('📖 [NOTES EDITOR] Carregando conteúdo no editor...');
          editor.commands.setContent(project.description);
          // Atualizar referência do último conteúdo salvo
          lastSavedContentRef.current = project.description;
          hasUnsavedChangesRef.current = false;
          console.log('✅ [NOTES EDITOR] Conteúdo carregado no editor:', `[${project.description.length} caracteres]`);
        } else {
          console.log('📖 [NOTES EDITOR] Nenhum conteúdo encontrado, editor iniciado vazio');
          // Normalizar conteúdo vazio do Tiptap
          const emptyContent = editor.getHTML();
          lastSavedContentRef.current = emptyContent || '';
          hasUnsavedChangesRef.current = false;
          console.log('📖 [NOTES EDITOR] Conteúdo inicial do editor (vazio):', emptyContent);
        }
        
        // Marcar como carregado mesmo se não houver conteúdo
        hasLoadedRef.current = true;
        console.log('✅ [NOTES EDITOR] ===== CARREGAMENTO CONCLUÍDO =====');
      } catch (error) {
        console.error('❌ [NOTES EDITOR] ===== ERRO AO CARREGAR NOTAS =====');
        console.error('❌ [NOTES EDITOR] Project ID:', projectId);
        console.error('❌ [NOTES EDITOR] Erro:', error.message);
        console.error('❌ [NOTES EDITOR] Stack:', error.stack);
        // Marcar como carregado mesmo em caso de erro para permitir salvamento
        hasLoadedRef.current = true;
      }
    };

    loadContent();
  }, [projectId, editor]);

  // Constantes de configuração
  const MAX_CONTENT_SIZE = 500000; // 500KB (~500.000 caracteres) - limite prático
  const isDevelopment = import.meta.env.DEV;
  
  // Função auxiliar para validar conteúdo
  const validateContent = useCallback((content) => {
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Conteúdo inválido' };
    }
    
    // Validar tamanho máximo
    if (content.length > MAX_CONTENT_SIZE) {
      return { 
        valid: false, 
        error: `Conteúdo muito grande (${content.length} caracteres). Máximo permitido: ${MAX_CONTENT_SIZE.toLocaleString()} caracteres.` 
      };
    }
    
    // Validar estrutura HTML básica (prevenir HTML malformado)
    if (content.trim() && !content.includes('<')) {
      // Se tem conteúdo mas não tem tags HTML, pode ser texto puro - OK
      return { valid: true };
    }
    
    // Verificar tags não fechadas (validação básica)
    const openTags = (content.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]+>/g) || []).length;
    const selfClosingTags = (content.match(/<[^>]+\/>/g) || []).length;
    
    // Permitir diferença razoável (algumas tags podem ser self-closing)
    if (Math.abs(openTags - closeTags - selfClosingTags) > 10) {
      return { valid: false, error: 'HTML malformado detectado' };
    }
    
    return { valid: true };
  }, []);
  
  // Função auxiliar para calcular debounce baseado no tamanho
  const getDebounceTime = useCallback((contentLength) => {
    if (contentLength < 1000) return 1000; // 1 segundo para textos pequenos
    if (contentLength < 10000) return 2000; // 2 segundos para textos médios
    return 5000; // 5 segundos para textos grandes
  }, []);
  
  // Função auxiliar para salvar conteúdo
  const saveContent = useCallback(async (contentToSave, isForced = false) => {
    if (!projectId || !contentToSave) return;
    
    // Validar conteúdo antes de salvar
    const validation = validateContent(contentToSave);
    if (!validation.valid) {
      console.error('❌ [NOTES EDITOR] Validação falhou:', validation.error);
      // Mostrar erro ao usuário (poderia usar um toast/notificação)
      alert(`Erro ao salvar: ${validation.error}`);
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Indicar início do salvamento
      if (saveStatus) saveStatus.setSaving();
      
      const textToSave = editor?.getText() || '';
      
      if (isDevelopment) {
        if (isForced) {
          console.log('🚨 [NOTES EDITOR] ===== SALVAMENTO FORÇADO (CLEANUP) =====');
        } else {
          console.log('💾 [NOTES EDITOR] ===== SALVANDO NOTAS =====');
        }
        console.log('💾 [NOTES EDITOR] Project ID:', projectId);
        console.log('💾 [NOTES EDITOR] HTML length:', contentToSave.length, 'caracteres');
        console.log('💾 [NOTES EDITOR] Text length:', textToSave.length, 'caracteres');
        console.log('💾 [NOTES EDITOR] Preview do texto:', textToSave.substring(0, 100) + (textToSave.length > 100 ? '...' : ''));
        // Em desenvolvimento, logar HTML completo; em produção, apenas preview
        if (isDevelopment) {
          console.log('💾 [NOTES EDITOR] HTML completo:', contentToSave);
        }
        console.log('💾 [NOTES EDITOR] Enviando para API...');
      }
      
      // Salvar no projeto
      const updatedProject = await projectsAPI.update(projectId, { description: contentToSave });
      
      // Atualizar referência do último conteúdo salvo
      lastSavedContentRef.current = contentToSave;
      hasUnsavedChangesRef.current = false;
      
      // Indicar salvamento bem-sucedido
      if (saveStatus) saveStatus.setSaved();
      
      if (isDevelopment) {
        console.log('✅ [NOTES EDITOR] Notas salvas automaticamente com sucesso!');
        console.log('✅ [NOTES EDITOR] Response da API:', {
          id: updatedProject.id,
          descriptionLength: updatedProject.description ? updatedProject.description.length : 0,
          descriptionPreview: updatedProject.description ? updatedProject.description.substring(0, 100) + (updatedProject.description.length > 100 ? '...' : '') : '[vazio]'
        });
        console.log('✅ [NOTES EDITOR] ===== SALVAMENTO CONCLUÍDO =====');
      }
    } catch (error) {
      console.error('❌ [NOTES EDITOR] ===== ERRO AO SALVAR NOTAS =====');
      console.error('❌ [NOTES EDITOR] Project ID:', projectId);
      console.error('❌ [NOTES EDITOR] Erro:', error.message);
      console.error('❌ [NOTES EDITOR] Response:', error.response?.data);
      if (isDevelopment) {
        console.error('❌ [NOTES EDITOR] Stack:', error.stack);
      }
      
      // Indicar erro no salvamento
      if (saveStatus) saveStatus.setError();
      
      // Mostrar erro ao usuário de forma amigável
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao salvar notas';
      alert(`Erro ao salvar notas: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, editor, validateContent, isDevelopment, saveStatus]);

  // Salvar automaticamente quando conteúdo mudar (debounce adaptativo)
  useEffect(() => {
    if (!projectId || !editor || !hasLoadedRef.current) {
      if (isDevelopment) {
        console.log('⏸️ [NOTES EDITOR] useEffect de salvamento não executado:', {
          hasProjectId: !!projectId,
          hasEditor: !!editor,
          hasLoaded: hasLoadedRef.current
        });
      }
      return;
    }

    if (isDevelopment) {
      console.log('✅ [NOTES EDITOR] Registrando listener de update no editor');
    }

    const handleUpdate = () => {
      // Log quando o evento de update é disparado
      const content = editor.getHTML();
      const textContent = editor.getText();
      
      if (isDevelopment) {
        console.log('🔄 [NOTES EDITOR] Evento UPDATE disparado:', {
          htmlLength: content.length,
          textLength: textContent.length,
          htmlPreview: content.substring(0, 100),
          lastSavedLength: lastSavedContentRef.current.length,
          lastSavedPreview: lastSavedContentRef.current.substring(0, 100)
        });
      }
      
      // Normalizar conteúdo vazio (Tiptap pode retornar <p></p> ou <p><br></p>)
      const normalizedContent = content.trim() === '<p></p>' || content.trim() === '<p><br></p>' ? '' : content;
      const normalizedLastSaved = lastSavedContentRef.current.trim() === '<p></p>' || lastSavedContentRef.current.trim() === '<p><br></p>' ? '' : lastSavedContentRef.current;
      
      // Verificar se há mudanças reais
      if (normalizedContent === normalizedLastSaved) {
        if (isDevelopment) {
          console.log('⏭️ [NOTES EDITOR] Sem mudanças reais, ignorando salvamento');
        }
        return; // Sem mudanças, não precisa salvar
      }
      
      hasUnsavedChangesRef.current = true;
      
      if (isDevelopment) {
        console.log('📝 [NOTES EDITOR] Conteúdo alterado detectado - INICIANDO SALVAMENTO:', {
          htmlLength: content.length,
          textLength: textContent.length,
          preview: textContent.substring(0, 50) + (textContent.length > 50 ? '...' : ''),
          htmlContent: content
        });
      }
      
      // Cancelar requisição anterior se ainda estiver em andamento
      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
        saveAbortControllerRef.current = null;
      }
      
      // Limpar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Calcular debounce adaptativo baseado no tamanho do conteúdo
      const debounceTime = getDebounceTime(content.length);
      
      if (isDevelopment) {
        console.log(`⏱️ [NOTES EDITOR] Debounce adaptativo: ${debounceTime}ms (tamanho: ${content.length} chars)`);
      }
      
      // Criar novo timeout com debounce adaptativo
      saveTimeoutRef.current = setTimeout(async () => {
        if (isDevelopment) {
          console.log('⏰ [NOTES EDITOR] Timeout executado, salvando conteúdo...');
        }
        await saveContent(content, false);
      }, debounceTime);
    };

    editor.on('update', handleUpdate);
    if (isDevelopment) {
      console.log('✅ [NOTES EDITOR] Listener de update registrado com sucesso');
    }

    return () => {
      if (isDevelopment) {
        console.log('🧹 [NOTES EDITOR] ===== CLEANUP DO USEEFFECT =====');
        console.log('🧹 [NOTES EDITOR] Project ID:', projectId);
        console.log('🧹 [NOTES EDITOR] Tem mudanças não salvas:', hasUnsavedChangesRef.current);
      }
      
      editor.off('update', handleUpdate);
      
      // Salvar conteúdo pendente antes de desmontar
      if (saveTimeoutRef.current) {
        if (isDevelopment) {
          console.log('🧹 [NOTES EDITOR] Cancelando timeout pendente e salvando conteúdo imediatamente...');
        }
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      // Se há mudanças não salvas, forçar salvamento
      if (editor && projectId) {
        const contentToSave = editor.getHTML();
        const hasChanges = contentToSave !== lastSavedContentRef.current;
        
        if (hasChanges) {
          if (isDevelopment) {
            console.log('🚨 [NOTES EDITOR] Forçando salvamento de conteúdo pendente antes de desmontar...');
            console.log('🚨 [NOTES EDITOR] Conteúdo a salvar:', contentToSave.substring(0, 100) + (contentToSave.length > 100 ? '...' : ''));
          }
          
          // Iniciar salvamento assíncrono (não podemos esperar no cleanup, mas podemos iniciar)
          // Usar uma função imediata para capturar os valores antes do cleanup
          (async () => {
            try {
              await saveContent(contentToSave, true);
            } catch (err) {
              console.error('❌ [NOTES EDITOR] Erro ao salvar no cleanup:', err);
            }
          })();
        } else {
          if (isDevelopment) {
            console.log('🧹 [NOTES EDITOR] Nenhuma mudança detectada, não é necessário salvar');
          }
        }
      }
      
      if (isDevelopment) {
        console.log('🧹 [NOTES EDITOR] ===== CLEANUP CONCLUÍDO =====');
      }
    };
  }, [projectId, editor, saveContent, getDebounceTime, isDevelopment]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" label="Loading editor..." />
      </div>
    );
  }

  return (
    <div className="w-full border border-divider rounded-lg bg-background overflow-hidden">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      {/* Camera input for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />
      {/* Gallery input for mobile */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple={false}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-2 sm:p-3 border-b border-divider bg-content1 overflow-x-auto">
        {/* Undo/Redo */}
        <div className="flex gap-1 shrink-0">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={undo}
            isDisabled={!editor.can().undo()}
            aria-label="Undo"
            className="min-w-[32px]"
          >
            <Icon icon="lucide:undo" className="text-base sm:text-lg" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={redo}
            isDisabled={!editor.can().redo()}
            aria-label="Redo"
            className="min-w-[32px]"
          >
            <Icon icon="lucide:redo" className="text-base sm:text-lg" />
          </Button>
        </div>

        <div className="w-px h-6 bg-divider shrink-0" />

        {/* Headings */}
        <select
          onChange={(e) => setHeading(parseInt(e.target.value))}
          className="px-2 py-1 text-xs sm:text-sm border border-divider rounded bg-background shrink-0"
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

        <div className="w-px h-6 bg-divider shrink-0" />

        {/* Text formatting */}
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('bold') ? 'solid' : 'light'}
          color={editor.isActive('bold') ? 'primary' : 'default'}
          onPress={toggleBold}
          aria-label="Bold"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:bold" className="text-base sm:text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('italic') ? 'solid' : 'light'}
          color={editor.isActive('italic') ? 'primary' : 'default'}
          onPress={toggleItalic}
          aria-label="Italic"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:italic" className="text-base sm:text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('underline') ? 'solid' : 'light'}
          color={editor.isActive('underline') ? 'primary' : 'default'}
          onPress={toggleUnderline}
          aria-label="Underline"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:underline" className="text-base sm:text-lg" />
        </Button>
        <div className="w-px h-6 bg-divider shrink-0" />

        {/* Lists */}
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('bulletList') ? 'solid' : 'light'}
          color={editor.isActive('bulletList') ? 'primary' : 'default'}
          onPress={toggleBulletList}
          aria-label="Bullet list"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:list" className="text-base sm:text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('orderedList') ? 'solid' : 'light'}
          color={editor.isActive('orderedList') ? 'primary' : 'default'}
          onPress={toggleOrderedList}
          aria-label="Ordered list"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:list-ordered" className="text-base sm:text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('taskList') ? 'solid' : 'light'}
          color={editor.isActive('taskList') ? 'primary' : 'default'}
          onPress={toggleTaskList}
          aria-label="Task list"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:check-square" className="text-base sm:text-lg" />
        </Button>

        <div className="w-px h-6 bg-divider shrink-0" />

        {/* Alignment */}
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive({ textAlign: 'left' }) ? 'solid' : 'light'}
          color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
          onPress={() => setTextAlign('left')}
          aria-label="Align left"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:align-left" className="text-base sm:text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive({ textAlign: 'center' }) ? 'solid' : 'light'}
          color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
          onPress={() => setTextAlign('center')}
          aria-label="Align center"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:align-center" className="text-base sm:text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive({ textAlign: 'right' }) ? 'solid' : 'light'}
          color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
          onPress={() => setTextAlign('right')}
          aria-label="Align right"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:align-right" className="text-base sm:text-lg" />
        </Button>

        <div className="w-px h-6 bg-divider shrink-0" />

        {/* Link & Image */}
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('link') ? 'solid' : 'light'}
          color={editor.isActive('link') ? 'primary' : 'default'}
          onPress={setLink}
          aria-label="Add link"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:link" className="text-base sm:text-lg" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={addImage}
          isDisabled={isUploading}
          aria-label="Add image"
          className="min-w-[32px] shrink-0"
        >
          {isUploading ? (
            <Spinner size="sm" />
          ) : (
            <Icon icon="lucide:image" className="text-base sm:text-lg" />
          )}
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={drawingMode ? 'solid' : 'light'}
          color={drawingMode ? 'primary' : 'default'}
          onPress={toggleDrawing}
          aria-label="Drawing mode"
          className="min-w-[32px] shrink-0"
        >
          <Icon icon="lucide:pencil" className="text-base sm:text-lg" />
        </Button>

        <div className="w-px h-6 bg-divider shrink-0" />

        {/* Colors */}
        <input
          type="color"
          onInput={(e) => setColor(e.target.value)}
          value={editor.getAttributes('textStyle').color || '#000000'}
          className="w-7 h-7 sm:w-8 sm:h-8 p-0 border border-divider rounded cursor-pointer shrink-0"
          aria-label="Text color"
        />
        <input
          type="color"
          onInput={(e) => setHighlight(e.target.value)}
          value={editor.getAttributes('highlight').color || '#ffff00'}
          className="w-7 h-7 sm:w-8 sm:h-8 p-0 border border-divider rounded cursor-pointer shrink-0"
          aria-label="Highlight color"
        />

        {/* Saving indicator */}
        {projectId && (
          <div className="flex items-center gap-2 text-xs text-default-500 ml-auto shrink-0">
            {isSaving ? (
              <>
                <Spinner size="sm" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <Icon icon="lucide:check-circle" className="text-success text-sm" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Drawing Canvas Modal */}
      {drawingMode && (
        <Modal isOpen={drawingMode} onClose={() => setDrawingMode(false)} size="2xl">
          <ModalContent>
            <ModalHeader>Draw</ModalHeader>
            <ModalBody>
              <div className="border border-divider rounded-lg p-4 bg-white">
                <canvas
                  ref={drawingCanvasRef}
                  className="w-full h-96 border border-divider rounded cursor-crosshair touch-none"
                  onMouseDown={handleDrawingMouseDown}
                  onMouseMove={handleDrawingMouseMove}
                  onMouseUp={handleDrawingMouseUp}
                  onMouseLeave={handleDrawingMouseUp}
                  onTouchStart={handleDrawingMouseDown}
                  onTouchMove={handleDrawingMouseMove}
                  onTouchEnd={handleDrawingMouseUp}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setDrawingMode(false)}>
                Cancel
              </Button>
              <Button color="primary" onPress={insertDrawing}>
                Insert Drawing
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Image Source Modal (Mobile) */}
      <Modal isOpen={isImageModalOpen} onClose={onImageModalClose} placement="center">
        <ModalContent>
          <ModalHeader>Add Image</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-3">
              <Button
                color="primary"
                variant="flat"
                size="lg"
                startContent={<Icon icon="lucide:camera" className="text-xl" />}
                onPress={handleCameraCapture}
                className="w-full"
              >
                Take Photo
              </Button>
              <Button
                color="primary"
                variant="flat"
                size="lg"
                startContent={<Icon icon="lucide:image" className="text-xl" />}
                onPress={handleGallerySelect}
                className="w-full"
              >
                Choose from Gallery
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onImageModalClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Link Modal */}
      <Modal isOpen={isLinkModalOpen} onClose={onLinkModalClose}>
        <ModalContent>
          <ModalHeader>Add Link</ModalHeader>
          <ModalBody>
            <Input
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyLink();
                }
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={unsetLink}>
              Remove Link
            </Button>
            <Button color="primary" onPress={applyLink}>
              Apply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[400px] prose max-w-none"
        />
        {/* Drop zone overlay */}
        <div
          className="absolute inset-0 pointer-events-none border-2 border-dashed border-transparent transition-colors"
          style={{
            borderColor: isUploading ? 'var(--heroui-primary)' : 'transparent',
          }}
        />
      </div>
    </div>
  );
}
