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
  logoInstructionsPage,
  onLogoInternalNext,
  onLogoInternalPrev,
  onLogoNew,
  onLogoFinish,
  isLogoFinishing,
}) {
  const isLogoInstructionsStep = currentStepId === "logo-instructions";

  return (
    <div className="w-full bg-content1 border-t border-divider px-4 py-4 sm:px-6 sm:py-6 flex-shrink-0">
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
        {isLogoInstructionsStep && logoInstructionsPage > 1 ? (
          // Nas páginas 2-4 do logo-instructions: Back navega entre páginas internas
          <Button
            variant="flat"
            onPress={onLogoInternalPrev}
            isDisabled={loading || isLogoFinishing}
            startContent={<Icon icon="lucide:arrow-left" />}
          >
            Back
          </Button>
        ) : (
          // Página 1 do logo-instructions ou outros steps: Back navega para step anterior
          <Button
            variant="flat"
            className={currentStep === 1 ? "invisible" : ""}
            onPress={onPrev}
            isDisabled={loading}
            startContent={<Icon icon="lucide:arrow-left" />}
          >
            Back
          </Button>
        )}

        <div className="flex gap-2">
          {isLogoInstructionsStep ? (
            // No step logo-instructions: mostrar botões baseado na página interna
            logoInstructionsPage === 4 ? (
              // Summary page: mostrar New Logo e Finish
              <>
                <Button
                  color="secondary"
                  variant="flat"
                  onPress={onLogoNew}
                  isDisabled={loading || isNavigating || !isCurrentLogoValid || isLogoFinishing}
                  startContent={<Icon icon="lucide:plus" />}
                >
                  New Logo
                </Button>
                <Button
                  color="primary"
                  onPress={onLogoFinish}
                  isLoading={loading || isNavigating || isSaving || isLogoFinishing}
                  isDisabled={!isValid || loading || isNavigating || isSaving || isLogoFinishing}
                  endContent={<Icon icon="lucide:check" />}
                  className="bg-primary-500 text-white"
                >
                  {loading || isNavigating || isSaving || isLogoFinishing ? (isSaving ? "Saving..." : "Creating...") : "Finish"}
                </Button>
              </>
            ) : (
              // Páginas 1-3: mostrar Next
              <Button
                color="primary"
                onPress={onLogoInternalNext}
                isDisabled={!isValid || loading || isNavigating || isLogoFinishing}
                endContent={<Icon icon="lucide:arrow-right" />}
                className="bg-blue-600 text-white"
              >
                Next
              </Button>
            )
          ) : currentStep < totalSteps ? (
            <Button
              color="primary"
              onPress={onNext}
              isLoading={isNavigating}
              isDisabled={!isValid || loading || isNavigating}
              endContent={<Icon icon="lucide:arrow-right" />}
              className="bg-blue-600 text-white"
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
              {loading ? (projectId ? "Saving..." : "Creating...") : (projectId ? "Save" : "Create Project")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
