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

// Schema de validação para Logo Instructions
const validationSchema = Yup.object({
  logoNumber: Yup.string()
    .required("Logo number is required")
    .min(3, "Logo number must be at least 3 characters"),
  logoName: Yup.string()
    .required("Logo name is required")
    .min(3, "Logo name must be at least 3 characters"),
  requestedBy: Yup.string()
    .required("Requested by is required"),
  fixationType: Yup.string()
    .required("Fixation type is required"),
  dimensions: Yup.object().shape({
    height: Yup.object().shape({
      value: Yup.number().nullable().positive("Height must be positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    length: Yup.object().shape({
      value: Yup.number().nullable().positive("Length must be positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    width: Yup.object().shape({
      value: Yup.number().nullable().positive("Width must be positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    diameter: Yup.object().shape({
      value: Yup.number().nullable().positive("Diameter must be positive"),
      imperative: Yup.boolean(),
    }).nullable(),
  }).nullable().test(
    "at-least-one-dimension",
    "At least one dimension (Height, Length, Width, or Diameter) must be filled",
    function (value) {
      // Se dimensions for null ou undefined, retornar false (inválido)
      if (!value) return false;
      const hasHeight = value.height?.value != null && value.height.value !== "";
      const hasLength = value.length?.value != null && value.length.value !== "";
      const hasWidth = value.width?.value != null && value.width.value !== "";
      const hasDiameter = value.diameter?.value != null && value.diameter.value !== "";
      return hasHeight || hasLength || hasWidth || hasDiameter;
    }
  ),
});

export function StepLogoInstructions({ formData, onInputChange, saveStatus }) {
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
    console.log("Max number found:", maxNumber);

    // Se o logo atual já tem um número válido, não contar ele mesmo (estamos editando)
    // Mas se não tem número ou tem um número diferente, precisamos gerar um novo
    if (currentLogoNumber) {
      const match = currentLogoNumber.match(/-L\s*(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        // Se este número já está nos logos salvos, significa que estamos editando este logo
        // Nesse caso, não devemos gerar um novo número, devemos manter o atual
        if (usedNumbers.has(num)) {
          console.log("Current logo number exists in saved logos (editing). Returning:", currentLogoNumber);
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
    // Se maxNumber é 2, significa que há L1 e L2, então o próximo é L3
    const nextNumber = maxNumber + 1;
    console.log("Next number generated:", nextNumber);
    return `${baseName} -L${nextNumber} `;
  }, [savedLogos]);

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
      // Sempre incluir valores preservados para garantir que não sejam perdidos
      const updatedCurrentLogo = {
        ...currentLogo,
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
          const response = await fetch(`${apiBase} /api/files / upload`, {
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
        const existingFiles = logoDetails.attachmentFiles || [];
        const allFiles = [...existingFiles, ...successfulUploads];

        // Save file metadata to logoDetails
        const updatedLogoDetails = {
          ...logoDetails,
          attachmentFiles: allFiles,
          currentLogo: currentLogo,
          logos: savedLogos,
        };
        onInputChange("logoDetails", updatedLogoDetails);
        console.log('✅ Files uploaded and metadata saved:', successfulUploads);
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
    prevLogoNumberRef.current = currentLogoNumber;

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
      // Verificar se o logo atual já existe nos logos salvos (estamos editando)
      const isEditingExistingLogo = savedLogos.some(logo =>
        logo.logoNumber === currentLogoNumber && currentLogoNumber
      );

      // Se não estamos editando e o logo number não foi inicializado, gerar novo
      if (!isEditingExistingLogo && !logoNumberInitialized.current) {
        const generatedLogoNumber = generateLogoNumber(projectName, currentLogoNumber);

        if (generatedLogoNumber) {
          // Se o logo atual está vazio ou não segue o padrão, aplicar o novo número
          const isEmpty = !currentLogoNumber || currentLogoNumber.trim() === "";
          const doesNotMatchPattern = currentLogoNumber && !currentLogoNumber.startsWith(`${projectName} -L`);

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
      } else if (isEditingExistingLogo) {
        // Se estamos editando, manter o número atual
        preservedLogoNumberRef.current = currentLogoNumber;
        logoNumberInitialized.current = true;
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

  // Helper para atualizar logoDetails completo (mantém compatibilidade)
  const handleUpdate = (key, value) => {
    const updatedCurrentLogo = {
      ...currentLogo,
      [key]: value
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos, // Preserve saved logos
    };
    onInputChange("logoDetails", updatedLogoDetails);
    // Sincronizar com Formik
    if (formik.values[key] !== undefined) {
      formik.setFieldValue(key, value);
    }
  };

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
    const currentAttachments = logoDetails.attachmentFiles || [];
    const newAttachments = currentAttachments.filter((_, i) => i !== index);

    const updatedLogoDetails = {
      ...logoDetails,
      attachmentFiles: newAttachments,
      currentLogo: currentLogo,
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
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">Logo Instructions</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Define the technical specifications for the logo</p>
        </div>
        <Button
          color="primary"
          variant="shadow"
          size="sm"
          className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-medium shadow-lg text-xs"
          startContent={<Icon icon="lucide:sparkles" className="w-4 h-4" />}
          onPress={() => setIsChatOpen(true)}
        >
          AI Assistant
        </Button>
      </div>

      {/* Form - Responsive Horizontal Grid */}
      <div className="flex-1 overflow-hidden p-3 bg-gray-50/30 dark:bg-gray-900/10">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1: Details & Attachments */}
          <div className="flex flex-col gap-4">

            {/* Details Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Icon icon="lucide:file-signature" className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Details</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-1.5">Logo Name</label>
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
                    classNames={{ input: "text-sm" }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-1.5">Description</label>
                  <Textarea
                    placeholder="Enter description..."
                    minRows={2}
                    variant="bordered"
                    size="sm"
                    value={formik.values.description}
                    onValueChange={(v) => formik.updateField("description", v)}
                    classNames={{ input: "text-sm" }}
                  />
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-pink-600 dark:text-pink-400">
                <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Icon icon="lucide:paperclip" className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Attachments</h2>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 hover:border-pink-300 dark:hover:border-pink-700 transition-colors">
                {logoDetails.attachmentFiles && logoDetails.attachmentFiles.length > 0 ? (
                  <div className="space-y-2">
                    {logoDetails.attachmentFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 group">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="p-1.5 bg-white dark:bg-gray-600 rounded-md text-pink-500 shadow-sm">
                            <Icon icon="lucide:file" className="w-4 h-4" />
                          </div>
                          <span className="truncate text-xs font-medium">{file.name}</span>
                        </div>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleRemoveAttachment(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 min-w-6"
                        >
                          <Icon icon="lucide:x" className="w-3 h-3" />
                        </Button>
                      </div>
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
          <div className="flex flex-col gap-4">
            {/* Dimensions Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Icon icon="lucide:ruler" className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Dimensions</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['Height', 'Length', 'Width', 'Diameter'].map((dim) => {
                  const key = dim.toLowerCase();
                  const dimensionValue = formik.values.dimensions?.[key]?.value || "";
                  const dimensionError = formik.errors.dimensions?.[key]?.value;
                  const isTouched = formik.touched.dimensions?.[key]?.value;

                  return (
                    <div key={key} className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{dim}</label>
                        <Checkbox
                          size="sm"
                          color="danger"
                          classNames={{ label: "text-xs font-medium text-gray-600" }}
                          isSelected={formik.values.dimensions?.[key]?.imperative || false}
                          onValueChange={(v) => handleDimensionUpdate(key, "imperative", v)}
                        >
                          Imperative
                        </Checkbox>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        endContent={<span className="text-xs text-gray-500 font-bold">m</span>}
                        variant="flat"
                        size="sm"
                        classNames={{ inputWrapper: "bg-gray-50 dark:bg-gray-700", input: "text-sm" }}
                        value={dimensionValue}
                        onValueChange={(v) => handleDimensionUpdate(key, "value", v ? parseFloat(v) : null)}
                        onBlur={() => formik.setFieldTouched(`dimensions.${key}.value`, true)}
                        isInvalid={isTouched && !!dimensionError}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fixation Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Icon icon="lucide:hammer" className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Fixation</h2>
              </div>

              <div className="space-y-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1.5">Usage Environment</label>
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
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1.5">Fixation Type</label>
                  <Select
                    placeholder="Select fixation type"
                    isRequired
                    size="sm"
                    variant="bordered"
                    selectedKeys={formik.values.fixationType ? new Set([formik.values.fixationType]) : new Set()}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] || "";
                      formik.setFieldTouched("fixationType", true);
                      formik.updateField("fixationType", selected);
                    }}
                    startContent={<Icon icon="lucide:settings-2" className="w-3 h-3 text-gray-500" />}
                    classNames={{ trigger: "text-sm h-8" }}
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
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1.5">Structure Finish</label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        color="secondary"
                        isSelected={formik.values.lacqueredStructure}
                        onValueChange={(v) => formik.updateField("lacqueredStructure", v)}
                      />
                      <span className="text-xs font-bold">Lacquered</span>
                    </div>
                    {formik.values.lacqueredStructure && (
                      <Input
                        placeholder="RAL Color Code"
                        size="sm"
                        variant="flat"
                        className="flex-1"
                        classNames={{ input: "text-sm", inputWrapper: "h-8" }}
                        startContent={<div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-blue-500 ring-2 ring-white"></div>}
                        value={formik.values.lacquerColor}
                        onValueChange={(v) => formik.updateField("lacquerColor", v)}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1.5">Technical Constraints</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className={`p-1.5 rounded-lg border-2 transition-all ${formik.values.maxWeightConstraint ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800' : 'bg-transparent border-gray-200 dark:border-gray-700'}`}>
                      <Checkbox
                        size="sm"
                        classNames={{ label: "text-xs font-medium" }}
                        isSelected={formik.values.maxWeightConstraint}
                        onValueChange={(v) => formik.updateField("maxWeightConstraint", v)}
                      >
                        Maximum Weight Constraint
                      </Checkbox>
                    </div>
                    <div className={`p-1.5 rounded-lg border-2 transition-all ${formik.values.ballast ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800' : 'bg-transparent border-gray-200 dark:border-gray-700'}`}>
                      <Checkbox
                        size="sm"
                        classNames={{ label: "text-xs font-medium" }}
                        isSelected={formik.values.ballast}
                        onValueChange={(v) => formik.updateField("ballast", v)}
                      >
                        Ballast Required
                      </Checkbox>
                    </div>
                    <div className={`p-1.5 rounded-lg border-2 transition-all ${formik.values.controlReport ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800' : 'bg-transparent border-gray-200 dark:border-gray-700'}`}>
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

          {/* Column 3: Composition (Components & Balls) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1 text-purple-600 dark:text-purple-400">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Icon icon="lucide:layers" className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold">Composition</h2>
            </div>

            {/* Components Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-lg border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Icon icon="lucide:box" className="w-4 h-4" />
                  <h4 className="text-sm font-bold uppercase tracking-wide">Components</h4>
                </div>
                <div className="flex gap-1.5">
                  {composition.componentes && composition.componentes.length > 0 && (
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      isIconOnly
                      onPress={handleClearAllComponentes}
                      className="bg-white dark:bg-gray-800 shadow-sm h-7 w-7 min-w-7"
                    >
                      <Icon icon="lucide:trash-2" className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    color="primary"
                    className="font-medium shadow-sm h-7 text-xs"
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
                        <div key={index} className="p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <div className="text-sm font-bold truncate text-gray-900 dark:text-white">{componente?.nome}</div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-xs">{comp.referencia}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="flat"
                                isIconOnly
                                onPress={() => handleToggleEditComponente(index)}
                                className="h-6 w-6 min-w-6"
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
                              >
                                <Icon icon="lucide:trash-2" className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className="p-2.5 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/30 dark:bg-purple-900/10 space-y-2 shadow-sm">
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
                          classNames={{ listboxWrapper: "max-h-[300px]", trigger: "text-sm", input: "text-sm" }}
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
                            classNames={{ trigger: "text-sm" }}
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
                          >
                            <Icon icon="lucide:trash-2" className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                    <Icon icon="lucide:box" className="w-8 h-8 text-gray-300 mb-1" />
                    <p className="text-xs text-gray-400">No components added yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Balls Section */}
            <div className="flex flex-col gap-3 border-t-2 border-gray-100 dark:border-gray-700 pt-3 mt-1">
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <Icon icon="lucide:circle-dot" className="w-4 h-4" />
                  <h4 className="text-sm font-bold uppercase tracking-wide">Balls</h4>
                </div>
                <Button
                  size="sm"
                  color="primary"
                  className="font-medium shadow-sm h-7 text-xs"
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
                        <div key={index} className="p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <div className="text-sm font-bold truncate text-gray-900 dark:text-white">{nomeBola}</div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-xs">{bola.referencia}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="flat"
                                isIconOnly
                                onPress={() => handleToggleEditBola(index)}
                                className="h-6 w-6 min-w-6"
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
                              >
                                <Icon icon="lucide:trash-2" className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className="p-2.5 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50/30 dark:bg-indigo-900/10 space-y-2 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300 ring-2 ring-white dark:ring-gray-700">
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
                          classNames={{ trigger: "text-sm" }}
                        >
                          {coresDisponiveis.map((cor) => (
                            <SelectItem key={String(cor.id)}>{cor.nome}</SelectItem>
                          ))}
                        </Select>

                        <div className="grid grid-cols-2 gap-2">
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
                            classNames={{ trigger: "text-sm" }}
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
                            classNames={{ trigger: "text-sm" }}
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
                          >
                            <Icon icon="lucide:trash-2" className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                    <Icon icon="lucide:circle-dashed" className="w-8 h-8 text-gray-300 mb-1" />
                    <p className="text-xs text-gray-400">No balls added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Chat */}
      <AIAssistantChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSaveImage={(imageUrl) => {
          const updatedCurrentLogo = {
            ...currentLogo,
            generatedImage: imageUrl
          };
          const updatedLogoDetails = {
            ...logoDetails,
            currentLogo: updatedCurrentLogo,
            logos: savedLogos,
          };
          onInputChange("logoDetails", updatedLogoDetails);
          setIsChatOpen(false);
        }}
      />
    </div>
  );
}

export default StepLogoInstructions;

