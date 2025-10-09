import React from "react";
import { Button, Card, CardFooter, Input, Textarea, Image, Autocomplete, AutocompleteItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { DatePicker } from "@heroui/date-picker";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Icon } from "@iconify/react";
import { projectsAPI } from "../services/api";

// Define form steps
const steps = [
  { id: "project-details", label: "Project Details", icon: "lucide:folder" },
  { id: "project-type", label: "Project Type", icon: "lucide:layers" },
  { id: "location-description", label: "Location & Description", icon: "lucide:map-pin" },
  { id: "confirm-details", label: "Confirm Details", icon: "lucide:check-circle" },
];

export function CreateProjectMultiStep({ onClose }) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [clients, setClients] = React.useState([]);
  const [newClientModal, setNewClientModal] = React.useState(false);
  const [newClientData, setNewClientData] = React.useState({ name: "", email: "", phone: "" });
  const [formData, setFormData] = React.useState({
    // Step 1: Project Details
    name: "",
    projectType: "simu",
    status: "created",
    clientId: null,
    selectedClientKey: null,
    
    // Step 2: Client Information
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    
    // Step 3: Timeline & Budget
    startDate: null,
    endDate: null,
    budget: "",
    
    // Step 4: Location & Description
    location: "",
    description: "",
  });

  // Carregar clientes existentes
  React.useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      // Clientes existentes no sistema
      const mockClients = [
        { id: 1, name: "Fashion Outlet", email: "contact@fashionoutlet.com", phone: "+351 123 456 789" },
        { id: 2, name: "Lisbon Municipality", email: "info@cm-lisboa.pt", phone: "+351 987 654 321" },
        { id: 3, name: "Luxury Hotel Chain", email: "reservations@luxuryhotels.com", phone: "+351 456 789 123" },
        { id: 4, name: "Hotel Marquês de Pombal", email: "info@hotelmarques.com", phone: "+351 321 654 987" },
        { id: 5, name: "City Council", email: "contact@citycouncil.pt", phone: "+351 555 123 456" },
        { id: 6, name: "Centro Comercial Colombo", email: "info@colombo.pt", phone: "+351 777 888 999" },
        { id: 7, name: "Gourmet Restaurant", email: "reservations@gourmet.pt", phone: "+351 111 222 333" },
        { id: 8, name: "Tech Company HQ", email: "contact@techcompany.com", phone: "+351 444 555 666" },
      ];
      setClients(mockClients);
      
      // Para ambiente de demo: pré-selecionar um cliente aleatório
      if (mockClients.length > 0) {
        const randomIndex = Math.floor(Math.random() * mockClients.length);
        const defaultClient = mockClients[randomIndex];
        
        // Lista de nomes de projetos para demo
        const projectNames = [
          "Christmas 2025 Collection",
          "Summer Campaign 2025",
          "New Year Celebration",
          "Easter Special Display",
          "Black Friday Setup",
          "Valentine's Day Decoration",
          "Mother's Day Tribute",
          "Halloween Theme",
          "Spring Collection Launch",
          "Holiday Season Display",
          "Back to School Campaign",
          "Winter Wonderland",
          "Summer Festival Setup",
          "Anniversary Celebration",
          "Grand Opening Event"
        ];
        
        const randomProjectName = projectNames[Math.floor(Math.random() * projectNames.length)];
        
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

  // Definir data de entrega por defeito: hoje + 7 dias
  React.useEffect(() => {
    if (!formData.endDate) {
      const base = today(getLocalTimeZone());
      setFormData((prev) => ({
        ...prev,
        endDate: base.add({ days: 7 }),
      }));
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const handleClientInputChange = (value) => {
    setFormData(prev => ({
      ...prev,
      clientName: value,
    }));
  };

  // Função de filtro personalizada para o autocomplete
  const filterClients = (textValue, inputValue) => {
    return textValue.toLowerCase().includes(inputValue.toLowerCase());
  };

  // Verificar se deve mostrar opção de adicionar novo cliente
  const shouldShowAddNew = formData.clientName && 
    !clients.some(c => c.name.toLowerCase().includes(formData.clientName.toLowerCase()));

  const handleClientSelection = (key) => {
    console.log('Selected key:', key, 'Type:', typeof key);
    if (key) {
      // Converter key para número se necessário
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

  const handleCreateNewClient = () => {
    const newClient = {
      id: Date.now(), // ID temporário
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

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar dados para API
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
      
      onClose(); // Fecha e recarrega dados
    } catch (err) {
      console.error("❌ Error creating project:", err);
      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Project Details</h2>
            <p className="text-sm sm:text-base text-default-500">Let's start with the basic information about your project.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name *</label>
                <Input
                  isRequired
                  placeholder="Enter the project name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full"
                  startContent={<Icon icon="lucide:folder" className="text-default-400" />}
                />
              </div>
              
              <div>
                <Autocomplete
                  label="Client"
                  placeholder="Search for a client"
                  isRequired
                  onSelectionChange={handleClientSelection}
                  className="w-full"
                  startContent={<Icon icon="lucide:user" className="text-default-400" />}
                  menuTrigger="input"
                  defaultItems={clients}
                  selectedKey={formData.selectedClientKey}
                  inputValue={formData.clientName}
                  onInputChange={handleClientInputChange}
                >
                  {(client) => (
                    <AutocompleteItem key={client.id} textValue={client.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-xs text-default-500">{client.email}</span>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                
                {/* Botão para adicionar novo cliente */}
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  className="mt-2"
                  onPress={() => setNewClientModal(true)}
                >
                  <Icon icon="lucide:plus" className="mr-1" />
                  Add New Client
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    labelPlacement="outside"
                    label="Delivery Date"
                    isRequired
                    value={formData.endDate}
                    onChange={(value) => handleInputChange("endDate", value)}
                    className="w-full"
                    variant="bordered"
                    size="lg"
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
                    onChange={(e) => handleInputChange("budget", e.target.value)}
                    className="w-full"
                    variant="bordered"
                    size="lg"
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
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Project Type</h2>
            <p className="text-sm sm:text-base text-default-500">Select the type of project</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 justify-items-center">
              {/* Simu Card */}
              <Card 
                isPressable 
                isFooterBlurred
                radius="lg"
                shadow="sm"
                aria-label="Select Simu project type"
                className={`cursor-pointer transition-all duration-200 max-w-[420px] w-full ${
                  formData.projectType === "simu" 
                    ? "ring-2 ring-primary/70 shadow-medium" 
                    : "hover:shadow-medium"
                }`}
                onPress={() => handleInputChange("projectType", "simu")}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                  <Image
                    removeWrapper
                    src="/simuvideo.webp"
                    alt="3D Simulation Video"
                    className="z-0 w-full h-full object-cover"
                  />
                  <CardFooter className="absolute bottom-0 z-10 bg-black/50 text-white flex items-center justify-between w-full gap-3">
                    <div className="leading-tight text-left">
                      <p className="font-semibold text-sm">Simu</p>
                      <p className="text-xs opacity-90 mt-0.5">Simulate the decor in the ambience</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.projectType === "simu" 
                        ? "border-white bg-white/20" 
                        : "border-white/50"
                    }`}>
                      {formData.projectType === "simu" && (
                        <Icon icon="lucide:check" className="text-white text-sm" />
                      )}
                    </div>
                  </CardFooter>
                </div>
              </Card>

              {/* Logo Card */}
              <Card 
                isPressable 
                isFooterBlurred
                radius="lg"
                shadow="sm"
                aria-label="Select Logo project type"
                className={`cursor-pointer transition-all duration-200 max-w-[420px] w-full ${
                  formData.projectType === "logo" 
                    ? "ring-2 ring-primary/70 shadow-medium" 
                    : "hover:shadow-medium"
                }`}
                onPress={() => handleInputChange("projectType", "logo")}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                  <Image
                    removeWrapper
                    src="/logo.webp"
                    alt="Logo Design"
                    className="z-0 w-full h-full object-cover"
                  />
                  <CardFooter className="absolute bottom-0 z-10 bg-black/50 text-white flex items-center justify-between w-full gap-3">
                    <div className="leading-tight text-left">
                      <p className="font-semibold text-sm">Logo</p>
                      <p className="text-xs opacity-90 mt-0.5">Create your own decoration or edit existing ones</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.projectType === "logo" 
                        ? "border-white bg-white/20" 
                        : "border-white/50"
                    }`}>
                      {formData.projectType === "logo" && (
                        <Icon icon="lucide:check" className="text-white text-sm" />
                      )}
                    </div>
                  </CardFooter>
                </div>
              </Card>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Location & Description</h2>
            <p className="text-sm sm:text-base text-default-500">
              Add location and a detailed description for the project.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Location (Optional)</label>
                <Input
                  placeholder="Enter project location or address"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full"
                  startContent={<Icon icon="lucide:map-pin" className="text-default-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Project Description (Optional)
                </label>
                <Textarea
                  placeholder="Enter a detailed project description, goals, and requirements..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full"
                  minRows={6}
                />
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Confirm Details</h2>
            <p className="text-sm sm:text-base text-default-500">
              Please review the information before creating the project.
            </p>
            
            <div className="space-y-6">
              {/* Project Details */}
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
                    <p className="font-medium capitalize">{formData.projectType}</p>
                  </div>
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
                      {formData.endDate ? formData.endDate.toDate(new Date().getTimezoneOffset()).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-default-500">Budget:</span>
                    <p className="font-medium">
                      {formData.budget ? `€${parseFloat(formData.budget).toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Location & Description */}
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
            
            {error && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
                <Icon icon="lucide:alert-circle" className="inline mr-2" />
                {error}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== "" && formData.clientName.trim() !== "" && formData.endDate;
      case 2:
        return formData.projectType;
      case 3:
        return true; // Optional fields
      case 4:
        return true; // Review step
      default:
        return false;
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

              {/* Horizontal steps */}
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
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-h-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 overflow-y-auto bg-default-100">
            <div className="max-w-6xl mx-auto pb-24">
              {renderStepContent()}
            </div>
          </div>
          
          {/* Fixed Footer com botões de navegação */}
          <div className="w-full bg-content1 border-t border-divider px-4 py-4 sm:px-6 sm:py-6 sticky bottom-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <Button
                variant="flat"
                className={currentStep === 1 ? "invisible" : ""}
                onPress={prevStep}
                isDisabled={loading}
                startContent={<Icon icon="lucide:arrow-left" />}
              >
                Back
              </Button>
              
              <div className="flex gap-2">
                {currentStep < steps.length ? (
                  <Button
                    color="primary"
                    onPress={nextStep}
                    isDisabled={!isStepValid() || loading}
                    endContent={<Icon icon="lucide:arrow-right" />}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    color="success"
                    onPress={handleSubmit}
                    isLoading={loading}
                    isDisabled={!isStepValid() || loading}
                    endContent={<Icon icon="lucide:check" />}
                  >
                    {loading ? "Creating..." : "Create Project"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Modal para adicionar novo cliente */}
      <Modal 
        isOpen={newClientModal} 
        onClose={() => setNewClientModal(false)}
        size="md"
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:user-plus" className="text-primary text-xl" />
                  <span>Add New Client</span>
                </div>
                <p className="text-xs text-default-500 font-normal">Fill in the client information below</p>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="space-y-4">
                  <Input
                    label="Client Name"
                    labelPlacement="outside"
                    placeholder="Enter client name"
                    value={newClientData.name}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                    isRequired
                    variant="bordered"
                    startContent={<Icon icon="lucide:building-2" className="text-default-400" />}
                  />
                  <Input
                    label="Email"
                    labelPlacement="outside"
                    type="email"
                    placeholder="client@example.com"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                    variant="bordered"
                    startContent={<Icon icon="lucide:mail" className="text-default-400" />}
                  />
                  <Input
                    label="Phone"
                    labelPlacement="outside"
                    placeholder="+351 123 456 789"
                    value={newClientData.phone}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                    variant="bordered"
                    startContent={<Icon icon="lucide:phone" className="text-default-400" />}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleCreateNewClient}
                  isDisabled={!newClientData.name.trim()}
                  startContent={<Icon icon="lucide:check" />}
                >
                  Add Client
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

