import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Input,
  Button,
  Textarea,
  Select,
  SelectItem,
  DatePicker,
  Spinner
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { projectsAPI } from "../services/api";

export function CreateProject({ onClose }) {
  const [formData, setFormData] = React.useState({
    name: "",
    clientName: "",
    projectType: "decor",
    status: "created",
    startDate: null,
    endDate: null,
    budget: "",
    description: "",
    location: ""
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      const newProject = await projectsAPI.create(projectData);
      console.log("✅ Project created:", newProject);
      
      onClose(); // Fecha modal e recarrega dados
    } catch (err) {
      console.error("❌ Error creating project:", err);
      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button 
            isIconOnly 
            variant="light" 
            onClick={onClose}
            className="mr-2"
            aria-label="Back"
          >
            <Icon icon="lucide:arrow-left" className="text-xl" />
          </Button>
          <h1 className="text-2xl font-bold">Create New Project</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
          <Icon icon="lucide:alert-circle" className="inline mr-2" />
          {error}
        </div>
      )}
      
      <Card className="shadow-sm">
        <CardHeader className="border-b border-default-200 pb-2">
          <h2 className="text-lg">Project Details</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                isRequired
                label="Project Name"
                placeholder="Enter the project name"
                value={formData.name}
                onValueChange={(value) => handleChange("name", value)}
                isDisabled={loading}
              />
              
              <Input
                isRequired
                label="Client"
                placeholder="Enter the client name"
                value={formData.clientName}
                onValueChange={(value) => handleChange("clientName", value)}
                isDisabled={loading}
              />
              
              <Input
                label="Location"
                placeholder="Project location"
                value={formData.location}
                onValueChange={(value) => handleChange("location", value)}
                isDisabled={loading}
              />
              
              <Select
                isRequired
                label="Project Type"
                placeholder="Select project type"
                defaultSelectedKeys={["decor"]}
                onChange={(e) => handleChange("projectType", e.target.value)}
                isDisabled={loading}
              >
                <SelectItem key="decor" value="decor">Decor</SelectItem>
                <SelectItem key="simu" value="simu">Simu</SelectItem>
                <SelectItem key="logo" value="logo">Logo</SelectItem>
              </Select>
              
              <Select
                isRequired
                label="Status"
                placeholder="Select status"
                defaultSelectedKeys={["created"]}
                onChange={(e) => handleChange("status", e.target.value)}
                isDisabled={loading}
              >
                <SelectItem key="created" value="created">Created</SelectItem>
                <SelectItem key="in_progress" value="in_progress">In Progress</SelectItem>
                <SelectItem key="finished" value="finished">Finished</SelectItem>
                <SelectItem key="approved" value="approved">Approved</SelectItem>
                <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                <SelectItem key="in_queue" value="in_queue">In Queue</SelectItem>
              </Select>
              
              <Input
                isRequired
                label="Budget ($)"
                placeholder="Enter the budget amount"
                value={formData.budget}
                onValueChange={(value) => handleChange("budget", value)}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">$</span>
                  </div>
                }
              />
              
              <DatePicker
                isRequired
                label="Start Date"
                placeholder="Select date"
                onChange={(date) => handleChange("startDate", date)}
              />
              
              <DatePicker
                isRequired
                label="End Date"
                placeholder="Select date"
                onChange={(date) => handleChange("endDate", date)}
              />
              
              <div className="md:col-span-2">
                <Textarea
                  label="Project Description"
                  placeholder="Enter a detailed project description"
                  value={formData.description}
                  onValueChange={(value) => handleChange("description", value)}
                  minRows={4}
                />
              </div>
            </div>
          </form>
        </CardBody>
        <CardFooter className="flex justify-end gap-2 border-t border-default-200 pt-4">
          <Button 
            variant="flat" 
            color="default"
            onClick={onClose}
            isDisabled={loading}
          >
            Cancel
          </Button>
          <Button 
            color="primary"
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
