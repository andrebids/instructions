import { useEffect, useRef } from 'react';
import { projectsAPI } from '../../../services/api';
import { saveEditorState } from '../../../services/indexedDB';
import { registerSyncTag, isBackgroundSyncAvailable } from '../../../services/backgroundSync';

/**
 * Hook para gerenciar salvamento automático dos dados do logo
 * Salva em formData e API (se projeto existe)
 * Similar ao useCanvasPersistence mas para projetos tipo logo
 * 
 * @param {Object} params
 * @param {Object} params.logoDetails - Dados das instruções do logo
 * @param {Object} params.formData - Dados do formulário
 * @param {Function} params.onInputChange - Callback para atualizar formData
 * @param {Object} params.saveStatus - Objeto com métodos setSaving, setSaved, setError para status visual
 */
export const useLogoPersistence = ({
  logoDetails,
  formData,
  onInputChange,
  saveStatus
}) => {
  // Ref para rastrear valores anteriores e evitar atualizações desnecessárias
  const prevValuesRef = useRef({
    logoDetails: null
  });
  
  useEffect(() => {
    // Verificar se realmente há mudanças antes de atualizar (evitar loops infinitos)
    const logoDetailsStr = JSON.stringify(logoDetails);
    
    const hasChanges = 
      prevValuesRef.current.logoDetails !== logoDetailsStr;
    
    if (!hasChanges) {
      return; // Não há mudanças, não atualizar
    }
    
    // Atualizar valores anteriores
    prevValuesRef.current = {
      logoDetails: logoDetailsStr
    };
    
    // NÃO chamar onInputChange aqui - isso causa loops infinitos
    // O logoDetails já está a ser atualizado pelo onChange do formik
    // Este hook só deve salvar na API, não atualizar o formData
    
    // Se projeto já existe (tem ID), salvar automaticamente na base de dados
    const temProjectId = !!formData?.id;
    
    if (temProjectId) {
      const timeoutId = setTimeout(async function() {
        // Indicar início do salvamento
        if (saveStatus) saveStatus.setSaving();
        
        const dadosParaSalvar = {
          logoDetails: logoDetails || {},
          lastEditedStep: 'logo-instructions', // Logo instructions step
        };
        
        // Salvar no IndexedDB também (robusto para mobile)
        try {
          await saveEditorState(formData.id, {
            lastEditedStep: 'logo-instructions',
            logoDetails: logoDetails || {},
            pendingSync: !navigator.onLine
          });
        } catch (idxError) {
          console.warn('⚠️ Erro ao salvar no IndexedDB:', idxError);
        }
        
        // Salvar na API usando updateCanvas (que suporta logoDetails)
        try {
          await projectsAPI.updateCanvas(formData.id, dadosParaSalvar);
          // Indicar salvamento bem-sucedido
          if (saveStatus) saveStatus.setSaved();
        } catch (err) {
          console.error('❌ Erro ao salvar logoDetails na API:', err.message);
          
          // Indicar erro no salvamento
          if (saveStatus) saveStatus.setError();
          
          // Se offline, registar para sync quando voltar online
          if (!navigator.onLine && isBackgroundSyncAvailable()) {
            registerSyncTag(formData.id);
          }
        }
      }, 500); // Debounce de 500ms para evitar muitas chamadas
      
      return function() {
        clearTimeout(timeoutId);
      };
    }
  }, [logoDetails, formData?.id]); // Removido onInputChange das dependências para evitar loop infinito
};

