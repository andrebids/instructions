import React from "react";
import { Input, DatePicker } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Icon } from "@iconify/react";
import * as Yup from "yup";
import { useFormikStep } from "../hooks/useFormikStep";
import { ClientAutocomplete } from "../components/ClientAutocomplete";
import { ProjectFormVoiceWizard } from "../components/ProjectFormVoiceWizard";
import { parseDate } from "@internationalized/date";

// Schema de validação para este step
const validationSchema = Yup.object({
  name: Yup.string()
    .required("Project name is required")
    .min(3, "Project name must be at least 3 characters"),
  budget: Yup.string()
    .required("Budget is required")
    .test("is-positive", "Budget must be greater than 0", (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    }),
  endDate: Yup.mixed()
    .required("Delivery date is required")
    .nullable(),
});

export function StepProjectDetails({
  formData,
  clients,
  onInputChange,
  onClientSelect,
  onClientInputChange,
  onAddNewClient,
  onNext,
}) {
  // Usar Formik para gerenciar estado e validação deste step
  const formik = useFormikStep({
    initialValues: {
      name: formData.name || "",
      budget: formData.budget || "",
      endDate: formData.endDate || null,
    },
    validationSchema,
    onChange: onInputChange,
    formData,
  });

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold">Project Details</h2>
          <p className="text-sm sm:text-base text-default-500 mt-2">
            Let's start with the basic information about your project.
          </p>
        </div>
        
        <ProjectFormVoiceWizard 
          onUpdateField={(field, value) => {
            // Handle special cases if needed
            if (field === 'endDate' && typeof value === 'string') {
               try {
                 formik.updateField(field, parseDate(value));
               } catch (e) {
                 console.error("Date parse error", e);
               }
            } else {
               formik.updateField(field, value);
            }
          }}
          clients={clients}
          onAddNewClient={onAddNewClient}
          onNext={onNext}
        />

        <div className="space-y-5">
          {/* Project Name */}
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-semibold mb-2 text-primary-700 dark:text-primary-400">
              Project Name *
            </label>
            <Input
              isRequired
              placeholder="Enter the project name"
              value={formik.values.name}
              onChange={(e) => formik.updateField("name", e.target.value)}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.name && !!formik.errors.name}
              errorMessage={formik.touched.name && formik.errors.name}
              className="w-full"
              variant="bordered"
              size="md"
              radius="lg"
              startContent={<Icon icon="lucide:folder" className="text-default-400" />}
              classNames={{
                input: "text-foreground font-medium",
                inputWrapper: formik.touched.name && formik.errors.name
                  ? "bg-content1 border-2 border-danger hover:border-danger focus-within:border-danger"
                  : "bg-content1 border-2 border-divider hover:border-primary focus-within:border-primary"
              }}
            />
          </div>
          
          {/* Client Autocomplete */}
          <div className="max-w-md mx-auto">
            <ClientAutocomplete
              clients={clients}
              selectedKey={formData.selectedClientKey}
              inputValue={formData.clientName}
              onSelectionChange={onClientSelect}
              onInputChange={onClientInputChange}
              onAddNewClick={onAddNewClient}
            />
          </div>
          
          {/* Date and Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
              <DatePicker
                labelPlacement="outside"
                label="Delivery Date"
                isRequired
                value={formik.values.endDate}
                onChange={(value) => formik.updateField("endDate", value)}
                onBlur={() => formik.setFieldTouched("endDate", true)}
                isInvalid={formik.touched.endDate && !!formik.errors.endDate}
                errorMessage={formik.touched.endDate && formik.errors.endDate}
                className="w-full"
                variant="bordered"
                size="md"
                radius="lg"
                showMonthAndYearPickers
                locale="pt-PT"
                minValue={today(getLocalTimeZone())}
                classNames={{
                  label: "text-primary-700 dark:text-primary-400"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">
                Budget (EUR) *
              </label>
              <Input
                type="number"
                placeholder="Enter the budget amount"
                value={formik.values.budget}
                onChange={(e) => formik.updateField("budget", e.target.value)}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.budget && !!formik.errors.budget}
                errorMessage={formik.touched.budget && formik.errors.budget}
                className="w-full"
                variant="bordered"
                size="md"
                radius="lg"
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">€</span>
                  </div>
                }
                classNames={{
                  inputWrapper: formik.touched.budget && formik.errors.budget
                    ? "bg-content1 border-2 border-danger hover:border-danger focus-within:border-danger"
                    : "bg-content1 border-2 border-divider hover:border-primary focus-within:border-primary"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

