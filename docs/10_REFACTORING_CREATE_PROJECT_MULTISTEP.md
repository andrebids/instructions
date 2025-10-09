# 📋 PLANO DE REFATORAÇÃO - Create Project Multi-Step

**Ficheiro Original:** `instructions-project/client/src/components/create-project-multi-step.jsx`  
**Linhas Atuais:** 854 linhas  
**Data do Plano:** 9 de Outubro de 2025  
**Status:** 🟡 Planeado (Não Implementado)

---

## 🎯 Objetivos da Refatoração

- ✅ Dividir componente monolítico em módulos reutilizáveis
- ✅ Facilitar manutenção e adição de novas funcionalidades
- ✅ Manter toda a funcionalidade existente sem quebras
- ✅ Melhorar legibilidade e testabilidade do código
- ✅ Permitir testes unitários independentes
- ✅ Preparar para escalabilidade futura

---

## 📁 ESTRUTURA DE FICHEIROS PROPOSTA

```
client/src/components/
├── create-project-multi-step/
│   ├── index.jsx                          # Componente principal (orquestrador) ~150-200 linhas
│   │
│   ├── hooks/
│   │   ├── useProjectForm.js              # Lógica do formulário e estado
│   │   ├── useClientManagement.js         # Gestão de clientes (CRUD)
│   │   └── useStepNavigation.js           # Navegação entre steps
│   │
│   ├── steps/
│   │   ├── StepProjectDetails.jsx         # Step 1: Nome, Cliente, Data, Budget
│   │   ├── StepProjectType.jsx            # Step 2: Tipo de projeto (Simu/Logo)
│   │   ├── StepLocationDescription.jsx    # Step 3: Localização e Descrição
│   │   └── StepConfirmDetails.jsx         # Step 4: Review e Confirmação
│   │
│   ├── components/
│   │   ├── ProjectTypeCard.jsx            # Card individual para tipo (Simu/Logo)
│   │   ├── SimuWorkflowSelector.jsx       # Seletor AI/Human para Simu
│   │   ├── ClientAutocomplete.jsx         # Autocomplete de clientes
│   │   ├── AddClientModal.jsx             # Modal de adicionar novo cliente
│   │   ├── StepIndicator.jsx              # Indicador de progresso horizontal
│   │   └── NavigationFooter.jsx           # Footer com botões de navegação
│   │
│   ├── utils/
│   │   ├── validation.js                  # Validações de cada step
│   │   └── mockData.js                    # Dados mock (clientes, nomes projetos)
│   │
│   └── constants.js                       # Constantes (steps config, defaults)
```

---

## 🔍 DECOMPOSIÇÃO DETALHADA POR FICHEIRO

### 1️⃣ **constants.js** (Novo - ~30 linhas)

**Localização Original:** Linhas 9-14, configurações dispersas

**Conteúdo a Extrair:**
```javascript
// Array de steps
export const STEPS = [
  { id: "project-details", label: "Project Details", icon: "lucide:folder" },
  { id: "project-type", label: "Project Type", icon: "lucide:layers" },
  { id: "location-description", label: "Location & Description", icon: "lucide:map-pin" },
  { id: "confirm-details", label: "Confirm Details", icon: "lucide:check-circle" },
];

// Configurações de validação
export const VALIDATION_CONFIG = {
  minBudget: 0,
  maxBudget: 1000000,
  minDescriptionLength: 0,
  maxDescriptionLength: 5000,
};

// Status de projetos
export const PROJECT_STATUS = {
  CREATED: "created",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};
```

**Razão:** Centralizar configurações reutilizáveis e facilitar modificações globais.

---

### 2️⃣ **utils/mockData.js** (Novo - ~80 linhas)

**Localização Original:** Linhas 56-90

**Conteúdo a Extrair:**
```javascript
// Mock de clientes (linhas 56-65)
export const MOCK_CLIENTS = [
  { id: 1, name: "Fashion Outlet", email: "contact@fashionoutlet.com", phone: "+351 123 456 789" },
  { id: 2, name: "Lisbon Municipality", email: "info@cm-lisboa.pt", phone: "+351 987 654 321" },
  // ... restantes clientes
];

// Nomes de projetos para demo (linhas 74-90)
export const PROJECT_NAME_SUGGESTIONS = [
  "Christmas 2025 Collection",
  "Summer Campaign 2025",
  // ... restantes nomes
];

// Funções utilitárias
export const getRandomClient = () => {
  const randomIndex = Math.floor(Math.random() * MOCK_CLIENTS.length);
  return MOCK_CLIENTS[randomIndex];
};

export const getRandomProjectName = () => {
  const randomIndex = Math.floor(Math.random() * PROJECT_NAME_SUGGESTIONS.length);
  return PROJECT_NAME_SUGGESTIONS[randomIndex];
};
```

**Razão:** Separar dados de demonstração da lógica de negócio. Facilita substituição por dados reais da API.

---

### 3️⃣ **utils/validation.js** (Novo - ~60 linhas)

**Localização Original:** Linhas 651-667

**Conteúdo a Extrair:**
```javascript
// Validação do Step 1
export const validateStepProjectDetails = (formData) => {
  return (
    formData.name.trim() !== "" && 
    formData.clientName.trim() !== "" && 
    formData.endDate !== null
  );
};

// Validação do Step 2
export const validateStepProjectType = (formData) => {
  return (
    formData.projectType !== null &&
    (formData.projectType !== "simu" || formData.simuWorkflow !== null)
  );
};

// Validação do Step 3
export const validateStepLocationDescription = (formData) => {
  return true; // Campos opcionais
};

// Validação do Step 4
export const validateStepConfirmDetails = (formData) => {
  return true; // Review step
};

// Validação geral por step
export const isStepValid = (currentStep, formData) => {
  switch (currentStep) {
    case 1: return validateStepProjectDetails(formData);
    case 2: return validateStepProjectType(formData);
    case 3: return validateStepLocationDescription(formData);
    case 4: return validateStepConfirmDetails(formData);
    default: return false;
  }
};
```

**Razão:** Facilitar testes unitários, reutilização de validações e manutenção centralizada de regras.

---

### 4️⃣ **hooks/useProjectForm.js** (Novo - ~100 linhas)

**Localização Original:** Linhas 23-46, 120-125, 200-229

**Conteúdo a Extrair:**
```javascript
import { useState } from "react";
import { projectsAPI } from "../../services/api";

export const useProjectForm = (onClose) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado do formulário (linhas 23-46)
  const [formData, setFormData] = useState({
    name: "",
    projectType: null,
    simuWorkflow: null,
    status: "created",
    clientId: null,
    selectedClientKey: null,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    startDate: null,
    endDate: null,
    budget: "",
    location: "",
    description: "",
  });

  // Handler genérico de input (linhas 120-125)
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Submissão do formulário (linhas 200-229)
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const projectData = {
        name: formData.name,
        clientName: formData.clientName,
        projectType: formData.projectType,
        status: formData.status,
        location: formData.location,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: null,
        endDate: formData.endDate ? formData.endDate.toDate(new Date().getTimezoneOffset()).toISOString() : null,
      };
      
      console.log("📤 Submitting project data:", projectData);
      const newProject = await projectsAPI.create(projectData);
      console.log("✅ Project created successfully:", newProject);
      
      onClose();
    } catch (err) {
      console.error("❌ Error creating project:", err);
      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    loading,
    error,
    setError,
  };
};
```

**Razão:** Separar lógica de estado da apresentação. Facilita testes e reutilização em outros contextos.

---

### 5️⃣ **hooks/useClientManagement.js** (Novo - ~120 linhas)

**Localização Original:** Linhas 48-107, 128-184

**Conteúdo a Extrair:**
```javascript
import { useState, useEffect } from "react";
import { MOCK_CLIENTS, getRandomClient, getRandomProjectName } from "../utils/mockData";

export const useClientManagement = (setFormData) => {
  const [clients, setClients] = useState([]);
  const [newClientModal, setNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ 
    name: "", 
    email: "", 
    phone: "" 
  });

  // Carregar clientes (linhas 53-107)
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setClients(MOCK_CLIENTS);
      
      // Demo: pré-selecionar cliente aleatório
      if (MOCK_CLIENTS.length > 0) {
        const defaultClient = getRandomClient();
        const randomProjectName = getRandomProjectName();
        
        setFormData(prev => ({
          ...prev,
          name: randomProjectName,
          selectedClientKey: defaultClient.id,
          clientId: defaultClient.id,
          clientName: defaultClient.name,
          clientEmail: defaultClient.email,
          clientPhone: defaultClient.phone,
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  // Handler de input do autocomplete (linhas 128-133)
  const handleClientInputChange = (value) => {
    setFormData(prev => ({
      ...prev,
      clientName: value,
    }));
  };

  // Filtro personalizado (linhas 136-138)
  const filterClients = (textValue, inputValue) => {
    return textValue.toLowerCase().includes(inputValue.toLowerCase());
  };

  // Seleção de cliente (linhas 144-162)
  const handleClientSelection = (key) => {
    console.log('Selected key:', key, 'Type:', typeof key);
    if (key) {
      const clientId = typeof key === 'string' ? parseInt(key) : key;
      const client = clients.find(c => c.id === clientId);
      console.log('Found client:', client);
      if (client) {
        setFormData(prev => ({
          ...prev,
          selectedClientKey: key,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          clientPhone: client.phone,
        }));
      }
    }
  };

  // Criar novo cliente (linhas 164-184)
  const handleCreateNewClient = () => {
    const newClient = {
      id: Date.now(),
      name: newClientData.name,
      email: newClientData.email,
      phone: newClientData.phone,
    };
    
    setClients(prev => [...prev, newClient]);
    setFormData(prev => ({
      ...prev,
      selectedClientKey: newClient.id,
      clientId: newClient.id,
      clientName: newClient.name,
      clientEmail: newClient.email,
      clientPhone: newClient.phone,
    }));
    
    setNewClientModal(false);
    setNewClientData({ name: "", email: "", phone: "" });
  };

  return {
    clients,
    newClientModal,
    setNewClientModal,
    newClientData,
    setNewClientData,
    handleClientInputChange,
    filterClients,
    handleClientSelection,
    handleCreateNewClient,
  };
};
```

**Razão:** Isolar toda a lógica de gestão de clientes. Facilita substituição por API real no futuro.

---

### 6️⃣ **hooks/useStepNavigation.js** (Novo - ~50 linhas)

**Localização Original:** Linhas 17, 186-198

**Conteúdo a Extrair:**
```javascript
import { useState } from "react";
import { isStepValid } from "../utils/validation";

export const useStepNavigation = (formData, totalSteps) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Avançar para próximo step (linhas 186-191)
  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid(currentStep, formData)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Voltar para step anterior (linhas 193-198)
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Verificar se step atual é válido
  const canProceed = () => {
    return isStepValid(currentStep, formData);
  };

  return {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    canProceed,
  };
};
```

**Razão:** Separar lógica de navegação e facilitar adicionar animações/transições futuras.

---

### 7️⃣ **components/StepIndicator.jsx** (Novo - ~70 linhas)

**Localização Original:** Linhas 685-731

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { Icon } from "@iconify/react";

export function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex-1 overflow-x-auto scrollbar-hide">
      <div className="flex justify-center">
        <ol className="flex items-center gap-2 sm:gap-4 min-w-fit">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;
            const isLast = stepNumber === steps.length;
            
            return (
              <React.Fragment key={step.id}>
                <li className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-colors ${
                      isCompleted
                        ? "bg-success text-white"
                        : isActive
                        ? "bg-primary text-white"
                        : "bg-default-100 text-default-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Icon icon="lucide:check" className="text-base sm:text-lg" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">{stepNumber}</span>
                    )}
                  </div>
                  <span
                    className={`whitespace-nowrap text-xs sm:text-sm ${
                      isActive ? "font-semibold text-foreground" : "text-default-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
                {!isLast && (
                  <div
                    className={`h-0.5 w-6 sm:w-10 md:w-16 lg:w-24 ${
                      isCompleted ? "bg-success" : "bg-default-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
```

**Props:**
- `steps`: Array com configuração dos steps
- `currentStep`: Número do step atual

**Razão:** Componente reutilizável para indicador de progresso. Pode ser usado em outros wizards.

---

### 8️⃣ **components/NavigationFooter.jsx** (Novo - ~70 linhas)

**Localização Original:** Linhas 743-778

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export function NavigationFooter({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSubmit,
  isValid,
  loading,
}) {
  return (
    <div className="w-full bg-content1 border-t border-divider px-4 py-4 sm:px-6 sm:py-6 sticky bottom-0">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Button
          variant="flat"
          className={currentStep === 1 ? "invisible" : ""}
          onPress={onPrev}
          isDisabled={loading}
          startContent={<Icon icon="lucide:arrow-left" />}
        >
          Back
        </Button>
        
        <div className="flex gap-2">
          {currentStep < totalSteps ? (
            <Button
              color="primary"
              onPress={onNext}
              isDisabled={!isValid || loading}
              endContent={<Icon icon="lucide:arrow-right" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              color="success"
              onPress={onSubmit}
              isLoading={loading}
              isDisabled={!isValid || loading}
              endContent={<Icon icon="lucide:check" />}
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Props:**
- `currentStep`: Número do step atual
- `totalSteps`: Total de steps
- `onNext`: Função para avançar
- `onPrev`: Função para voltar
- `onSubmit`: Função de submissão final
- `isValid`: Booleano de validação
- `loading`: Estado de carregamento

**Razão:** Footer reutilizável com lógica de navegação. Facilita customização de botões.

---

### 9️⃣ **components/ClientAutocomplete.jsx** (Novo - ~80 linhas)

**Localização Original:** Linhas 262-304

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { Autocomplete, AutocompleteItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export function ClientAutocomplete({
  clients,
  selectedKey,
  inputValue,
  onSelectionChange,
  onInputChange,
  onAddNewClick,
}) {
  return (
    <div>
      <Autocomplete
        label="Client"
        placeholder="Search for a client"
        isRequired
        onSelectionChange={onSelectionChange}
        className="w-full"
        variant="bordered"
        size="md"
        radius="lg"
        startContent={<Icon icon="lucide:user" className="text-default-400" />}
        menuTrigger="input"
        defaultItems={clients}
        selectedKey={selectedKey}
        inputValue={inputValue}
        onInputChange={onInputChange}
        classNames={{
          label: "text-foreground font-semibold",
          input: "text-foreground font-medium",
          inputWrapper: "bg-content1 border-2 border-divider hover:border-primary focus-within:border-primary"
        }}
      >
        {(client) => (
          <AutocompleteItem key={client.id} textValue={client.name}>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{client.name}</span>
              <span className="text-xs text-default-500">{client.email}</span>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
      
      <Button
        size="sm"
        color="primary"
        variant="flat"
        className="mt-2"
        onPress={onAddNewClick}
        startContent={<Icon icon="lucide:plus" />}
      >
        Add New Client
      </Button>
    </div>
  );
}
```

**Props:**
- `clients`: Array de clientes disponíveis
- `selectedKey`: Chave do cliente selecionado
- `inputValue`: Valor do input
- `onSelectionChange`: Callback de seleção
- `onInputChange`: Callback de mudança de input
- `onAddNewClick`: Callback para adicionar novo cliente

**Razão:** Componente reutilizável de seleção de clientes. Pode ser usado em outros formulários.

---

### 🔟 **components/AddClientModal.jsx** (Novo - ~100 linhas)

**Localização Original:** Linhas 783-849

**Conteúdo a Extrair:**
```jsx
import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";

export function AddClientModal({ isOpen, onClose, onAddClient }) {
  const [clientData, setClientData] = useState({ 
    name: "", 
    email: "", 
    phone: "" 
  });

  const handleAdd = () => {
    onAddClient(clientData);
    setClientData({ name: "", email: "", phone: "" });
  };

  const handleClose = () => {
    onClose();
    setClientData({ name: "", email: "", phone: "" });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="md"
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:user-plus" className="text-primary text-xl" />
                <span>Add New Client</span>
              </div>
              <p className="text-xs text-default-500 font-normal">
                Fill in the client information below
              </p>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="space-y-4">
                <Input
                  label="Client Name"
                  labelPlacement="outside"
                  placeholder="Enter client name"
                  value={clientData.name}
                  onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                  isRequired
                  variant="bordered"
                  startContent={<Icon icon="lucide:building-2" className="text-default-400" />}
                />
                <Input
                  label="Email"
                  labelPlacement="outside"
                  type="email"
                  placeholder="client@example.com"
                  value={clientData.email}
                  onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                  variant="bordered"
                  startContent={<Icon icon="lucide:mail" className="text-default-400" />}
                />
                <Input
                  label="Phone"
                  labelPlacement="outside"
                  placeholder="+351 123 456 789"
                  value={clientData.phone}
                  onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                  variant="bordered"
                  startContent={<Icon icon="lucide:phone" className="text-default-400" />}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={handleClose}>
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleAdd}
                isDisabled={!clientData.name.trim()}
                startContent={<Icon icon="lucide:check" />}
              >
                Add Client
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
```

**Props:**
- `isOpen`: Booleano de visibilidade
- `onClose`: Callback de fecho
- `onAddClient`: Callback com dados do novo cliente

**Razão:** Modal independente e reutilizável. Facilita alteração de campos do cliente.

---

### 1️⃣1️⃣ **components/ProjectTypeCard.jsx** (Novo - ~70 linhas)

**Localização Original:** Linhas 362-437 (2 instâncias)

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { Card, CardFooter, Image } from "@heroui/react";
import { Icon } from "@iconify/react";

export function ProjectTypeCard({
  type,
  title,
  description,
  image,
  isSelected,
  onSelect,
}) {
  return (
    <Card 
      isPressable 
      isFooterBlurred
      radius="lg"
      shadow="sm"
      aria-label={`Select ${title} project type`}
      className={`cursor-pointer transition-all duration-200 w-full ${
        isSelected 
          ? "ring-2 ring-primary/70 shadow-medium" 
          : "hover:shadow-medium"
      }`}
      onPress={onSelect}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
        <Image
          removeWrapper
          src={image}
          alt={title}
          className="z-0 w-full h-full object-cover"
        />
        <CardFooter className="absolute bottom-0 z-10 bg-black/50 text-white flex items-center justify-between w-full gap-3">
          <div className="leading-tight text-left">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs opacity-90 mt-0.5">{description}</p>
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            isSelected 
              ? "border-primary bg-primary/20" 
              : "border-white/50 bg-white/10"
          }`}>
            {isSelected && (
              <Icon icon="lucide:check" className="text-primary text-sm" />
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
```

**Props:**
- `type`: Tipo do projeto ("simu" | "logo")
- `title`: Título do card
- `description`: Descrição do tipo
- `image`: URL da imagem
- `isSelected`: Se está selecionado
- `onSelect`: Callback de seleção

**Razão:** Card reutilizável. Facilita adicionar novos tipos de projeto no futuro.

---

### 1️⃣2️⃣ **components/SimuWorkflowSelector.jsx** (Novo - ~90 linhas)

**Localização Original:** Linhas 441-496

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { Card } from "@heroui/react";
import { Icon } from "@iconify/react";

export function SimuWorkflowSelector({ selectedWorkflow, onSelect }) {
  const workflows = [
    {
      id: "ai",
      icon: "lucide:zap",
      iconColor: "text-warning-500",
      title: "AI Assisted Designer",
      features: ["Results in seconds", "Ideal for quick projects"],
    },
    {
      id: "human",
      icon: "lucide:palette",
      iconColor: "text-pink-400",
      title: "Send to Human Designer",
      features: ["More realistic results", "More refined results"],
    },
  ];

  return (
    <div className="mt-3">
      <div className="text-center mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          Choose the mode
        </h3>
      </div>
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          {workflows.map((workflow) => (
            <Card
              key={workflow.id}
              isPressable
              radius="lg"
              shadow="sm"
              aria-label={workflow.title}
              className={`relative transition-all bg-content1 rounded-2xl border-2 ${
                selectedWorkflow === workflow.id
                  ? "border-primary"
                  : "border-transparent hover:border-primary/40"
              }`}
              onPress={() => onSelect(workflow.id)}
            >
              {selectedWorkflow === workflow.id && (
                <Icon 
                  icon="lucide:check" 
                  className="absolute top-2.5 right-2.5 text-primary text-sm" 
                />
              )}
              <div className="p-3 sm:p-4 flex flex-col items-center text-center gap-1">
                <Icon icon={workflow.icon} className={`${workflow.iconColor} text-2xl`} />
                <p className="font-semibold text-foreground text-base sm:text-lg">
                  {workflow.title}
                </p>
                {workflow.features.map((feature, idx) => (
                  <p key={idx} className="text-xs text-default-500">
                    {feature}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Props:**
- `selectedWorkflow`: Workflow selecionado ("ai" | "human" | null)
- `onSelect`: Callback de seleção

**Razão:** Componente especializado para seleção de workflow Simu. Facilita adicionar novos workflows.

---

### 1️⃣3️⃣ **steps/StepProjectDetails.jsx** (Novo - ~150 linhas)

**Localização Original:** Linhas 234-348

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { Input, DatePicker } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Icon } from "@iconify/react";
import { ClientAutocomplete } from "../components/ClientAutocomplete";

export function StepProjectDetails({
  formData,
  clients,
  onInputChange,
  onClientSelect,
  onClientInputChange,
  onAddNewClient,
}) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold">Project Details</h2>
          <p className="text-sm sm:text-base text-default-500 mt-2">
            Let's start with the basic information about your project.
          </p>
        </div>
        
        <div className="space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">
              Project Name *
            </label>
            <Input
              isRequired
              placeholder="Enter the project name"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              className="w-full"
              variant="bordered"
              size="md"
              radius="lg"
              startContent={<Icon icon="lucide:folder" className="text-default-400" />}
              classNames={{
                input: "text-foreground font-medium",
                inputWrapper: "bg-content1 border-2 border-divider hover:border-primary focus-within:border-primary"
              }}
            />
          </div>
          
          {/* Client Autocomplete */}
          <div>
            <ClientAutocomplete
              clients={clients}
              selectedKey={formData.selectedClientKey}
              inputValue={formData.clientName}
              onSelectionChange={onClientSelect}
              onInputChange={onClientInputChange}
              onAddNewClick={onAddNewClient}
            />
          </div>
          
          {/* Date and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePicker
                labelPlacement="outside"
                label="Delivery Date"
                isRequired
                value={formData.endDate}
                onChange={(value) => onInputChange("endDate", value)}
                className="w-full"
                variant="bordered"
                size="md"
                radius="lg"
                showMonthAndYearPickers
                locale="pt-PT"
                minValue={today(getLocalTimeZone())}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Budget (EUR) *</label>
              <Input
                type="number"
                placeholder="Enter the budget amount"
                value={formData.budget}
                onChange={(e) => onInputChange("budget", e.target.value)}
                className="w-full"
                variant="bordered"
                size="md"
                radius="lg"
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">€</span>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Props:**
- `formData`: Objeto com dados do formulário
- `clients`: Array de clientes
- `onInputChange`: Handler genérico de inputs
- `onClientSelect`: Handler de seleção de cliente
- `onClientInputChange`: Handler de mudança de input de cliente
- `onAddNewClient`: Handler de adicionar novo cliente

**Razão:** Step independente. Facilita modificar campos do Step 1 sem afetar outros steps.

---

### 1️⃣4️⃣ **steps/StepProjectType.jsx** (Novo - ~80 linhas)

**Localização Original:** Linhas 350-497

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { ProjectTypeCard } from "../components/ProjectTypeCard";
import { SimuWorkflowSelector } from "../components/SimuWorkflowSelector";

export function StepProjectType({ formData, onInputChange }) {
  const projectTypes = [
    {
      type: "simu",
      title: "Simu",
      description: "Simulate the decor in the ambience",
      image: "/simuvideo.webp",
    },
    {
      type: "logo",
      title: "Logo",
      description: "Create your own decoration or edit existing ones",
      image: "/logo.webp",
    },
  ];

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold">Project Type</h2>
          <p className="text-sm sm:text-base text-default-500 mt-1">
            Select the type of project
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-2xl">
            {projectTypes.map((projectType) => (
              <ProjectTypeCard
                key={projectType.type}
                type={projectType.type}
                title={projectType.title}
                description={projectType.description}
                image={projectType.image}
                isSelected={formData.projectType === projectType.type}
                onSelect={() => onInputChange("projectType", projectType.type)}
              />
            ))}
          </div>
        </div>

        {/* Simu Workflow Selector */}
        {formData.projectType === "simu" && (
          <SimuWorkflowSelector
            selectedWorkflow={formData.simuWorkflow}
            onSelect={(workflow) => onInputChange("simuWorkflow", workflow)}
          />
        )}
      </div>
    </div>
  );
}
```

**Props:**
- `formData`: Objeto com dados do formulário
- `onInputChange`: Handler genérico de inputs

**Razão:** Step modular. Facilita adicionar novos tipos de projeto (ex: "decoration", "blueprint").

---

### 1️⃣5️⃣ **steps/StepLocationDescription.jsx** (Novo - ~90 linhas)

**Localização Original:** Linhas 500-547

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { Input, Textarea, Card } from "@heroui/react";
import { Icon } from "@iconify/react";

export function StepLocationDescription({ formData, onInputChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Location & Description</h2>
      <p className="text-sm sm:text-base text-default-500">
        Add location and a detailed description for the project.
      </p>
      
      <div className="space-y-4">
        {/* Selected Workflow Info */}
        {formData.projectType === "simu" && formData.simuWorkflow && (
          <Card className="p-4 bg-content1/60 border border-divider">
            <div className="flex items-start gap-3">
              <Icon icon="lucide:layers" className="text-primary" />
              <div>
                <p className="text-sm text-default-500">Selected mode</p>
                <p className="font-medium text-foreground capitalize">
                  {formData.simuWorkflow === "ai" 
                    ? "AI Assisted Designer" 
                    : "Send to Human Designer"}
                </p>
              </div>
            </div>
          </Card>
        )}
        
        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Project Location (Optional)
          </label>
          <Input
            placeholder="Enter project location or address"
            value={formData.location}
            onChange={(e) => onInputChange("location", e.target.value)}
            className="w-full"
            startContent={<Icon icon="lucide:map-pin" className="text-default-400" />}
          />
        </div>
        
        {/* Description Textarea */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Project Description (Optional)
          </label>
          <Textarea
            placeholder="Enter a detailed project description, goals, and requirements..."
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            className="w-full"
            minRows={6}
          />
        </div>
      </div>
    </div>
  );
}
```

**Props:**
- `formData`: Objeto com dados do formulário
- `onInputChange`: Handler genérico de inputs

**Razão:** Step simples e independente. Facilita adicionar campos adicionais (ex: tags, anexos).

---

### 1️⃣6️⃣ **steps/StepConfirmDetails.jsx** (Novo - ~120 linhas)

**Localização Original:** Linhas 549-643

**Conteúdo a Extrair:**
```jsx
import React from "react";
import { Card } from "@heroui/react";
import { Icon } from "@iconify/react";

export function StepConfirmDetails({ formData, error }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Confirm Details</h2>
      <p className="text-sm sm:text-base text-default-500">
        Please review the information before creating the project.
      </p>
      
      <div className="space-y-6">
        {/* Project Details Card */}
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon icon="lucide:folder" className="text-primary" />
            Project Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-default-500">Name:</span>
              <p className="font-medium">{formData.name || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Type:</span>
              <p className="font-medium capitalize">{formData.projectType || "—"}</p>
            </div>
            {formData.projectType === "simu" && (
              <div className="col-span-2">
                <span className="text-default-500">Simu mode:</span>
                <p className="font-medium">
                  {formData.simuWorkflow === "ai"
                    ? "AI Assisted Designer"
                    : formData.simuWorkflow === "human"
                    ? "Send to Human Designer"
                    : "—"}
                </p>
              </div>
            )}
            <div>
              <span className="text-default-500">Client:</span>
              <p className="font-medium">{formData.clientName || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Status:</span>
              <p className="font-medium">Created</p>
            </div>
            <div>
              <span className="text-default-500">Client Email:</span>
              <p className="font-medium">{formData.clientEmail || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Client Phone:</span>
              <p className="font-medium">{formData.clientPhone || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">End Date:</span>
              <p className="font-medium">
                {formData.endDate 
                  ? formData.endDate.toDate(new Date().getTimezoneOffset()).toLocaleDateString() 
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-default-500">Budget:</span>
              <p className="font-medium">
                {formData.budget 
                  ? `€${parseFloat(formData.budget).toLocaleString()}` 
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Location & Description Card */}
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon icon="lucide:map-pin" className="text-primary" />
            Location & Description
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-default-500">Location:</span>
              <p className="font-medium">{formData.location || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Description:</span>
              <p className="font-medium whitespace-pre-wrap">
                {formData.description || "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
          <Icon icon="lucide:alert-circle" className="inline mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}
```

**Props:**
- `formData`: Objeto com todos os dados do formulário
- `error`: Mensagem de erro (se houver)

**Razão:** Step de review independente. Facilita customizar formatação de dados.

---

### 1️⃣7️⃣ **index.jsx** (Principal - Refatorado)

**Linhas Estimadas:** ~180-220 linhas (redução de 75%)

**Estrutura:**
```jsx
import React, { useEffect } from "react";
import { Card, Button } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Icon } from "@iconify/react";

// Hooks
import { useProjectForm } from "./hooks/useProjectForm";
import { useClientManagement } from "./hooks/useClientManagement";
import { useStepNavigation } from "./hooks/useStepNavigation";

// Components
import { StepIndicator } from "./components/StepIndicator";
import { NavigationFooter } from "./components/NavigationFooter";
import { AddClientModal } from "./components/AddClientModal";

// Steps
import { StepProjectDetails } from "./steps/StepProjectDetails";
import { StepProjectType } from "./steps/StepProjectType";
import { StepLocationDescription } from "./steps/StepLocationDescription";
import { StepConfirmDetails } from "./steps/StepConfirmDetails";

// Constants
import { STEPS } from "./constants";

export function CreateProjectMultiStep({ onClose }) {
  // Initialize hooks
  const formState = useProjectForm(onClose);
  const clientState = useClientManagement(formState.setFormData);
  const navigation = useStepNavigation(formState.formData, STEPS.length);

  // Set default end date
  useEffect(() => {
    if (!formState.formData.endDate) {
      const base = today(getLocalTimeZone());
      formState.handleInputChange("endDate", base.add({ days: 7 }));
    }
  }, []);

  // Render current step
  const renderStepContent = () => {
    switch (navigation.currentStep) {
      case 1:
        return (
          <StepProjectDetails
            formData={formState.formData}
            clients={clientState.clients}
            onInputChange={formState.handleInputChange}
            onClientSelect={clientState.handleClientSelection}
            onClientInputChange={clientState.handleClientInputChange}
            onAddNewClient={() => clientState.setNewClientModal(true)}
          />
        );
      
      case 2:
        return (
          <StepProjectType
            formData={formState.formData}
            onInputChange={formState.handleInputChange}
          />
        );
      
      case 3:
        return (
          <StepLocationDescription
            formData={formState.formData}
            onInputChange={formState.handleInputChange}
          />
        );
      
      case 4:
        return (
          <StepConfirmDetails
            formData={formState.formData}
            error={formState.error}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full">
      <Card className="shadow-lg overflow-hidden h-full rounded-none bg-default-100">
        <div className="flex flex-col h-full min-h-0">
          {/* Top bar + horizontal stepper */}
          <div className="w-full bg-content1 px-4 py-2 sm:px-6 sm:py-3 border-b border-divider">
            <div className="flex items-center gap-4">
              <Button
                variant="light"
                className="text-default-600 shrink-0"
                startContent={<Icon icon="lucide:arrow-left" />}
                onPress={onClose}
              >
                Back to dashboard
              </Button>

              <StepIndicator 
                steps={STEPS} 
                currentStep={navigation.currentStep} 
              />
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-h-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 overflow-y-auto bg-default-100">
            <div className="max-w-6xl mx-auto pb-24">
              {renderStepContent()}
            </div>
          </div>
          
          {/* Navigation Footer */}
          <NavigationFooter
            currentStep={navigation.currentStep}
            totalSteps={STEPS.length}
            onNext={navigation.nextStep}
            onPrev={navigation.prevStep}
            onSubmit={formState.handleSubmit}
            isValid={navigation.canProceed()}
            loading={formState.loading}
          />
        </div>
      </Card>
      
      {/* Add Client Modal */}
      <AddClientModal
        isOpen={clientState.newClientModal}
        onClose={() => clientState.setNewClientModal(false)}
        onAddClient={clientState.handleCreateNewClient}
      />
    </div>
  );
}
```

**Razão:** Componente principal simplificado que orquestra todos os módulos. Fácil de entender e manter.

---

## 🔄 ORDEM DE IMPLEMENTAÇÃO

### **Fase 1: Preparação** (Sem quebras, criação de ficheiros base)
1. ✅ Criar estrutura de pastas: `create-project-multi-step/`
2. ✅ Criar `constants.js`
3. ✅ Criar `utils/mockData.js`
4. ✅ Criar `utils/validation.js`

**Status:** ✅ Nenhuma quebra, ficheiro original intacto

---

### **Fase 2: Custom Hooks** (Extração de lógica)
5. ✅ Criar `hooks/useProjectForm.js`
6. ✅ Criar `hooks/useClientManagement.js`
7. ✅ Criar `hooks/useStepNavigation.js`

**Status:** ✅ Hooks podem ser testados independentemente

---

### **Fase 3: Componentes Reutilizáveis** (UI)
8. ✅ Criar `components/StepIndicator.jsx`
9. ✅ Criar `components/NavigationFooter.jsx`
10. ✅ Criar `components/ProjectTypeCard.jsx`
11. ✅ Criar `components/SimuWorkflowSelector.jsx`
12. ✅ Criar `components/ClientAutocomplete.jsx`
13. ✅ Criar `components/AddClientModal.jsx`

**Status:** ✅ Componentes isolados, podem ser testados em Storybook

---

### **Fase 4: Steps Modulares** (Conteúdo dos steps)
14. ✅ Criar `steps/StepProjectDetails.jsx`
15. ✅ Criar `steps/StepProjectType.jsx`
16. ✅ Criar `steps/StepLocationDescription.jsx`
17. ✅ Criar `steps/StepConfirmDetails.jsx`

**Status:** ✅ Steps independentes criados

---

### **Fase 5: Integração e Validação** (Substituição do original)
18. ✅ Refatorar `create-project-multi-step.jsx` → `create-project-multi-step/index.jsx`
19. ✅ Testar fluxo completo em desenvolvimento
20. ✅ Validar que todas as funcionalidades funcionam
21. ✅ Remover ficheiro original após confirmação

**Status:** ⚠️ Atenção máxima nesta fase

---

## ✅ VANTAGENS DESTA ARQUITETURA

### 📦 **Modularidade**
- Cada componente tem responsabilidade única (Single Responsibility Principle)
- Fácil localizar onde fazer alterações
- Reduz acoplamento entre componentes

### ♻️ **Reutilização**
- `ProjectTypeCard` pode ser usado em outros wizards
- `AddClientModal` pode ser usado em gestão de clientes
- Hooks podem ser compartilhados entre formulários

### 🧪 **Testabilidade**
- Cada módulo pode ser testado isoladamente
- Mocks mais simples (ex: testar `useClientManagement` sem UI)
- Facilita TDD (Test-Driven Development)

### 🔧 **Manutenção**
- Alterações em Step 1 não afetam Step 2
- Bug fixes mais rápidos (scope reduzido)
- Code reviews mais fáceis (ficheiros menores)

### 📈 **Escalabilidade**
- Adicionar Step 5 é trivial
- Novos tipos de projeto = novo card
- Fácil adicionar validações customizadas

### 📚 **Legibilidade**
- Ficheiros de 50-150 linhas (vs 854)
- Nomes descritivos facilitam navegação
- Hierarquia clara de responsabilidades

### ⚡ **Performance** (Futuro)
- Possibilita lazy loading de steps pesados
- Code splitting por step
- Otimização seletiva de re-renders

---

## 🛡️ GARANTIAS DE NÃO QUEBRAR

### ✅ **Implementação Gradual**
- Criar novos ficheiros **sem alterar** o original
- Testar cada módulo independentemente
- Original permanece funcional até validação completa

### ✅ **Testes em Paralelo**
- Manter `create-project-multi-step.jsx` original
- Criar `create-project-multi-step/` em paralelo
- Comparar comportamento lado a lado

### ✅ **Props Explícitas**
- Toda comunicação via props (sem globals)
- Tipos claros de dados esperados
- Facilita debug e rastreamento

### ✅ **Estado Centralizado**
- Hooks mantêm estado consistente
- Nenhuma duplicação de estado
- Single source of truth

### ✅ **Mesmas Dependências**
- Não adicionar novas bibliotecas
- Usar mesmos componentes HeroUI
- Manter mesma lógica de API

### ✅ **Console.logs Preservados**
- Manter todos os logs existentes [[memory:9198107]]
- Adicionar novos logs para debugging
- Facilita comparação de comportamento

---

## 🚀 BENEFÍCIOS FUTUROS

### Fácil Adicionar:

#### ➕ **Novos Tipos de Projeto**
```jsx
// Em steps/StepProjectType.jsx, adicionar:
{
  type: "decoration",
  title: "Custom Decoration",
  description: "Design from scratch",
  image: "/decoration.webp",
}
```

#### ➕ **Novo Step (Ex: "Upload Files")**
1. Adicionar em `constants.js`:
   ```javascript
   { id: "upload-files", label: "Upload Files", icon: "lucide:upload" }
   ```
2. Criar `steps/StepUploadFiles.jsx`
3. Adicionar case no switch de `index.jsx`
4. Adicionar validação em `validation.js`

#### ➕ **Validações Customizadas**
```javascript
// Em utils/validation.js
export const validateBudget = (budget) => {
  return budget >= 100 && budget <= 1000000;
};
```

#### ➕ **Novos Workflows Simu**
```jsx
// Em components/SimuWorkflowSelector.jsx
{
  id: "hybrid",
  icon: "lucide:sparkles",
  iconColor: "text-purple-500",
  title: "Hybrid (AI + Human Review)",
  features: ["Best of both worlds", "AI speed + Human refinement"],
}
```

#### ➕ **Integração com API Real**
```javascript
// Em hooks/useClientManagement.js
const loadClients = async () => {
  try {
    const response = await clientsAPI.getAll(); // Substituir MOCK_CLIENTS
    setClients(response.data);
  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
  }
};
```

### Possibilidades Avançadas:

#### 🎨 **Animações entre Steps**
```jsx
// Com Framer Motion
<AnimatePresence mode="wait">
  <motion.div
    key={navigation.currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
  >
    {renderStepContent()}
  </motion.div>
</AnimatePresence>
```

#### 📖 **Storybook para Componentes**
```javascript
// stories/ProjectTypeCard.stories.jsx
export default {
  title: 'Components/ProjectTypeCard',
  component: ProjectTypeCard,
};

export const Simu = {
  args: {
    type: "simu",
    title: "Simu",
    description: "Simulate the decor",
    image: "/simuvideo.webp",
    isSelected: false,
  },
};
```

#### 🔄 **Lazy Loading de Steps**
```jsx
const StepProjectType = React.lazy(() => import('./steps/StepProjectType'));
const StepConfirmDetails = React.lazy(() => import('./steps/StepConfirmDetails'));
```

#### 💾 **Auto-save de Formulário**
```javascript
// Em hooks/useProjectForm.js
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem('draft-project', JSON.stringify(formData));
  }, 1000);
  
  return () => clearTimeout(timer);
}, [formData]);
```

---

## 📝 NOTAS IMPORTANTES

### ⚠️ **Princípios a Seguir:**

1. **Não remover console.logs** até confirmação do utilizador [[memory:9198107]]
2. **Não alterar lógica de negócio**, apenas estrutura
3. **Manter compatibilidade** com componentes externos (`projectsAPI`)
4. **Props devem ser tipadas** com PropTypes (ou TypeScript no futuro)
5. **Comentários devem explicar** dependências entre módulos
6. **Testar em mobile e desktop** (responsividade)

### 📋 **Checklist de Validação:**

- [ ] Todos os campos continuam a funcionar
- [ ] Validações funcionam corretamente
- [ ] Cliente pode ser selecionado/adicionado
- [ ] Data picker funciona
- [ ] Navegação entre steps funciona
- [ ] Submissão cria projeto na API
- [ ] Erros são exibidos corretamente
- [ ] Responsivo funciona (mobile/tablet/desktop)
- [ ] Console.logs presentes e funcionais
- [ ] Workflow Simu (AI/Human) funciona
- [ ] Modal de adicionar cliente funciona
- [ ] Autocomplete de clientes funciona

### 🎯 **Métricas de Sucesso:**

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Linhas por ficheiro** | 854 | ~50-150 | -82% |
| **Ficheiros** | 1 | 18 | Modularizado |
| **Complexidade Ciclomática** | Alta | Baixa | Simplificado |
| **Testabilidade** | Difícil | Fácil | +100% |
| **Tempo de localização** | ~5min | ~30s | -90% |
| **Reutilização** | 0% | 70% | +70% |

---

## 🔄 PROCESSO DE MIGRAÇÃO

### Passo a Passo Seguro:

1. **Backup:**
   ```bash
   git checkout -b refactor/create-project-multi-step
   ```

2. **Criar pasta:**
   ```bash
   mkdir -p src/components/create-project-multi-step/{hooks,steps,components,utils}
   ```

3. **Implementar Fase 1-4** (sem tocar no original)

4. **Testar módulos isoladamente**

5. **Implementar Fase 5:**
   - Renomear `create-project-multi-step.jsx` para `create-project-multi-step.backup.jsx`
   - Criar `create-project-multi-step/index.jsx`
   - Testar aplicação completa

6. **Validação final:**
   - Criar projeto Simu (AI e Human)
   - Criar projeto Logo
   - Adicionar novo cliente
   - Testar validações
   - Verificar submissão

7. **Remover backup** (após confirmação)

---

## 📚 REFERÊNCIAS E PADRÕES

### Padrões Utilizados:
- **Custom Hooks Pattern** - Extração de lógica reutilizável
- **Compound Components** - Componentes que trabalham juntos (Steps)
- **Container/Presentational** - Separação de lógica e UI
- **Single Responsibility** - Cada módulo tem um propósito
- **DRY (Don't Repeat Yourself)** - Reutilização de código

### Arquitetura:
```
┌─────────────────────────────────────┐
│         index.jsx (Orchestrator)    │
│  - Coordena hooks e componentes     │
│  - Renderiza layout geral           │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    │   Hooks     │ (Lógica)
    │             │
    │ ├─ useProjectForm
    │ ├─ useClientManagement
    │ └─ useStepNavigation
    │
    ├──────┴──────┐
    │ Components  │ (UI Reutilizável)
    │             │
    │ ├─ StepIndicator
    │ ├─ NavigationFooter
    │ ├─ ProjectTypeCard
    │ ├─ SimuWorkflowSelector
    │ ├─ ClientAutocomplete
    │ └─ AddClientModal
    │
    ├──────┴──────┐
    │   Steps     │ (Conteúdo)
    │             │
    │ ├─ StepProjectDetails
    │ ├─ StepProjectType
    │ ├─ StepLocationDescription
    │ └─ StepConfirmDetails
    │
    └──────┴──────┐
        │  Utils  │ (Auxiliares)
        │         │
        ├─ validation.js
        ├─ mockData.js
        └─ constants.js
```

---

## ✨ CONCLUSÃO

Esta refatoração transforma um componente monolítico de **854 linhas** em **18 módulos especializados**, cada um com responsabilidade única e **50-150 linhas**.

### Ganhos Principais:
- ✅ **Manutenibilidade:** Encontrar e corrigir bugs em segundos
- ✅ **Escalabilidade:** Adicionar features sem medo de quebrar existentes
- ✅ **Testabilidade:** Testes unitários para cada módulo
- ✅ **Reutilização:** Componentes podem ser usados em outros contextos
- ✅ **Legibilidade:** Código auto-documentado e fácil de entender
- ✅ **Colaboração:** Múltiplos devs podem trabalhar em paralelo

### Risco de Quebra:
- ⚠️ **Mínimo** - Implementação gradual com validação contínua
- ⚠️ **Zero** durante Fases 1-4 (original intacto)
- ⚠️ **Controlado** na Fase 5 (testes antes de remover original)

---

**Status do Plano:** 🟢 Pronto para Implementação  
**Risco:** 🟢 Baixo (com implementação cuidadosa)  
**Tempo Estimado:** 6-8 horas (implementação completa)  
**Benefício:** 🚀 Alto (manutenibilidade e escalabilidade)

---

*Documento criado em: 9 de Outubro de 2025*  
*Última atualização: 9 de Outubro de 2025*  
*Autor: AI Assistant (Claude)*

