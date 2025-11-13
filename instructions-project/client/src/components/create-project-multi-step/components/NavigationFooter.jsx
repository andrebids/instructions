import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { SaveStatus } from "./SaveStatus";

export function NavigationFooter({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSubmit,
  isValid,
  loading,
  isNavigating,
  saveStatus, // Novo prop para status de salvamento
}) {
  return (
    <div className="w-full bg-content1 border-t border-divider px-4 py-4 sm:px-6 sm:py-6 sticky bottom-0">
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
        <Button
          variant="flat"
          className={currentStep === 1 ? "invisible" : ""}
          onPress={onPrev}
          isDisabled={loading}
          startContent={<Icon icon="lucide:arrow-left" />}
        >
          Back
        </Button>
        
        {/* Status de salvamento no centro */}
        <div className="flex-1 flex items-center justify-center min-h-[32px]">
          <SaveStatus status={saveStatus} />
        </div>
        
        <div className="flex gap-2">
          {currentStep < totalSteps ? (
            <Button
              color="primary"
              onPress={onNext}
              isLoading={isNavigating}
              isDisabled={!isValid || loading || isNavigating}
              endContent={<Icon icon="lucide:arrow-right" />}
            >
              {isNavigating ? "Creating..." : "Continue"}
            </Button>
          ) : (
            <Button
              color="success"
              onPress={onSubmit}
              isLoading={loading}
              isDisabled={!isValid || loading}
              endContent={<Icon icon="lucide:check" />}
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

