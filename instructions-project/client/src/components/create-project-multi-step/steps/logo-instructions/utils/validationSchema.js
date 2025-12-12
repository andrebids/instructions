import * as Yup from "yup";

// Schema de validação para Logo Instructions
export const validationSchema = Yup.object({
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




