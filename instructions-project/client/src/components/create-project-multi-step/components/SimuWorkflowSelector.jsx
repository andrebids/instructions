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
      features: ["More realistic results", "Ideal for strategic projects"],
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

