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
    return `${baseName}-L${nextNumber}`;
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
          const response = await fetch(`${apiBase}/api/files/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
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
          const doesNotMatchPattern = currentLogoNumber && !currentLogoNumber.startsWith(`${projectName}-L`);

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
    }
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

    newComposition.bolas = newArray;
    handleUpdate("composition", newComposition);
  };

  // Persistência automática dos dados do logo (PWA)
  useLogoPersistence({
    logoDetails: logoDetails,
    formData: formData,
    onInputChange: onInputChange,
    saveStatus: saveStatus
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center gap-3 mb-2">
        <div>
          <h2 className="text-lg font-bold text-default-900">Logo Instructions</h2>
          <p className="text-xs text-default-500">Define the technical specifications for the logo</p>
        </div>
        <Button
          color="primary"
          variant="shadow"
          size="sm"
          className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white"
          startContent={<Icon icon="lucide:sparkles" className="w-4 h-4" />}
          onPress={() => setIsChatOpen(true)}
        >
          AI Assistant
        </Button>
      </div>

      {/* 3-Column Tablet Layout */}
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0 overflow-hidden">

        {/* Left Column - Dimensions + Fixation */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Dimensions */}
          <Card className="shadow-sm flex flex-col">
            <CardHeader className="px-3 pt-2 pb-1 flex-shrink-0">
              <h3 className="text-xs font-semibold flex items-center gap-1.5">
                <Icon icon="lucide:ruler" className="text-primary w-3.5 h-3.5" />
                Dimensions
              </h3>
            </CardHeader>
            <CardBody className="p-3 pt-1.5 flex-1">
              <div className="grid grid-cols-4 gap-2">
                {['Height', 'Length', 'Width', 'Diameter'].map((dim) => {
                  const key = dim.toLowerCase();
                  const dimensionValue = formik.values.dimensions?.[key]?.value || "";
                  const dimensionError = formik.errors.dimensions?.[key]?.value;
                  const isTouched = formik.touched.dimensions?.[key]?.value;

                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[10px] text-default-600 font-medium">
                        {dim}
                      </label>
                      <Input
                        type="number"
                        endContent={<span className="text-default-400 text-[10px]">m</span>}
                        variant="flat"
                        size="sm"
                        classNames={{
                          input: "text-xs",
                          inputWrapper: "h-7 min-h-7"
                        }}
                        value={dimensionValue}
                        onValueChange={(v) => handleDimensionUpdate(key, "value", v ? parseFloat(v) : null)}
                        onBlur={() => formik.setFieldTouched(`dimensions.${key}.value`, true)}
                        isInvalid={isTouched && !!dimensionError}
                        errorMessage={isTouched && dimensionError}
                      />
                      <Checkbox
                        size="sm"
                        color="danger"
                        classNames={{
                          label: "text-[10px]",
                          base: "max-w-fit"
                        }}
                        isSelected={formik.values.dimensions?.[key]?.imperative || false}
                        onValueChange={(v) => handleDimensionUpdate(key, "imperative", v)}
                      >
                        <span className="text-[10px]">Imp.</span>
                      </Checkbox>
                    </div>
                  );
                })}
              </div>
              {formik.errors.dimensions && typeof formik.errors.dimensions === 'string' && (
                <div className="text-danger text-[9px] mt-1">
                  {formik.errors.dimensions}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Fixation & Constraints */}
          <Card className="shadow-sm flex flex-col flex-1">
            <CardHeader className="px-3 pt-2 pb-1 flex-shrink-0">
              <h3 className="text-xs font-semibold flex items-center gap-1.5">
                <Icon icon="lucide:anchor" className="text-primary w-3.5 h-3.5" />
                Fixation & Constraints
              </h3>
            </CardHeader>
            <CardBody className="p-3 pt-1.5 flex-1 overflow-y-auto">
              <div className="space-y-2.5">
                {/* Usage Toggle */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-default-600 font-medium">Usage</label>
                  <Tabs
                    fullWidth
                    size="sm"
                    aria-label="Usage Options"
                    selectedKey={formik.values.usageOutdoor ? "outdoor" : "indoor"}
                    onSelectionChange={(key) => {
                      if (key === "indoor") {
                        formik.updateFields({
                          usageIndoor: true,
                          usageOutdoor: false,
                        });
                      } else {
                        formik.updateFields({
                          usageIndoor: false,
                          usageOutdoor: true,
                        });
                      }
                    }}
                    classNames={{
                      tabList: "gap-1 h-7",
                      tab: "min-w-0 px-2 h-7",
                      tabContent: "text-[10px]"
                    }}
                  >
                    <Tab key="indoor" title="Indoor" />
                    <Tab key="outdoor" title="Outdoor" />
                  </Tabs>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-default-600 font-medium">Fixation Type</label>
                  <Select
                    placeholder="Select"
                    isRequired
                    size="sm"
                    selectedKeys={formik.values.fixationType ? new Set([formik.values.fixationType]) : new Set()}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] || "";
                      formik.setFieldTouched("fixationType", true);
                      formik.updateField("fixationType", selected);
                    }}
                    onBlur={() => formik.setFieldTouched("fixationType", true)}
                    isInvalid={formik.touched.fixationType && !!formik.errors.fixationType}
                    errorMessage={formik.touched.fixationType && formik.errors.fixationType}
                    validationBehavior="aria"
                    classNames={{
                      trigger: "h-7 min-h-7",
                      value: "text-[10px]"
                    }}
                  >
                    <SelectItem key="ground" textValue="Ground">Ground</SelectItem>
                    <SelectItem key="wall" textValue="Wall">Wall</SelectItem>
                    <SelectItem key="suspended" textValue="Suspended">Suspended</SelectItem>
                    <SelectItem key="none" textValue="None">None</SelectItem>
                    <SelectItem key="pole_side" textValue="Pole Side">Pole (Side)</SelectItem>
                    <SelectItem key="pole_central" textValue="Pole Central">Pole (Central)</SelectItem>
                    <SelectItem key="special" textValue="Special">Special</SelectItem>
                  </Select>
                </div>

                {/* Lacquered Structure */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-default-600 font-medium">Lacquered Structure</label>
                  <div className="flex items-center gap-2">
                    <Switch
                      size="sm"
                      isSelected={formik.values.lacqueredStructure}
                      onValueChange={(v) => formik.updateField("lacqueredStructure", v)}
                    />
                    {formik.values.lacqueredStructure && (
                      <Input
                        placeholder="RAL Color"
                        size="sm"
                        startContent={<Icon icon="lucide:palette" className="text-default-400 w-3.5 h-3.5" />}
                        classNames={{
                          input: "text-xs",
                          inputWrapper: "h-7 min-h-7"
                        }}
                        value={formik.values.lacquerColor}
                        onValueChange={(v) => formik.updateField("lacquerColor", v)}
                      />
                    )}
                  </div>
                </div>

                {/* Constraints */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-default-600 font-medium">Constraints</label>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        size="sm"
                        classNames={{ label: "text-[10px]" }}
                        isSelected={formik.values.maxWeightConstraint}
                        onValueChange={(v) => formik.updateField("maxWeightConstraint", v)}
                      >
                        Max Weight
                      </Checkbox>
                      {formik.values.maxWeightConstraint && (
                        <Input
                          placeholder="kg"
                          size="sm"
                          classNames={{
                            input: "text-xs",
                            inputWrapper: "h-7 min-h-7 w-14"
                          }}
                          value={formik.values.maxWeight}
                          onValueChange={(v) => formik.updateField("maxWeight", v)}
                        />
                      )}
                    </div>
                    <Checkbox
                      size="sm"
                      classNames={{ label: "text-[10px]" }}
                      isSelected={formik.values.ballast}
                      onValueChange={(v) => formik.updateField("ballast", v)}
                    >
                      Ballast
                    </Checkbox>
                    <Checkbox
                      size="sm"
                      classNames={{ label: "text-[10px]" }}
                      isSelected={formik.values.controlReport}
                      onValueChange={(v) => formik.updateField("controlReport", v)}
                    >
                      Control Report
                    </Checkbox>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Middle Column - Composition */}
        <div className="flex flex-col gap-3 min-h-0">

          {/* Composition Card */}
          <Card className="shadow-sm flex flex-col flex-1 min-h-0">
            <CardHeader className="px-3 pt-2 pb-1 flex-shrink-0">
              <h3 className="text-xs font-semibold flex items-center gap-1.5">
                <Icon icon="lucide:layers" className="text-primary w-3.5 h-3.5" />
                Composition
              </h3>
            </CardHeader>
            <CardBody className="p-3 pt-1.5 space-y-3 flex-1 min-h-0 overflow-y-auto">

              {/* Componentes Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-default-900 uppercase tracking-wider">Components</p>
                  <div className="flex items-center gap-2">
                    {composition.componentes && composition.componentes.length > 0 && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<Icon icon="lucide:trash-2" className="w-4 h-4" />}
                        onPress={handleClearAllComponentes}
                        className="min-w-0 px-2"
                      >
                        Clear
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
                      onPress={handleAddComponente}
                      className="min-w-0 px-2"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {composition.componentes && composition.componentes.length > 0 ? (
                    composition.componentes.map((comp, index) => {
                      const componente = comp.componenteId ? getComponenteById(comp.componenteId) : null;
                      const coresDisponiveis = componente && !componente.semCor
                        ? getCoresByComponente(comp.componenteId)
                        : [];

                      // Verificar se está completo e não está em modo de edição
                      const completo = isComponenteCompleto(comp);
                      const editando = componentesEditando[index];
                      const mostrarApenasReferencia = completo && !editando;

                      // Filtrar componentes baseado na busca (usando função helper, não hook)
                      const searchValue = componenteSearchValues[index] || "";
                      const componentesFiltrados = filterComponentes(searchValue);

                      // Valor de exibição do componente selecionado
                      const displayValue = componente
                        ? `${componente.nome}${componente.referencia ? ` (${componente.referencia})` : ""}`
                        : "";

                      // Se está completo e não editando, mostrar apenas referência
                      if (mostrarApenasReferencia) {
                        return (
                          <div key={index} className="p-3 border border-default-200 rounded-lg bg-default-50 overflow-hidden">
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="text-sm font-semibold text-default-900">
                                  {componente?.nome || "Component"}
                                </div>
                                <div className="text-xs text-default-600 bg-default-100 p-2 rounded overflow-hidden">
                                  <span className="font-semibold">Reference: </span>
                                  <MarqueeText hoverOnly={true} className="inline-block">
                                    {comp.referencia}
                                  </MarqueeText>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="default"
                                  isIconOnly
                                  onPress={() => handleToggleEditComponente(index)}
                                  title="Edit component"
                                  aria-label="Edit component"
                                >
                                  <Icon icon="lucide:pencil" className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  isIconOnly
                                  onPress={() => handleRemoveComponente(index)}
                                  title="Remove component"
                                  aria-label="Remove component"
                                >
                                  <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Modo de edição: mostrar todos os campos
                      return (
                        <div key={index} className="p-3 border border-default-200 rounded-lg space-y-3 bg-default-50 overflow-hidden">
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="min-w-0">
                                <AutocompleteWithMarquee
                                  label="Component"
                                  placeholder="Search or select a component"
                                  size="sm"
                                  selectedKey={comp.componenteId ? String(comp.componenteId) : null}
                                  inputValue={componenteSearchValues[index] || displayValue || ""}
                                  onSelectionChange={(key) => {
                                    const selectedId = key ? Number(key) : null;
                                    handleCompositionUpdate("componentes", index, "componenteId", selectedId);
                                    // Limpar busca após seleção
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
                                  startContent={<Icon icon="lucide:search" className="text-default-400 w-4 h-4" />}
                                  allowsCustomValue={false}
                                  classNames={{
                                    base: "w-full min-w-0",
                                    trigger: "min-w-0",
                                    inputWrapper: "min-w-0",
                                    input: "min-w-0"
                                  }}
                                >
                                  {(c) => (
                                    <AutocompleteItem key={String(c.id)} textValue={`${c.nome} ${c.referencia || ""}`}>
                                      <div className="flex flex-col min-w-0">
                                        <MarqueeText hoverOnly={true} className="font-medium">
                                          {c.nome}
                                        </MarqueeText>
                                        {c.referencia && (
                                          <MarqueeText hoverOnly={true} className="text-xs text-default-500">
                                            Ref: {c.referencia}
                                          </MarqueeText>
                                        )}
                                      </div>
                                    </AutocompleteItem>
                                  )}
                                </AutocompleteWithMarquee>
                              </div>

                              {componente && !componente.semCor && (
                                <div className="min-w-0">
                                  <SelectWithMarquee
                                    label="Color"
                                    placeholder="Select a color"
                                    size="sm"
                                    selectedKeys={comp.corId ? new Set([String(comp.corId)]) : new Set()}
                                    onSelectionChange={(keys) => {
                                      const selectedId = Array.from(keys)[0];
                                      handleCompositionUpdate("componentes", index, "corId", selectedId ? Number(selectedId) : null);
                                    }}
                                    classNames={{
                                      base: "w-full",
                                      trigger: "min-w-0",
                                      value: "overflow-hidden"
                                    }}
                                  >
                                    {coresDisponiveis.map((cor) => (
                                      <SelectItem key={String(cor.id)} value={String(cor.id)} textValue={cor.nome}>
                                        <MarqueeText hoverOnly={true}>
                                          {cor.nome}
                                        </MarqueeText>
                                      </SelectItem>
                                    ))}
                                  </SelectWithMarquee>
                                </div>
                              )}

                              {comp.referencia && (
                                <div className="text-xs text-default-600 bg-default-100 p-2 rounded overflow-hidden min-w-0">
                                  <span className="font-semibold">Reference: </span>
                                  <MarqueeText hoverOnly={true} className="inline-block">
                                    {comp.referencia}
                                  </MarqueeText>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 flex-shrink-0">
                              {completo && (
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="default"
                                  isIconOnly
                                  onPress={() => handleToggleEditComponente(index)}
                                  title="Close edition"
                                  aria-label="Close edition"
                                >
                                  <Icon icon="lucide:check" className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                isIconOnly
                                onPress={() => handleRemoveComponente(index)}
                                title="Remove component"
                                aria-label="Remove component"
                              >
                                <Icon icon="lucide:trash-2" className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-default-400 text-center py-4">No components added</p>
                  )}
                </div>
              </div>

              <Divider />

              {/* Bolas Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-default-900 uppercase tracking-wider">Balls</p>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
                    onPress={handleAddBola}
                    className="min-w-0 px-2"
                  >
                    Add
                  </Button>
                </div>

                <div className="space-y-4">
                  {composition.bolas && composition.bolas.length > 0 ? (
                    composition.bolas.map((bola, index) => {
                      const coresDisponiveis = getCoresDisponiveisBolas();
                      const acabamentosDisponiveis = bola.corId
                        ? getAcabamentosByCorBola(bola.corId)
                        : materialsData.acabamentos;
                      const tamanhosDisponiveis = bola.corId && bola.acabamentoId
                        ? getTamanhosByCorEAcabamentoBola(bola.corId, bola.acabamentoId)
                        : materialsData.tamanhos;

                      return (
                        <div key={index} className="p-3 border border-default-200 rounded-lg space-y-3 bg-default-50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-3">
                              <Select
                                label="Color"
                                placeholder="Select a color"
                                size="sm"
                                selectedKeys={bola.corId ? [String(bola.corId)] : []}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleBolaUpdate(index, "corId", selectedId ? Number(selectedId) : null);
                                }}
                              >
                                {coresDisponiveis.map((cor) => (
                                  <SelectItem key={String(cor.id)} value={String(cor.id)}>
                                    {cor.nome}
                                  </SelectItem>
                                ))}
                              </Select>

                              <Select
                                label="Finish"
                                placeholder="Select a finish"
                                size="sm"
                                selectedKeys={bola.acabamentoId ? [String(bola.acabamentoId)] : []}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleBolaUpdate(index, "acabamentoId", selectedId ? Number(selectedId) : null);
                                }}
                                isDisabled={!bola.corId}
                              >
                                {acabamentosDisponiveis.map((acabamento) => (
                                  <SelectItem key={String(acabamento.id)} value={String(acabamento.id)}>
                                    {acabamento.nome}
                                  </SelectItem>
                                ))}
                              </Select>

                              <Select
                                label="Size"
                                placeholder="Select a size"
                                size="sm"
                                selectedKeys={bola.tamanhoId ? [String(bola.tamanhoId)] : []}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleBolaUpdate(index, "tamanhoId", selectedId ? Number(selectedId) : null);
                                }}
                                isDisabled={!bola.corId || !bola.acabamentoId}
                              >
                                {tamanhosDisponiveis.map((tamanho) => (
                                  <SelectItem key={String(tamanho.id)} value={String(tamanho.id)}>
                                    {tamanho.nome}
                                  </SelectItem>
                                ))}
                              </Select>

                              {bola.referencia && (
                                <div className="text-xs text-default-600 bg-default-100 p-2 rounded overflow-hidden min-w-0">
                                  <span className="font-semibold">Reference: </span>
                                  <MarqueeText hoverOnly={true} className="inline-block">
                                    {bola.referencia}
                                  </MarqueeText>
                                </div>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant="light"
                              color="danger"
                              isIconOnly
                              onPress={() => handleRemoveBola(index)}
                              aria-label="Remove ball"
                            >
                              <Icon icon="lucide:trash-2" className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-default-400 text-center py-4">No balls added</p>
                  )}
                </div>
              </div>

            </CardBody>
          </Card>
        </div>

        {/* Right Column - Details & Attachments */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Details & Criteria */}
          <Card ref={detailsCriteriaRef} className="shadow-sm flex flex-col flex-1">
            <CardHeader className="px-3 pt-2 pb-1 flex-shrink-0">
              <h3 className="text-xs font-semibold flex items-center gap-1.5">
                <Icon icon="lucide:file-text" className="text-primary w-3.5 h-3.5" />
                Details & Criteria
              </h3>
            </CardHeader>
            <CardBody className="p-3 pt-1.5 space-y-2.5 flex-1 overflow-y-auto">
              <Input
                label="Logo Name"
                placeholder="Name of the logo"
                variant="bordered"
                size="sm"
                isRequired
                classNames={{
                  label: "text-[10px]",
                  input: "text-xs",
                  inputWrapper: "h-7 min-h-7"
                }}
                value={formik.values.logoName}
                onValueChange={(v) => formik.updateField("logoName", v)}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.logoName && !!formik.errors.logoName}
                errorMessage={formik.touched.logoName && formik.errors.logoName}
              />
              <Textarea
                label="Description"
                placeholder="Detailed description..."
                minRows={2}
                variant="bordered"
                size="sm"
                classNames={{
                  label: "text-[10px]",
                  input: "text-xs"
                }}
                value={formik.values.description}
                onValueChange={(v) => formik.updateField("description", v)}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-default-700">Attachments</p>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    startContent={<Icon icon="lucide:paperclip" className="w-3 h-3" />}
                    onPress={() => document.getElementById('logo-file-input').click()}
                    classNames={{
                      base: "h-6 min-h-6 px-2"
                    }}
                  >
                    <span className="text-[10px]">Upload</span>
                  </Button>
                </div>

                <input
                  id="logo-file-input"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ai,.eps"
                  className="hidden"
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files);
                    if (newFiles.length > 0) {
                      handleFileUpload(newFiles);
                    }
                    e.target.value = '';
                  }}
                />

                <DragAndDropZone
                  className="rounded-lg transition-colors"
                  multiple={true}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ai,.eps"
                  onFilesSelected={handleFileUpload}
                >
                  {(() => {
                    return (currentLogo.generatedImage || (logoDetails.attachmentFiles && logoDetails.attachmentFiles.length > 0));
                  })() ? (
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {currentLogo.generatedImage && (
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary group">
                          <img
                            src={currentLogo.generatedImage}
                            alt="AI Generated"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.nextElementSibling;
                              if (fallback && fallback.classList.contains('image-fallback')) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="image-fallback absolute inset-0 bg-default-100 flex-col items-center justify-center gap-2 hidden">
                            <Icon icon="lucide:image-off" className="w-8 h-8 text-default-400" />
                            <p className="text-[10px] text-default-500 text-center px-2">
                              Image failed to load
                            </p>
                          </div>
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full">
                            AI
                          </div>
                          <div
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              isIconOnly
                              color="danger"
                              variant="flat"
                              size="sm"
                              onPress={() => {
                                const updatedCurrentLogo = { ...currentLogo, generatedImage: null };
                                const updatedLogoDetails = {
                                  ...logoDetails,
                                  currentLogo: updatedCurrentLogo,
                                  logos: savedLogos,
                                };
                                onInputChange("logoDetails", updatedLogoDetails);
                              }}
                            >
                              <Icon icon="solar:trash-bin-trash-linear" width={16} />
                            </Button>
                          </div>
                        </div>
                      )}

                      {logoDetails.attachmentFiles && logoDetails.attachmentFiles.map((file, index) => {
                        const isImage = file.mimetype?.startsWith('image/');
                        const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/api$/, '') || '';
                        const fileUrl = file.url || `${baseApi}${file.path}`;

                        return (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-default-200 group">
                            {isImage ? (
                              <>
                                <img
                                  src={fileUrl}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallback = e.target.nextElementSibling;
                                    if (fallback && fallback.classList.contains('image-fallback')) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="image-fallback absolute inset-0 bg-default-100 flex-col items-center justify-center gap-2 hidden">
                                  <Icon icon="lucide:image-off" className="w-8 h-8 text-default-400" />
                                  <p className="text-[10px] text-default-500 text-center px-2">
                                    Image failed to load
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-default-100 p-1.5">
                                <Icon icon="lucide:file" className="w-8 h-8 text-default-400 mb-1" />
                                <p className="text-[9px] text-center text-default-600 truncate w-full px-1">
                                  {file.name}
                                </p>
                                {file.size && (
                                  <p className="text-[9px] text-default-400 mt-0.5">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                            )}
                            <div
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                isIconOnly
                                color="danger"
                                variant="flat"
                                size="sm"
                                onPress={() => {
                                  const updatedFiles = logoDetails.attachmentFiles.filter((_, i) => i !== index);
                                  const updatedLogoDetails = {
                                    ...logoDetails,
                                    attachmentFiles: updatedFiles,
                                    currentLogo: currentLogo,
                                    logos: savedLogos,
                                  };
                                  onInputChange("logoDetails", updatedLogoDetails);
                                }}
                              >
                                <Icon icon="solar:trash-bin-trash-linear" width={16} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-default-200 rounded-lg transition-colors">
                      <Icon icon="lucide:image-plus" className="w-8 h-8 mx-auto mb-1 text-default-300" />
                      <p className="text-[10px] text-default-400">
                        No attachments yet
                      </p>
                      <p className="text-[9px] text-default-300 mt-0.5">
                        Upload or drag & drop
                      </p>
                    </div>
                  )}
                </DragAndDropZone>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

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
    </div >
  );
}
