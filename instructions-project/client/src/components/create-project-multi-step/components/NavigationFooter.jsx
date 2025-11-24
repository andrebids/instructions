import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export function NavigationFooter({
  currentStep,
  totalSteps,
  currentStepId,
  onNext,
  onPrev,
  onSubmit,
  onSave,
  isValid,
  loading,
  isNavigating,
  onResetLogo,
  isCurrentLogoValid,
  projectId,
  isSaving,
}) {
  const isLogoInstructionsStep = currentStepId === "logo-instructions";

  return (
    <div className="w-full bg-content1 border-t border-divider px-4 py-4 sm:px-6 sm:py-6 flex-shrink-0">
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

        <div className="flex gap-2">
          {/* Save button - only show when editing existing project */}
          {projectId && currentStep < totalSteps && (
            <Button
              color="secondary"
              variant="flat"
              onPress={onSave}
              isLoading={isSaving}
              isDisabled={loading || isNavigating || isSaving}
              startContent={<Icon icon="lucide:save" />}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}

          {isLogoInstructionsStep ? (
            <>
              <Button
                color="secondary"
                variant="flat"
                onPress={onResetLogo}
                isDisabled={loading || isNavigating || !isCurrentLogoValid}
                startContent={<Icon icon="lucide:plus" />}
              >
                New Logo
              </Button>
              <Button
                color="primary"
                onPress={onNext}
                isLoading={isNavigating}
                isDisabled={!isValid || loading || isNavigating}
                endContent={<Icon icon="lucide:check" />}
              >
                {isNavigating ? "Creating..." : "Finish"}
              </Button>
            </>
          ) : currentStep < totalSteps ? (
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
