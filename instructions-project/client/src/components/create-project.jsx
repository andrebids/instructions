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
  DatePicker
} from "@heroui/react";
import { Icon } from "@iconify/react";

export function CreateProject({ onClose }) {
  const [formData, setFormData] = React.useState({
    name: "",
    client: "",
    status: "Em Progresso",
    startDate: null,
    endDate: null,
    budget: "",
    description: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    onClose();
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
          >
            <Icon icon="lucide:arrow-left" className="text-xl" />
          </Button>
          <h1 className="text-2xl font-bold">Create New Project</h1>
        </div>
      </div>

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
              />
              
              <Input
                isRequired
                label="Client"
                placeholder="Enter the client name"
                value={formData.client}
                onValueChange={(value) => handleChange("client", value)}
              />
              
              <Select
                isRequired
                label="Status"
                placeholder="Select status"
                defaultSelectedKeys={["In Progress"]}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <SelectItem key="In Progress" value="In Progress">In Progress</SelectItem>
                <SelectItem key="Finished" value="Finished">Finished</SelectItem>
                <SelectItem key="Approved" value="Approved">Approved</SelectItem>
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
          >
            Cancel
          </Button>
          <Button 
            color="primary"
            onClick={handleSubmit}
          >
            Create Project
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
