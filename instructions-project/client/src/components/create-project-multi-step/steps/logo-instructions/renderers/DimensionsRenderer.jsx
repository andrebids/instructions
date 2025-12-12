import React from "react";
import { Input, Checkbox, Select, SelectItem, Switch, Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export const DimensionsRenderer = ({
  formik,
  isCompact,
  handleDimensionUpdate,
  t,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Dimensions Section */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-1.5' : 'p-1.5'} shadow-xl border border-white/10`}>
        <div className={`flex items-center gap-2 mb-1.5 text-emerald-600 dark:text-emerald-400`}>
          <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Icon icon="lucide:ruler" className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold">Dimensions</h2>
        </div>

        <div className="overflow-x-hidden">
          <div className="grid grid-cols-2 gap-2 min-w-0">
            {['Height', 'Length', 'Width', 'Diameter'].map((dim) => {
              const key = dim.toLowerCase();
              const dimensionValue = formik.values.dimensions?.[key]?.value || "";
              const dimensionError = formik.errors.dimensions?.[key]?.value;
              const isTouched = formik.touched.dimensions?.[key]?.value;

              return (
                <div key={key} className="p-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm shadow-md min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider truncate">{dim}</label>
                    <Checkbox
                      size="sm"
                      color="danger"
                      classNames={{
                        label: "text-xs font-semibold text-gray-800 dark:text-gray-100",
                        wrapper: "before:border-2 before:border-gray-400 dark:before:border-gray-500",
                        icon: "text-white"
                      }}
                      isSelected={formik.values.dimensions?.[key]?.imperative || false}
                      onValueChange={(v) => handleDimensionUpdate(key, "imperative", v)}
                    >
                      <span className="text-xs">Imperative</span>
                    </Checkbox>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    endContent={<span className="text-xs text-gray-700 dark:text-gray-200 font-bold">m</span>}
                    variant="flat"
                    size="sm"
                    classNames={{ inputWrapper: "bg-gray-50 dark:bg-gray-700 h-8", input: "text-xs" }}
                    value={dimensionValue}
                    onValueChange={(v) => {
                      if (!v || v === "" || v === "0" || v === "0.00") {
                        handleDimensionUpdate(key, "value", "");
                      } else {
                        const numValue = parseFloat(v);
                        if (!isNaN(numValue) && numValue > 0) {
                          handleDimensionUpdate(key, "value", numValue);
                        } else {
                          handleDimensionUpdate(key, "value", "");
                        }
                      }
                    }}
                    onBlur={() => {
                      formik.setFieldTouched(`dimensions.${key}.value`, true);
                      formik.setFieldTouched("dimensions", true);
                    }}
                    isInvalid={isTouched && !!dimensionError}
                  />
                </div>
              );
            })}
          </div>
          {formik.touched.dimensions && formik.errors.dimensions && typeof formik.errors.dimensions === 'string' && (
            <div className="mt-1 text-xs text-danger">
              {formik.errors.dimensions}
            </div>
          )}
        </div>
      </div>

      {/* Fixation Section */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10`}>
        <div className={`flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400`}>
          <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Icon icon="lucide:hammer" className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold">Fixation</h2>
        </div>

        <div className="space-y-1.5">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Usage</label>
            <Tabs
              fullWidth
              size="sm"
              color="primary"
              aria-label="Usage Environment"
              selectedKey={formik.values.usageOutdoor ? "outdoor" : "indoor"}
              onSelectionChange={(key) => {
                if (key === "indoor") {
                  formik.updateFields({ usageIndoor: true, usageOutdoor: false });
                } else {
                  formik.updateFields({ usageIndoor: false, usageOutdoor: true });
                }
              }}
              classNames={{
                tabList: "p-0.5 bg-gray-100 dark:bg-gray-700",
                cursor: "shadow-md",
                tabContent: "font-bold text-xs"
              }}
            >
              <Tab
                key="indoor"
                title={
                  <div className="flex items-center gap-1 py-0.5">
                    <Icon icon="lucide:home" className="w-3 h-3" />
                    <span className="text-xs">Indoor</span>
                  </div>
                }
              />
              <Tab
                key="outdoor"
                title={
                  <div className="flex items-center gap-1 py-0.5">
                    <Icon icon="lucide:trees" className="w-3 h-3" />
                    <span className="text-xs">Outdoor</span>
                  </div>
                }
              />
            </Tabs>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Fixation Type</label>
            <Select
              placeholder="Select fixation type"
              isRequired
              size="sm"
              variant="bordered"
              aria-label="Fixation Type"
              selectedKeys={formik.values.fixationType ? new Set([formik.values.fixationType]) : new Set()}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] || "";
                formik.updateField("fixationType", selected);
                formik.setFieldTouched("fixationType", true);
              }}
              onBlur={() => formik.setFieldTouched("fixationType", true)}
              isInvalid={formik.touched.fixationType && (!formik.values.fixationType || formik.values.fixationType.trim() === "")}
              errorMessage={formik.touched.fixationType && (!formik.values.fixationType || formik.values.fixationType.trim() === "") ? "Fixation type is required" : undefined}
              startContent={<Icon icon="lucide:settings-2" className="w-3 h-3 text-gray-500" />}
              classNames={{ trigger: "text-xs h-8" }}
            >
              <SelectItem key="ground" startContent={<Icon icon="lucide:arrow-down-to-line" className="w-3 h-3" />}>Ground</SelectItem>
              <SelectItem key="wall" startContent={<Icon icon="lucide:brick-wall" className="w-3 h-3" />}>Wall</SelectItem>
              <SelectItem key="suspended" startContent={<Icon icon="lucide:arrow-up-to-line" className="w-3 h-3" />}>Suspended</SelectItem>
              <SelectItem key="none" startContent={<Icon icon="lucide:ban" className="w-3 h-3" />}>None</SelectItem>
              <SelectItem key="pole_side">Pole (Side)</SelectItem>
              <SelectItem key="pole_central">Pole (Central)</SelectItem>
              <SelectItem key="special">Special</SelectItem>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Structure Finish</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 p-1.5 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-600/30">
              <div className="flex items-center gap-1.5">
                <Switch
                  size="sm"
                  color="secondary"
                  isSelected={formik.values.lacqueredStructure}
                  onValueChange={(v) => formik.updateField("lacqueredStructure", v)}
                />
                <span className="text-xs font-bold">{t('pages.projectDetails.lacquered', 'Lacquered')}</span>
              </div>
              {formik.values.lacqueredStructure && (
                <Select
                  placeholder={t('pages.projectDetails.lacquerColor', 'Lacquer Color')}
                  size="sm"
                  variant="flat"
                  className="flex-1 w-full sm:w-auto"
                  selectedKeys={(() => {
                    const colorKeys = ['white', 'gold', 'red', 'blue', 'green', 'pink', 'black'];
                    const savedValue = formik.values.lacquerColor || '';
                    const matchingKey = colorKeys.find(key => {
                      const translatedValue = t(`pages.projectDetails.lacquerColors.${key}`, '');
                      return translatedValue === savedValue || key === savedValue;
                    });
                    return matchingKey ? new Set([matchingKey]) : new Set();
                  })()}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    if (selected) {
                      const translatedValue = t(`pages.projectDetails.lacquerColors.${selected}`, '');
                      formik.updateField("lacquerColor", translatedValue || selected);
                    } else {
                      formik.updateField("lacquerColor", "");
                    }
                  }}
                  classNames={{
                    trigger: "text-xs h-8",
                    value: "text-xs"
                  }}
                >
                  <SelectItem key="white" value="white">
                    {t('pages.projectDetails.lacquerColors.white', 'WHITE RAL 9010')}
                  </SelectItem>
                  <SelectItem key="gold" value="gold">
                    {t('pages.projectDetails.lacquerColors.gold', 'GOLD PANTONE 131C')}
                  </SelectItem>
                  <SelectItem key="red" value="red">
                    {t('pages.projectDetails.lacquerColors.red', 'RED RAL 3000')}
                  </SelectItem>
                  <SelectItem key="blue" value="blue">
                    {t('pages.projectDetails.lacquerColors.blue', 'BLUE RAL 5005')}
                  </SelectItem>
                  <SelectItem key="green" value="green">
                    {t('pages.projectDetails.lacquerColors.green', 'GREEN RAL 6029')}
                  </SelectItem>
                  <SelectItem key="pink" value="pink">
                    {t('pages.projectDetails.lacquerColors.pink', 'PINK RAL 3015')}
                  </SelectItem>
                  <SelectItem key="black" value="black">
                    {t('pages.projectDetails.lacquerColors.black', 'BLACK RAL 9011')}
                  </SelectItem>
                </Select>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Technical Constraints</label>
            <div className="grid grid-cols-1 gap-1">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 p-1.5 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-600/30">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      size="sm"
                      color="secondary"
                      isSelected={formik.values.maxWeightConstraint}
                      onValueChange={(v) => formik.updateField("maxWeightConstraint", v)}
                    />
                    <span className="text-xs font-bold">{t('pages.projectDetails.maxWeightConstraint', 'Max Weight')}</span>
                  </div>
                  {formik.values.maxWeightConstraint && (
                    <Input
                      placeholder={t('pages.projectDetails.maxWeight', 'Weight (kg)')}
                      size="sm"
                      variant="flat"
                      type="number"
                      min="0"
                      step="0.01"
                      className="flex-1 w-full sm:w-auto"
                      classNames={{ input: "text-xs", inputWrapper: "h-8" }}
                      endContent={<span className="text-xs text-default-400">kg</span>}
                      value={formik.values.maxWeight}
                      onValueChange={(v) => formik.updateField("maxWeight", v)}
                    />
                  )}
                </div>
              </div>
              <div className={`p-1 rounded-lg border-2 transition-all ${formik.values.ballast ? 'bg-primary-50/80 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800' : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-700/50'}`}>
                <Checkbox
                  size="sm"
                  classNames={{ label: "text-xs font-medium" }}
                  isSelected={formik.values.ballast}
                  onValueChange={(v) => formik.updateField("ballast", v)}
                >
                  Ballast Required
                </Checkbox>
              </div>
              <div className={`p-1 rounded-lg border-2 transition-all ${formik.values.controlReport ? 'bg-primary-50/80 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800' : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-700/50'}`}>
                <Checkbox
                  size="sm"
                  classNames={{ label: "text-xs font-medium" }}
                  isSelected={formik.values.controlReport}
                  onValueChange={(v) => formik.updateField("controlReport", v)}
                >
                  Control Report Needed
                </Checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




