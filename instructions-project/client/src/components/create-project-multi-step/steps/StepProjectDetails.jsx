import React from "react";
import { Input, DatePicker, Button, Checkbox } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Icon } from "@iconify/react";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useFormikStep } from "../hooks/useFormikStep";
import { ClientAutocomplete } from "../components/ClientAutocomplete";
import { useProjectFormVoiceLogic } from "../hooks/useProjectFormVoiceLogic";
import { parseDate } from "@internationalized/date";

export function StepProjectDetails({
  formData,
  clients,
  onInputChange,
  onClientSelect,
  onClientInputChange,
  onAddNewClient,
  onNext,
}) {
  const { t } = useTranslation();

  // Schema de validação para este step (criado dentro do componente para ter acesso às traduções)
  const validationSchema = React.useMemo(() => Yup.object({
    name: Yup.string()
      .required(t('pages.projectDetails.validation.projectNameRequired'))
      .min(3, t('pages.projectDetails.validation.projectNameMinLength')),
    budget: Yup.string()
      .required(t('pages.projectDetails.validation.budgetRequired'))
      .test("is-positive", t('pages.projectDetails.validation.budgetMustBePositive'), (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0;
      }),
    endDate: Yup.mixed()
      .required(t('pages.projectDetails.validation.deliveryDateRequired'))
      .nullable(),
  }), [t]);

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

  // Integrate Voice Assistant Logic
  const { listening, startListening } = useProjectFormVoiceLogic({
    onUpdateField: (field, value) => {
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
    },
    clients,
    onAddNewClient,
    onClientSelect,
    onNext
  });

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold">{t('pages.projectDetails.title')}</h2>
          <p className="text-sm sm:text-base text-default-500 mt-2">
            {t('pages.projectDetails.subtitle')}
          </p>
        </div>



        <div className="space-y-5">
          {/* Project Name */}
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-semibold mb-2 text-primary-700 dark:text-primary-400">
              {t('pages.projectDetails.projectName')} {t('pages.projectDetails.projectNameRequired')}
            </label>
            <Input
              isRequired
              placeholder={t('pages.projectDetails.projectNamePlaceholder')}
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

          {/* AO/Tender Checkbox */}
          <div className="max-w-md mx-auto">
            <Checkbox
              isSelected={formData.category === 'ao_tender'}
              onValueChange={(checked) => {
                onInputChange('category', checked ? 'ao_tender' : 'normal');
              }}
              classNames={{
                base: "w-full max-w-full",
                label: "w-full"
              }}
            >
              <div className="flex items-center gap-2">
                <Icon icon="lucide:star" className="text-purple-600" />
                <div>
                  <span className="font-medium text-foreground">{t('pages.projectDetails.aoTender')}</span>
                  <p className="text-xs text-default-500">{t('pages.projectDetails.aoTenderDescription')}</p>
                </div>
              </div>
            </Checkbox>
          </div>

          {/* Date and Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
              <DatePicker
                labelPlacement="outside"
                label={t('pages.projectDetails.deliveryDate')}
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
                minValue={today(getLocalTimeZone())}
                classNames={{
                  label: "text-primary-700 dark:text-primary-400"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">
                {t('pages.projectDetails.budget')} {t('pages.projectDetails.budgetRequired')}
              </label>
              <Input
                type="number"
                placeholder={t('pages.projectDetails.budgetPlaceholder')}
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

