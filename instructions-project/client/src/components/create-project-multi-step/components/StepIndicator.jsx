import React from "react";
import { Icon } from "@iconify/react";

export function StepIndicator({ steps, currentStep }) {
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
  );
}

