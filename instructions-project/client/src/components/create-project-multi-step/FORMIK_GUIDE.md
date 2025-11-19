# Guia de Integração Formik

Este documento explica como o Formik foi integrado nos formulários do projeto e como usar em novos componentes.

## 📦 O que foi instalado

- **Formik**: Biblioteca para gerenciamento de estado e validação de formulários
- **Yup**: Biblioteca para validação de schemas (compatível com Formik)

## ✨ Benefícios

### Antes (sem Formik)
```jsx
// Muito boilerplate manual
const [name, setName] = useState("");
const [errors, setErrors] = useState({});

const handleChange = (e) => {
  setName(e.target.value);
  // Validação manual
  if (e.target.value.length < 3) {
    setErrors({ name: "Nome deve ter pelo menos 3 caracteres" });
  }
};

<Input
  value={name}
  onChange={handleChange}
  // Sem validação automática
/>
```

### Depois (com Formik)
```jsx
// Código muito mais limpo e declarativo
const formik = useFormikStep({
  initialValues: { name: "" },
  validationSchema: Yup.object({
    name: Yup.string()
      .required("Nome é obrigatório")
      .min(3, "Nome deve ter pelo menos 3 caracteres")
  }),
  onChange: onInputChange,
  formData,
});

<Input
  value={formik.values.name}
  onChange={(e) => formik.updateField("name", e.target.value)}
  onBlur={formik.handleBlur}
  isInvalid={formik.touched.name && !!formik.errors.name}
  errorMessage={formik.touched.name && formik.errors.name}
/>
```

## 🎯 Componentes Refatorados

### 1. StepProjectDetails
- ✅ Validação de nome do projeto (mínimo 3 caracteres)
- ✅ Validação de budget (deve ser positivo)
- ✅ Validação de data de entrega (obrigatória)
- ✅ Mensagens de erro automáticas
- ✅ Feedback visual de erros

### 2. StepLogoInstructions
- ✅ Validação de campos obrigatórios (Logo Number, Logo Name, Requested By)
- ✅ Validação de dimensões (valores positivos)
- ✅ Gerenciamento simplificado de campos aninhados
- ✅ Sincronização automática com estado global

## 🛠️ Como Usar

### Hook useFormikStep

O hook `useFormikStep` foi criado para integrar Formik com o sistema de formulário multi-step existente:

```jsx
import { useFormikStep } from "../hooks/useFormikStep";
import * as Yup from "yup";

// 1. Definir schema de validação
const validationSchema = Yup.object({
  fieldName: Yup.string()
    .required("Campo obrigatório")
    .min(3, "Mínimo 3 caracteres"),
});

// 2. Usar o hook
const formik = useFormikStep({
  initialValues: {
    fieldName: formData.fieldName || "",
  },
  validationSchema,
  onChange: onInputChange, // Sincroniza com estado global
  formData, // Estado global para sincronização
});

// 3. Usar nos componentes
<Input
  value={formik.values.fieldName}
  onChange={(e) => formik.updateField("fieldName", e.target.value)}
  onBlur={formik.handleBlur}
  isInvalid={formik.touched.fieldName && !!formik.errors.fieldName}
  errorMessage={formik.touched.fieldName && formik.errors.fieldName}
/>
```

### Helpers para Campos Aninhados

Para trabalhar com objetos aninhados (como `logoDetails.dimensions.height.value`):

```jsx
import { updateNestedField, getNestedValue } from "../utils/formikHelpers";

// Obter valor
const height = getNestedValue(formik.values, "dimensions.height.value", 0);

// Atualizar valor
updateNestedField(formik, "dimensions.height.value", 10);
```

### Validação com Yup

Yup oferece validações poderosas e declarativas:

```jsx
const validationSchema = Yup.object({
  // String obrigatória com tamanho mínimo
  name: Yup.string()
    .required("Nome é obrigatório")
    .min(3, "Mínimo 3 caracteres")
    .max(50, "Máximo 50 caracteres"),
  
  // Número positivo
  budget: Yup.number()
    .required("Budget é obrigatório")
    .positive("Deve ser positivo")
    .integer("Deve ser um número inteiro"),
  
  // Email válido
  email: Yup.string()
    .email("Email inválido")
    .required("Email é obrigatório"),
  
  // Objeto aninhado
  dimensions: Yup.object({
    height: Yup.object({
      value: Yup.number()
        .nullable()
        .positive("Altura deve ser positiva"),
      imperative: Yup.boolean(),
    }),
  }),
  
  // Array
  tags: Yup.array()
    .of(Yup.string())
    .min(1, "Pelo menos uma tag é necessária"),
});
```

## 🔄 Sincronização com Estado Global

O `useFormikStep` sincroniza automaticamente:
- **Formik → Estado Global**: Quando você usa `formik.updateField()`, o valor é automaticamente sincronizado com `formData` através do callback `onChange`
- **Estado Global → Formik**: Quando `formData` muda externamente, o Formik é atualizado automaticamente

Isso mantém a compatibilidade com o sistema existente enquanto aproveita os benefícios do Formik.

## 📝 Exemplo Completo

```jsx
import React from "react";
import { Input } from "@heroui/react";
import * as Yup from "yup";
import { useFormikStep } from "../hooks/useFormikStep";

const validationSchema = Yup.object({
  projectName: Yup.string()
    .required("Nome do projeto é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres"),
  budget: Yup.string()
    .required("Budget é obrigatório")
    .test("is-positive", "Budget deve ser maior que 0", (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    }),
});

export function MyFormStep({ formData, onInputChange }) {
  const formik = useFormikStep({
    initialValues: {
      projectName: formData.projectName || "",
      budget: formData.budget || "",
    },
    validationSchema,
    onChange: onInputChange,
    formData,
  });

  return (
    <div>
      <Input
        label="Project Name"
        isRequired
        value={formik.values.projectName}
        onChange={(e) => formik.updateField("projectName", e.target.value)}
        onBlur={formik.handleBlur}
        isInvalid={formik.touched.projectName && !!formik.errors.projectName}
        errorMessage={formik.touched.projectName && formik.errors.projectName}
      />
      
      <Input
        label="Budget"
        type="number"
        isRequired
        value={formik.values.budget}
        onChange={(e) => formik.updateField("budget", e.target.value)}
        onBlur={formik.handleBlur}
        isInvalid={formik.touched.budget && !!formik.errors.budget}
        errorMessage={formik.touched.budget && formik.errors.budget}
      />
    </div>
  );
}
```

## 🚀 Próximos Passos

Para aplicar Formik em outros steps:

1. **StepProjectType**: Adicionar validação para seleção de tipo
2. **StepLocationDescription**: Validar localização e descrição
3. **Outros formulários**: Aplicar o mesmo padrão em outros componentes do projeto

## 📚 Recursos

- [Documentação Formik](https://formik.org/docs/overview)
- [Documentação Yup](https://github.com/jquense/yup)
- [Exemplos Formik](https://formik.org/docs/examples)

## ⚠️ Notas Importantes

1. **Compatibilidade**: O sistema mantém compatibilidade total com o código existente
2. **Performance**: Formik é otimizado e não causa problemas de performance
3. **Validação**: Validação acontece apenas quando o campo é "touched" (após blur)
4. **Sincronização**: A sincronização bidirecional é automática, mas evite loops infinitos

---

**Autor**: AI Assistant  
**Data**: Dezembro 2024  
**Versão**: 1.0.0

