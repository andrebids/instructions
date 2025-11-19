/**
 * Helpers para trabalhar com Formik em formulários complexos
 */

/**
 * Helper para atualizar campos aninhados no Formik
 * Exemplo: updateNestedField(formik, 'logoDetails.dimensions.height.value', 10)
 */
export const updateNestedField = (formik, path, value) => {
  const keys = path.split('.');
  const newValues = { ...formik.values };
  
  let current = newValues;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    } else {
      current[key] = { ...current[key] };
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  formik.setValues(newValues);
};

/**
 * Helper para obter valor de campo aninhado
 * Exemplo: getNestedValue(formik.values, 'logoDetails.dimensions.height.value')
 */
export const getNestedValue = (values, path, defaultValue = null) => {
  const keys = path.split('.');
  let current = values;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : defaultValue;
};

/**
 * Helper para trabalhar com FieldArray do Formik
 * Facilita adicionar/remover/atualizar itens em arrays
 */
export const useFieldArrayHelpers = (formik, fieldPath) => {
  const array = getNestedValue(formik.values, fieldPath, []);
  
  const push = (item) => {
    const newArray = [...array, item];
    updateNestedField(formik, fieldPath, newArray);
  };
  
  const remove = (index) => {
    const newArray = array.filter((_, i) => i !== index);
    updateNestedField(formik, fieldPath, newArray);
  };
  
  const update = (index, updates) => {
    const newArray = [...array];
    newArray[index] = { ...newArray[index], ...updates };
    updateNestedField(formik, fieldPath, newArray);
  };
  
  const replace = (newArray) => {
    updateNestedField(formik, fieldPath, newArray);
  };
  
  return {
    array,
    push,
    remove,
    update,
    replace,
    length: array.length,
  };
};

