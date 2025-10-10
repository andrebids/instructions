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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl">
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

