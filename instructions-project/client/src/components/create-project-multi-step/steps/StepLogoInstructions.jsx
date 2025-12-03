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
const AttachmentItem = ({ file, index, onRemove }) => {
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

export function StepLogoInstructions({ formData, onInputChange, saveStatus, isCompact = false }) {
  const logoDetails = formData.logoDetails || {};
  // Support both old structure (direct logoDetails) and new structure (with currentLogo)
  const currentLogo = logoDetails.currentLogo || logoDetails;
  const savedLogos = logoDetails.logos || [];
  const composition = currentLogo.composition || { componentes: [], bolas: [] };

  // Obter nome do usuário atual
  const { userName } = useUser();

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

  // Resetar refs quando um novo logo é criado (quando o ID muda ou quando o logo está vazio)
  React.useEffect(() => {
    const currentLogoId = currentLogo.id || null;
    const isLogoEmpty = !currentLogo.logoNumber && !currentLogo.logoName;

    // Se o ID mudou ou o logo está vazio (novo logo), resetar refs
    if (currentLogoId !== currentLogoIdRef.current || (isLogoEmpty && currentLogoIdRef.current !== null)) {
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
      const match = currentLogo.logoNumber.match(/-L\s*(\d+)$/i);
      if (match) {
        console.log("Logo has ID and valid logoNumber (editing existing logo). Preserving:", currentLogo.logoNumber);
        return currentLogo.logoNumber; // Preservar o número existente
      }
    }

    // Usar o nome do projeto como base
    const baseName = projectName.trim();
    let maxNumber = 0;
    const usedNumbers = new Set();

    // Verificar nos logos salvos - contar todos os logos que começam com o nome do projeto
    console.log("Generating Logo Number. SavedLogos:", savedLogos);
    savedLogos.forEach((logo) => {
      if (logo.logoNumber) {
        // Tentar encontrar o padrão -L<número> no final da string
        // Isso é mais robusto do que startsWith, pois o usuário pode ter alterado o prefixo levemente
        const match = logo.logoNumber.match(/-L\s*(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          console.log("Found logo number:", num, "in", logo.logoNumber);
          usedNumbers.add(num);
          if (num > maxNumber) {
            maxNumber = num;
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
      const match = currentLogo.logoNumber.match(/-L\s*(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        console.log("Found logo number in currentLogo:", num, "in", currentLogo.logoNumber);
        usedNumbers.add(num);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    console.log("Max number found:", maxNumber);

    // Se o logo atual já tem um número válido, não contar ele mesmo (estamos editando)
    // Mas se não tem número ou tem um número diferente, precisamos gerar um novo
    if (currentLogoNumber) {
      const match = currentLogoNumber.match(/-L\s*(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        // Se este número já está nos logos salvos ou no currentLogo, significa que estamos editando este logo
        // Nesse caso, não devemos gerar um novo número, devemos manter o atual
        if (usedNumbers.has(num)) {
          console.log("Current logo number exists in saved logos or currentLogo (editing). Returning:", currentLogoNumber);
          return currentLogoNumber; // Retornar o número atual se já existe
        }
        // Se não está nos salvos mas tem um número, considerar para o máximo
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // Gerar o próximo número sequencial
    // Se maxNumber é 0, significa que não há logos, então começar com L1
    // Se maxNumber é 1, significa que há L1, então o próximo é L2
    // Se maxNumber é 2, significa que há L1 e L2, então o próximo é L3
    const nextNumber = maxNumber + 1;
    console.log("Next number generated:", nextNumber);
    return `${baseName} -L${nextNumber} `;
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
    },
    validationSchema,
    onChange: (field, value) => {
      // Sincronizar com formData global através de currentLogo
      // IMPORTANTE: Preservar TODOS os valores do formik para não perder dados durante atualizações
      const updatedCurrentLogo = {
        ...currentLogo,
        // Preservar TODOS os valores do formik (que podem ter sido digitados mas ainda não sincronizados)
        logoName: formik.values.logoName || currentLogo.logoName || "",
        description: formik.values.description || currentLogo.description || "",
        logoNumber: formik.values.logoNumber || currentLogo.logoNumber || "",
        requestedBy: formik.values.requestedBy || currentLogo.requestedBy || "",
        budget: formik.values.budget || currentLogo.budget || "",
        fixationType: formik.values.fixationType || currentLogo.fixationType || "",
        dimensions: formik.values.dimensions || currentLogo.dimensions || {},
        // Atualizar o campo específico que está sendo alterado
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
          // Só atualizar se o valor preservado for diferente do atual
          if (preservedLogoNumberRef.current !== logoNumberToPreserve) {
            preservedLogoNumberRef.current = logoNumberToPreserve;
            logoNumberInitialized.current = true;
            // Garantir que o formik tem o valor correto (só atualizar se diferente)
            if (formik.values.logoNumber !== logoNumberToPreserve) {
              formik.setFieldValue("logoNumber", logoNumberToPreserve);
            }
            console.log("Preserving existing logo number for editing:", logoNumberToPreserve);
          }
        }
      } else if (!logoNumberInitialized.current) {
        // Se não estamos editando e o logo number não foi inicializado, gerar novo
        const generatedLogoNumber = generateLogoNumber(projectName, currentLogoNumber);

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
              logos: savedLogos,
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

  return (
    <div className={`${isCompact ? 'w-auto h-auto' : 'w-full h-full'} flex flex-col ${isCompact ? 'overflow-visible' : 'overflow-hidden'} ${isCompact ? 'bg-transparent' : 'bg-gradient-to-b from-[#e4e4ec] to-[#d6d4ee] dark:bg-none dark:bg-background'}`}>
      {/* Header - escondido no modo compacto (quando usado em modal) */}
      {!isCompact && (
        <div className={`step-logo-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 px-3 sm:px-4 lg:px-4 py-3 flex-shrink-0 bg-transparent`}>
          <div>
            <h1 className="text-base sm:text-lg lg:text-lg font-bold text-white">Logo Instructions</h1>
            <p className="text-xs text-gray-300/70 hidden sm:block">Define the technical specifications for the logo</p>
          </div>
          <Button
            color="primary"
            variant="solid"
            size="sm"
            className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-medium text-xs w-full sm:w-auto shadow-lg"
            startContent={<Icon icon="lucide:sparkles" className="w-4 h-4" />}
            onPress={() => setIsChatOpen(true)}
          >
            AI Assistant
          </Button>
        </div>
      )}

      {/* Form - Responsive Horizontal Grid */}
      <div className={`${isCompact ? 'flex-auto' : 'flex-1'} ${isCompact ? 'overflow-visible' : 'overflow-y-auto sm:overflow-hidden'} ${isCompact ? 'p-1 sm:p-2' : 'p-2 sm:p-3 md:p-4 lg:p-6'}`}>
        <div className={`${isCompact ? 'h-auto' : 'h-full'} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${isCompact ? 'gap-[50px] sm:gap-[50px]' : 'gap-4 sm:gap-4 md:gap-5 lg:gap-6'}`}>
          {/* Column 1: Details & Attachments */}
          <div className={`flex flex-col ${isCompact ? 'gap-1 sm:gap-1.5' : 'gap-2 sm:gap-2.5 md:gap-3 lg:gap-3'}`}>

            {/* Details Section */}
            <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-4'} shadow-xl border border-white/10`}>
              <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-1.5 sm:mb-1.5 md:mb-2 lg:mb-2'} text-blue-600 dark:text-blue-400`}>
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Icon icon="lucide:file-signature" className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-sm md:text-base lg:text-base font-bold">Details</h2>
              </div>

              <div className={isCompact ? 'space-y-1' : 'space-y-1.5 sm:space-y-2 lg:space-y-2'}>
                <div>
                  <label className="text-xs sm:text-sm lg:text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-0.5 sm:mb-1 lg:mb-1">Logo Name</label>
                  <Input
                    placeholder="Enter logo name"
                    variant="bordered"
                    size="sm"
                    isRequired
                    value={formik.values.logoName}
                    onValueChange={(v) => formik.updateField("logoName", v)}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.logoName && !!formik.errors.logoName}
                    errorMessage={formik.touched.logoName && formik.errors.logoName}
                    classNames={{ input: "text-xs sm:text-sm md:text-base lg:text-sm", inputWrapper: "h-9 sm:h-9 md:h-10 lg:h-9" }}
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm md:text-base lg:text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-0.5 sm:mb-1 md:mb-1.5 lg:mb-1">Description</label>
                  <Textarea
                    placeholder="Enter description..."
                    minRows={3}
                    variant="bordered"
                    size="sm"
                    isRequired
                    value={formik.values.description}
                    onValueChange={(v) => formik.updateField("description", v)}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.description && !!formik.errors.description}
                    errorMessage={formik.touched.description && formik.errors.description}
                    classNames={{ input: "text-xs sm:text-sm md:text-base lg:text-sm" }}
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm md:text-base lg:text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-0.5 sm:mb-1 md:mb-1.5 lg:mb-1">
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
                      // Remover todos os caracteres não numéricos exceto vírgula
                      let cleaned = v.replace(/[^\d,]/g, '');
                      // Substituir ponto por vírgula para formato europeu
                      cleaned = cleaned.replace(/\./g, ',');
                      // Permitir apenas uma vírgula
                      const parts = cleaned.split(',');
                      if (parts.length > 2) {
                        cleaned = parts[0] + ',' + parts.slice(1).join('');
                      }
                      // Limitar a 2 casas decimais após a vírgula
                      if (parts.length === 2 && parts[1].length > 2) {
                        cleaned = parts[0] + ',' + parts[1].substring(0, 2);
                      }
                      // Formatar com separadores de milhar (espaços ou pontos) antes da vírgula
                      if (parts[0] && parts[0].length > 3) {
                        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                        cleaned = parts.length > 1 ? integerPart + ',' + parts[1] : integerPart;
                      }
                      formik.updateField("budget", cleaned);
                    }}
                    onBlur={(e) => {
                      // Ao perder o foco, garantir formatação correta
                      const value = formik.values.budget || "";
                      if (value) {
                        // Remover espaços e garantir formato correto
                        let cleaned = value.replace(/\s/g, '');
                        const parts = cleaned.split(',');
                        if (parts.length === 1 && parts[0]) {
                          // Se não tem vírgula, adicionar ,00
                          cleaned = parts[0] + ',00';
                        } else if (parts.length === 2 && parts[1].length === 1) {
                          // Se tem apenas 1 decimal, adicionar 0
                          cleaned = parts[0] + ',' + parts[1] + '0';
                        } else if (parts.length === 2 && parts[1].length === 0) {
                          // Se vírgula sem decimais, adicionar 00
                          cleaned = parts[0] + ',00';
                        }
                        // Formatar com separadores de milhar
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
                    classNames={{ input: "text-xs sm:text-sm md:text-base lg:text-sm", inputWrapper: "h-9 sm:h-9 md:h-10 lg:h-9" }}
                  />
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-4'} shadow-xl border border-white/10`}>
              <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-1.5 sm:mb-1.5 md:mb-2 lg:mb-2'} text-pink-600 dark:text-pink-400`}>
                <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Icon icon="lucide:paperclip" className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-sm md:text-base lg:text-base font-bold">Attachments</h2>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 sm:p-2.5 md:p-4 lg:p-3 bg-gray-50/50 dark:bg-gray-700/50 hover:border-pink-300 dark:hover:border-pink-700 transition-colors">
                {currentLogo.attachmentFiles && currentLogo.attachmentFiles.length > 0 ? (
                  <div className="space-y-2">
                    {currentLogo.attachmentFiles.map((file, index) => (
                      <AttachmentItem
                        key={index}
                        file={file}
                        index={index}
                        onRemove={handleRemoveAttachment}
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
                  <div className="flex flex-col items-center justify-center py-3 text-center">
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-full mb-2">
                      <Icon icon="lucide:cloud-upload" className="w-6 h-6 text-pink-500" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">Upload Files</h4>
                    <p className="text-xs text-gray-500 mb-3">Drag & drop or click to upload</p>
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

          {/* Column 2: Dimensions & Fixation */}
          <div className="flex flex-col gap-2 sm:gap-2.5 md:gap-3 lg:gap-3">
            {/* Dimensions Section */}
            <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-4'} shadow-xl border border-white/10`}>
              <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-1.5 sm:mb-1.5 md:mb-2 lg:mb-2'} text-emerald-600 dark:text-emerald-400`}>
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Icon icon="lucide:ruler" className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-sm md:text-base lg:text-base font-bold">Dimensions</h2>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-2 md:gap-3 lg:gap-3">
                {['Height', 'Length', 'Width', 'Diameter'].map((dim) => {
                  const key = dim.toLowerCase();
                  const dimensionValue = formik.values.dimensions?.[key]?.value || "";
                  const dimensionError = formik.errors.dimensions?.[key]?.value;
                  const isTouched = formik.touched.dimensions?.[key]?.value;

                  return (
                    <div key={key} className="p-2 sm:p-2 md:p-2.5 lg:p-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5">
                        <label className="text-xs md:text-sm lg:text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{dim}</label>
                        <Checkbox
                          size="sm"
                          color="danger"
                          classNames={{ 
                            label: "text-xs md:text-sm lg:text-xs font-semibold text-gray-800 dark:text-gray-100",
                            wrapper: "before:border-2 before:border-gray-400 dark:before:border-gray-500",
                            icon: "text-white"
                          }}
                          isSelected={formik.values.dimensions?.[key]?.imperative || false}
                          onValueChange={(v) => handleDimensionUpdate(key, "imperative", v)}
                        >
                          Imperative
                        </Checkbox>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        endContent={<span className="text-xs md:text-sm lg:text-xs text-gray-700 dark:text-gray-200 font-bold">m</span>}
                        variant="flat"
                        size="sm"
                        classNames={{ inputWrapper: "bg-gray-50 dark:bg-gray-700 h-9 md:h-10 lg:h-9", input: "text-xs sm:text-sm md:text-base lg:text-sm" }}
                        value={dimensionValue}
                        onValueChange={(v) => handleDimensionUpdate(key, "value", v ? parseFloat(v) : null)}
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
                <div className="mt-1.5 text-xs text-danger">
                  {formik.errors.dimensions}
                </div>
              )}
            </div>

            {/* Fixation Section */}
            <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-4'} shadow-xl border border-white/10`}>
              <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-1.5 sm:mb-1.5 md:mb-2 lg:mb-2'} text-orange-600 dark:text-orange-400`}>
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Icon icon="lucide:hammer" className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-sm md:text-base lg:text-base font-bold">Fixation</h2>
              </div>

              <div className="space-y-1.5 sm:space-y-1.5 md:space-y-2 lg:space-y-1.5">
                <div>
                  <label className="text-xs md:text-sm lg:text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1 md:mb-1.5 lg:mb-1">Usage Environment</label>
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
                  <label className="text-xs md:text-sm lg:text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1 md:mb-1.5 lg:mb-1">Fixation Type</label>
                  <Select
                    placeholder="Select fixation type"
                    isRequired
                    size="sm"
                    variant="bordered"
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
                    classNames={{ trigger: "text-xs sm:text-sm md:text-base lg:text-sm h-8 md:h-10 lg:h-8" }}
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
                  <label className="text-xs md:text-sm lg:text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1 md:mb-1.5 lg:mb-1">Structure Finish</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 md:p-2 lg:p-1.5 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-600/30">
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        color="secondary"
                        isSelected={formik.values.lacqueredStructure}
                        onValueChange={(v) => formik.updateField("lacqueredStructure", v)}
                      />
                      <span className="text-xs md:text-sm lg:text-xs font-bold">Lacquered</span>
                    </div>
                    {formik.values.lacqueredStructure && (
                      <Input
                        placeholder="RAL Color Code"
                        size="sm"
                        variant="flat"
                        className="flex-1 w-full sm:w-auto"
                        classNames={{ input: "text-xs sm:text-sm md:text-base lg:text-sm", inputWrapper: "h-8 md:h-10 lg:h-8" }}
                        startContent={<div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-blue-500 ring-2 ring-white"></div>}
                        value={formik.values.lacquerColor}
                        onValueChange={(v) => formik.updateField("lacquerColor", v)}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs md:text-sm lg:text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1 md:mb-1.5 lg:mb-1">Technical Constraints</label>
                  <div className="grid grid-cols-1 gap-1 sm:gap-1 md:gap-1.5 lg:gap-1">
                    <div className={`p-1 sm:p-1.5 md:p-1.5 lg:p-1 rounded-lg border-2 transition-all ${formik.values.maxWeightConstraint ? 'bg-primary-50/80 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800' : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-700/50'}`}>
                      <Checkbox
                        size="sm"
                        classNames={{ label: "text-xs md:text-sm lg:text-xs font-medium" }}
                        isSelected={formik.values.maxWeightConstraint}
                        onValueChange={(v) => formik.updateField("maxWeightConstraint", v)}
                      >
                        Maximum Weight Constraint
                      </Checkbox>
                    </div>
                    <div className={`p-1 sm:p-1.5 md:p-1.5 lg:p-1 rounded-lg border-2 transition-all ${formik.values.ballast ? 'bg-primary-50/80 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800' : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-700/50'}`}>
                      <Checkbox
                        size="sm"
                        classNames={{ label: "text-xs md:text-sm lg:text-xs font-medium" }}
                        isSelected={formik.values.ballast}
                        onValueChange={(v) => formik.updateField("ballast", v)}
                      >
                        Ballast Required
                      </Checkbox>
                    </div>
                    <div className={`p-1 sm:p-1.5 md:p-1.5 lg:p-1 rounded-lg border-2 transition-all ${formik.values.controlReport ? 'bg-primary-50/80 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800' : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-700/50'}`}>
                      <Checkbox
                        size="sm"
                        classNames={{ label: "text-xs md:text-sm lg:text-xs font-medium" }}
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

          {/* Column 3: Composition (Components & Balls) */}
          <div className={`flex flex-col ${isCompact ? 'gap-1 sm:gap-1.5' : 'gap-2 sm:gap-2.5 md:gap-3 lg:gap-3'}`}>
            <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-4'} shadow-xl border border-white/10`}>
              <div className={`flex items-center gap-2 ${isCompact ? 'mb-1.5' : 'mb-3'} text-purple-600 dark:text-purple-400`}>
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Icon icon="lucide:layers" className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-sm md:text-base lg:text-base font-bold">Composition</h2>
              </div>

            {/* Components Section */}
            <div className="flex flex-col gap-2 sm:gap-2 md:gap-3 lg:gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 lg:p-2.5 rounded-lg border border-white/20 dark:border-gray-600/30 shadow-md gap-2 sm:gap-0">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Icon icon="lucide:box" className="w-4 h-4" />
                  <h4 className="text-sm font-bold uppercase tracking-wide">Components</h4>
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
                      <div key={index} className="p-2 sm:p-2 md:p-2.5 lg:p-2 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm space-y-1.5 sm:space-y-1.5 md:space-y-2 lg:space-y-1.5 shadow-md">
                        <AutocompleteWithMarquee
                          label="Component"
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
                          classNames={{ listboxWrapper: "max-h-[300px]", trigger: "text-xs sm:text-sm md:text-base lg:text-sm h-9 md:h-10 lg:h-9", input: "text-xs sm:text-sm md:text-base lg:text-sm" }}
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
                              handleCompositionUpdate("componentes", index, "corId", selectedId ? Number(selectedId) : null);
                            }}
                            startContent={<Icon icon="lucide:palette" className="w-3 h-3 text-gray-500" />}
                            classNames={{ trigger: "text-xs sm:text-sm md:text-base lg:text-sm h-9 md:h-10 lg:h-9" }}
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

            {/* Balls Section */}
            <div className="flex flex-col gap-2 sm:gap-2 md:gap-3 lg:gap-3 border-t-2 border-white/20 dark:border-gray-600/30 pt-2 sm:pt-2 md:pt-3 lg:pt-3 mt-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 lg:p-2.5 rounded-lg border border-white/20 dark:border-gray-600/30 shadow-md gap-2 sm:gap-0">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Icon icon="lucide:circle-dot" className="w-4 h-4" />
                  <h4 className="text-xs sm:text-sm lg:text-sm font-bold uppercase tracking-wide">Balls</h4>
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
                      // Montar nome da bola: cor + acabamento + tamanho
                      const nomeBola = [bola.corNome, bola.acabamentoNome, bola.tamanhoNome]
                        .filter(Boolean)
                        .join(" - ");

                      return (
                        <div key={index} className="p-2 sm:p-2 md:p-2.5 lg:p-2 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0">
                                <div className="text-sm md:text-base lg:text-sm font-bold truncate text-gray-900 dark:text-white">{nomeBola}</div>
                              </div>
                              <div className="text-xs md:text-sm lg:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-xs md:text-sm lg:text-xs">{bola.referencia}</span>
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
                      <div key={index} className="p-2 sm:p-2 md:p-2.5 lg:p-2 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm space-y-1.5 sm:space-y-1.5 md:space-y-2 lg:space-y-1.5 shadow-md">
                        <div className="flex items-center gap-1.5 mb-0">
                          <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-700">
                            {index + 1}
                          </div>
                          <span className="text-xs md:text-sm lg:text-xs font-bold text-gray-600 dark:text-gray-300">Ball Configuration</span>
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
                          classNames={{ trigger: "text-xs sm:text-sm md:text-base lg:text-sm h-9 md:h-10 lg:h-9" }}
                        >
                          {coresDisponiveis.map((cor) => (
                            <SelectItem key={String(cor.id)}>{cor.nome}</SelectItem>
                          ))}
                        </Select>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-1.5 sm:gap-1.5 md:gap-2 lg:gap-1.5">
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
                            classNames={{ trigger: "text-xs sm:text-sm md:text-base lg:text-sm h-9 md:h-10 lg:h-9" }}
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
                            classNames={{ trigger: "text-xs sm:text-sm md:text-base lg:text-sm h-9 md:h-10 lg:h-9" }}
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
        </div>
      </div>

      {/* AI Assistant Chat */}
      <AIAssistantChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialAIState={currentLogo.aiAssistantState || null}
        onAIStateChange={(aiState) => {
          // Salvar estado do AI Assistant no currentLogo
          const updatedCurrentLogo = {
            ...currentLogo,
            aiAssistantState: aiState,
          };
          const updatedLogoDetails = {
            ...logoDetails,
            currentLogo: updatedCurrentLogo,
            logos: savedLogos,
          };
          onInputChange("logoDetails", updatedLogoDetails);
        }}
        onSaveImage={async (imageUrl) => {
          try {
            // Extract filename from URL or create a default name
            const urlParts = imageUrl.split('/');
            const originalFilename = urlParts[urlParts.length - 1] || 'ai-generated-image.webp';
            const nameWithoutExtension = originalFilename.replace(/\.[^/.]+$/, '');
            
            // Fetch the image from the URL and convert to File
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], originalFilename, { type: blob.type || 'image/webp' });
            
            // Upload the image to the server
            const formData = new FormData();
            formData.append('file', file);

            const apiBase = (import.meta?.env?.VITE_API_URL || '').replace(/\/api$/, '') || '';
            const uploadResponse = await fetch(`${apiBase}/api/files/upload`, {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            const uploadResult = await uploadResponse.json();
            console.log('✅ AI Generated image uploaded:', uploadResult.file);
            
            // Create attachment object with server URL
            const aiGeneratedAttachment = {
              name: `AI Generated - ${nameWithoutExtension}`,
              filename: uploadResult.file.filename,
              url: uploadResult.file.url,
              path: uploadResult.file.path,
              size: uploadResult.file.size,
              mimetype: uploadResult.file.mimetype || 'image/webp',
              isAIGenerated: true // Flag to identify AI generated images
            };

            // Add to attachments in currentLogo, not logoDetails (each logo has its own attachments)
            const existingFiles = currentLogo.attachmentFiles || [];
            const allFiles = [...existingFiles, aiGeneratedAttachment];

            // Preservar estado do AI Assistant ao salvar imagem
            const updatedCurrentLogo = {
              ...currentLogo,
              attachmentFiles: allFiles,
              generatedImage: uploadResult.file.url,
              // Manter o estado do AI Assistant (pode ter sido atualizado)
              aiAssistantState: currentLogo.aiAssistantState || null
            };
            const updatedLogoDetails = {
              ...logoDetails,
              currentLogo: updatedCurrentLogo,
              logos: savedLogos,
            };
            onInputChange("logoDetails", updatedLogoDetails);
            setIsChatOpen(false);
          } catch (error) {
            console.error('❌ Error uploading AI generated image:', error);
            // Show error to user or handle gracefully
            alert('Erro ao fazer upload da imagem gerada. Por favor, tente novamente.');
          }
        }}
      />
    </div>
  );
}

export default StepLogoInstructions;

