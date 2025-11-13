import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export function NavigationFooter({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSubmit,
  isValid,
  loading,
  isNavigating,
}) {
  return (
    <div className="w-full bg-content1 border-t border-divider px-4 py-4 sm:px-6 sm:py-6 sticky bottom-0">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Button
          variant="flat"
          className={currentStep === 1 ? "invisible" : ""}
          onPress={onPrev}
          isDisabled={loading}
          startContent={<Icon icon="lucide:arrow-left" />}
        >
          Back
        </Button>
        
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

