import React from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export function StepIndicator({ steps, currentStep, onStepClick, vertical = false }) {
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
    <div className={`${vertical
      ? "fixed right-8 top-1/2 -translate-y-1/2 z-50 bg-transparent"
      : "flex-1 overflow-x-auto scrollbar-hide p-4"
      }`}>
      <div className={vertical ? "" : "flex justify-center"}>
        <ol className={`${vertical
          ? "flex flex-col items-end"
          : "flex items-center gap-2 sm:gap-4 min-w-fit"
          }`}>
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;
            const isLast = stepNumber === steps.length;

            return (
              <React.Fragment key={step.id}>
                <li className={`flex items-center gap-3 relative ${vertical ? "py-1" : ""}`}>
                  <button
                    onClick={() => onStepClick && onStepClick(stepNumber)}
                    className={`flex items-center gap-3 transition-all cursor-pointer hover:opacity-80 group ${vertical ? "flex-row-reverse text-right" : "text-left"}`}
                  >
                    <div
                      className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 border-2 ${isCompleted
                        ? "bg-success border-success text-white shadow-sm"
                        : isActive
                          ? "bg-primary border-primary text-white shadow-md scale-110"
                          : "bg-default-50 border-default-200 text-default-400 group-hover:border-default-300"
                        }`}
                    >
                      {isCompleted ? (
                        <Icon icon="lucide:check" className="text-base" />
                      ) : (
                        <span className="text-sm font-semibold">{stepNumber}</span>
                      )}
                    </div>

                    {vertical && (
                      <div className="flex flex-col items-end max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                        <span
                          className={`whitespace-nowrap text-sm font-medium transition-colors ${isActive
                            ? "text-foreground font-semibold"
                            : isCompleted
                              ? "text-white/90"
                              : "text-gray-300"
                            }`}
                        >
                          {getTranslatedLabel(step.id)}
                        </span>
                        {isActive && (
                          <span className="text-xs text-primary/90 font-medium whitespace-nowrap">
                            {t('common.currentStep', 'Current Step')}
                          </span>
                        )}
                      </div>
                    )}

                    {!vertical && (
                      <span
                        className={`whitespace-nowrap text-xs sm:text-sm ${isActive ? "font-semibold text-foreground" : "text-default-500"
                          }`}
                      >
                        {getTranslatedLabel(step.id)}
                      </span>
                    )}
                  </button>
                </li>

                {!isLast && (
                  <div
                    className={`${vertical
                      ? `w-0.5 h-6 mr-4 my-1 transition-colors duration-300 ${isCompleted ? "bg-success/50" : "bg-default-200"
                      }`
                      : `h-0.5 w-6 sm:w-10 md:w-16 lg:w-24 ${isCompleted ? "bg-success" : "bg-default-200"
                      }`
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

