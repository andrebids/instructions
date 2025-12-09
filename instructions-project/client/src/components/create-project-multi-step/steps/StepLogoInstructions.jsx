import React from "react";
import {
  Input,
  Checkbox,
  Textarea,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Switch,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import * as Yup from "yup";
import { useFormikStep } from "../hooks/useFormikStep";
import { useLogoPersistence } from "../hooks/useLogoPersistence";
import { updateNestedField, getNestedValue } from "../utils/formikHelpers";
import { materialsData } from "../data/materialsData.js";
import { useUser } from "../../../context/UserContext";
import {
  getComponenteById,
  getCorById,
  getAcabamentoById,
  getTamanhoById,
  getCoresByComponente,
  getCombinacaoByComponenteECor,
  getBolaBySelecao,
  getCoresDisponiveisBolas,
  getAcabamentosByCorBola,
  getTamanhosByCorEAcabamentoBola,
} from "../utils/materialsUtils.js";
import { AIAssistantChat } from "../components/AIAssistantChat";
import { DragAndDropZone } from "../../ui/DragAndDropZone";
import { productsAPI } from "../../../services/api";
import { useTranslation } from "react-i18next";
import { StepIndicator } from "../components/StepIndicator";
import { useVoiceAssistant } from "../../../context/VoiceAssistantContext";

// Componente para texto em movimento quando truncado
const MarqueeText = ({ children, className = "", hoverOnly = false }) => {
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);
  const [needsMarquee, setNeedsMarquee] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textElement = textRef.current;
        const containerElement = containerRef.current;
        // Verificar se o texto está truncado
        const isOverflowing = textElement.scrollWidth > containerElement.clientWidth;
        setNeedsMarquee(isOverflowing);
      }
    };

    // Verificar após renderização
    checkOverflow();

    // Verificar também após um pequeno delay para garantir que o layout está completo
    const timeout = setTimeout(checkOverflow, 100);

    // Verificar quando a janela é redimensionada
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children]);

  const shouldAnimate = needsMarquee && (!hoverOnly || isHovered);

  return (
    <>
      {needsMarquee && (
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-100% - 1rem)); }
          }
        `}</style>
      )}
      <div
        ref={containerRef}
        className={`overflow-hidden ${className}`}
        style={{ maxWidth: "100%", width: "100%" }}
        onMouseEnter={() => hoverOnly && setIsHovered(true)}
        onMouseLeave={() => hoverOnly && setIsHovered(false)}
      >
        {shouldAnimate ? (
          <div
            className="inline-block whitespace-nowrap"
            style={{
              animation: shouldAnimate ? "marquee 10s linear infinite" : "none",
              paddingRight: "2rem",
            }}
          >
            {children}
          </div>
        ) : (
          <span ref={textRef} className="inline-block whitespace-nowrap" style={{ maxWidth: "100%" }}>
            {children}
          </span>
        )}
      </div>
    </>
  );
};

// Componente Select com suporte a marquee no valor selecionado
const SelectWithMarquee = React.forwardRef((props, ref) => {
  const triggerRef = React.useRef(null);
  const combinedRef = React.useCallback((node) => {
    triggerRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  React.useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = triggerRef.current;
    let cleanup = null;

    const checkAndApplyMarquee = () => {
      const valueSlot = trigger.querySelector('[data-slot="value"]');
      if (!valueSlot) return;

      const isOverflowing = valueSlot.scrollWidth > valueSlot.clientWidth;

      const handleMouseEnter = () => {
        if (isOverflowing) {
          valueSlot.style.overflow = 'visible';
          valueSlot.style.animation = 'marquee 10s linear infinite';
          valueSlot.style.paddingRight = '2rem';
          valueSlot.style.whiteSpace = 'nowrap';
        }
      };

      const handleMouseLeave = () => {
        valueSlot.style.overflow = 'hidden';
        valueSlot.style.animation = 'none';
        valueSlot.style.paddingRight = '0';
      };

      trigger.addEventListener('mouseenter', handleMouseEnter);
      trigger.addEventListener('mouseleave', handleMouseLeave);

      cleanup = () => {
        trigger.removeEventListener('mouseenter', handleMouseEnter);
        trigger.removeEventListener('mouseleave', handleMouseLeave);
      };
    };

    // Verificar após um delay para garantir que o DOM está pronto
    const timeout = setTimeout(checkAndApplyMarquee, 100);

    // Observar mudanças no DOM
    const observer = new MutationObserver(checkAndApplyMarquee);
    observer.observe(trigger, { childList: true, subtree: true, attributes: true });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      if (cleanup) cleanup();
    };
  }, [props.selectedKeys, props.children]);

  return <Select {...props} ref={combinedRef} />;
});

SelectWithMarquee.displayName = 'SelectWithMarquee';

// Componente Autocomplete com suporte a marquee no valor selecionado
const AutocompleteWithMarquee = React.forwardRef((props, ref) => {
  const triggerRef = React.useRef(null);
  const combinedRef = React.useCallback((node) => {
    triggerRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  React.useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = triggerRef.current;
    let cleanup = null;

    const checkAndApplyMarquee = () => {
      const input = trigger.querySelector('input');
      if (!input) return;

      // Verificar se o texto está truncado
      const isOverflowing = input.scrollWidth > input.clientWidth;

      const handleMouseEnter = () => {
        if (isOverflowing && input) {
          input.style.overflow = 'visible';
          input.style.animation = 'marquee 10s linear infinite';
          input.style.paddingRight = '2rem';
          input.style.whiteSpace = 'nowrap';
        }
      };

      const handleMouseLeave = () => {
        if (input) {
          input.style.overflow = 'hidden';
          input.style.animation = 'none';
          input.style.paddingRight = '0';
        }
      };

      trigger.addEventListener('mouseenter', handleMouseEnter);
      trigger.addEventListener('mouseleave', handleMouseLeave);

      cleanup = () => {
        trigger.removeEventListener('mouseenter', handleMouseEnter);
        trigger.removeEventListener('mouseleave', handleMouseLeave);
      };
    };

    // Verificar após um delay para garantir que o DOM está pronto
    const timeout = setTimeout(checkAndApplyMarquee, 100);

    // Observar mudanças no DOM
    const observer = new MutationObserver(checkAndApplyMarquee);
    observer.observe(trigger, { childList: true, subtree: true, attributes: true });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      if (cleanup) cleanup();
    };
  }, [props.selectedKey, props.inputValue, props.children]);

  return <Autocomplete {...props} ref={combinedRef} />;
});

AutocompleteWithMarquee.displayName = 'AutocompleteWithMarquee';

// Componente para exibir um item de attachment com preview de imagem
const AttachmentItem = ({ file, index, onRemove, onEdit }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  
  const isImage = file.mimetype?.startsWith('image/') || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isAIGenerated = file.isAIGenerated;
  
  // Construir URL completa se necessário
  const imageUrl = React.useMemo(() => {
    if (!file.url && !file.path) return null;
    
    // Preferir file.url se disponível, caso contrário usar file.path
    let url = file.url || file.path;
    
    // Detectar caminhos UNC do Windows (começam com \\)
    // Exemplo: \\192.168.2.22\Olimpo\.dev\web\thecore\coelho-1764760019198-615688862.webp
    if (url.startsWith('\\\\') || url.startsWith('//')) {
      // Extrair apenas o nome do arquivo do caminho UNC
      const filename = url.split(/[\\/]/).pop();
      if (filename) {
        // Construir URL HTTP usando o nome do arquivo
        return `/api/files/${filename}`;
      }
      console.warn('Could not extract filename from UNC path:', url);
      return null;
    }
    
    // Se a URL já é absoluta (começa com http://, https:// ou data:)
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        
        // SEMPRE usar caminho relativo para que o proxy do Vite funcione
        // Se o caminho começa com /api/files/, usar diretamente (será resolvido pelo proxy)
        if (pathname.startsWith('/api/files/')) {
          return pathname;
        }
        
        // Se o caminho começa com /api/, usar diretamente
        if (pathname.startsWith('/api/')) {
          return pathname;
        }
        
        // Se não começa com /api/, adicionar /api antes
        return `/api${pathname}`;
      } catch (e) {
        // Se não conseguir fazer parse da URL, tentar extrair o caminho manualmente
        const match = url.match(/\/api\/files\/[^\/\s]+/);
        if (match) {
          return match[0];
        }
        console.warn('Could not parse URL:', url, e);
        return url;
      }
    }
    
    // Se a URL já começa com /api/, usar diretamente (será resolvida pelo proxy do Vite)
    if (url.startsWith('/api/')) {
      return url;
    }
    
    // Se começa com /, é um caminho relativo ao servidor
    if (url.startsWith('/')) {
      // Se não começa com /api/, adicionar /api antes
      if (!url.startsWith('/api/')) {
        return `/api${url}`;
      }
      return url;
    }
    
    // Caso contrário, assumir que é um nome de arquivo e construir caminho completo
    return `/api/files/${url}`;
  }, [file.url, file.path]);
  
  return (
    <div className="flex items-center justify-between p-2 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-600/30 group">
      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
        {isImage ? (
          <div className="relative w-10 h-10 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {!imageError && imageUrl ? (
              <img 
                src={imageUrl} 
                alt={file.name}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  console.error('❌ Error loading image:', imageUrl, file);
                  setImageError(true);
                  setImageLoading(false);
                  e.target.style.display = 'none';
                }}
                style={{ display: imageLoading ? 'none' : 'block' }}
              />
            ) : null}
            {(imageError || !imageUrl) && (
              <div className={`w-full h-full flex items-center justify-center ${isAIGenerated ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-pink-100 dark:bg-pink-900/30'}`}>
                <Icon icon={isAIGenerated ? "lucide:sparkles" : "lucide:image"} className={`w-5 h-5 ${isAIGenerated ? 'text-purple-500' : 'text-pink-500'}`} />
              </div>
            )}
            {isAIGenerated && !imageError && imageUrl && (
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-[8px] px-1 py-0.5 rounded-bl-md font-bold">
                AI
              </div>
            )}
          </div>
        ) : (
          <div className={`p-1.5 bg-white dark:bg-gray-600 rounded-md ${isAIGenerated ? 'text-purple-500' : 'text-pink-500'} shadow-sm`}>
            <Icon icon={isAIGenerated ? "lucide:sparkles" : "lucide:file"} className="w-4 h-4" />
          </div>
        )}
        <span className="truncate text-xs font-medium flex-1">{file.name}</span>
      </div>
      <div className="flex items-center gap-1">
        {isAIGenerated && onEdit && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="primary"
            onPress={() => onEdit(index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 min-w-6 flex-shrink-0"
            aria-label={`Edit AI generated image ${file.name}`}
          >
            <Icon icon="lucide:edit-2" className="w-3 h-3" />
          </Button>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          onPress={() => onRemove(index)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 min-w-6 flex-shrink-0"
          aria-label={`Remove attachment ${file.name}`}
        >
          <Icon icon="lucide:x" className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

// Schema de validação para Logo Instructions
const validationSchema = Yup.object({
  logoNumber: Yup.string()
    .required("Logo number is required")
    .min(3, "Logo number must be at least 3 characters"),
  logoName: Yup.string()
    .required("Logo name is required")
    .min(3, "Logo name must be at least 3 characters"),
  description: Yup.string()
    .required("Description is required")
    .min(3, "Description must be at least 3 characters"),
  budget: Yup.string(),
  requestedBy: Yup.string()
    .required("Requested by is required"),
  fixationType: Yup.string()
    .required("Fixation type is required"),
  dimensions: Yup.object().shape({
    height: Yup.object().shape({
      value: Yup.number().nullable().min(0, "Height must be 0 or positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    length: Yup.object().shape({
      value: Yup.number().nullable().min(0, "Length must be 0 or positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    width: Yup.object().shape({
      value: Yup.number().nullable().min(0, "Width must be 0 or positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    diameter: Yup.object().shape({
      value: Yup.number().nullable().min(0, "Diameter must be 0 or positive"),
      imperative: Yup.boolean(),
    }).nullable(),
  }).nullable().test(
    "at-least-one-dimension",
    "At least one dimension (Height, Length, Width, or Diameter) must be filled",
    function (value) {
      // Se dimensions for null ou undefined, retornar false (inválido)
      if (!value) return false;
      // Aceitar valores numéricos válidos (incluindo 0)
      // Verificar se o valor existe, não é null, não é string vazia, e é um número válido >= 0
      const hasHeight = value.height?.value != null && value.height.value !== "" && !isNaN(parseFloat(value.height.value)) && parseFloat(value.height.value) >= 0;
      const hasLength = value.length?.value != null && value.length.value !== "" && !isNaN(parseFloat(value.length.value)) && parseFloat(value.length.value) >= 0;
      const hasWidth = value.width?.value != null && value.width.value !== "" && !isNaN(parseFloat(value.width.value)) && parseFloat(value.width.value) >= 0;
      const hasDiameter = value.diameter?.value != null && value.diameter.value !== "" && !isNaN(parseFloat(value.diameter.value)) && parseFloat(value.diameter.value) >= 0;
      return hasHeight || hasLength || hasWidth || hasDiameter;
    }
  ),
});

export function StepLogoInstructions({ formData, onInputChange, saveStatus, isCompact = false, onBack, onNext, onSave, projectId, currentStep, totalSteps, onInternalPageChange, handlersRef }) {
  const { t } = useTranslation();
  const logoDetails = formData.logoDetails || {};
  // Support both old structure (direct logoDetails) and new structure (with currentLogo)
  const rawCurrentLogo = logoDetails.currentLogo || logoDetails;
  // Garantir que isModification seja false por padrão se não estiver definido
  const currentLogo = {
    ...rawCurrentLogo,
    isModification: rawCurrentLogo.isModification === true ? true : false
  };
  const savedLogos = logoDetails.logos || [];
  const composition = currentLogo.composition || { componentes: [], bolas: [] };

  // Obter nome do usuário atual
  const { userName } = useUser();

  // Voice Assistant
  const { 
    openAssistant, 
    closeAssistant, 
    isOpen: isVoiceAssistantOpen,
    listening,
    supported: voiceSupported 
  } = useVoiceAssistant();

  // Refs para preservar valores preenchidos automaticamente
  const preservedRequestedByRef = React.useRef(null);
  const preservedLogoNumberRef = React.useRef(null);

  // Estado para controlar a busca nos componentes
  const [componenteSearchValues, setComponenteSearchValues] = React.useState({});

  // Estado para controlar quais componentes estão em modo de edição
  const [componentesEditando, setComponentesEditando] = React.useState({});

  // Estado para controlar quais bolas estão em modo de edição
  const [bolasEditando, setBolasEditando] = React.useState({});

  // Estado para controlar a visibilidade do chat
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  // Estado para rastrear qual attachment AI Generated está sendo editado
  const [editingAttachmentIndex, setEditingAttachmentIndex] = React.useState(null);

  // Estados para modificação de logo e pesquisa de produtos
  const [productSearchValue, setProductSearchValue] = React.useState("");
  const [productSearchResults, setProductSearchResults] = React.useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = React.useState(false);
  const [relatedProducts, setRelatedProducts] = React.useState([]);
  const [productSizes, setProductSizes] = React.useState([]);
  const [selectedRelatedProductId, setSelectedRelatedProductId] = React.useState(null);
  const productSearchTimeoutRef = React.useRef(null);

  // Wizard state - controla a página atual do wizard step-by-step
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFinishing, setIsFinishing] = React.useState(false);

  // Notificar o componente pai sobre mudanças na página interna
  React.useEffect(() => {
    if (onInternalPageChange) {
      onInternalPageChange(currentPage);
    }
  }, [currentPage, onInternalPageChange]);
  const logoSteps = [
    { id: 'details-attachments', label: 'Details & Attachments' },
    { id: 'dimensions', label: 'Dimensions' },
    { id: 'composition', label: 'Composition' },
    { id: 'summary', label: 'Summary' }
  ];

  // Ref para o card Details & Criteria para fazer scroll
  const detailsCriteriaRef = React.useRef(null);

  // Ref para rastrear se o campo "Requested By" já foi preenchido automaticamente
  const requestedByAutoFilled = React.useRef(false);

  // Ref para rastrear se o Logo Number já foi gerado inicialmente
  const logoNumberInitialized = React.useRef(false);

  // Ref para rastrear o último nome do projeto usado para gerar o Logo Number
  const lastProjectNameRef = React.useRef("");

  // Ref para rastrear o ID do logo atual para detectar quando um novo logo é criado
  const currentLogoIdRef = React.useRef(currentLogo.id || null);

  // Ref para debounce do onAIStateChange e evitar loops infinitos
  const aiStateChangeTimeoutRef = React.useRef(null);
  const isProcessingAIStateChangeRef = React.useRef(false);

  // Cleanup do timeout quando o componente for desmontado ou o chat fechar
  React.useEffect(() => {
    return () => {
      if (aiStateChangeTimeoutRef.current) {
        clearTimeout(aiStateChangeTimeoutRef.current);
      }
    };
  }, []);

  // Resetar refs quando um novo logo é criado (quando o ID muda ou quando o logo está vazio)
  // E atualizar formik quando currentLogo for carregado (especialmente quando o modal abre)
  React.useEffect(() => {
    const currentLogoId = currentLogo.id || null;
    const isLogoEmpty = !currentLogo.logoNumber && !currentLogo.logoName;
    const previousLogoId = currentLogoIdRef.current;
    
    // Se o logo foi carregado (tem dados mas não tinha ID antes), atualizar formik
    const hasLogoData = currentLogo.logoNumber || currentLogo.logoName || currentLogo.requestedBy;
    if (hasLogoData && previousLogoId === null && currentLogoId !== null) {
      // Logo foi carregado, atualizar formik com os valores
      // Usar setTimeout para garantir que o formik esteja pronto
      setTimeout(() => {
        formik.setFieldValue("logoNumber", currentLogo.logoNumber || "");
        formik.setFieldValue("logoName", currentLogo.logoName || "");
        formik.setFieldValue("requestedBy", currentLogo.requestedBy || "");
        formik.setFieldValue("budget", currentLogo.budget || "");
        formik.setFieldValue("dimensions", currentLogo.dimensions || {});
        formik.setFieldValue("usageOutdoor", currentLogo.usageOutdoor || false);
        formik.setFieldValue("usageIndoor", currentLogo.usageIndoor !== undefined ? currentLogo.usageIndoor : true);
        formik.setFieldValue("fixationType", currentLogo.fixationType || "");
        formik.setFieldValue("lacqueredStructure", currentLogo.lacqueredStructure || false);
        formik.setFieldValue("lacquerColor", currentLogo.lacquerColor || "");
        formik.setFieldValue("mastDiameter", currentLogo.mastDiameter || "");
        formik.setFieldValue("maxWeightConstraint", currentLogo.maxWeightConstraint || false);
        formik.setFieldValue("maxWeight", currentLogo.maxWeight || "");
        formik.setFieldValue("ballast", currentLogo.ballast || false);
        formik.setFieldValue("controlReport", currentLogo.controlReport || false);
        formik.setFieldValue("criteria", currentLogo.criteria || "");
        formik.setFieldValue("description", currentLogo.description || "");
        formik.setFieldValue("isModification", currentLogo.isModification || false);
        formik.setFieldValue("baseProductId", currentLogo.baseProductId || null);
        formik.setFieldValue("baseProduct", currentLogo.baseProduct || null);
        formik.setFieldValue("relatedProducts", currentLogo.relatedProducts || []);
        formik.setFieldValue("productSizes", currentLogo.productSizes || []);
        // Restaurar seleção de produto relacionado se houver
        if (currentLogo.selectedRelatedProductId) {
          setSelectedRelatedProductId(currentLogo.selectedRelatedProductId);
        } else {
          setSelectedRelatedProductId(null);
        }
      }, 0);
    }
    
    // Também verificar se o logo tem dados mas o formik está vazio (caso o logo seja carregado após o componente montar)
    if (hasLogoData && (!formik.values.logoNumber && !formik.values.logoName && !formik.values.requestedBy)) {
      // Formik está vazio mas o logo tem dados, atualizar
      setTimeout(() => {
        formik.setFieldValue("logoNumber", currentLogo.logoNumber || "");
        formik.setFieldValue("logoName", currentLogo.logoName || "");
        formik.setFieldValue("requestedBy", currentLogo.requestedBy || "");
        formik.setFieldValue("budget", currentLogo.budget || "");
        formik.setFieldValue("dimensions", currentLogo.dimensions || {});
        formik.setFieldValue("usageOutdoor", currentLogo.usageOutdoor || false);
        formik.setFieldValue("usageIndoor", currentLogo.usageIndoor !== undefined ? currentLogo.usageIndoor : true);
        formik.setFieldValue("fixationType", currentLogo.fixationType || "");
        formik.setFieldValue("lacqueredStructure", currentLogo.lacqueredStructure || false);
        formik.setFieldValue("lacquerColor", currentLogo.lacquerColor || "");
        formik.setFieldValue("mastDiameter", currentLogo.mastDiameter || "");
        formik.setFieldValue("maxWeightConstraint", currentLogo.maxWeightConstraint || false);
        formik.setFieldValue("maxWeight", currentLogo.maxWeight || "");
        formik.setFieldValue("ballast", currentLogo.ballast || false);
        formik.setFieldValue("controlReport", currentLogo.controlReport || false);
        formik.setFieldValue("criteria", currentLogo.criteria || "");
        formik.setFieldValue("description", currentLogo.description || "");
        formik.setFieldValue("isModification", currentLogo.isModification || false);
        formik.setFieldValue("baseProductId", currentLogo.baseProductId || null);
        formik.setFieldValue("baseProduct", currentLogo.baseProduct || null);
        formik.setFieldValue("relatedProducts", currentLogo.relatedProducts || []);
        formik.setFieldValue("productSizes", currentLogo.productSizes || []);
        // Restaurar seleção de produto relacionado se houver
        if (currentLogo.selectedRelatedProductId) {
          setSelectedRelatedProductId(currentLogo.selectedRelatedProductId);
        } else {
          setSelectedRelatedProductId(null);
        }
      }, 0);
    }

    // Se o ID mudou ou o logo está vazio (novo logo), resetar refs
    if (currentLogoId !== previousLogoId || (isLogoEmpty && previousLogoId !== null)) {
      // IMPORTANTE: Quando o ID do logo muda (editando um logo diferente), atualizar todos os campos do formik
      if (currentLogoId !== previousLogoId && currentLogoId !== null && previousLogoId !== null) {
        console.log("Logo ID changed, updating formik with new logo data. Previous ID:", previousLogoId, "New ID:", currentLogoId);
        // Atualizar todos os campos do formik com os valores do novo currentLogo
        formik.setFieldValue("logoNumber", currentLogo.logoNumber || "");
        formik.setFieldValue("logoName", currentLogo.logoName || "");
        formik.setFieldValue("requestedBy", currentLogo.requestedBy || "");
        formik.setFieldValue("budget", currentLogo.budget || "");
        formik.setFieldValue("dimensions", currentLogo.dimensions || {});
        formik.setFieldValue("usageOutdoor", currentLogo.usageOutdoor || false);
        formik.setFieldValue("usageIndoor", currentLogo.usageIndoor !== undefined ? currentLogo.usageIndoor : true);
        formik.setFieldValue("fixationType", currentLogo.fixationType || "");
        formik.setFieldValue("lacqueredStructure", currentLogo.lacqueredStructure || false);
        formik.setFieldValue("lacquerColor", currentLogo.lacquerColor || "");
        formik.setFieldValue("mastDiameter", currentLogo.mastDiameter || "");
        formik.setFieldValue("maxWeightConstraint", currentLogo.maxWeightConstraint || false);
        formik.setFieldValue("maxWeight", currentLogo.maxWeight || "");
        formik.setFieldValue("ballast", currentLogo.ballast || false);
        formik.setFieldValue("controlReport", currentLogo.controlReport || false);
        formik.setFieldValue("criteria", currentLogo.criteria || "");
        formik.setFieldValue("description", currentLogo.description || "");
        formik.setFieldValue("composition", currentLogo.composition || { componentes: [], bolas: [] });
        formik.setFieldValue("isModification", currentLogo.isModification || false);
        formik.setFieldValue("baseProductId", currentLogo.baseProductId || null);
        formik.setFieldValue("baseProduct", currentLogo.baseProduct || null);
        formik.setFieldValue("relatedProducts", currentLogo.relatedProducts || []);
        formik.setFieldValue("productSizes", currentLogo.productSizes || []);
        // Restaurar seleção de produto relacionado se houver
        if (currentLogo.selectedRelatedProductId) {
          setSelectedRelatedProductId(currentLogo.selectedRelatedProductId);
        } else {
          setSelectedRelatedProductId(null);
        }
      }
      
      requestedByAutoFilled.current = false;
      logoNumberInitialized.current = false;
      preservedRequestedByRef.current = null;
      preservedLogoNumberRef.current = null;
      currentLogoIdRef.current = currentLogoId;
    }
  }, [currentLogo.id, currentLogo.logoNumber, currentLogo.logoName, savedLogos.length]);

  // Função para gerar o Logo Number automaticamente baseado no nome do projeto
  const generateLogoNumber = React.useCallback((projectName, currentLogoNumber = "") => {
    if (!projectName || projectName.trim() === "") {
      return "";
    }

    // IMPORTANTE: Se o currentLogo já tem um logoNumber válido e estamos editando, NÃO gerar novo número
    // Verificar se o currentLogo tem um ID (indica que é um logo existente sendo editado)
    if (currentLogo.id && currentLogo.logoNumber && currentLogo.logoNumber.trim() !== "") {
      const match = currentLogo.logoNumber.match(/-L\s*(\d+)/i);
      if (match) {
        console.log("Logo has ID and valid logoNumber (editing existing logo). Preserving:", currentLogo.logoNumber);
        return currentLogo.logoNumber; // Preservar o número existente
      }
    }

    // Usar o nome do projeto como base
    const baseName = projectName.trim();
    let maxNumber = 0;
    const usedNumbers = new Set();

    // Verificar nos logos salvos - contar todos os logos que têm o padrão -L<número>
    console.log("Generating Logo Number. SavedLogos:", savedLogos);
    savedLogos.forEach((logo) => {
      if (logo.logoNumber) {
        // Limpar espaços extras e tentar encontrar o padrão -L<número>
        // Pode estar no meio ou no final, com ou sem espaços
        const cleanedLogoNumber = logo.logoNumber.trim();
        const match = cleanedLogoNumber.match(/-L\s*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > 0) {
            console.log("Found logo number:", num, "in saved logo:", logo.logoNumber);
            usedNumbers.add(num);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
    });
    
    // IMPORTANTE: Também verificar o currentLogo atual (que pode ter um logo anterior ainda não salvo)
    // Isso garante que quando criamos o Logo 2, o Logo 1 (ainda em currentLogo) seja contado
    // Só contar se o currentLogo.logoNumber for diferente do currentLogoNumber (que está sendo gerado)
    // e se o currentLogo.logoNumber não estiver vazio
    // NÃO contar se o currentLogo tem um ID (é um logo existente sendo editado)
    if (currentLogo.logoNumber && 
        currentLogo.logoNumber.trim() !== "" && 
        currentLogo.logoNumber !== currentLogoNumber &&
        !currentLogo.id) { // Não contar se tem ID (logo existente)
      const cleanedCurrentLogoNumber = currentLogo.logoNumber.trim();
      const match = cleanedCurrentLogoNumber.match(/-L\s*(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > 0) {
          console.log("Found logo number in currentLogo:", num, "in", currentLogo.logoNumber);
          usedNumbers.add(num);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
    
    console.log("Max number found:", maxNumber, "from", savedLogos.length, "saved logos. Used numbers:", Array.from(usedNumbers).sort((a, b) => a - b));

    // Se o logo atual já tem um número válido, não contar ele mesmo (estamos editando)
    // Mas se não tem número ou tem um número diferente, precisamos gerar um novo
    if (currentLogoNumber && currentLogoNumber.trim() !== "") {
      const cleanedCurrentLogoNumber = currentLogoNumber.trim();
      const match = cleanedCurrentLogoNumber.match(/-L\s*(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > 0) {
          // Se este número já está nos logos salvos ou no currentLogo, significa que estamos editando este logo
          // Nesse caso, não devemos gerar um novo número, devemos manter o atual
          if (usedNumbers.has(num)) {
            console.log("Current logo number exists in saved logos or currentLogo (editing). Returning:", currentLogoNumber);
            return currentLogoNumber.trim(); // Retornar o número atual se já existe (sem espaços extras)
          }
          // Se não está nos salvos mas tem um número, considerar para o máximo
          if (num > maxNumber) {
            maxNumber = num;
          }
          // Adicionar ao usedNumbers para não gerar duplicado
          usedNumbers.add(num);
        }
      }
    }

    // Encontrar o próximo número disponível (não apenas maxNumber + 1, mas o próximo que não está em uso)
    // Isso garante que mesmo se houver gaps (ex: L1, L3), o próximo será L2, não L4
    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) {
      nextNumber++;
    }
    
    // Se nextNumber for maior que maxNumber + 1, significa que há gaps, mas vamos usar o próximo disponível
    // Se não há gaps, nextNumber será maxNumber + 1
    console.log("Next number generated:", nextNumber, "for project:", baseName, "(max was:", maxNumber, ", used:", Array.from(usedNumbers).sort((a, b) => a - b), ")");
    return `${baseName} -L${nextNumber}`;
  }, [savedLogos, currentLogo]);

  // Função helper para filtrar componentes (não pode ser hook pois é usada dentro de map)
  const filterComponentes = React.useCallback((searchTerm) => {
    if (!searchTerm) return materialsData.componentes;
    const term = searchTerm.toLowerCase();
    return materialsData.componentes.filter((c) => {
      const nome = c.nome?.toLowerCase() || "";
      const referencia = c.referencia?.toLowerCase() || "";
      return nome.includes(term) || referencia.includes(term);
    });
  }, []);

  // Verificar se um componente está completo (tem referência)
  const isComponenteCompleto = React.useCallback((comp) => {
    if (!comp.componenteId) return false;
    const componente = getComponenteById(comp.componenteId);
    if (!componente) return false;

    // Se o componente não precisa de cor, só precisa do componenteId
    if (componente.semCor) {
      return true;
    }

    // Se precisa de cor, precisa ter corId e referência
    return comp.corId && comp.referencia;
  }, []);

  // Verificar se uma bola está completa (tem cor, acabamento, tamanho e referência)
  const isBolaCompleta = React.useCallback((bola) => {
    return bola.corId && bola.acabamentoId && bola.tamanhoId && bola.referencia;
  }, []);

  // Verificar se uma bola tem dados preenchidos (pelo menos um campo)
  const hasBolaData = React.useCallback((bola) => {
    return !!(bola.corId || bola.acabamentoId || bola.tamanhoId || bola.referencia || bola.corNome || bola.acabamentoNome || bola.tamanhoName || bola.bolaName || bola.reference);
  }, []);

  // Usar Formik para gerenciar estado e validação
  const formik = useFormikStep({
    initialValues: {
      logoNumber: currentLogo.logoNumber || "",
      logoName: currentLogo.logoName || "",
      requestedBy: currentLogo.requestedBy || "",
      budget: currentLogo.budget || "",
      dimensions: currentLogo.dimensions || {},
      // Manter outros campos para compatibilidade
      usageOutdoor: currentLogo.usageOutdoor || false,
      usageIndoor: currentLogo.usageIndoor !== undefined ? currentLogo.usageIndoor : true,
      fixationType: currentLogo.fixationType || "",
      lacqueredStructure: currentLogo.lacqueredStructure || false,
      lacquerColor: currentLogo.lacquerColor || "",
      mastDiameter: currentLogo.mastDiameter || "",
      maxWeightConstraint: currentLogo.maxWeightConstraint || false,
      maxWeight: currentLogo.maxWeight || "",
      ballast: currentLogo.ballast || false,
      controlReport: currentLogo.controlReport || false,
      criteria: currentLogo.criteria || "",
      description: currentLogo.description || "",
      // Campos de modificação de logo
      isModification: currentLogo.isModification || false,
      baseProductId: currentLogo.baseProductId || null,
      baseProduct: currentLogo.baseProduct || null,
      relatedProducts: currentLogo.relatedProducts || [],
      productSizes: currentLogo.productSizes || [],
    },
    validationSchema,
    onChange: (field, value) => {
      // Sincronizar com formData global através de currentLogo
      // IMPORTANTE: Preservar TODOS os valores do formik para não perder dados durante atualizações
      // IMPORTANTE: Preservar também _originalIndex, id e savedAt que são essenciais para identificar e posicionar logos editados
      
      // Usar o valor novo do parâmetro quando o campo sendo alterado é o mesmo, senão usar o valor do formik
      const updatedCurrentLogo = {
        ...currentLogo,
        // Preservar metadados importantes para logos editados
        id: currentLogo.id,
        savedAt: currentLogo.savedAt,
        _originalIndex: currentLogo._originalIndex,
        // Preservar TODOS os valores do formik (que podem ter sido digitados mas ainda não sincronizados)
        // IMPORTANTE: Se o campo sendo alterado é o mesmo, usar o valor novo do parâmetro, senão usar formik.values
        logoName: field === "logoName" ? value : (formik.values.logoName || currentLogo.logoName || ""),
        description: field === "description" ? value : (formik.values.description || currentLogo.description || ""),
        logoNumber: field === "logoNumber" ? value : (formik.values.logoNumber || currentLogo.logoNumber || ""),
        requestedBy: field === "requestedBy" ? value : (formik.values.requestedBy || currentLogo.requestedBy || ""),
        budget: field === "budget" ? value : (formik.values.budget || currentLogo.budget || ""),
        fixationType: field === "fixationType" ? value : (formik.values.fixationType || currentLogo.fixationType || ""),
        dimensions: field === "dimensions" ? value : (formik.values.dimensions || currentLogo.dimensions || {}),
        // Atualizar o campo específico que está sendo alterado (garantir que o valor novo seja usado)
        [field]: value,
        // Garantir que valores preservados sejam sempre incluídos se o campo atual estiver vazio
        ...(preservedRequestedByRef.current && (!currentLogo.requestedBy || currentLogo.requestedBy.trim() === "") ? { requestedBy: preservedRequestedByRef.current } : {}),
        ...(preservedLogoNumberRef.current && (!currentLogo.logoNumber || currentLogo.logoNumber.trim() === "") ? { logoNumber: preservedLogoNumberRef.current } : {}),
      };
      // Update logoDetails with new structure (preserving saved logos)
      const updatedLogoDetails = {
        ...logoDetails,
        currentLogo: updatedCurrentLogo,
        logos: savedLogos, // Preserve saved logos
      };
      onInputChange("logoDetails", updatedLogoDetails);
    },
    formData: currentLogo,
  });

  const handleFileUpload = async (newFiles) => {
    if (newFiles.length > 0) {
      console.log('📤 Uploading files to server...', newFiles);

      // Upload each file to the server
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const apiBase = (import.meta?.env?.VITE_API_URL || '').replace(/\/api$/, '') || '';
          const response = await fetch(`${apiBase}/api/files/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText} `);
          }

          const result = await response.json();
          console.log('✅ File uploaded:', result.file);

          // Return file metadata to store in attachments
          return {
            name: result.file.originalName,
            filename: result.file.filename,
            path: result.file.path,
            url: result.file.url,
            size: result.file.size,
            mimetype: result.file.mimetype,
          };
        } catch (error) {
          console.error('❌ Error uploading file:', file.name, error);
          return null;
        }
      });

      // Wait for all uploads to complete
      const uploadedFiles = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFiles.filter(f => f !== null);

      if (successfulUploads.length > 0) {
        // Save attachments to currentLogo, not logoDetails (each logo has its own attachments)
        const existingFiles = currentLogo.attachmentFiles || [];
        const allFiles = [...existingFiles, ...successfulUploads];

        // Save file metadata to currentLogo
        const updatedCurrentLogo = {
          ...currentLogo,
          attachmentFiles: allFiles,
        };
        const updatedLogoDetails = {
          ...logoDetails,
          currentLogo: updatedCurrentLogo,
          logos: savedLogos,
        };
        onInputChange("logoDetails", updatedLogoDetails);
        console.log('✅ Files uploaded and metadata saved to currentLogo:', successfulUploads);
      }
    }
  };

  // Preencher automaticamente o campo "Requested By" com o nome do usuário (apenas uma vez)
  React.useEffect(() => {
    // Preencher apenas se ainda não foi preenchido e userName estiver disponível
    if (userName && !requestedByAutoFilled.current) {
      const currentRequestedBy = currentLogo.requestedBy?.trim() || formik.values.requestedBy?.trim() || "";
      // Se o campo está vazio, preencher com o nome do usuário
      if (!currentRequestedBy) {
        preservedRequestedByRef.current = userName;
        requestedByAutoFilled.current = true;
        // Atualizar tanto no formik quanto no currentLogo diretamente
        formik.updateField("requestedBy", userName);
        // Garantir que seja salvo no currentLogo
        const updatedCurrentLogo = {
          ...currentLogo,
          requestedBy: userName,
        };
        const updatedLogoDetails = {
          ...logoDetails,
          currentLogo: updatedCurrentLogo,
          logos: savedLogos,
        };
        onInputChange("logoDetails", updatedLogoDetails);
      } else {
        // Se já tem valor, preservar e marcar como preenchido
        preservedRequestedByRef.current = currentRequestedBy;
        requestedByAutoFilled.current = true;
      }
    } else if (currentLogo.requestedBy && !preservedRequestedByRef.current) {
      // Preservar valor do currentLogo se ainda não foi preservado
      preservedRequestedByRef.current = currentLogo.requestedBy;
      requestedByAutoFilled.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, currentLogo.requestedBy]); // Executar quando userName ou currentLogo.requestedBy mudar

  // Ref para rastrear o número anterior de logos salvos
  const prevSavedLogosLengthRef = React.useRef(savedLogos.length);
  // Ref para rastrear o número do logo anterior (para detectar limpeza/novo logo)
  const prevLogoNumberRef = React.useRef(currentLogo.logoNumber || "");

  // Gerar automaticamente o Logo Number baseado no nome do projeto
  React.useEffect(() => {
    const projectName = formData.name?.trim() || "";
    // FIX: Usar nullish coalescing (??) para respeitar string vazia "" como valor válido
    // Isso evita que caia no valor do formik (que pode estar desatualizado) quando criamos um novo logo
    const currentLogoNumber = currentLogo.logoNumber ?? formik.values.logoNumber ?? "";

    // Se o nome do projeto mudou, resetar a flag de inicialização
    if (projectName && projectName !== lastProjectNameRef.current) {
      logoNumberInitialized.current = false;
      lastProjectNameRef.current = projectName;
      preservedLogoNumberRef.current = null;
    }

    // Detectar se o logo number foi limpo (transição de um logo existente para um novo)
    if (prevLogoNumberRef.current && (!currentLogoNumber || currentLogoNumber.trim() === "")) {
      logoNumberInitialized.current = false;
      preservedLogoNumberRef.current = null;
    }
    
    // Só atualizar prevLogoNumberRef se realmente mudou para evitar loops
    if (prevLogoNumberRef.current !== currentLogoNumber) {
      prevLogoNumberRef.current = currentLogoNumber;
    }

    // Se o número de logos salvos mudou e o logo atual está vazio, resetar para recalcular
    if (savedLogos.length !== prevSavedLogosLengthRef.current) {
      prevSavedLogosLengthRef.current = savedLogos.length;
      // Se o logo atual está vazio (novo logo criado), resetar para gerar novo número
      if (!currentLogoNumber || currentLogoNumber.trim() === "") {
        logoNumberInitialized.current = false;
        preservedLogoNumberRef.current = null;
      }
    }

    if (projectName) {
      // IMPORTANTE: Se o currentLogo tem um ID, significa que é um logo existente sendo editado
      // Nesse caso, SEMPRE preservar o logoNumber existente, não gerar novo
      const isEditingExistingLogo = currentLogo.id !== null && currentLogo.id !== undefined;
      
      // Também verificar se o logo está nos savedLogos (pode não ter ID mas estar na lista)
      const isInSavedLogos = savedLogos.some(logo =>
        (logo.id && currentLogo.id && logo.id === currentLogo.id) ||
        (logo.logoNumber === currentLogoNumber && currentLogoNumber)
      );

      // Se estamos editando um logo existente (tem ID ou está nos savedLogos), preservar o número
      if (isEditingExistingLogo || isInSavedLogos) {
        // Usar o logoNumber do currentLogo se existir e for válido
        const logoNumberToPreserve = currentLogo.logoNumber && currentLogo.logoNumber.trim() !== "" 
          ? currentLogo.logoNumber 
          : currentLogoNumber;
        
        if (logoNumberToPreserve && logoNumberToPreserve.trim() !== "") {
          // IMPORTANTE: Se o ID do logo mudou, sempre atualizar o logoNumber no formik
          // Isso garante que quando editamos um logo diferente, o logoNumber correto é carregado
          const logoIdChanged = currentLogo.id !== currentLogoIdRef.current;
          
          // Só atualizar se o valor preservado for diferente do atual OU se o ID mudou
          if (preservedLogoNumberRef.current !== logoNumberToPreserve || logoIdChanged) {
            preservedLogoNumberRef.current = logoNumberToPreserve;
            logoNumberInitialized.current = true;
            // Sempre atualizar o formik quando o logoNumber mudar ou quando o ID do logo mudar
            if (formik.values.logoNumber !== logoNumberToPreserve || logoIdChanged) {
              formik.setFieldValue("logoNumber", logoNumberToPreserve);
              console.log("Preserving existing logo number for editing:", logoNumberToPreserve, "logo ID:", currentLogo.id);
            }
          }
        }
      } else if (!logoNumberInitialized.current) {
        // Se não estamos editando e o logo number não foi inicializado, gerar novo
        // IMPORTANTE: Usar o savedLogos mais recente do logoDetails para garantir que incluímos logos recém-salvos
        const latestSavedLogos = logoDetails.logos || savedLogos;
        console.log("Generating new logo number. Current savedLogos length:", savedLogos.length, "Latest from logoDetails:", latestSavedLogos.length);
        
        // Criar uma versão temporária da função com os logos mais recentes
        const generateWithLatestLogos = (projectName, currentLogoNumber = "") => {
          if (!projectName || projectName.trim() === "") {
            return "";
          }

          // IMPORTANTE: Se o currentLogo já tem um logoNumber válido e estamos editando, NÃO gerar novo número
          if (currentLogo.id && currentLogo.logoNumber && currentLogo.logoNumber.trim() !== "") {
            const match = currentLogo.logoNumber.match(/-L\s*(\d+)/i);
            if (match) {
              console.log("Logo has ID and valid logoNumber (editing existing logo). Preserving:", currentLogo.logoNumber);
              return currentLogo.logoNumber;
            }
          }

          const baseName = projectName.trim();
          let maxNumber = 0;
          const usedNumbers = new Set();

          // Usar os logos mais recentes
          latestSavedLogos.forEach((logo) => {
            if (logo.logoNumber) {
              const cleanedLogoNumber = logo.logoNumber.trim();
              const match = cleanedLogoNumber.match(/-L\s*(\d+)/i);
              if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > 0) {
                  console.log("Found logo number:", num, "in saved logo:", logo.logoNumber);
                  usedNumbers.add(num);
                  if (num > maxNumber) {
                    maxNumber = num;
                  }
                }
              }
            }
          });
          
          // Verificar currentLogo se não tiver ID
          if (currentLogo.logoNumber && 
              currentLogo.logoNumber.trim() !== "" && 
              currentLogo.logoNumber !== currentLogoNumber &&
              !currentLogo.id) {
            const cleanedCurrentLogoNumber = currentLogo.logoNumber.trim();
            const match = cleanedCurrentLogoNumber.match(/-L\s*(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > 0) {
                console.log("Found logo number in currentLogo:", num, "in", currentLogo.logoNumber);
                usedNumbers.add(num);
                if (num > maxNumber) {
                  maxNumber = num;
                }
              }
            }
          }
          
          console.log("Max number found:", maxNumber, "from", latestSavedLogos.length, "saved logos. Used numbers:", Array.from(usedNumbers).sort((a, b) => a - b));

          if (currentLogoNumber && currentLogoNumber.trim() !== "") {
            const cleanedCurrentLogoNumber = currentLogoNumber.trim();
            const match = cleanedCurrentLogoNumber.match(/-L\s*(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > 0) {
                if (usedNumbers.has(num)) {
                  console.log("Current logo number exists (editing). Returning:", currentLogoNumber);
                  return currentLogoNumber.trim();
                }
                if (num > maxNumber) {
                  maxNumber = num;
                }
                usedNumbers.add(num);
              }
            }
          }

          let nextNumber = 1;
          while (usedNumbers.has(nextNumber)) {
            nextNumber++;
          }
          
          console.log("Next number generated:", nextNumber, "for project:", baseName);
          return `${baseName} -L${nextNumber}`;
        };
        
        const generatedLogoNumber = generateWithLatestLogos(projectName, currentLogoNumber);

        if (generatedLogoNumber) {
          // Se o logo atual está vazio ou não segue o padrão, aplicar o novo número
          const isEmpty = !currentLogoNumber || currentLogoNumber.trim() === "";
          const doesNotMatchPattern = currentLogoNumber && !currentLogoNumber.match(new RegExp(`^${projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-L\\s*\\d+`, 'i'));

          if (isEmpty || doesNotMatchPattern) {
            preservedLogoNumberRef.current = generatedLogoNumber;
            logoNumberInitialized.current = true;
            // IMPORTANTE: Atualizar formik E currentLogo
            formik.setFieldValue("logoNumber", generatedLogoNumber);

            const updatedCurrentLogo = {
              ...currentLogo,
              logoNumber: generatedLogoNumber,
            };
            const updatedLogoDetails = {
              ...logoDetails,
              currentLogo: updatedCurrentLogo,
              logos: latestSavedLogos, // Usar os logos mais recentes
            };
            onInputChange("logoDetails", updatedLogoDetails);
          } else {
            // Se já tem um número válido, preservar e marcar como inicializado
            preservedLogoNumberRef.current = currentLogoNumber;
            logoNumberInitialized.current = true;
          }
        }
      } else if (currentLogo.logoNumber && currentLogo.logoNumber.trim() !== "" && !isEditingExistingLogo) {
        // Se o currentLogo tem um número válido mas não estamos editando, verificar se precisa atualizar
        const logoNumberToPreserve = currentLogo.logoNumber;
        if (formik.values.logoNumber !== logoNumberToPreserve) {
          formik.setFieldValue("logoNumber", logoNumberToPreserve);
        }
      }
    } else if (currentLogo.logoNumber && !preservedLogoNumberRef.current) {
      // Preservar valor do currentLogo se ainda não foi preservado
      preservedLogoNumberRef.current = currentLogo.logoNumber;
      logoNumberInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, currentLogo.logoNumber, savedLogos.length, savedLogos, logoNumberInitialized.current]); // Adicionado logoNumberInitialized.current

  // Garantir que valores preservados sejam salvos no currentLogo quando outros campos mudarem
  React.useEffect(() => {
    const needsUpdate = {};
    let shouldUpdate = false;

    // Verificar se requestedBy precisa ser atualizado
    if (preservedRequestedByRef.current && (!currentLogo.requestedBy || currentLogo.requestedBy.trim() === "")) {
      needsUpdate.requestedBy = preservedRequestedByRef.current;
      shouldUpdate = true;
    }

    // Verificar se logoNumber precisa ser atualizado
    if (preservedLogoNumberRef.current && (!currentLogo.logoNumber || currentLogo.logoNumber.trim() === "")) {
      needsUpdate.logoNumber = preservedLogoNumberRef.current;
      shouldUpdate = true;
    }

    // Atualizar currentLogo se necessário
    if (shouldUpdate) {
      const updatedCurrentLogo = {
        ...currentLogo,
        ...needsUpdate,
      };
      const updatedLogoDetails = {
        ...logoDetails,
        currentLogo: updatedCurrentLogo,
        logos: savedLogos,
      };
      onInputChange("logoDetails", updatedLogoDetails);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLogo]); // Executar quando currentLogo mudar

  // Sincronizar valores do Formik quando currentLogo mudar (especialmente para campos que podem ser atualizados externamente)
  // IMPORTANTE: Não sincronizar logoName aqui para evitar conflitos com a digitação do usuário
  // O logoName é gerenciado diretamente pelo updateField através do onChange
  React.useEffect(() => {
    if (currentLogo.fixationType !== formik.values.fixationType) {
      formik.setFieldValue("fixationType", currentLogo.fixationType || "");
    }
    if (currentLogo.description !== formik.values.description) {
      formik.setFieldValue("description", currentLogo.description || "");
    }
    // Removido logoName da sincronização automática para evitar conflitos com digitação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLogo.fixationType, currentLogo.description]);

  // Helper para atualizar logoDetails completo (mantém compatibilidade)
  // IMPORTANTE: Preservar todos os valores do formik para não perder dados durante atualizações
  const handleUpdate = React.useCallback((key, value) => {
    // Usar valores do formik como base para preservar todos os campos preenchidos
    const updatedCurrentLogo = {
      ...currentLogo,
      // Preservar valores do formik (que podem ter sido digitados mas ainda não sincronizados)
      logoName: formik.values.logoName || currentLogo.logoName || "",
      description: formik.values.description || currentLogo.description || "",
      logoNumber: formik.values.logoNumber || currentLogo.logoNumber || "",
      requestedBy: formik.values.requestedBy || currentLogo.requestedBy || "",
      budget: formik.values.budget || currentLogo.budget || "",
      fixationType: formik.values.fixationType || currentLogo.fixationType || "",
      // Atualizar o campo específico
      [key]: value
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos, // Preserve saved logos
    };
    onInputChange("logoDetails", updatedLogoDetails);
    // NÃO sincronizar com Formik aqui - o formik já foi atualizado antes de chamar handleUpdate
    // Isso evita loops infinitos
  }, [currentLogo, formik.values, logoDetails, savedLogos, onInputChange]);

  // Helper melhorado para atualizar dimensões usando Formik
  const handleDimensionUpdate = (dim, field, value) => {
    const dimensions = formik.values.dimensions || {};
    const updatedDimensions = {
      ...dimensions,
      [dim]: {
        ...dimensions[dim],
        [field]: value
      }
    };
    formik.setFieldValue("dimensions", updatedDimensions);
    // Sincronizar com formData global
    handleUpdate("dimensions", updatedDimensions);
  };

  // Handler para selecionar um produto relacionado
  const handleSelectRelatedProduct = (product) => {
    // Extrair dimensões do produto
    const height = product.height || product.specs?.dimensions?.heightM || product.specs?.height;
    const width = product.width || product.specs?.dimensions?.widthM || product.specs?.width;
    const depth = product.depth || product.specs?.dimensions?.depthM || product.specs?.depth;
    const diameter = product.diameter || product.specs?.dimensions?.diameterM || product.specs?.diameter;
    const length = product.length || product.specs?.dimensions?.lengthM || product.specs?.length;

    // Atualizar estado de seleção
    setSelectedRelatedProductId(product.id);

    // Salvar o ID do produto selecionado no currentLogo
    const updatedCurrentLogo = {
      ...currentLogo,
      selectedRelatedProductId: product.id,
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);

    // Atualizar dimensões do logo com as dimensões do produto selecionado
    const updatedDimensions = {
      ...formik.values.dimensions,
    };

    if (height) {
      updatedDimensions.height = {
        ...updatedDimensions.height,
        value: parseFloat(height)
      };
    }
    if (width) {
      updatedDimensions.width = {
        ...updatedDimensions.width,
        value: parseFloat(width)
      };
    }
    // Depth mapeia para length (comprimento)
    if (depth) {
      updatedDimensions.length = {
        ...updatedDimensions.length,
        value: parseFloat(depth)
      };
    } else if (length) {
      // Se não tem depth mas tem length, usar length
      updatedDimensions.length = {
        ...updatedDimensions.length,
        value: parseFloat(length)
      };
    }
    if (diameter) {
      updatedDimensions.diameter = {
        ...updatedDimensions.diameter,
        value: parseFloat(diameter)
      };
    }

    // Atualizar dimensões no formik
    formik.setFieldValue("dimensions", updatedDimensions);
    handleUpdate("dimensions", updatedDimensions);
  };

  // Handlers para Composition
  const handleCompositionUpdate = (type, index, field, value) => {
    const newComposition = { ...composition };
    if (!newComposition[type]) {
      newComposition[type] = [];
    }
    const newArray = [...newComposition[type]];

    if (!newArray[index]) {
      newArray[index] = {};
    }

    // Guardar estado anterior para verificar se ficou completo
    const estadoAnterior = { ...newArray[index] };

    newArray[index] = {
      ...newArray[index],
      [field]: value
    };

    // Se estamos atualizando componenteId, resetar cor e combinação
    if (field === "componenteId") {
      const componente = getComponenteById(value);
      if (componente) {
        newArray[index].componenteNome = componente.nome;
        newArray[index].componenteReferencia = componente.referencia;

        // Se semCor === true, verificar se há apenas uma combinação disponível
        if (componente.semCor) {
          // Verificar se há apenas uma cor/combinação disponível para este componente
          const coresDisponiveis = getCoresByComponente(value);

          if (coresDisponiveis.length === 1) {
            // Se há apenas uma cor disponível, usar automaticamente
            const corUnica = coresDisponiveis[0];
            const combinacao = getCombinacaoByComponenteECor(value, corUnica.id);

            if (combinacao) {
              newArray[index].corId = corUnica.id;
              newArray[index].corNome = corUnica.nome;
              newArray[index].combinacaoId = combinacao.id;
              newArray[index].referencia = combinacao.referencia;
            } else {
              // Se não há combinação, usar referência do componente
              newArray[index].corId = null;
              newArray[index].corNome = null;
              newArray[index].combinacaoId = null;
              newArray[index].referencia = componente.referencia || null;
            }
          } else {
            // Se não há cores ou há múltiplas, usar referência do componente
            newArray[index].corId = null;
            newArray[index].corNome = null;
            newArray[index].combinacaoId = null;
            newArray[index].referencia = componente.referencia || null;
          }
        } else {
          // Se semCor === false, manter cor se já existir, senão limpar
          if (!newArray[index].corId) {
            newArray[index].corId = null;
            newArray[index].corNome = null;
            newArray[index].combinacaoId = null;
            newArray[index].referencia = null;
          }
        }
      }
    }

    // Se estamos atualizando corId, atualizar combinação
    if (field === "corId" && newArray[index].componenteId) {
      if (value) {
        const cor = getCorById(value);
        if (cor) {
          newArray[index].corNome = cor.nome;
          const combinacao = getCombinacaoByComponenteECor(newArray[index].componenteId, value);
          if (combinacao) {
            newArray[index].combinacaoId = combinacao.id;
            newArray[index].referencia = combinacao.referencia;
          }
        }
      } else {
        newArray[index].corNome = null;
        newArray[index].combinacaoId = null;
        newArray[index].referencia = null;
      }
    }

    newComposition[type] = newArray;

    // Verificar se o componente acabou de ficar completo (só para componentes)
    if (type === "componentes") {
      const componenteAtual = newArray[index];
      const estavaCompleto = isComponenteCompleto(estadoAnterior);
      const ficouCompleto = isComponenteCompleto(componenteAtual);

      // Se acabou de ficar completo e não estava completo antes, adicionar novo componente
      if (ficouCompleto && !estavaCompleto) {
        newComposition.componentes.push({
          componenteId: null,
          componenteNome: null,
          componenteReferencia: null,
          corId: null,
          corNome: null,
          combinacaoId: null,
          referencia: null
        });
      }
    }

    handleUpdate("composition", newComposition);
  };

  const handleAddComponente = () => {
    const newComposition = { ...composition };
    if (!newComposition.componentes) {
      newComposition.componentes = [];
    }
    newComposition.componentes.push({
      componenteId: null,
      componenteNome: null,
      componenteReferencia: null,
      corId: null,
      corNome: null,
      combinacaoId: null,
      referencia: null
    });
    handleUpdate("composition", newComposition);
  };

  const handleRemoveComponente = (index) => {
    const newComposition = { ...composition };
    if (newComposition.componentes) {
      newComposition.componentes = newComposition.componentes.filter((_, i) => i !== index);
      handleUpdate("composition", newComposition);
      // Limpar estado de busca para o índice removido e ajustar índices
      setComponenteSearchValues(prev => {
        const newValues = {};
        Object.keys(prev).forEach(key => {
          const keyIndex = Number(key);
          if (keyIndex < index) {
            newValues[keyIndex] = prev[key];
          } else if (keyIndex > index) {
            newValues[keyIndex - 1] = prev[key];
          }
          // keyIndex === index é ignorado (removido)
        });
        return newValues;
      });
      // Limpar estado de edição
      setComponentesEditando(prev => {
        const newValues = {};
        Object.keys(prev).forEach(key => {
          const keyIndex = Number(key);
          if (keyIndex < index) {
            newValues[keyIndex] = prev[key];
          } else if (keyIndex > index) {
            newValues[keyIndex - 1] = prev[key];
          }
        });
        return newValues;
      });
    }
  };

  const handleClearAllComponentes = () => {
    const newComposition = { ...composition };
    newComposition.componentes = [];
    handleUpdate("composition", newComposition);
    // Limpar todos os estados de busca e edição
    setComponenteSearchValues({});
    setComponentesEditando({});
  };

  const handleToggleEditComponente = (index) => {
    setComponentesEditando(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    // Limpar busca quando entrar em modo de edição
    setComponenteSearchValues(prev => {
      const newValues = { ...prev };
      delete newValues[index];
      return newValues;
    });
  };

  const handleAddBola = () => {
    const newComposition = { ...composition };
    if (!newComposition.bolas) {
      newComposition.bolas = [];
    }
    newComposition.bolas.push({
      bolaId: null,
      corId: null,
      corNome: null,
      acabamentoId: null,
      acabamentoNome: null,
      tamanhoId: null,
      tamanhoNome: null,
      referencia: null
    });
    handleUpdate("composition", newComposition);
  };

  const handleRemoveBola = (index) => {
    const newComposition = { ...composition };
    if (newComposition.bolas) {
      newComposition.bolas = newComposition.bolas.filter((_, i) => i !== index);
      handleUpdate("composition", newComposition);
      // Limpar estado de edição
      setBolasEditando(prev => {
        const newValues = {};
        Object.keys(prev).forEach(key => {
          const keyIndex = Number(key);
          if (keyIndex < index) {
            newValues[keyIndex] = prev[key];
          } else if (keyIndex > index) {
            newValues[keyIndex - 1] = prev[key];
          }
        });
        return newValues;
      });
    }
  };

  const handleToggleEditBola = (index) => {
    setBolasEditando(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleBolaUpdate = (index, field, value) => {
    const newComposition = { ...composition };
    if (!newComposition.bolas) {
      newComposition.bolas = [];
    }
    const newArray = [...newComposition.bolas];

    if (!newArray[index]) {
      newArray[index] = {};
    }

    // Guardar estado anterior para verificar se ficou completa
    const estadoAnterior = { ...newArray[index] };

    newArray[index] = {
      ...newArray[index],
      [field]: value
    };

    // Atualizar nomes quando IDs mudam
    if (field === "corId") {
      if (value) {
        const cor = getCorById(value);
        if (cor) {
          newArray[index].corNome = cor.nome;
        }
      } else {
        newArray[index].corNome = null;
        newArray[index].acabamentoId = null;
        newArray[index].acabamentoNome = null;
        newArray[index].tamanhoId = null;
        newArray[index].tamanhoNome = null;
        newArray[index].referencia = null;
      }
    }

    if (field === "acabamentoId") {
      if (value) {
        const acabamento = getAcabamentoById(value);
        if (acabamento) {
          newArray[index].acabamentoNome = acabamento.nome;
        }
      } else {
        newArray[index].acabamentoNome = null;
        newArray[index].tamanhoId = null;
        newArray[index].tamanhoNome = null;
        newArray[index].referencia = null;
      }
    }

    if (field === "tamanhoId") {
      if (value) {
        const tamanho = getTamanhoById(value);
        if (tamanho) {
          newArray[index].tamanhoNome = tamanho.nome;
        }
      } else {
        newArray[index].tamanhoNome = null;
        newArray[index].referencia = null;
      }
    }

    // Quando todos os três estão selecionados, buscar a bola
    if (newArray[index].corId && newArray[index].acabamentoId && newArray[index].tamanhoId) {
      const bola = getBolaBySelecao(
        newArray[index].corId,
        newArray[index].acabamentoId,
        newArray[index].tamanhoId
      );
      if (bola) {
        newArray[index].bolaId = bola.id;
        newArray[index].referencia = bola.referencia;
      }
    } else {
      newArray[index].bolaId = null;
      newArray[index].referencia = null;
    }

    // Verificar se a bola acabou de ficar completa (só para bolas)
    const estavaCompleta = isBolaCompleta(estadoAnterior);
    const ficouCompleta = isBolaCompleta(newArray[index]);

    // Se acabou de ficar completa e não estava completa antes, adicionar nova bola
    if (ficouCompleta && !estavaCompleta) {
      newComposition.bolas = newArray;
      newComposition.bolas.push({
        bolaId: null,
        corId: null,
        corNome: null,
        acabamentoId: null,
        acabamentoNome: null,
        tamanhoId: null,
        tamanhoNome: null,
        referencia: null
      });
    } else {
      newComposition.bolas = newArray;
    }

    handleUpdate("composition", newComposition);
  };

  const handleFileDrop = (files) => {
    handleFileUpload(files);
  };

  const handleEditAIGenerated = (index) => {
    // Armazenar o índice do attachment que está sendo editado
    setEditingAttachmentIndex(index);
    // Abrir o AI Assistant Chat
    setIsChatOpen(true);
  };

  // Função para buscar produtos do Stock Catalogue com debounce
  const searchProducts = React.useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setProductSearchResults([]);
      return;
    }

    setIsSearchingProducts(true);
    try {
      const results = await productsAPI.search(query.trim());
      setProductSearchResults(results || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProductSearchResults([]);
    } finally {
      setIsSearchingProducts(false);
    }
  }, []);

  // Debounce da pesquisa de produtos
  React.useEffect(() => {
    if (productSearchTimeoutRef.current) {
      clearTimeout(productSearchTimeoutRef.current);
    }

    if (productSearchValue && productSearchValue.trim().length >= 2) {
      productSearchTimeoutRef.current = setTimeout(() => {
        searchProducts(productSearchValue);
      }, 300);
    } else {
      setProductSearchResults([]);
    }

    return () => {
      if (productSearchTimeoutRef.current) {
        clearTimeout(productSearchTimeoutRef.current);
      }
    };
  }, [productSearchValue, searchProducts]);

  // Ref para rastrear quais produtos já tiveram produtos relacionados gerados
  const hasGeneratedRelatedProductsRef = React.useRef(new Map());

  // Handler para seleção de produto
  const handleProductSelection = (productId) => {
    const selectedProduct = productSearchResults.find(p => p.id === productId);
    if (selectedProduct) {
      // Criar 3 produtos relacionados fictícios com tamanhos diferentes
      // Usar as dimensões do produto base como referência
      const baseHeight = parseFloat(selectedProduct.height) || 0;
      const baseWidth = parseFloat(selectedProduct.width) || 0;
      const baseDepth = parseFloat(selectedProduct.depth) || 0;
      const baseDiameter = parseFloat(selectedProduct.diameter) || 0;
      
      const demoRelatedProducts = [
        {
          id: `${selectedProduct.id}-size-1`,
          name: selectedProduct.name,
          size: "1.5m",
          height: baseHeight ? (baseHeight * 1.5).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 1.5).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 1.5).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 1.5).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
        {
          id: `${selectedProduct.id}-size-2`,
          name: selectedProduct.name,
          size: "2.0m",
          height: baseHeight ? (baseHeight * 2.0).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 2.0).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 2.0).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 2.0).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
        {
          id: `${selectedProduct.id}-size-3`,
          name: selectedProduct.name,
          size: "2.5m",
          height: baseHeight ? (baseHeight * 2.5).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 2.5).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 2.5).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 2.5).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
      ];

      // Atualizar currentLogo com o produto selecionado
      const updatedCurrentLogo = {
        ...currentLogo,
        isModification: true,
        baseProductId: selectedProduct.id,
        baseProduct: selectedProduct,
        relatedProducts: demoRelatedProducts,
        productSizes: [], // Não usado mais, tamanhos estão nos produtos relacionados
      };
      const updatedLogoDetails = {
        ...logoDetails,
        currentLogo: updatedCurrentLogo,
        logos: savedLogos,
      };
      onInputChange("logoDetails", updatedLogoDetails);

      // Atualizar estados locais
      setRelatedProducts(demoRelatedProducts);
      setProductSizes([]);
      
      // Marcar que produtos relacionados foram gerados para este produto
      if (hasGeneratedRelatedProductsRef.current) {
        hasGeneratedRelatedProductsRef.current.set(selectedProduct.id, true);
      }
      
      // Limpar campo de pesquisa
      setProductSearchValue("");
      setProductSearchResults([]);
    }
  };

  // Handler para limpar seleção de produto
  const handleClearProductSelection = () => {
    const updatedCurrentLogo = {
      ...currentLogo,
      baseProductId: null,
      baseProduct: null,
      relatedProducts: [],
      productSizes: [],
      selectedRelatedProductId: null,
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);
    setProductSearchValue("");
    setProductSearchResults([]);
    setRelatedProducts([]);
    setProductSizes([]);
    setSelectedRelatedProductId(null);
    // Resetar o ref de produtos gerados para este produto
    if (currentLogo.baseProductId && hasGeneratedRelatedProductsRef.current) {
      hasGeneratedRelatedProductsRef.current.delete(currentLogo.baseProductId);
    }
  };

  // Sincronizar estados locais com currentLogo quando produto é carregado
  // E gerar produtos relacionados de demo se necessário
  React.useEffect(() => {
    if (currentLogo.baseProduct) {
      const productId = currentLogo.baseProduct.id;
      const hasGenerated = hasGeneratedRelatedProductsRef.current.get(productId) || false;
      
      // Se já tem produtos relacionados, usar eles
      if (currentLogo.relatedProducts && currentLogo.relatedProducts.length > 0) {
        setRelatedProducts(currentLogo.relatedProducts);
        // Restaurar seleção se houver um produto relacionado selecionado
        if (currentLogo.selectedRelatedProductId) {
          setSelectedRelatedProductId(currentLogo.selectedRelatedProductId);
        }
        hasGeneratedRelatedProductsRef.current.set(productId, true);
      } else if (!hasGenerated) {
        // Se não tem produtos relacionados mas tem produto base, gerar demo apenas uma vez por produto
        const selectedProduct = currentLogo.baseProduct;
        // Usar as dimensões do produto base como referência
        const baseHeight = parseFloat(selectedProduct.height) || 0;
        const baseWidth = parseFloat(selectedProduct.width) || 0;
        const baseDepth = parseFloat(selectedProduct.depth) || 0;
        const baseDiameter = parseFloat(selectedProduct.diameter) || 0;
        
        const demoRelatedProducts = [
          {
            id: `${selectedProduct.id}-size-1`,
            name: selectedProduct.name,
            size: "1.5m",
            height: baseHeight ? (baseHeight * 1.5).toFixed(2) : null,
            width: baseWidth ? (baseWidth * 1.5).toFixed(2) : null,
            depth: baseDepth ? (baseDepth * 1.5).toFixed(2) : null,
            diameter: baseDiameter ? (baseDiameter * 1.5).toFixed(2) : null,
            imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
            baseProductId: selectedProduct.id,
          },
          {
            id: `${selectedProduct.id}-size-2`,
            name: selectedProduct.name,
            size: "2.0m",
            height: baseHeight ? (baseHeight * 2.0).toFixed(2) : null,
            width: baseWidth ? (baseWidth * 2.0).toFixed(2) : null,
            depth: baseDepth ? (baseDepth * 2.0).toFixed(2) : null,
            diameter: baseDiameter ? (baseDiameter * 2.0).toFixed(2) : null,
            imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
            baseProductId: selectedProduct.id,
          },
          {
            id: `${selectedProduct.id}-size-3`,
            name: selectedProduct.name,
            size: "2.5m",
            height: baseHeight ? (baseHeight * 2.5).toFixed(2) : null,
            width: baseWidth ? (baseWidth * 2.5).toFixed(2) : null,
            depth: baseDepth ? (baseDepth * 2.5).toFixed(2) : null,
            diameter: baseDiameter ? (baseDiameter * 2.5).toFixed(2) : null,
            imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
            baseProductId: selectedProduct.id,
          },
        ];
        setRelatedProducts(demoRelatedProducts);
        hasGeneratedRelatedProductsRef.current.set(productId, true);
        
        // Atualizar currentLogo com os produtos relacionados gerados
        const updatedCurrentLogo = {
          ...currentLogo,
          relatedProducts: demoRelatedProducts,
        };
        const updatedLogoDetails = {
          ...logoDetails,
          currentLogo: updatedCurrentLogo,
          logos: savedLogos,
        };
        onInputChange("logoDetails", updatedLogoDetails);
      }
      setProductSizes(currentLogo.productSizes || []);
    } else {
      setRelatedProducts([]);
      setProductSizes([]);
      setSelectedRelatedProductId(null);
    }
  }, [currentLogo.baseProduct?.id, currentLogo.relatedProducts?.length]);

  // Handler para mudança do switch de modificação
  const handleModificationToggle = (isModification) => {
    const updatedCurrentLogo = {
      ...currentLogo,
      isModification: isModification,
      baseProductId: isModification ? currentLogo.baseProductId : null,
      baseProduct: isModification ? currentLogo.baseProduct : null,
      relatedProducts: isModification ? (currentLogo.relatedProducts || []) : [],
      productSizes: isModification ? (currentLogo.productSizes || []) : [],
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);

    if (!isModification) {
      // Limpar pesquisa quando desativar
      setProductSearchValue("");
      setProductSearchResults([]);
      setRelatedProducts([]);
      setProductSizes([]);
    }
  };

  const handleRemoveAttachment = (index) => {
    // Remove attachments from currentLogo, not logoDetails (each logo has its own attachments)
    const currentAttachments = currentLogo.attachmentFiles || [];
    const newAttachments = currentAttachments.filter((_, i) => i !== index);

    const updatedCurrentLogo = {
      ...currentLogo,
      attachmentFiles: newAttachments,
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);
  };

  // Persistência automática dos dados do logo (PWA)
  useLogoPersistence({
    logoDetails: logoDetails,
    formData: formData,
    onInputChange: onInputChange,
    saveStatus: saveStatus
  });

  // Validação por página
  const validatePage = (pageNumber) => {
    switch (pageNumber) {
      case 1: // Details & Attachments
        // Validar apenas campos visíveis nesta página (Logo Number, Requested By e Criteria são guardados mas não visíveis aqui)
        const hasLogoName = formik.values.logoName?.trim() !== "";
        const hasDescription = formik.values.description?.trim() !== "";
        return hasLogoName && hasDescription;
      case 2: // Dimensions & Fixation
        // Validar pelo menos uma dimensão preenchida
        const dimensions = formik.values.dimensions || {};
        const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "" && !isNaN(parseFloat(dimensions.height.value));
        const hasLength = dimensions.length?.value != null && dimensions.length.value !== "" && !isNaN(parseFloat(dimensions.length.value));
        const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "" && !isNaN(parseFloat(dimensions.width.value));
        const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "" && !isNaN(parseFloat(dimensions.diameter.value));
        const hasDimension = hasHeight || hasLength || hasWidth || hasDiameter;
        // Validar que Fixation Type está selecionado
        const hasFixationType = formik.values.fixationType?.trim() !== "";
        return hasDimension && hasFixationType;
      case 3: // Composition
        // Sem validação obrigatória (pode estar vazio)
        return true;
      case 4: // Summary
        // Sem validação (já passou pelas outras páginas)
        return true;
      default:
        return true;
    }
  };

  const canProceedToNext = () => {
    return validatePage(currentPage);
  };

  const handleNextPage = () => {
    // Marcar campos como touched antes de validar para mostrar erros
    if (currentPage === 1) {
      formik.setFieldTouched("logoName", true);
      formik.setFieldTouched("description", true);
    } else if (currentPage === 2) {
      // Marcar dimensões como touched
      formik.setFieldTouched("dimensions", true);
      ['height', 'length', 'width', 'diameter'].forEach(key => {
        formik.setFieldTouched(`dimensions.${key}.value`, true);
      });
      // Marcar fixationType como touched
      formik.setFieldTouched("fixationType", true);
    }
    
    if (canProceedToNext() && currentPage < logoSteps.length) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleStepClick = (stepNumber) => {
    // Permitir navegar para qualquer step anterior ou o atual
    // Para steps futuros, só permitir se o step atual for válido
    if (stepNumber <= currentPage || (stepNumber === currentPage + 1 && canProceedToNext())) {
      setCurrentPage(stepNumber);
      if (onInternalPageChange) {
        onInternalPageChange(stepNumber);
      }
      window.scrollTo(0, 0);
    }
  };

  const handleFinish = async () => {
    // Finalizar e salvar o logo atual antes de navegar
    if (!canProceedToNext() || isFinishing) {
      return; // Não prosseguir se a página atual não for válida ou já estiver processando
    }

    setIsFinishing(true);
    try {
      // Salvar antes de avançar se estiver editando um projeto existente
      if (projectId && onSave) {
        try {
          await onSave();
        } catch (saveError) {
          console.error('❌ Erro ao salvar antes de avançar:', saveError);
          // Continuar mesmo se houver erro no save (pode ser um problema temporário)
          // O erro já foi mostrado no saveStatus
        }
      }
      
      // Navegar para o próximo passo
      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error('❌ Erro ao processar Finish:', error);
      // Não bloquear a UI, o erro já foi mostrado
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNewLogo = () => {
    // Só salvar o logo atual se ele for válido
    let updatedSavedLogos = [...savedLogos];
    
    if (isCurrentLogoValid()) {
      // Guardar _originalIndex antes de remover (é apenas para controle interno)
      const originalIndex = currentLogo._originalIndex;
      
      // Remover _originalIndex antes de salvar (é apenas para controle interno)
      const { _originalIndex, ...logoWithoutOriginalIndex } = currentLogo;
      
      const logoToSave = {
        ...logoWithoutOriginalIndex,
        id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        savedAt: currentLogo.savedAt || new Date().toISOString()
      };

      // Verificar se o logo já existe nos savedLogos (por ID ou logoNumber)
      const existingLogoIndex = savedLogos.findIndex(logo => {
        // Se currentLogo tem ID, comparar por ID (mais confiável)
        if (logoToSave.id && logo.id) {
          return logo.id === logoToSave.id;
        }
        // Se não tem ID, comparar por logoNumber
        if (logo.logoNumber && logoToSave.logoNumber) {
          return logo.logoNumber.trim() === logoToSave.logoNumber.trim();
        }
        return false;
      });

      if (existingLogoIndex >= 0) {
        // Logo já existe - ATUALIZAR em vez de criar novo
        updatedSavedLogos[existingLogoIndex] = logoToSave;
      } else if (originalIndex !== undefined && originalIndex >= 0 && originalIndex < savedLogos.length) {
        // Logo não existe mas tem posição original válida - INSERIR na posição original
        updatedSavedLogos.splice(originalIndex, 0, logoToSave);
      } else {
        // Logo não existe e não tem posição original - ADICIONAR como novo no final
        updatedSavedLogos.push(logoToSave);
      }
    }
    
    // Resetar refs para permitir preenchimento automático novamente
    logoNumberInitialized.current = false;
    requestedByAutoFilled.current = false;
    
    // Criar um novo logo vazio
    const newLogo = {
      id: null,
      logoNumber: "",
      logoName: "",
      description: "",
      budget: "",
      requestedBy: userName || "",
      criteria: "",
      dimensions: {},
      usageIndoor: true,
      usageOutdoor: false,
      fixationType: "",
      lacqueredStructure: false,
      lacquerColor: "",
      maxWeightConstraint: false,
      maxWeight: "",
      ballast: false,
      controlReport: false,
      composition: { componentes: [], bolas: [] },
      attachmentFiles: [],
      isModification: false,
      baseProductId: null,
      baseProduct: null,
    };

    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: newLogo,
      logos: updatedSavedLogos, // Usar savedLogos atualizado (com o logo anterior salvo)
    };

    onInputChange("logoDetails", updatedLogoDetails);
    setCurrentPage(1); // Voltar para a primeira página
    if (onInternalPageChange) {
      onInternalPageChange(1);
    }
    window.scrollTo(0, 0);
  };

  // Função para renderizar página 1: Details & Attachments
  const renderDetailsAndAttachments = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
        {/* Details Section */}
        <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10 flex flex-col overflow-hidden`}>
          <div className={`flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 flex-shrink-0`}>
            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Icon icon="lucide:file-signature" className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold">Details</h2>
          </div>

          <div className={`flex-1 overflow-y-auto space-y-1.5`}>
            {/* Logo Number, Requested By e Criteria são guardados mas não mostrados aqui - só no Summary */}
            
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Logo Name</label>
              <Input
                placeholder="Enter logo name"
                variant="bordered"
                size="sm"
                isRequired
                aria-label="Logo Name"
                value={formik.values.logoName}
                onValueChange={(v) => formik.updateField("logoName", v)}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.logoName && !!formik.errors.logoName}
                errorMessage={formik.touched.logoName && formik.errors.logoName}
                classNames={{ input: "text-xs", inputWrapper: "h-8" }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Description</label>
              <Textarea
                placeholder="Enter description..."
                minRows={2}
                variant="bordered"
                size="sm"
                isRequired
                aria-label="Description"
                value={formik.values.description}
                onValueChange={(v) => formik.updateField("description", v)}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.description && !!formik.errors.description}
                errorMessage={formik.touched.description && formik.errors.description}
                classNames={{ input: "text-xs" }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">
                Budget (EUR)
              </label>
              <Input
                placeholder="0,00"
                variant="bordered"
                size="sm"
                type="text"
                startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">€</span>}
                value={formik.values.budget || ""}
                onValueChange={(v) => {
                  let cleaned = v.replace(/[^\d,]/g, '');
                  cleaned = cleaned.replace(/\./g, ',');
                  const parts = cleaned.split(',');
                  if (parts.length > 2) {
                    cleaned = parts[0] + ',' + parts.slice(1).join('');
                  }
                  if (parts.length === 2 && parts[1].length > 2) {
                    cleaned = parts[0] + ',' + parts[1].substring(0, 2);
                  }
                  if (parts[0] && parts[0].length > 3) {
                    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    cleaned = parts.length > 1 ? integerPart + ',' + parts[1] : integerPart;
                  }
                  formik.updateField("budget", cleaned);
                }}
                onBlur={(e) => {
                  const value = formik.values.budget || "";
                  if (value) {
                    let cleaned = value.replace(/\s/g, '');
                    const parts = cleaned.split(',');
                    if (parts.length === 1 && parts[0]) {
                      cleaned = parts[0] + ',00';
                    } else if (parts.length === 2 && parts[1].length === 1) {
                      cleaned = parts[0] + ',' + parts[1] + '0';
                    } else if (parts.length === 2 && parts[1].length === 0) {
                      cleaned = parts[0] + ',00';
                    }
                    const finalParts = cleaned.split(',');
                    if (finalParts[0] && finalParts[0].length > 3) {
                      const integerPart = finalParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                      cleaned = finalParts.length > 1 ? integerPart + ',' + finalParts[1] : integerPart;
                    }
                    formik.updateField("budget", cleaned);
                  }
                  formik.handleBlur(e);
                }}
                isInvalid={formik.touched.budget && !!formik.errors.budget}
                errorMessage={formik.touched.budget && formik.errors.budget}
                classNames={{ input: "text-xs", inputWrapper: "h-8" }}
              />
            </div>

            {/* Logo Modification Section */}
            <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Switch
                  size="sm"
                  isSelected={currentLogo.isModification || false}
                  onValueChange={handleModificationToggle}
                  classNames={{
                    base: "max-w-fit",
                    wrapper: "group-data-[selected=true]:bg-primary-500",
                    label: "text-xs font-semibold text-gray-700 dark:text-gray-200"
                  }}
                >
                  <span className="text-xs">Is this logo a modification of an existing product?</span>
                </Switch>
              </div>

              {currentLogo.isModification && (
                <div className="space-y-3 mt-3">
                  {/* Product Search - manter código existente */}
                  <div>
                    <label className="text-xs sm:text-sm md:text-base lg:text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-1">Search Product from Stock Catalogue</label>
                    <AutocompleteWithMarquee
                      aria-label="Search Product from Stock Catalogue"
                      placeholder="Search products..."
                      size="sm"
                      variant="bordered"
                      selectedKey={currentLogo.baseProductId || null}
                      inputValue={productSearchValue !== "" ? productSearchValue : (currentLogo.baseProduct ? currentLogo.baseProduct.name : "")}
                      onSelectionChange={(key) => {
                        if (key) {
                          handleProductSelection(key);
                        } else {
                          handleClearProductSelection();
                        }
                      }}
                      onInputChange={(value) => {
                        setProductSearchValue(value);
                        if (value === "" && currentLogo.baseProductId) {
                          handleClearProductSelection();
                        }
                      }}
                      defaultItems={productSearchResults}
                      menuTrigger="input"
                      isLoading={isSearchingProducts}
                      startContent={<Icon icon="lucide:search" className="w-3 h-3 text-gray-500" />}
                      endContent={
                        currentLogo.baseProductId && !productSearchValue ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearProductSelection();
                            }}
                            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Clear selection"
                          >
                            <Icon icon="lucide:x" className="w-3 h-3 text-gray-500" />
                          </button>
                        ) : null
                      }
                      allowsCustomValue={false}
                      classNames={{ 
                        listboxWrapper: "max-h-[300px]", 
                        trigger: "text-xs h-8", 
                        input: "text-xs" 
                      }}
                    >
                      {(product) => (
                        <AutocompleteItem 
                          key={product.id} 
                          textValue={`${product.name} ${product.type || ""}`}
                        >
                          <div className="flex flex-col">
                            <div className="text-sm font-medium">{product.name}</div>
                            {product.type && (
                              <div className="text-xs text-gray-500">{product.type}</div>
                            )}
                          </div>
                        </AutocompleteItem>
                      )}
                    </AutocompleteWithMarquee>
                  </div>

                  {/* Related Products - manter código existente se necessário */}
                  {currentLogo.baseProduct && relatedProducts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:package" className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <label className="text-xs sm:text-sm md:text-base lg:text-sm font-semibold text-gray-700 dark:text-gray-200">Related Products</label>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {relatedProducts.map((product, idx) => {
                            const isSelected = selectedRelatedProductId === product.id;
                            return (
                              <div 
                                key={product.id || idx} 
                                onClick={() => handleSelectRelatedProduct(product)}
                                className={`
                                  p-2 rounded-lg border space-y-1.5 cursor-pointer transition-all
                                  ${isSelected 
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400 shadow-md' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
                                  }
                                `}
                              >
                                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{product.name || product}</div>
                                {/* Dimensões */}
                                {(() => {
                                  // Extrair dimensões de diferentes formatos possíveis
                                  const height = product.height || product.specs?.dimensions?.heightM || product.specs?.height;
                                  const width = product.width || product.specs?.dimensions?.widthM || product.specs?.width;
                                  const depth = product.depth || product.specs?.dimensions?.depthM || product.specs?.depth;
                                  const diameter = product.diameter || product.specs?.dimensions?.diameterM || product.specs?.diameter;
                                  
                                  if (height || width || depth || diameter) {
                                    return (
                                      <div className="space-y-0.5 text-xs">
                                        {height && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">H:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{Number(height).toFixed(2)}m</span>
                                          </div>
                                        )}
                                        {width && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">W:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{Number(width).toFixed(2)}m</span>
                                          </div>
                                        )}
                                        {depth && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">D:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{Number(depth).toFixed(2)}m</span>
                                          </div>
                                        )}
                                        {diameter && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Ø:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{Number(diameter).toFixed(2)}m</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                {isSelected && (
                                  <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 text-xs">
                                    <Icon icon="lucide:check-circle" className="w-3 h-3" />
                                    <span className="font-medium">Selected</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10 flex flex-col overflow-hidden`}>
          <div className={`flex items-center justify-between mb-2 flex-shrink-0`}>
            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
              <div className="p-1 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <Icon icon="lucide:paperclip" className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold">Attachments</h2>
            </div>
            {!isCompact && (
              <Button
                color="primary"
                variant="solid"
                size="sm"
                className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-medium text-xs shadow-lg h-7"
                startContent={<Icon icon="lucide:sparkles" className="w-3 h-3" />}
                onPress={() => setIsChatOpen(true)}
              >
                AI Assistant
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50/50 dark:bg-gray-700/50 hover:border-pink-300 dark:hover:border-pink-700 transition-colors">
            {currentLogo.attachmentFiles && currentLogo.attachmentFiles.length > 0 ? (
              <div className="space-y-2">
                {currentLogo.attachmentFiles.map((file, index) => (
                  <AttachmentItem
                    key={index}
                    file={file}
                    index={index}
                    onRemove={handleRemoveAttachment}
                    onEdit={handleEditAIGenerated}
                  />
                ))}
                <input
                  type="file"
                  id="file-upload-more"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                />
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  fullWidth
                  className="mt-1 font-medium"
                  startContent={<Icon icon="lucide:upload" className="w-4 h-4" />}
                  onPress={() => document.getElementById('file-upload-more').click()}
                >
                  Add More Files
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <div className="p-1.5 bg-pink-50 dark:bg-pink-900/20 rounded-full mb-1.5">
                  <Icon icon="lucide:cloud-upload" className="w-5 h-5 text-pink-500" />
                </div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-0.5">Upload Files</h4>
                <p className="text-xs text-gray-500 mb-2">Drag & drop or click to upload</p>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                />
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="font-medium px-6"
                  onPress={() => document.getElementById('file-upload').click()}
                >
                  Select Files
                </Button>
                <p className="text-xs text-gray-400 mt-2">Supported: PNG, JPG, PDF</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Função para renderizar página 2: Dimensions & Fixation
  const renderDimensions = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Dimensions Section */}
        <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-1.5' : 'p-1.5'} shadow-xl border border-white/10`}>
          <div className={`flex items-center gap-2 mb-1.5 text-emerald-600 dark:text-emerald-400`}>
            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Icon icon="lucide:ruler" className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold">Dimensions</h2>
          </div>

          <div className="overflow-x-hidden">
            <div className="grid grid-cols-2 gap-2 min-w-0">
              {['Height', 'Length', 'Width', 'Diameter'].map((dim) => {
                const key = dim.toLowerCase();
                const dimensionValue = formik.values.dimensions?.[key]?.value || "";
                const dimensionError = formik.errors.dimensions?.[key]?.value;
                const isTouched = formik.touched.dimensions?.[key]?.value;

                return (
                  <div key={key} className="p-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm shadow-md min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider truncate">{dim}</label>
                      <Checkbox
                        size="sm"
                        color="danger"
                        classNames={{ 
                          label: "text-xs font-semibold text-gray-800 dark:text-gray-100",
                          wrapper: "before:border-2 before:border-gray-400 dark:before:border-gray-500",
                          icon: "text-white"
                        }}
                        isSelected={formik.values.dimensions?.[key]?.imperative || false}
                        onValueChange={(v) => handleDimensionUpdate(key, "imperative", v)}
                      >
                        <span className="text-xs">Imperative</span>
                      </Checkbox>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      endContent={<span className="text-xs text-gray-700 dark:text-gray-200 font-bold">m</span>}
                      variant="flat"
                      size="sm"
                      classNames={{ inputWrapper: "bg-gray-50 dark:bg-gray-700 h-8", input: "text-xs" }}
                      value={dimensionValue}
                      onValueChange={(v) => {
                        if (!v || v === "" || v === "0" || v === "0.00") {
                          handleDimensionUpdate(key, "value", "");
                        } else {
                          const numValue = parseFloat(v);
                          if (!isNaN(numValue) && numValue > 0) {
                            handleDimensionUpdate(key, "value", numValue);
                          } else {
                            handleDimensionUpdate(key, "value", "");
                          }
                        }
                      }}
                      onBlur={() => {
                        formik.setFieldTouched(`dimensions.${key}.value`, true);
                        formik.setFieldTouched("dimensions", true);
                      }}
                      isInvalid={isTouched && !!dimensionError}
                    />
                  </div>
                );
              })}
            </div>
            {formik.touched.dimensions && formik.errors.dimensions && typeof formik.errors.dimensions === 'string' && (
              <div className="mt-1 text-xs text-danger">
                {formik.errors.dimensions}
              </div>
            )}
          </div>
        </div>

        {/* Fixation Section */}
        <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10`}>
          <div className={`flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400`}>
            <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Icon icon="lucide:hammer" className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold">Fixation</h2>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Usage</label>
              <Tabs
                fullWidth
                size="sm"
                color="primary"
                aria-label="Usage Environment"
                selectedKey={formik.values.usageOutdoor ? "outdoor" : "indoor"}
                onSelectionChange={(key) => {
                  if (key === "indoor") {
                    formik.updateFields({ usageIndoor: true, usageOutdoor: false });
                  } else {
                    formik.updateFields({ usageIndoor: false, usageOutdoor: true });
                  }
                }}
                classNames={{
                  tabList: "p-0.5 bg-gray-100 dark:bg-gray-700",
                  cursor: "shadow-md",
                  tabContent: "font-bold text-xs"
                }}
              >
                <Tab
                  key="indoor"
                  title={
                    <div className="flex items-center gap-1 py-0.5">
                      <Icon icon="lucide:home" className="w-3 h-3" />
                      <span className="text-xs">Indoor</span>
                    </div>
                  }
                />
                <Tab
                  key="outdoor"
                  title={
                    <div className="flex items-center gap-1 py-0.5">
                      <Icon icon="lucide:trees" className="w-3 h-3" />
                      <span className="text-xs">Outdoor</span>
                    </div>
                  }
                />
              </Tabs>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Fixation Type</label>
              <Select
                placeholder="Select fixation type"
                isRequired
                size="sm"
                variant="bordered"
                aria-label="Fixation Type"
                selectedKeys={formik.values.fixationType ? new Set([formik.values.fixationType]) : new Set()}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] || "";
                  formik.updateField("fixationType", selected);
                  formik.setFieldTouched("fixationType", true);
                }}
                onBlur={() => formik.setFieldTouched("fixationType", true)}
                isInvalid={formik.touched.fixationType && (!formik.values.fixationType || formik.values.fixationType.trim() === "")}
                errorMessage={formik.touched.fixationType && (!formik.values.fixationType || formik.values.fixationType.trim() === "") ? "Fixation type is required" : undefined}
                startContent={<Icon icon="lucide:settings-2" className="w-3 h-3 text-gray-500" />}
                classNames={{ trigger: "text-xs h-8" }}
              >
                <SelectItem key="ground" startContent={<Icon icon="lucide:arrow-down-to-line" className="w-3 h-3" />}>Ground</SelectItem>
                <SelectItem key="wall" startContent={<Icon icon="lucide:brick-wall" className="w-3 h-3" />}>Wall</SelectItem>
                <SelectItem key="suspended" startContent={<Icon icon="lucide:arrow-up-to-line" className="w-3 h-3" />}>Suspended</SelectItem>
                <SelectItem key="none" startContent={<Icon icon="lucide:ban" className="w-3 h-3" />}>None</SelectItem>
                <SelectItem key="pole_side">Pole (Side)</SelectItem>
                <SelectItem key="pole_central">Pole (Central)</SelectItem>
                <SelectItem key="special">Special</SelectItem>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Structure Finish</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 p-1.5 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-600/30">
                <div className="flex items-center gap-1.5">
                  <Switch
                    size="sm"
                    color="secondary"
                    isSelected={formik.values.lacqueredStructure}
                    onValueChange={(v) => formik.updateField("lacqueredStructure", v)}
                  />
                  <span className="text-xs font-bold">{t('pages.projectDetails.lacquered', 'Lacquered')}</span>
                </div>
                {formik.values.lacqueredStructure && (
                  <Select
                    placeholder={t('pages.projectDetails.lacquerColor', 'Lacquer Color')}
                    size="sm"
                    variant="flat"
                    className="flex-1 w-full sm:w-auto"
                    selectedKeys={(() => {
                      const colorKeys = ['white', 'gold', 'red', 'blue', 'green', 'pink', 'black'];
                      const savedValue = formik.values.lacquerColor || '';
                      const matchingKey = colorKeys.find(key => {
                        const translatedValue = t(`pages.projectDetails.lacquerColors.${key}`, '');
                        return translatedValue === savedValue || key === savedValue;
                      });
                      return matchingKey ? new Set([matchingKey]) : new Set();
                    })()}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      if (selected) {
                        const translatedValue = t(`pages.projectDetails.lacquerColors.${selected}`, '');
                        formik.updateField("lacquerColor", translatedValue || selected);
                      } else {
                        formik.updateField("lacquerColor", "");
                      }
                    }}
                    classNames={{ 
                      trigger: "text-xs h-8",
                      value: "text-xs"
                    }}
                  >
                    <SelectItem key="white" value="white">
                      {t('pages.projectDetails.lacquerColors.white', 'WHITE RAL 9010')}
                    </SelectItem>
                    <SelectItem key="gold" value="gold">
                      {t('pages.projectDetails.lacquerColors.gold', 'GOLD PANTONE 131C')}
                    </SelectItem>
                    <SelectItem key="red" value="red">
                      {t('pages.projectDetails.lacquerColors.red', 'RED RAL 3000')}
                    </SelectItem>
                    <SelectItem key="blue" value="blue">
                      {t('pages.projectDetails.lacquerColors.blue', 'BLUE RAL 5005')}
                    </SelectItem>
                    <SelectItem key="green" value="green">
                      {t('pages.projectDetails.lacquerColors.green', 'GREEN RAL 6029')}
                    </SelectItem>
                    <SelectItem key="pink" value="pink">
                      {t('pages.projectDetails.lacquerColors.pink', 'PINK RAL 3015')}
                    </SelectItem>
                    <SelectItem key="black" value="black">
                      {t('pages.projectDetails.lacquerColors.black', 'BLACK RAL 9011')}
                    </SelectItem>
                  </Select>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Technical Constraints</label>
              <div className="grid grid-cols-1 gap-1">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 p-1.5 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-600/30">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        size="sm"
                        color="secondary"
                        isSelected={formik.values.maxWeightConstraint}
                        onValueChange={(v) => formik.updateField("maxWeightConstraint", v)}
                      />
                      <span className="text-xs font-bold">{t('pages.projectDetails.maxWeightConstraint', 'Max Weight')}</span>
                    </div>
                    {formik.values.maxWeightConstraint && (
                      <Input
                        placeholder={t('pages.projectDetails.maxWeight', 'Weight (kg)')}
                        size="sm"
                        variant="flat"
                        type="number"
                        min="0"
                        step="0.01"
                        className="flex-1 w-full sm:w-auto"
                        classNames={{ input: "text-xs", inputWrapper: "h-8" }}
                        endContent={<span className="text-xs text-default-400">kg</span>}
                        value={formik.values.maxWeight}
                        onValueChange={(v) => formik.updateField("maxWeight", v)}
                      />
                    )}
                  </div>
                </div>
                <div className={`p-1 rounded-lg border-2 transition-all ${formik.values.ballast ? 'bg-primary-50/80 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800' : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-700/50'}`}>
                  <Checkbox
                    size="sm"
                    classNames={{ label: "text-xs font-medium" }}
                    isSelected={formik.values.ballast}
                    onValueChange={(v) => formik.updateField("ballast", v)}
                  >
                    Ballast Required
                  </Checkbox>
                </div>
                <div className={`p-1 rounded-lg border-2 transition-all ${formik.values.controlReport ? 'bg-primary-50/80 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800' : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-700/50'}`}>
                  <Checkbox
                    size="sm"
                    classNames={{ label: "text-xs font-medium" }}
                    isSelected={formik.values.controlReport}
                    onValueChange={(v) => formik.updateField("controlReport", v)}
                  >
                    Control Report Needed
                  </Checkbox>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Função para renderizar página 3: Composition
  const renderComposition = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Components Section */}
        <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10 flex flex-col`}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 dark:border-gray-600/30 shadow-md gap-2 sm:gap-0 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <Icon icon="lucide:box" className="w-3.5 h-3.5" />
                <h4 className="text-xs font-bold uppercase tracking-wide">Components</h4>
              </div>
              <div className="flex gap-1.5 w-full sm:w-auto">
                {composition.componentes && composition.componentes.length > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    isIconOnly
                    onPress={handleClearAllComponentes}
                    className="bg-white dark:bg-gray-800 h-7 w-7 min-w-7"
                    aria-label="Clear all components"
                  >
                    <Icon icon="lucide:trash-2" className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  color="primary"
                  className="font-medium h-7 text-xs flex-1 sm:flex-initial"
                  startContent={<Icon icon="lucide:plus" className="w-3 h-3" />}
                  onPress={handleAddComponente}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {composition.componentes && composition.componentes.length > 0 ? (
                composition.componentes.map((comp, index) => {
                  const componente = comp.componenteId ? getComponenteById(comp.componenteId) : null;
                  const coresDisponiveis = componente && !componente.semCor
                    ? getCoresByComponente(comp.componenteId)
                    : [];
                  const completo = isComponenteCompleto(comp);
                  const editando = componentesEditando[index];
                  const mostrarApenasReferencia = completo && !editando;
                  const searchValue = componenteSearchValues[index] || "";
                  const componentesFiltrados = filterComponentes(searchValue);
                  const displayValue = componente
                    ? `${componente.nome}${componente.referencia ? ` (${componente.referencia})` : ""} `
                    : "";

                  if (mostrarApenasReferencia) {
                    return (
                      <div key={index} className="p-2 sm:p-2 md:p-2.5 lg:p-2 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0">
                              <div className="text-sm md:text-base lg:text-sm font-bold truncate text-gray-900 dark:text-white">{componente?.nome}</div>
                            </div>
                            <div className="text-xs md:text-sm lg:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-xs md:text-sm lg:text-xs">{comp.referencia}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="flat"
                              isIconOnly
                              onPress={() => handleToggleEditComponente(index)}
                              className="h-6 w-6 min-w-6"
                              aria-label={`Edit component ${index + 1}`}
                            >
                              <Icon icon="lucide:pencil" className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              isIconOnly
                              onPress={() => handleRemoveComponente(index)}
                              className="h-6 w-6 min-w-6"
                              aria-label={`Remove component ${index + 1}`}
                            >
                              <Icon icon="lucide:trash-2" className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="p-1.5 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm space-y-1.5 shadow-md">
                      <AutocompleteWithMarquee
                        label="Component"
                        aria-label="Search component"
                        placeholder="Search component"
                        size="sm"
                        variant="bordered"
                        selectedKey={comp.componenteId ? String(comp.componenteId) : null}
                        inputValue={componenteSearchValues[index] || displayValue || ""}
                        onSelectionChange={(key) => {
                          const selectedId = key ? Number(key) : null;
                          handleCompositionUpdate("componentes", index, "componenteId", selectedId);
                          setComponenteSearchValues(prev => {
                            const newValues = { ...prev };
                            delete newValues[index];
                            return newValues;
                          });
                        }}
                        onInputChange={(value) => {
                          setComponenteSearchValues(prev => ({
                            ...prev,
                            [index]: value
                          }));
                        }}
                        defaultItems={componentesFiltrados}
                        menuTrigger="input"
                        startContent={<Icon icon="lucide:search" className="w-3 h-3 text-gray-500" />}
                        allowsCustomValue={false}
                        classNames={{ listboxWrapper: "max-h-[300px]", trigger: "text-xs h-8", input: "text-xs" }}
                      >
                        {(c) => (
                          <AutocompleteItem key={String(c.id)} textValue={`${c.nome} ${c.referencia || ""} `}>
                            <div className="text-xs font-medium">{c.nome}</div>
                            {c.referencia && <div className="text-xs text-gray-500">Ref: {c.referencia}</div>}
                          </AutocompleteItem>
                        )}
                      </AutocompleteWithMarquee>

                      {componente && !componente.semCor && (
                        <SelectWithMarquee
                          label="Color"
                          placeholder="Select color"
                          size="sm"
                          variant="bordered"
                          selectedKeys={comp.corId ? new Set([String(comp.corId)]) : new Set()}
                          onSelectionChange={(keys) => {
                            const selectedId = Array.from(keys)[0];
                            handleCompositionUpdate("componentes", index, "corId", selectedId ? Number(selectedId) : null);
                          }}
                          startContent={<Icon icon="lucide:palette" className="w-3 h-3 text-gray-500" />}
                          classNames={{ trigger: "text-xs h-8" }}
                        >
                          {coresDisponiveis.map((cor) => (
                            <SelectItem key={String(cor.id)} textValue={cor.nome}>
                              {cor.nome}
                            </SelectItem>
                          ))}
                        </SelectWithMarquee>
                      )}

                      <div className="flex gap-1.5 justify-end mt-1">
                        {completo && (
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            className="font-medium h-6 text-xs"
                            startContent={<Icon icon="lucide:check" className="w-3 h-3" />}
                            onPress={() => handleToggleEditComponente(index)}
                          >
                            Done
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          isIconOnly
                          className="h-6 w-6 min-w-6"
                          onPress={() => handleRemoveComponente(index)}
                          aria-label={`Remove component ${index + 1}`}
                        >
                          <Icon icon="lucide:trash-2" className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-white/30 dark:border-gray-600/40 rounded-lg bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm">
                  <Icon icon="lucide:box" className="w-8 h-8 text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400">No components added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Balls Section */}
        <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10 flex flex-col`}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 dark:border-gray-600/30 shadow-md gap-2 sm:gap-0 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <Icon icon="lucide:circle-dot" className="w-3.5 h-3.5" />
                <h4 className="text-xs font-bold uppercase tracking-wide">Balls</h4>
              </div>
              <Button
                size="sm"
                color="primary"
                className="font-medium h-7 text-xs w-full sm:w-auto"
                startContent={<Icon icon="lucide:plus" className="w-3 h-3" />}
                onPress={handleAddBola}
              >
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {composition.bolas && composition.bolas.length > 0 ? (
                composition.bolas.map((bola, index) => {
                  const coresDisponiveis = getCoresDisponiveisBolas();
                  const acabamentosDisponiveis = bola.corId
                    ? getAcabamentosByCorBola(bola.corId)
                    : materialsData.acabamentos;
                  const tamanhosDisponiveis = bola.corId && bola.acabamentoId
                    ? getTamanhosByCorEAcabamentoBola(bola.corId, bola.acabamentoId)
                    : materialsData.tamanhos;
                  const completa = isBolaCompleta(bola);
                  const editando = bolasEditando[index];
                  const mostrarApenasReferencia = completa && !editando;

                  if (mostrarApenasReferencia) {
                    const nomeBola = [bola.corNome, bola.acabamentoNome, bola.tamanhoNome]
                      .filter(Boolean)
                      .join(" - ");

                    return (
                      <div key={index} className="p-1.5 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0">
                              <div className="text-xs font-bold truncate text-gray-900 dark:text-white">{nomeBola}</div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-xs">{bola.referencia}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="flat"
                              isIconOnly
                              onPress={() => handleToggleEditBola(index)}
                              className="h-6 w-6 min-w-6"
                              aria-label={`Edit ball ${index + 1}`}
                            >
                              <Icon icon="lucide:pencil" className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              isIconOnly
                              onPress={() => handleRemoveBola(index)}
                              className="h-6 w-6 min-w-6"
                              aria-label={`Remove ball ${index + 1}`}
                            >
                              <Icon icon="lucide:trash-2" className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="p-1.5 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm space-y-1.5 shadow-md">
                      <div className="flex items-center gap-1.5 mb-0">
                        <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-700">
                          {index + 1}
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Ball Configuration</span>
                      </div>

                      <Select
                        label="Color"
                        placeholder="Select color"
                        size="sm"
                        variant="bordered"
                        selectedKeys={bola.corId ? [String(bola.corId)] : []}
                        onSelectionChange={(keys) => {
                          const selectedId = Array.from(keys)[0];
                          handleBolaUpdate(index, "corId", selectedId ? Number(selectedId) : null);
                        }}
                        classNames={{ trigger: "text-xs h-8" }}
                      >
                        {coresDisponiveis.map((cor) => (
                          <SelectItem key={String(cor.id)}>{cor.nome}</SelectItem>
                        ))}
                      </Select>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <Select
                          label="Finish"
                          placeholder="Finish"
                          size="sm"
                          variant="bordered"
                          selectedKeys={bola.acabamentoId ? [String(bola.acabamentoId)] : []}
                          onSelectionChange={(keys) => {
                            const selectedId = Array.from(keys)[0];
                            handleBolaUpdate(index, "acabamentoId", selectedId ? Number(selectedId) : null);
                          }}
                          isDisabled={!bola.corId}
                          classNames={{ trigger: "text-xs h-8" }}
                        >
                          {acabamentosDisponiveis.map((acabamento) => (
                            <SelectItem key={String(acabamento.id)}>{acabamento.nome}</SelectItem>
                          ))}
                        </Select>

                        <Select
                          label="Size"
                          placeholder="Size"
                          size="sm"
                          variant="bordered"
                          selectedKeys={bola.tamanhoId ? [String(bola.tamanhoId)] : []}
                          onSelectionChange={(keys) => {
                            const selectedId = Array.from(keys)[0];
                            handleBolaUpdate(index, "tamanhoId", selectedId ? Number(selectedId) : null);
                          }}
                          isDisabled={!bola.corId || !bola.acabamentoId}
                          classNames={{ trigger: "text-xs h-8" }}
                        >
                          {tamanhosDisponiveis.map((tamanho) => (
                            <SelectItem key={String(tamanho.id)}>{tamanho.nome}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      <div className="flex gap-1.5 justify-end mt-0.5">
                        {completa && (
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            className="font-medium h-6 text-xs"
                            startContent={<Icon icon="lucide:check" className="w-3 h-3" />}
                            onPress={() => handleToggleEditBola(index)}
                          >
                            Done
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          className="h-6 w-6 min-w-6"
                          onPress={() => handleRemoveBola(index)}
                          aria-label={`Remove ball ${index + 1}`}
                        >
                          <Icon icon="lucide:trash-2" className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-white/30 dark:border-gray-600/40 rounded-lg bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm">
                  <Icon icon="lucide:circle-dashed" className="w-8 h-8 text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400">No balls added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Função para renderizar página 4: Summary (editável)
  const renderSummary = () => {
    // Helper function to check if a value is filled
    const hasValue = (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return value !== 0;
      return true;
    };

    // Helper functions to map filtered indices to original array indices
    const getOriginalComponenteIndex = (filteredIndex) => {
      if (!composition.componentes) return -1;
      let count = 0;
      for (let i = 0; i < composition.componentes.length; i++) {
        if (composition.componentes[i].referencia) {
          if (count === filteredIndex) {
            return i;
          }
          count++;
        }
      }
      return -1;
    };

    const getOriginalBolaIndex = (filteredIndex) => {
      if (!composition.bolas) return -1;
      let count = 0;
      for (let i = 0; i < composition.bolas.length; i++) {
        if (hasBolaData(composition.bolas[i])) {
          if (count === filteredIndex) {
            return i;
          }
          count++;
        }
      }
      return -1;
    };

    // Helper function to build image URL for attachments
    const buildImageUrl = (imageUrl) => {
      if (!imageUrl) return '';
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        try {
          const urlObj = new URL(imageUrl);
          imageUrl = urlObj.pathname;
        } catch (e) {
          const match = imageUrl.match(/\/api\/[^\s]+/);
          if (match) imageUrl = match[0];
        }
      }
      if (imageUrl.startsWith('\\\\') || imageUrl.startsWith('//')) {
        const filename = imageUrl.split(/[\\/]/).pop();
        if (filename) imageUrl = `/api/files/${filename}`;
      }
      if (imageUrl && !imageUrl.startsWith('/api/') && imageUrl.startsWith('/')) {
        imageUrl = `/api${imageUrl}`;
      } else if (imageUrl && !imageUrl.startsWith('/')) {
        imageUrl = `/api/files/${imageUrl}`;
      }
      return imageUrl;
    };

    // Get dimensions in correct order: HEIGHT, WIDTH, LENGTH, DIAMETER
    const dimensionOrder = ['height', 'width', 'length', 'diameter'];
    const dimensionLabels = {
      height: 'HEIGHT',
      width: 'WIDTH',
      length: 'LENGTH',
      diameter: 'DIAMETER'
    };

    // Get valid componentes and bolas
    const validComponentes = composition.componentes?.filter(c => c.referencia) || [];
    const validBolas = composition.bolas?.filter(bola => hasBolaData(bola)) || [];

    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Single Card with all sections */}
          <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl border border-white/10 space-y-4`}>
            
            {/* Details Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Icon icon="lucide:file-signature" className="w-4 h-4" />
                <h2 className="text-sm font-bold">Details</h2>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Logo Number</label>
                  <Input
                    placeholder="Enter logo number"
                    variant="bordered"
                    size="sm"
                    value={formik.values.logoNumber || ""}
                    onValueChange={(v) => formik.updateField("logoNumber", v)}
                    classNames={{ input: "text-xs", inputWrapper: "h-8" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Logo Name</label>
                  <Input
                    placeholder="Enter logo name"
                    variant="bordered"
                    size="sm"
                    value={formik.values.logoName || ""}
                    onValueChange={(v) => formik.updateField("logoName", v)}
                    classNames={{ input: "text-xs", inputWrapper: "h-8" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Budget (EUR)</label>
                  <Input
                    placeholder="0,00"
                    variant="bordered"
                    size="sm"
                    type="text"
                    startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">€</span>}
                    value={formik.values.budget || ""}
                    onValueChange={(v) => {
                      let cleaned = v.replace(/[^\d,]/g, '');
                      cleaned = cleaned.replace(/\./g, ',');
                      const parts = cleaned.split(',');
                      if (parts.length > 2) {
                        cleaned = parts[0] + ',' + parts.slice(1).join('');
                      }
                      if (parts.length === 2 && parts[1].length > 2) {
                        cleaned = parts[0] + ',' + parts[1].substring(0, 2);
                      }
                      if (parts[0] && parts[0].length > 3) {
                        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                        cleaned = parts.length > 1 ? integerPart + ',' + parts[1] : integerPart;
                      }
                      formik.updateField("budget", cleaned);
                    }}
                    classNames={{ input: "text-xs", inputWrapper: "h-8" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Requested By</label>
                  <Input
                    placeholder="Enter requester name"
                    variant="bordered"
                    size="sm"
                    value={formik.values.requestedBy || ""}
                    onValueChange={(v) => formik.updateField("requestedBy", v)}
                    classNames={{ input: "text-xs", inputWrapper: "h-8" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Description</label>
                  <Textarea
                    placeholder="Enter description..."
                    minRows={3}
                    variant="bordered"
                    size="sm"
                    value={formik.values.description || ""}
                    onValueChange={(v) => formik.updateField("description", v)}
                    classNames={{ input: "text-xs" }}
                  />
                </div>
              </div>
            </div>

            <Divider />

            {/* Attachments Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                <Icon icon="lucide:paperclip" className="w-4 h-4" />
                <h2 className="text-sm font-bold">Attachments</h2>
              </div>
              <div className="pl-6">
                {currentLogo.attachmentFiles && currentLogo.attachmentFiles.length > 0 ? (
                  <div className="space-y-2">
                    {currentLogo.attachmentFiles.map((file, index) => {
                      const isImage = file.mimetype?.startsWith('image/') || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      const fileUrl = buildImageUrl(file.url || file.path);
                      return (
                        <div key={index} className="relative">
                          {isImage && fileUrl ? (
                            <img 
                              src={fileUrl} 
                              alt={file.name || `Attachment ${index + 1}`}
                              className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <AttachmentItem
                              file={file}
                              index={index}
                              onRemove={handleRemoveAttachment}
                              onEdit={handleEditAIGenerated}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No attachments</p>
                )}
              </div>
            </div>

            <Divider />

            {/* Dimensions Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Icon icon="lucide:ruler" className="w-4 h-4" />
                <h2 className="text-sm font-bold">Dimensions</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-6">
                {dimensionOrder.map((key) => {
                  const dimensionValue = formik.values.dimensions?.[key]?.value || "";
                  const isImperative = formik.values.dimensions?.[key]?.imperative || false;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">{dimensionLabels[key]}</label>
                        <Checkbox
                          size="sm"
                          color="danger"
                          classNames={{ 
                            wrapper: isImperative ? "before:border-danger" : "",
                            icon: "text-white"
                          }}
                          isSelected={isImperative}
                          onValueChange={(v) => handleDimensionUpdate(key, "imperative", v)}
                        >
                          <span className="text-xs">Imperative</span>
                        </Checkbox>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        endContent={<span className="text-xs text-gray-700 dark:text-gray-200 font-bold">m</span>}
                        variant="bordered"
                        size="sm"
                        classNames={{ inputWrapper: "bg-gray-50 dark:bg-gray-700 h-8", input: "text-xs" }}
                        value={dimensionValue}
                        onValueChange={(v) => {
                          if (!v || v === "" || v === "0" || v === "0.00") {
                            handleDimensionUpdate(key, "value", "");
                          } else {
                            const numValue = parseFloat(v);
                            if (!isNaN(numValue) && numValue > 0) {
                              handleDimensionUpdate(key, "value", numValue);
                            } else {
                              handleDimensionUpdate(key, "value", "");
                            }
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Divider />

            {/* Fixation & Technical Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Icon icon="lucide:wrench" className="w-4 h-4" />
                <h2 className="text-sm font-bold">Fixation & Technical</h2>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Usage</label>
                  <Tabs
                    fullWidth
                    size="sm"
                    color="primary"
                    selectedKey={formik.values.usageOutdoor ? "outdoor" : "indoor"}
                    onSelectionChange={(key) => {
                      if (key === "indoor") {
                        formik.updateFields({ usageIndoor: true, usageOutdoor: false });
                      } else {
                        formik.updateFields({ usageIndoor: false, usageOutdoor: true });
                      }
                    }}
                    classNames={{
                      tabList: "p-0.5 bg-gray-100 dark:bg-gray-700",
                      cursor: "shadow-md",
                      tabContent: "font-bold text-xs"
                    }}
                  >
                    <Tab
                      key="indoor"
                      title={
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Icon icon="lucide:home" className="w-3 h-3" />
                          <span>Indoor</span>
                        </div>
                      }
                    />
                    <Tab
                      key="outdoor"
                      title={
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Icon icon="lucide:trees" className="w-3 h-3" />
                          <span>Outdoor</span>
                        </div>
                      }
                    />
                  </Tabs>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Structure Finish</label>
                  {formik.values.lacqueredStructure ? (
                    <Input
                      variant="bordered"
                      size="sm"
                      value={formik.values.lacquerColor || ""}
                      onValueChange={(v) => formik.updateField("lacquerColor", v)}
                      classNames={{ input: "text-xs", inputWrapper: "h-8" }}
                      endContent={
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => formik.updateField("lacqueredStructure", false)}
                          className="min-w-6 h-6"
                        >
                          <Icon icon="lucide:x" className="w-3 h-3" />
                        </Button>
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        color="secondary"
                        isSelected={false}
                        onValueChange={(v) => formik.updateField("lacqueredStructure", v)}
                      />
                      <Select
                        placeholder="Select color"
                        size="sm"
                        variant="bordered"
                        selectedKeys={(() => {
                          const colorKeys = ['white', 'gold', 'red', 'blue', 'green', 'pink', 'black'];
                          const savedValue = formik.values.lacquerColor || '';
                          const matchingKey = colorKeys.find(key => {
                            const translatedValue = t(`pages.projectDetails.lacquerColors.${key}`, '');
                            return translatedValue === savedValue || key === savedValue;
                          });
                          return matchingKey ? new Set([matchingKey]) : new Set();
                        })()}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0];
                          if (selected) {
                            const translatedValue = t(`pages.projectDetails.lacquerColors.${selected}`, '');
                            formik.updateField("lacquerColor", translatedValue || selected);
                            formik.updateField("lacqueredStructure", true);
                          }
                        }}
                        classNames={{ trigger: "text-xs h-8" }}
                      >
                        <SelectItem key="white" value="white">
                          {t('pages.projectDetails.lacquerColors.white', 'WHITE RAL 9010')}
                        </SelectItem>
                        <SelectItem key="gold" value="gold">
                          {t('pages.projectDetails.lacquerColors.gold', 'GOLD PANTONE 131C')}
                        </SelectItem>
                        <SelectItem key="red" value="red">
                          {t('pages.projectDetails.lacquerColors.red', 'RED RAL 3000')}
                        </SelectItem>
                        <SelectItem key="blue" value="blue">
                          {t('pages.projectDetails.lacquerColors.blue', 'BLUE RAL 5005')}
                        </SelectItem>
                        <SelectItem key="green" value="green">
                          {t('pages.projectDetails.lacquerColors.green', 'GREEN RAL 6029')}
                        </SelectItem>
                        <SelectItem key="pink" value="pink">
                          {t('pages.projectDetails.lacquerColors.pink', 'PINK RAL 3015')}
                        </SelectItem>
                        <SelectItem key="black" value="black">
                          {t('pages.projectDetails.lacquerColors.black', 'BLACK RAL 9011')}
                        </SelectItem>
                      </Select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Fixation Type</label>
                  <Select
                    placeholder="Select fixation type"
                    size="sm"
                    variant="bordered"
                    selectedKeys={formik.values.fixationType ? new Set([formik.values.fixationType]) : new Set()}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] || "";
                      formik.updateField("fixationType", selected);
                    }}
                    startContent={<Icon icon="lucide:settings-2" className="w-3 h-3 text-gray-500" />}
                    classNames={{ trigger: "text-xs h-8" }}
                  >
                    <SelectItem key="ground" startContent={<Icon icon="lucide:arrow-down-to-line" className="w-3 h-3" />}>Ground</SelectItem>
                    <SelectItem key="wall" startContent={<Icon icon="lucide:brick-wall" className="w-3 h-3" />}>Wall</SelectItem>
                    <SelectItem key="suspended" startContent={<Icon icon="lucide:arrow-up-to-line" className="w-3 h-3" />}>Suspended</SelectItem>
                    <SelectItem key="none" startContent={<Icon icon="lucide:ban" className="w-3 h-3" />}>None</SelectItem>
                    <SelectItem key="pole_side">Pole (Side)</SelectItem>
                    <SelectItem key="pole_central">Pole (Central)</SelectItem>
                    <SelectItem key="special">Special</SelectItem>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">Technical Constraints</label>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        color="secondary"
                        isSelected={formik.values.maxWeightConstraint || false}
                        onValueChange={(v) => formik.updateField("maxWeightConstraint", v)}
                      />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Restrição de Peso Máx.</span>
                      {formik.values.maxWeightConstraint && (
                        <Input
                          placeholder="Weight (kg)"
                          size="sm"
                          variant="bordered"
                          type="number"
                          min="0"
                          step="0.01"
                          classNames={{ input: "text-xs", inputWrapper: "h-8 w-24" }}
                          endContent={<span className="text-xs text-default-400">kg</span>}
                          value={formik.values.maxWeight || ""}
                          onValueChange={(v) => formik.updateField("maxWeight", v)}
                        />
                      )}
                    </div>
                    <Checkbox
                      size="sm"
                      classNames={{ label: "text-xs font-medium" }}
                      isSelected={formik.values.ballast || false}
                      onValueChange={(v) => formik.updateField("ballast", v)}
                    >
                      Ballast Required
                    </Checkbox>
                    <Checkbox
                      size="sm"
                      classNames={{ label: "text-xs font-medium" }}
                      isSelected={formik.values.controlReport || false}
                      onValueChange={(v) => formik.updateField("controlReport", v)}
                    >
                      Control Report Needed
                    </Checkbox>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* Composition Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Icon icon="lucide:atom" className="w-4 h-4" />
                <h2 className="text-sm font-bold">Composition</h2>
              </div>
              <div className="space-y-3 pl-6">
                {/* Components */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">COMPONENTS</h5>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-semibold">
                        {validComponentes.length}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      color="primary"
                      className="font-medium h-7 text-xs"
                      startContent={<Icon icon="lucide:plus" className="w-3 h-3" />}
                      onPress={handleAddComponente}
                    >
                      Add
                    </Button>
                  </div>
                  {validComponentes.length > 0 ? (
                    <div className="space-y-1.5">
                      {validComponentes.map((comp, filteredIdx) => {
                        const originalIndex = getOriginalComponenteIndex(filteredIdx);
                        if (originalIndex === -1) return null;
                        
                        const componente = comp.componenteId ? getComponenteById(comp.componenteId) : null;
                        const coresDisponiveis = componente && !componente.semCor
                          ? getCoresByComponente(comp.componenteId)
                          : [];
                        const completo = isComponenteCompleto(comp);
                        const editando = componentesEditando[originalIndex];
                        const mostrarApenasReferencia = completo && !editando;
                        const searchValue = componenteSearchValues[originalIndex] || "";
                        const componentesFiltrados = filterComponentes(searchValue);
                        const displayValue = componente
                          ? `${componente.nome}${componente.referencia ? ` (${componente.referencia})` : ""} `
                          : "";

                        if (mostrarApenasReferencia) {
                          return (
                            <div key={originalIndex} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-gray-900 dark:text-white">{componente?.nome || comp.componenteNome}</div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {comp.referencia && (
                                      <>
                                        Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded">{comp.referencia}</span>
                                      </>
                                    )}
                                  </div>
                                  {(comp.corNome || comp.acabamentoNome) && (
                                    <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                                      {comp.corNome && <span>{comp.corNome}</span>}
                                      {comp.corNome && comp.acabamentoNome && <span> - </span>}
                                      {comp.acabamentoNome && <span>{comp.acabamentoNome}</span>}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    isIconOnly
                                    onPress={() => handleToggleEditComponente(originalIndex)}
                                    className="h-6 w-6 min-w-6"
                                  >
                                    <Icon icon="lucide:pencil" className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    isIconOnly
                                    onPress={() => handleRemoveComponente(originalIndex)}
                                    className="h-6 w-6 min-w-6"
                                  >
                                    <Icon icon="lucide:trash-2" className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={originalIndex} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 space-y-1.5">
                            <AutocompleteWithMarquee
                              label="Component"
                              placeholder="Search component"
                              size="sm"
                              variant="bordered"
                              selectedKey={comp.componenteId ? String(comp.componenteId) : null}
                              inputValue={componenteSearchValues[originalIndex] || displayValue || ""}
                              onSelectionChange={(key) => {
                                const selectedId = key ? Number(key) : null;
                                handleCompositionUpdate("componentes", originalIndex, "componenteId", selectedId);
                                setComponenteSearchValues(prev => {
                                  const newValues = { ...prev };
                                  delete newValues[originalIndex];
                                  return newValues;
                                });
                              }}
                              onInputChange={(value) => {
                                setComponenteSearchValues(prev => ({
                                  ...prev,
                                  [originalIndex]: value
                                }));
                              }}
                              defaultItems={componentesFiltrados}
                              menuTrigger="input"
                              startContent={<Icon icon="lucide:search" className="w-3 h-3 text-gray-500" />}
                              allowsCustomValue={false}
                              classNames={{ listboxWrapper: "max-h-[300px]", trigger: "text-xs h-8", input: "text-xs" }}
                            >
                              {(c) => (
                                <AutocompleteItem key={String(c.id)} textValue={`${c.nome} ${c.referencia || ""} `}>
                                  <div className="text-sm font-medium">{c.nome}</div>
                                  {c.referencia && <div className="text-xs text-gray-500">Ref: {c.referencia}</div>}
                                </AutocompleteItem>
                              )}
                            </AutocompleteWithMarquee>

                            {componente && !componente.semCor && (
                              <SelectWithMarquee
                                label="Color"
                                placeholder="Select color"
                                size="sm"
                                variant="bordered"
                                selectedKeys={comp.corId ? new Set([String(comp.corId)]) : new Set()}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleCompositionUpdate("componentes", originalIndex, "corId", selectedId ? Number(selectedId) : null);
                                }}
                                startContent={<Icon icon="lucide:palette" className="w-3 h-3 text-gray-500" />}
                                classNames={{ trigger: "text-xs h-8" }}
                              >
                                {coresDisponiveis.map((cor) => (
                                  <SelectItem key={String(cor.id)} textValue={cor.nome}>
                                    {cor.nome}
                                  </SelectItem>
                                ))}
                              </SelectWithMarquee>
                            )}

                            <div className="flex gap-1.5 justify-end">
                              {completo && (
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  className="font-medium h-6 text-xs"
                                  startContent={<Icon icon="lucide:check" className="w-3 h-3" />}
                                  onPress={() => handleToggleEditComponente(originalIndex)}
                                >
                                  Done
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                isIconOnly
                                className="h-6 w-6 min-w-6"
                                onPress={() => handleRemoveComponente(originalIndex)}
                              >
                                <Icon icon="lucide:trash-2" className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {/* Balls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">BALLS</h5>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-semibold">
                        {validBolas.length}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      color="primary"
                      className="font-medium h-7 text-xs"
                      startContent={<Icon icon="lucide:plus" className="w-3 h-3" />}
                      onPress={handleAddBola}
                    >
                      Add
                    </Button>
                  </div>
                  {validBolas.length > 0 ? (
                    <div className="space-y-1.5">
                      {validBolas.map((bola, filteredIdx) => {
                        const originalIndex = getOriginalBolaIndex(filteredIdx);
                        if (originalIndex === -1) return null;
                        
                        const coresDisponiveis = getCoresDisponiveisBolas();
                        const acabamentosDisponiveis = bola.corId
                          ? getAcabamentosByCorBola(bola.corId)
                          : materialsData.acabamentos;
                        const tamanhosDisponiveis = bola.corId && bola.acabamentoId
                          ? getTamanhosByCorEAcabamentoBola(bola.corId, bola.acabamentoId)
                          : materialsData.tamanhos;
                        const completa = isBolaCompleta(bola);
                        const editando = bolasEditando[originalIndex];
                        const mostrarApenasReferencia = completa && !editando;

                        if (mostrarApenasReferencia) {
                          const nomeBola = [bola.corNome, bola.acabamentoNome, bola.tamanhoNome]
                            .filter(Boolean)
                            .join(" - ");

                          return (
                            <div key={originalIndex} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-gray-900 dark:text-white">{nomeBola || bola.bolaName || `Ball ${filteredIdx + 1}`}</div>
                                  {bola.reference && (
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                      Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded">{bola.reference}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    isIconOnly
                                    onPress={() => handleToggleEditBola(originalIndex)}
                                    className="h-6 w-6 min-w-6"
                                  >
                                    <Icon icon="lucide:pencil" className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    isIconOnly
                                    onPress={() => handleRemoveBola(originalIndex)}
                                    className="h-6 w-6 min-w-6"
                                  >
                                    <Icon icon="lucide:trash-2" className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={originalIndex} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 space-y-1.5">
                            <Select
                              label="Color"
                              placeholder="Select color"
                              size="sm"
                              variant="bordered"
                              selectedKeys={bola.corId ? [String(bola.corId)] : []}
                              onSelectionChange={(keys) => {
                                const selectedId = Array.from(keys)[0];
                                handleBolaUpdate(originalIndex, "corId", selectedId ? Number(selectedId) : null);
                              }}
                              classNames={{ trigger: "text-xs h-8" }}
                            >
                              {coresDisponiveis.map((cor) => (
                                <SelectItem key={String(cor.id)}>{cor.nome}</SelectItem>
                              ))}
                            </Select>

                            <div className="grid grid-cols-2 gap-1.5">
                              <Select
                                label="Finish"
                                placeholder="Finish"
                                size="sm"
                                variant="bordered"
                                selectedKeys={bola.acabamentoId ? [String(bola.acabamentoId)] : []}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleBolaUpdate(originalIndex, "acabamentoId", selectedId ? Number(selectedId) : null);
                                }}
                                isDisabled={!bola.corId}
                                classNames={{ trigger: "text-xs h-8" }}
                              >
                                {acabamentosDisponiveis.map((acabamento) => (
                                  <SelectItem key={String(acabamento.id)}>{acabamento.nome}</SelectItem>
                                ))}
                              </Select>

                              <Select
                                label="Size"
                                placeholder="Size"
                                size="sm"
                                variant="bordered"
                                selectedKeys={bola.tamanhoId ? [String(bola.tamanhoId)] : []}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleBolaUpdate(originalIndex, "tamanhoId", selectedId ? Number(selectedId) : null);
                                }}
                                isDisabled={!bola.corId || !bola.acabamentoId}
                                classNames={{ trigger: "text-xs h-8" }}
                              >
                                {tamanhosDisponiveis.map((tamanho) => (
                                  <SelectItem key={String(tamanho.id)}>{tamanho.nome}</SelectItem>
                                ))}
                              </Select>
                            </div>

                            <div className="flex gap-1.5 justify-end">
                              {completa && (
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  className="font-medium h-6 text-xs"
                                  startContent={<Icon icon="lucide:check" className="w-3 h-3" />}
                                  onPress={() => handleToggleEditBola(originalIndex)}
                                >
                                  Done
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                isIconOnly
                                className="h-6 w-6 min-w-6"
                                onPress={() => handleRemoveBola(originalIndex)}
                              >
                                <Icon icon="lucide:trash-2" className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // Renderizar página atual baseada no estado
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return renderDetailsAndAttachments();
      case 2:
        return renderDimensions();
      case 3:
        return renderComposition();
      case 4:
        return renderSummary();
      default:
        return renderDetailsAndAttachments();
    }
  };

  // Helper para verificar se o logo atual é válido (para o botão New Logo)
  const isCurrentLogoValid = () => {
    const hasLogoNumber = currentLogo.logoNumber?.trim() !== "";
    const hasLogoName = currentLogo.logoName?.trim() !== "";
    const hasDescription = currentLogo.description?.trim() !== "";
    const hasRequestedBy = currentLogo.requestedBy?.trim() !== "";
    const hasFixationType = currentLogo.fixationType?.trim() !== "";
    const dimensions = currentLogo.dimensions || {};
    const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "" && !isNaN(parseFloat(dimensions.height.value)) && parseFloat(dimensions.height.value) >= 0;
    const hasLength = dimensions.length?.value != null && dimensions.length.value !== "" && !isNaN(parseFloat(dimensions.length.value)) && parseFloat(dimensions.length.value) >= 0;
    const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "" && !isNaN(parseFloat(dimensions.width.value)) && parseFloat(dimensions.width.value) >= 0;
    const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "" && !isNaN(parseFloat(dimensions.diameter.value)) && parseFloat(dimensions.diameter.value) >= 0;
    const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
    return hasLogoNumber && hasLogoName && hasDescription && hasRequestedBy && hasFixationType && hasAtLeastOneDimension;
  };

  // Expor funções para o componente pai através de ref
  React.useEffect(() => {
    if (handlersRef) {
      handlersRef.current = {
        handleNextPage,
        handlePrevPage,
        handleNewLogo,
        handleFinish,
        canProceedToNext: canProceedToNext(),
        isCurrentLogoValid: isCurrentLogoValid(),
        isFinishing,
      };
    }
  });

  return (
    <div className={`${isCompact ? 'w-auto h-auto' : 'w-full h-full'} flex flex-col ${isCompact ? 'overflow-visible' : 'overflow-hidden'} ${isCompact ? 'bg-transparent' : 'bg-gradient-to-b from-[#e4e4ec] to-[#d6d4ee] dark:bg-none dark:bg-background'}`}>
      {/* Wizard Navigation - StepIndicator */}
      {!isCompact && (
        <div className="w-full bg-content1 px-3 py-2 border-b border-divider flex-shrink-0">
          <StepIndicator
            steps={logoSteps}
            currentStep={currentPage}
            onStepClick={handleStepClick}
          />
        </div>
      )}

      {/* Form Content - Current Page */}
      <div className={`${isCompact ? 'flex-auto' : 'flex-1'} ${isCompact ? 'overflow-visible' : 'overflow-hidden'} ${isCompact ? 'p-1 sm:p-2' : 'p-2 sm:p-2 md:p-3 lg:p-3'}`}>
        <div className={`${isCompact ? 'h-auto' : 'h-full max-h-[calc(100vh-200px)]'} max-w-7xl mx-auto w-full`}>
          <div className="h-full overflow-y-auto">
            {renderCurrentPage()}
          </div>
        </div>
      </div>

    </div>
  );
};

export default StepLogoInstructions;
