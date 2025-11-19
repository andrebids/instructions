import { useEffect, useRef } from 'react';
import { useFormik } from 'formik';

/**
 * Hook para integrar Formik com o sistema de formulário multi-step existente
 * 
 * @param {Object} config - Configuração do Formik
 * @param {Object} config.initialValues - Valores iniciais do formulário
 * @param {Object|Function} config.validationSchema - Schema de validação Yup
 * @param {Function} config.onSubmit - Handler de submissão (opcional, para validação local)
 * @param {Function} config.onChange - Callback chamado quando valores mudam (sincroniza com formData global)
 * @param {Object} config.formData - Estado global do formulário (para sincronização)
 * 
 * @returns {Object} - Objeto Formik com helpers adicionais
 */
export const useFormikStep = ({
  initialValues,
  validationSchema,
  onSubmit,
  onChange,
  formData,
}) => {
  // Ref para rastrear se estamos sincronizando para evitar loops
  const isSyncingRef = useRef(false);
  const lastSyncedValuesRef = useRef({});

  // Criar instância do Formik
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: onSubmit || (() => {}),
    enableReinitialize: true, // Permite reinicializar quando initialValues mudam
  });

  // Sincronizar valores do Formik com formData global quando formData mudar externamente
  useEffect(() => {
    if (!formData || isSyncingRef.current) return;

    // Atualizar apenas os campos que existem em initialValues
    const updates = {};
    let hasChanges = false;

    Object.keys(initialValues).forEach((key) => {
      const formDataValue = formData[key];
      const currentValue = formik.values[key];
      
      // Comparar valores (incluindo null/undefined)
      if (formDataValue !== undefined && formDataValue !== currentValue) {
        // Evitar atualizar se já foi sincronizado recentemente
        if (lastSyncedValuesRef.current[key] !== formDataValue) {
          updates[key] = formDataValue;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      isSyncingRef.current = true;
      formik.setValues((prev) => ({ ...prev, ...updates }));
      // Atualizar referência dos valores sincronizados
      Object.keys(updates).forEach((key) => {
        lastSyncedValuesRef.current[key] = updates[key];
      });
      // Reset flag após um pequeno delay
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }
  }, [formData, initialValues]);

  return {
    ...formik,
    // Helper para atualizar campo específico e sincronizar
    updateField: (field, value) => {
      formik.setFieldValue(field, value);
      if (onChange && !isSyncingRef.current) {
        isSyncingRef.current = true;
        onChange(field, value);
        lastSyncedValuesRef.current[field] = value;
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    },
    // Helper para atualizar múltiplos campos
    updateFields: (fields) => {
      formik.setValues((prev) => ({ ...prev, ...fields }));
      if (onChange && !isSyncingRef.current) {
        isSyncingRef.current = true;
        Object.keys(fields).forEach((key) => {
          onChange(key, fields[key]);
          lastSyncedValuesRef.current[key] = fields[key];
        });
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    },
  };
};

