import { useFormik } from 'formik';
import * as Yup from 'yup';

// Schema de validação para produtos
export const productValidationSchema = Yup.object({
  name: Yup.string()
    .required("Product name is required")
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name must be less than 100 characters"),
  
  stock: Yup.string()
    .test("is-non-negative", "Stock must be a non-negative number", (value) => {
      if (!value || value === "") return true; // Opcional
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    }),
  
  usedStock: Yup.string()
    .test("is-non-negative", "Used stock must be a non-negative number", (value) => {
      if (!value || value === "") return true; // Opcional
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    }),
  
  prices: Yup.object({
    new: Yup.object({
      price: Yup.string()
        .test("is-positive", "Price must be greater than 0", (value) => {
          if (!value || value === "") return true; // Opcional
          const num = parseFloat(value);
          return !isNaN(num) && num > 0;
        }),
      oldPrice: Yup.string()
        .test("is-valid-old-price", "Old price must be greater than current price", function(value) {
          if (!value || value === "") return true; // Opcional
          const currentPrice = parseFloat(this.parent.price) || 0;
          const oldPrice = parseFloat(value) || 0;
          if (oldPrice > 0 && currentPrice > 0) {
            return oldPrice >= currentPrice;
          }
          return true;
        }),
      rentalPrice: Yup.string()
        .test("is-non-negative", "Rental price must be a non-negative number", (value) => {
          if (!value || value === "") return true; // Opcional
          const num = parseFloat(value);
          return !isNaN(num) && num >= 0;
        }),
    }),
    used: Yup.object({
      price: Yup.string()
        .test("is-non-negative", "Used price must be a non-negative number", (value) => {
          if (!value || value === "") return true; // Opcional
          const num = parseFloat(value);
          return !isNaN(num) && num >= 0;
        }),
      rentalPrice: Yup.string()
        .test("is-non-negative", "Used rental price must be a non-negative number", (value) => {
          if (!value || value === "") return true; // Opcional
          const num = parseFloat(value);
          return !isNaN(num) && num >= 0;
        }),
    }),
  }),
  
  type: Yup.string().nullable(),
  location: Yup.string().nullable(),
  mount: Yup.string().nullable(),
  releaseYear: Yup.string().nullable(),
  season: Yup.string().nullable(),
  
  specs: Yup.object().shape({
    descricao: Yup.string().nullable(),
    tecnicas: Yup.string().nullable(),
    weight: Yup.string().nullable(),
    effects: Yup.mixed().nullable(),
    materiais: Yup.mixed().nullable(),
    stockPolicy: Yup.string().nullable(),
    printType: Yup.string().nullable(),
    printColor: Yup.mixed().nullable(),
    aluminium: Yup.mixed().nullable(),
    softXLED: Yup.mixed().nullable(),
    sparkle: Yup.string().nullable(),
    sparkles: Yup.mixed().nullable(),
  }).nullable(),
  
  tags: Yup.array().of(Yup.string()),
  availableColors: Yup.object().nullable(),
  isActive: Yup.boolean(),
});

/**
 * Hook para gerenciar formulário de produtos com Formik
 */
export const useProductForm = (initialValues, onSubmit) => {
  const formik = useFormik({
    initialValues: initialValues || {
      name: "",
      stock: "",
      usedStock: "",
      prices: {
        new: {
          price: "",
          oldPrice: "",
          rentalPrice: "",
        },
        used: {
          price: "",
          rentalPrice: "",
        },
      },
      type: "",
      location: "",
      mount: "",
      tags: [],
      isActive: true,
      specs: {
        descricao: "",
        tecnicas: "",
        weight: "",
        effects: "",
        materiais: "",
        stockPolicy: "",
        printType: "",
        printColor: "",
        aluminium: "",
        softXLED: "",
        sparkle: "",
        sparkles: "",
      },
      availableColors: {},
      videoFile: "",
      releaseYear: "",
      season: "",
      height: "",
      width: "",
      depth: "",
      diameter: "",
    },
    validationSchema: productValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        await onSubmit(values);
      } catch (error) {
        // Tratar erros de validação do servidor
        if (error.response?.data?.errors) {
          Object.keys(error.response.data.errors).forEach((field) => {
            setFieldError(field, error.response.data.errors[field]);
          });
        }
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Helper para atualizar campo aninhado
  const updateNestedField = (path, value) => {
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

  // Helper para obter valor aninhado
  const getNestedValue = (path, defaultValue = null) => {
    const keys = path.split('.');
    let current = formik.values;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  };

  // Helper para obter erro aninhado
  const getNestedError = (path) => {
    const keys = path.split('.');
    let current = formik.errors;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  };

  // Helper para verificar se campo foi tocado
  const isNestedTouched = (path) => {
    const keys = path.split('.');
    let current = formik.touched;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return false;
      }
      current = current[key];
    }
    
    return current === true;
  };

  return {
    ...formik,
    updateNestedField,
    getNestedValue,
    getNestedError,
    isNestedTouched,
  };
};

