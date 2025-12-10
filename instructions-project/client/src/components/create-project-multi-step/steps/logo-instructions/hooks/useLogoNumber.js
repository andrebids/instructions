import React from "react";
import { generateLogoNumber } from "../utils/logoNumberGenerator";

// Hook para gerenciar a geração e sincronização de logo number
export const useLogoNumber = ({
  formData,
  currentLogo,
  formik,
  logoDetails,
  savedLogos,
  onInputChange,
  currentLogoIdRef,
}) => {
  // Ref para rastrear se o Logo Number já foi gerado inicialmente
  const logoNumberInitialized = React.useRef(false);
  const preservedLogoNumberRef = React.useRef(null);
  const lastProjectNameRef = React.useRef("");
  const prevSavedLogosLengthRef = React.useRef(savedLogos.length);
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

        const generatedLogoNumber = generateLogoNumber(projectName, currentLogoNumber, latestSavedLogos, currentLogo);

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

  return {
    logoNumberInitialized,
    preservedLogoNumberRef,
  };
};

