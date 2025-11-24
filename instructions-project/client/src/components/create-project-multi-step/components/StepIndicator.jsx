import React from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export function StepIndicator({ steps, currentStep, onStepClick }) {
  const { t } = useTranslation();

  // Função para traduzir o label do step
  const getTranslatedLabel = (stepId) => {
    // Converter stepId de kebab-case para camelCase
    // project-details -> projectDetails, logo-instructions -> logoInstructions
    const camelCaseId = stepId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const translationKey = `pages.createProject.steps.${camelCaseId}`;
    const translated = t(translationKey);
    // Se a tradução não existir, retornar o label original
    return translated !== translationKey ? translated : steps.find(s => s.id === stepId)?.label || stepId;
  };
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
                  <button
                    onClick={() => onStepClick && onStepClick(stepNumber)}
                    disabled={!isCompleted && !isActive}
                    className={`flex items-center gap-1.5 sm:gap-2 transition-all ${(isCompleted || isActive) ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'
                      }`}
                  >
                    <div
                      className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-colors ${isCompleted
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
                      className={`whitespace-nowrap text-xs sm:text-sm ${isActive ? "font-semibold text-foreground" : "text-default-500"
                        }`}
                    >
                      {getTranslatedLabel(step.id)}
                    </span>
                  </button>
                </li>
                {!isLast && (
                  <div
                    className={`h-0.5 w-6 sm:w-10 md:w-16 lg:w-24 ${isCompleted ? "bg-success" : "bg-default-200"
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

