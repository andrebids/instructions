import React from "react";
import { Button, Card, Input, Textarea, Image, CardFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import { projectsAPI } from "../services/api";

// Define form steps
const steps = [
  { id: "project-details", label: "Project Details", icon: "lucide:folder" },
  { id: "client-info", label: "Client Information", icon: "lucide:user" },
  { id: "timeline-budget", label: "Timeline & Budget", icon: "lucide:calendar" },
  { id: "location-description", label: "Location & Description", icon: "lucide:map-pin" },
  { id: "confirm-details", label: "Confirm Details", icon: "lucide:check-circle" },
];

export function CreateProjectMultiStep({ onClose }) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [formData, setFormData] = React.useState({
    // Step 1: Project Details
    name: "",
    projectType: "simu",
    status: "created",
    
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
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
            <h2 className="text-2xl font-bold">Project Details</h2>
            <p className="text-default-500">Let's start with the basic information about your project.</p>
            
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
                <label className="block text-sm font-medium mb-2">Project Type *</label>
                <p className="text-xs text-default-500 mb-3">Select the type of project</p>
                <RadioGroup
                  value={formData.projectType}
                  onValueChange={(value) => handleInputChange("projectType", value)}
                >
                  <Radio value="simu">
                    <div className="flex items-center gap-2">
                      <Icon icon="lucide:box" />
                      <span>Simu - Simulate the decor in the ambience</span>
                    </div>
                  </Radio>
                  <Radio value="logo">
                    <div className="flex items-center gap-2">
                      <Icon icon="lucide:image" />
                      <span>Logo - Create your own decoration or edit existing ones</span>
                    </div>
                  </Radio>
                </RadioGroup>
              </div>
              
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Client Information</h2>
            <p className="text-default-500">
              Tell us about the client for this project.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client Name *</label>
                <Input
                  isRequired
                  placeholder="Enter the client name"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  className="w-full"
                  startContent={<Icon icon="lucide:user" className="text-default-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Client Email (Optional)</label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                  className="w-full"
                  startContent={<Icon icon="lucide:mail" className="text-default-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Client Phone (Optional)</label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                  className="w-full"
                  startContent={<Icon icon="lucide:phone" className="text-default-400" />}
                />
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Timeline & Budget</h2>
            <p className="text-default-500">
              Set the timeline and budget for this project.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date *</label>
                <Input
                  type="date"
                  isRequired
                  value={formData.startDate || ""}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="w-full"
                  startContent={<Icon icon="lucide:calendar" className="text-default-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">End Date *</label>
                <Input
                  type="date"
                  isRequired
                  value={formData.endDate || ""}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full"
                  startContent={<Icon icon="lucide:calendar-check" className="text-default-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Budget (USD) *</label>
                <Input
                  type="number"
                  isRequired
                  placeholder="Enter the budget amount"
                  value={formData.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  className="w-full"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Location & Description</h2>
            <p className="text-default-500">
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
      
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Confirm Details</h2>
            <p className="text-default-500">
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
                    <span className="text-default-500">Status:</span>
                    <p className="font-medium">Created</p>
                  </div>
                </div>
              </Card>
              
              {/* Client Information */}
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="lucide:user" className="text-primary" />
                  Client Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-default-500">Name:</span>
                    <p className="font-medium">{formData.clientName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-default-500">Email:</span>
                    <p className="font-medium">{formData.clientEmail || "—"}</p>
                  </div>
                  <div>
                    <span className="text-default-500">Phone:</span>
                    <p className="font-medium">{formData.clientPhone || "—"}</p>
                  </div>
                </div>
              </Card>
              
              {/* Timeline & Budget */}
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="lucide:calendar" className="text-primary" />
                  Timeline & Budget
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-default-500">Start Date:</span>
                    <p className="font-medium">
                      {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-default-500">End Date:</span>
                    <p className="font-medium">
                      {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-default-500">Budget:</span>
                    <p className="font-medium">
                      {formData.budget ? `$${parseFloat(formData.budget).toLocaleString()}` : "—"}
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
        return formData.name.trim() !== "" && formData.projectType;
      case 2:
        return formData.clientName.trim() !== "";
      case 3:
        return formData.startDate && formData.endDate && formData.budget;
      case 4:
        return true; // Optional fields
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Card className="shadow-lg overflow-hidden">
        <div className="flex flex-col min-h-[600px]">
          {/* Top bar + horizontal stepper */}
          <div className="w-full bg-content1 p-6 border-b border-divider">
            <div className="flex items-center justify-between">
              <Button
                variant="light"
                className="text-default-600"
                startContent={<Icon icon="lucide:arrow-left" />}
                onPress={onClose}
              >
                Back to dashboard
              </Button>
            </div>
            
            {/* Horizontal steps */}
            <div className="mt-4 overflow-x-auto">
              <ol className="flex items-center gap-4 min-w-[700px]">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < currentStep;
                  const isActive = stepNumber === currentStep;
                  const isLast = stepNumber === steps.length;
                  return (
                    <React.Fragment key={step.id}>
                      <li className="flex items-center gap-2">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            isCompleted
                              ? "bg-success text-white"
                              : isActive
                              ? "bg-primary text-white"
                              : "bg-default-100 text-default-400"
                          }`}
                        >
                          {isCompleted ? (
                            <Icon icon="lucide:check" className="text-lg" />
                          ) : (
                            <span className="text-sm font-medium">{stepNumber}</span>
                          )}
                        </div>
                        <span
                          className={`whitespace-nowrap text-sm ${
                            isActive ? "font-semibold text-foreground" : "text-default-500"
                          }`}
                        >
                          {step.label}
                        </span>
                      </li>
                      {!isLast && (
                        <div
                          className={`h-0.5 w-10 md:w-24 ${
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

          {/* Main content */}
          <div className="flex-1 p-8">
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>
            
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-divider">
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
    </div>
  );
}

