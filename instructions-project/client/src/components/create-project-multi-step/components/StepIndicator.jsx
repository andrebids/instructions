import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@heroui/use-theme";

export function StepIndicator({ steps, currentStep, onStepClick, vertical = false }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return theme === 'dark';
  });

  useEffect(() => {
    const checkDark = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(hasDarkClass);
    };

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('themechange', checkDark);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', checkDark);
    };
  }, [theme]);

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
                      className={`relative z-10 flex items-center justify-center aspect-square w-8 h-8 rounded-full transition-all duration-300 ${isCompleted
                        ? "bg-success border-2 border-success text-white shadow-sm"
                        : isActive
                          ? isDark
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-primary-500 text-white shadow-md"
                          : isDark
                            ? "bg-default-50 border-2 border-default-200 text-default-400 group-hover:border-default-300"
                            : "bg-gray-100 border-2 border-gray-300 text-gray-500 group-hover:border-gray-400"
                        }`}
                      style={{ minWidth: '2rem', minHeight: '2rem' }}
                    >
                      {isCompleted ? (
                        <Icon icon="lucide:check" className="text-base" />
                      ) : (
                        <span className="text-sm font-semibold leading-none">{stepNumber}</span>
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
                        className={`whitespace-nowrap text-xs sm:text-sm ${
                          isActive 
                            ? "font-semibold text-foreground" 
                            : isDark 
                              ? "text-default-500" 
                              : "text-gray-600"
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
                      ? `w-0.5 h-6 mr-4 my-1 transition-colors duration-300 ${
                          isCompleted 
                            ? "bg-success/50" 
                            : isDark 
                              ? "bg-default-200" 
                              : "bg-gray-300"
                        }`
                      : `h-0.5 w-6 sm:w-10 md:w-16 lg:w-24 ${
                          isCompleted 
                            ? "bg-success" 
                            : isDark 
                              ? "bg-default-200" 
                              : "bg-gray-300"
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

