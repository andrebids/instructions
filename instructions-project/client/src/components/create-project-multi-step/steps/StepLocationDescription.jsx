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
          <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">
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
          <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">
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

