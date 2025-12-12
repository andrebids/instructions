import React from "react";
import { Icon } from "@iconify/react";
import { Input, Textarea, Switch, Tabs, Tab, Select, SelectItem, Checkbox } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { materialsData } from "../../../data/materialsData.js";
import {
  getComponenteById,
  getCoresByComponente,
  getCoresDisponiveisBolas,
  getAcabamentosByCorBola,
  getTamanhosByCorEAcabamentoBola,
} from "../../../utils/materialsUtils.js";

export const SummaryRenderer = ({
  formik,
  composition,
  currentLogo,
  hasBolaData,
  handleCompositionUpdate,
  handleAddComponente,
  handleRemoveComponente,
  handleAddBola,
  handleRemoveBola,
}) => {
  const { t } = useTranslation();
  const [componentesEditMode, setComponentesEditMode] = React.useState({});
  const [bolasEditMode, setBolasEditMode] = React.useState({});
  const attachments = currentLogo.attachmentFiles || [];
  const [attachmentIndex, setAttachmentIndex] = React.useState(0);

  React.useEffect(() => {
    setAttachmentIndex(0);
  }, [attachments.length, currentLogo?.id]);

  const getColorStyle = (name) => {
    if (!name) return {};
    const n = name.toLowerCase();
    const palette = [
      { keys: ["blanc", "white"], color: "#f5f5f5" },
      { keys: ["noir", "black"], color: "#111111" },
      { keys: ["gris", "gray", "grey"], color: "#9ca3af" },
      { keys: ["rouge", "red"], color: "#e03131" },
      { keys: ["vert", "green"], color: "#2f9e44" },
      { keys: ["bleu", "blue"], color: "#228be6" },
      { keys: ["jaune", "yellow"], color: "#f2c200" },
      { keys: ["or", "gold"], color: "#d4a017" },
      { keys: ["orange"], color: "#f08c00" },
      { keys: ["violet", "purple"], color: "#9c36b5" },
      { keys: ["rose", "pink"], color: "#e64980" },
      { keys: ["marron", "brown", "chocolat"], color: "#8d5524" },
      { keys: ["argent", "silver"], color: "#c0c0c0" },
      { keys: ["cuivre", "copper"], color: "#b87333" },
      { keys: ["beige"], color: "#d9b38c" },
      { keys: ["nude"], color: "#d3b8ae" },
    ];
    const match = palette.find((p) => p.keys.some((k) => n.includes(k)));
    return match ? { color: match.color } : {};
  };

  const getDotStyle = (name) => {
    const style = getColorStyle(name);
    return style.color ? { backgroundColor: style.color } : {};
  };

  // Helpers for inline editing
  const updateDimension = (dim, field, value) => {
    const dimensions = formik.values.dimensions || {};
    const updatedDimensions = {
      ...dimensions,
      [dim]: {
        ...dimensions[dim],
        [field]: value
      }
    };
    formik.updateField("dimensions", updatedDimensions);
  };

  const setUsage = (mode) => {
    if (mode === "indoor") {
      formik.updateFields({ usageIndoor: true, usageOutdoor: false });
    } else {
      formik.updateFields({ usageIndoor: false, usageOutdoor: true });
    }
  };

  const goPrevAttachment = () => {
    if (attachments.length < 2) return;
    setAttachmentIndex((prev) => (prev === 0 ? attachments.length - 1 : prev - 1));
  };

  const goNextAttachment = () => {
    if (attachments.length < 2) return;
    setAttachmentIndex((prev) => (prev === attachments.length - 1 ? 0 : prev + 1));
  };

  const formatBudgetOnInput = (value) => {
    let cleaned = value.replace(/[^\d,]/g, '');
    cleaned = cleaned.replace(/\./g, ',');
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + ',' + parts[1].substring(0, 2);
    }
    if (parts[0] && parts[0].length > 3) {
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      cleaned = parts.length > 1 ? integerPart + ',' + parts[1] : integerPart;
    }
    return cleaned;
  };

  const formatBudgetOnBlur = (value) => {
    if (!value) return "";
    let cleaned = value.replace(/\s/g, '');
    const parts = cleaned.split(',');
    if (parts.length === 1 && parts[0]) {
      cleaned = parts[0] + ',00';
    } else if (parts.length === 2 && parts[1].length === 1) {
      cleaned = parts[0] + ',' + parts[1] + '0';
    } else if (parts.length === 2 && parts[1].length === 0) {
      cleaned = parts[0] + ',00';
    }
    const finalParts = cleaned.split(',');
    if (finalParts[0] && finalParts[0].length > 3) {
      const integerPart = finalParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      cleaned = finalParts.length > 1 ? integerPart + ',' + finalParts[1] : integerPart;
    }
    return cleaned;
  };

  // Helper function to build image URL for attachments
  const buildImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(imageUrl);
        imageUrl = urlObj.pathname;
      } catch (e) {
        const match = imageUrl.match(/\/api\/[^\s]+/);
        if (match) imageUrl = match[0];
      }
    }
    if (imageUrl.startsWith('\\\\') || imageUrl.startsWith('//')) {
      const filename = imageUrl.split(/[\\/]/).pop();
      if (filename) imageUrl = `/api/files/${filename}`;
    }
    if (imageUrl && !imageUrl.startsWith('/api/') && imageUrl.startsWith('/')) {
      imageUrl = `/api${imageUrl}`;
    } else if (imageUrl && !imageUrl.startsWith('/')) {
      imageUrl = `/api/files/${imageUrl}`;
    }
    return imageUrl;
  };

  // Get dimensions in correct order: HEIGHT, WIDTH, LENGTH, DIAMETER
  const dimensionOrder = ['height', 'width', 'length', 'diameter'];
  const dimensionLabels = {
    height: t('pages.createProject.logoInstructions.summary.height'),
    width: t('pages.createProject.logoInstructions.summary.width'),
    length: t('pages.createProject.logoInstructions.summary.length'),
    diameter: t('pages.createProject.logoInstructions.summary.diameter')
  };

  // Lists for composition (allow editing even if incomplete)
  const componentesList = composition.componentes || [];
  const bolasList = composition.bolas || [];

  // Attachment carousel state
  const mainAttachment = attachments.length > 0 ? attachments[attachmentIndex] : null;

  return (
    <div className="h-full overflow-y-auto p-4 bg-[#141b2d] text-gray-300 font-sans">
      <div className="w-full mx-auto space-y-3">

        {/* TOP ROW: 4 equal columns for efficiency */}
        <div className="grid grid-cols-12 gap-4">

          {/* COLUMN 1: Details (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">

            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Icon icon="lucide:file-text" className="w-4 h-4" />
              <h3 className="text-sm font-bold">{t('pages.createProject.logoInstructions.summary.details')}</h3>
            </div>

            <div className="space-y-3">
              {/* Row 1: Logo Number + Logo Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.logoNumber')}</label>
                  <div className="text-xs font-medium text-white break-words">{formik.values.logoNumber || "---"}</div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.logoName')}</label>
                  <Input
                    aria-label="Logo Name"
                    variant="bordered"
                    size="sm"
                    classNames={{ input: "text-xs", inputWrapper: "h-8 bg-[#0f172a]" }}
                    value={formik.values.logoName || ""}
                    onValueChange={(v) => formik.updateField("logoName", v)}
                  />
                </div>
              </div>

              {/* Row 2: Budget + Requested By */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.budget')}</label>
                  <Input
                    aria-label="Budget (EUR)"
                    startContent={<span className="text-gray-400 text-xs font-semibold">&euro;</span>}
                    variant="bordered"
                    size="sm"
                    classNames={{ input: "text-xs", inputWrapper: "h-8 bg-[#0f172a]" }}
                    value={formik.values.budget || ""}
                    onValueChange={(v) => formik.updateField("budget", formatBudgetOnInput(v))}
                    onBlur={() => formik.updateField("budget", formatBudgetOnBlur(formik.values.budget || ""))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.requestedBy')}</label>
                  <div className="text-xs font-medium text-white break-words">{formik.values.requestedBy || "---"}</div>
                </div>
              </div>

              {/* Description - now takes more vertical space */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.description')}</label>
                <Textarea
                  aria-label={t('pages.createProject.logoInstructions.summary.description')}
                  minRows={4}
                  variant="bordered"
                  size="sm"
                  classNames={{ input: "text-xs bg-[#0f172a]" }}
                  value={formik.values.description || ""}
                  onValueChange={(v) => formik.updateField("description", v)}
                  placeholder={t('pages.createProject.logoInstructions.summary.descriptionPlaceholder')}
                />
              </div>
            </div>

          </div>

          {/* COLUMN 2: Fixation & Technical (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <Icon icon="lucide:hammer" className="w-4 h-4" />
              <h3 className="text-sm font-bold">{t('pages.createProject.logoInstructions.summary.fixationTechnical')}</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.usage')}</label>
                <Tabs
                  size="sm"
                  color="primary"
                  selectedKey={formik.values.usageOutdoor ? "outdoor" : "indoor"}
                  onSelectionChange={(key) => setUsage(key)}
                  classNames={{
                    tabList: "bg-[#1f2942] p-1 rounded-lg",
                    tab: "text-xs text-gray-200",
                    cursor: "bg-primary-500"
                  }}
                >
                  <Tab key="indoor" title={<div className="flex items-center gap-1"><Icon icon="lucide:home" className="w-3 h-3" /> {t('pages.createProject.logoInstructions.summary.indoor')}</div>} />
                  <Tab key="outdoor" title={<div className="flex items-center gap-1"><Icon icon="lucide:trees" className="w-3 h-3" /> {t('pages.createProject.logoInstructions.summary.outdoor')}</div>} />
                </Tabs>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.structureFinish')}</label>
                <div className="flex flex-col gap-2 bg-[#1f2942] border border-gray-700 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      size="sm"
                      color="secondary"
                      isSelected={formik.values.lacqueredStructure}
                      onValueChange={(v) => formik.updateField("lacqueredStructure", v)}
                    />
                    <span className="text-xs text-white font-semibold">{t('pages.projectDetails.lacquered', 'Lacquered')}</span>
                  </div>
                  {formik.values.lacqueredStructure ? (
                    <Select
                      aria-label={t('pages.projectDetails.lacquerColor', 'Lacquer Color')}
                      variant="flat"
                      size="sm"
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
                      classNames={{ trigger: "text-xs h-8", value: "text-xs text-white" }}
                      placeholder={t('pages.projectDetails.lacquerColor', 'Select color')}
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
                  ) : (
                    <div className="text-[10px] font-medium text-gray-400 italic">{t('pages.createProject.logoInstructions.summary.standard')}</div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.fixationType')}</label>
                <Select
                  aria-label="Fixation Type"
                  variant="flat"
                  size="sm"
                  classNames={{ trigger: "text-xs h-8", value: "text-xs text-white" }}
                  selectedKeys={formik.values.fixationType ? new Set([formik.values.fixationType]) : new Set()}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] || "";
                    formik.updateField("fixationType", selected);
                  }}
                >
                  <SelectItem key="ground">{t('pages.createProject.logoInstructions.dimensions.ground')}</SelectItem>
                  <SelectItem key="wall">{t('pages.createProject.logoInstructions.dimensions.wall')}</SelectItem>
                  <SelectItem key="suspended">{t('pages.createProject.logoInstructions.dimensions.suspended')}</SelectItem>
                  <SelectItem key="none">{t('pages.createProject.logoInstructions.dimensions.none')}</SelectItem>
                  <SelectItem key="pole_side">{t('pages.createProject.logoInstructions.dimensions.poleSide')}</SelectItem>
                  <SelectItem key="pole_central">{t('pages.createProject.logoInstructions.dimensions.poleCentral')}</SelectItem>
                  <SelectItem key="special">{t('pages.createProject.logoInstructions.dimensions.special')}</SelectItem>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">{t('pages.createProject.logoInstructions.summary.technicalConstraints')}</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-[#1f2942] border border-gray-700 rounded-lg p-2">
                    <Switch
                      size="sm"
                      color="secondary"
                      isSelected={formik.values.maxWeightConstraint}
                      onValueChange={(v) => formik.updateField("maxWeightConstraint", v)}
                    />
                    <span className="text-xs text-white font-semibold">{t('pages.createProject.logoInstructions.summary.maxWeight')}</span>
                    {formik.values.maxWeightConstraint && (
                      <Input
                        aria-label="Max Weight"
                        size="sm"
                        type="number"
                        variant="flat"
                        endContent={<span className="text-[10px] text-gray-300">kg</span>}
                        classNames={{ input: "text-xs text-white", inputWrapper: "h-8 bg-[#0f172a]" }}
                        value={formik.values.maxWeight || ""}
                        onValueChange={(v) => formik.updateField("maxWeight", v)}
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Checkbox
                      size="sm"
                      classNames={{ label: "text-[11px] text-gray-200" }}
                      isSelected={formik.values.ballast}
                      onValueChange={(v) => formik.updateField("ballast", v)}
                    >
                      {t('pages.createProject.logoInstructions.summary.ballast')}
                    </Checkbox>
                    <Checkbox
                      size="sm"
                      classNames={{ label: "text-[11px] text-gray-200" }}
                      isSelected={formik.values.controlReport}
                      onValueChange={(v) => formik.updateField("controlReport", v)}
                    >
                      {t('pages.createProject.logoInstructions.summary.controlReport')}
                    </Checkbox>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Attachments (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-pink-500 mb-2">
              <Icon icon="lucide:paperclip" className="w-4 h-4" />
              <h4 className="text-sm font-bold">{t('pages.createProject.logoInstructions.summary.attachments')}</h4>
            </div>

            {mainAttachment ? (
              <div className="relative w-full h-[220px] rounded-xl overflow-hidden border-2 border-dashed border-gray-700 bg-[#1f2942]">
                <div className="w-full h-full flex items-center justify-center">
                  {mainAttachment.mimetype?.startsWith('image/') && (mainAttachment.url || mainAttachment.path) ? (
                    <img
                      src={buildImageUrl(mainAttachment.url || mainAttachment.path)}
                      alt={mainAttachment.name || "Attachment"}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-default gap-2">
                      <Icon icon="lucide:file" className="w-6 h-6" />
                      <span className="text-[11px]">{mainAttachment.name || "Attachment"}</span>
                    </div>
                  )}
                </div>

                {attachments.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrevAttachment}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                      aria-label="Previous attachment"
                    >
                      <Icon icon="lucide:chevron-left" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goNextAttachment}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                      aria-label="Next attachment"
                    >
                      <Icon icon="lucide:chevron-right" className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-2">
                      <span className="bg-black/70 text-white text-[11px] px-3 py-1 rounded-full">
                        {attachmentIndex + 1} / {attachments.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-[220px] rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 bg-[#1f2942]/30">
                <span className="text-[10px]">{t('pages.createProject.logoInstructions.summary.noImageAttached')}</span>
              </div>
            )}
          </div>

          {/* COLUMN 4: Dimensions (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <Icon icon="lucide:ruler" className="w-4 h-4" />
              <h3 className="text-sm font-bold">{t('pages.createProject.logoInstructions.summary.dimensions')}</h3>
            </div>

            <div className="space-y-2">
              {dimensionOrder.map(key => {
                const dimData = formik.values.dimensions?.[key];
                const val = dimData?.value;
                const isImperative = dimData?.imperative;
                const displayVal = (val !== null && val !== undefined && val !== "") ? val : "";

                return (
                  <div key={key} className="bg-[#1f2942] p-3 rounded-lg border border-gray-700 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dimensionLabels[key]}</span>
                        <Checkbox
                          size="sm"
                          classNames={{ label: "text-[10px] text-gray-200" }}
                          isSelected={!!isImperative}
                          onValueChange={(v) => updateDimension(key, "imperative", v)}
                        >
                          {t('pages.createProject.logoInstructions.summary.imperative')}
                        </Checkbox>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        endContent={<span className="text-xs text-gray-400 font-semibold">m</span>}
                        variant="bordered"
                        size="sm"
                        classNames={{ inputWrapper: "h-9 bg-[#0f172a]", input: "text-sm text-white" }}
                        value={displayVal}
                        onValueChange={(v) => {
                          if (!v || v === "" || v === "0" || v === "0.00") {
                            updateDimension(key, "value", "");
                          } else {
                            const numValue = parseFloat(v);
                            if (!isNaN(numValue) && numValue > 0) {
                              updateDimension(key, "value", numValue);
                            } else {
                              updateDimension(key, "value", "");
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Composition (Components + Balls side by side) - Full Width */}
        <div className="space-y-2 mt-1">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Icon icon="lucide:layers" className="w-4 h-4" />
            <h3 className="text-sm font-bold">{t('pages.createProject.logoInstructions.summary.composition')}</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Components Subsection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#0f172a] border border-[#1f2a3c] rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:box" className="w-3.5 h-3.5 text-blue-300" />
                  <span className="text-[11px] font-bold text-slate-100 uppercase tracking-wide">{t('pages.createProject.logoInstructions.summary.components')}</span>
                  <span className="bg-[#1f2a3c] text-slate-200 text-[10px] px-1.5 rounded font-bold border border-[#243553]">{componentesList.length}</span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-[#243553] bg-[#1f2a3c] text-slate-100 hover:bg-[#22314d]"
                  onClick={() => {
                    const newIndex = componentesList.length;
                    handleAddComponente();
                    setComponentesEditMode(prev => ({ ...prev, [newIndex]: true }));
                  }}
                >
                  <Icon icon="lucide:plus" className="w-3 h-3" />
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {componentesList.length > 0 ? (
                  componentesList.map((comp, idx) => {
                    const isEditing = !!componentesEditMode[idx];
                    const componente = comp.componenteId ? getComponenteById(comp.componenteId) : null;
                    const coresDisponiveis = componente && !componente.semCor ? getCoresByComponente(comp.componenteId) : [];

                    return (
                      <div key={idx} className="bg-[#0f172a] p-3 rounded-lg border border-[#1f2a3c] flex items-start gap-3 shadow-sm">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-white truncate">
                                {componente?.nome || comp.componenteNome || t('pages.createProject.logoInstructions.summary.component')}
                              </span>
                              {(comp.referencia || componente?.referencia) && (
                                <span className="text-[11px] text-gray-400">{t('pages.createProject.logoInstructions.summary.reference')} {comp.referencia || componente?.referencia}</span>
                              )}
                              {comp.corNome && (
                                <span className="text-[11px] font-semibold flex items-center gap-1">
                                  <span className="inline-block w-2 h-2 rounded-full" style={getDotStyle(comp.corNome)} />
                                  <span style={getColorStyle(comp.corNome)}>{comp.corNome}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {isEditing && (
                            <>
                              <Select
                                selectionMode="single"
                                disallowEmptySelection
                                aria-label={`Component ${idx + 1}`}
                                variant="flat"
                                size="sm"
                                selectedKeys={comp.componenteId ? new Set([String(comp.componenteId)]) : new Set()}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0];
                                  if (selected !== undefined) {
                                    handleCompositionUpdate("componentes", idx, "componenteId", selected ? Number(selected) : null);
                                  }
                                }}
                                classNames={{ trigger: "h-9 text-sm bg-[#0f172a]", value: "text-sm text-white" }}
                                placeholder={t('pages.createProject.logoInstructions.summary.chooseComponent')}
                              >
                                {materialsData.componentes.map((c) => (
                                  <SelectItem key={String(c.id)} textValue={c.nome}>
                                    <div className="flex flex-col">
                                      <span className="text-sm">{c.nome}</span>
                                      {c.referencia && <span className="text-[11px] text-gray-500">{t('pages.createProject.logoInstructions.summary.reference')} {c.referencia}</span>}
                                    </div>
                                  </SelectItem>
                                ))}
                              </Select>
                              {componente && !componente.semCor && (
                                <Select
                                  selectionMode="single"
                                  disallowEmptySelection
                                  aria-label={`Component Color ${idx + 1}`}
                                  variant="flat"
                                  size="sm"
                                  selectedKeys={comp.corId ? new Set([String(comp.corId)]) : new Set()}
                                  onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0];
                                    if (selected !== undefined) {
                                      handleCompositionUpdate("componentes", idx, "corId", selected ? Number(selected) : null);
                                    }
                                  }}
                                  classNames={{ trigger: "h-9 text-sm bg-[#0f172a]", value: "text-sm text-white" }}
                                  placeholder={t('pages.createProject.logoInstructions.summary.chooseColor')}
                                >
                                  {coresDisponiveis.map((cor) => (
                                    <SelectItem key={String(cor.id)} textValue={cor.nome}>
                                      {cor.nome}
                                    </SelectItem>
                                  ))}
                                </Select>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex flex-row gap-2 items-start">
                          <button
                            type="button"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2d3a55] hover:bg-[#35466a] text-gray-200"
                            onClick={() => setComponentesEditMode(prev => ({ ...prev, [idx]: !isEditing }))}
                            aria-label={`${isEditing ? "Close" : "Edit"} component ${idx + 1}`}
                          >
                            <Icon icon={isEditing ? "lucide:check" : "lucide:pencil"} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2a1b1f] hover:bg-[#3a252b] text-rose-200"
                            onClick={() => {
                              setComponentesEditMode(prev => {
                                const next = { ...prev };
                                delete next[idx];
                                return next;
                              });
                              handleRemoveComponente(idx);
                            }}
                            aria-label={`Remove component ${idx + 1}`}
                          >
                            <Icon icon="lucide:trash" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[10px] text-gray-500 italic px-2">{t('pages.createProject.logoInstructions.summary.noComponents')}</div>
                )}
              </div>
            </div>

            {/* Balls Subsection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#0f172a] border border-[#1f2a3c] rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:circle-dot" className="w-3.5 h-3.5 text-blue-300" />
                  <span className="text-[11px] font-bold text-slate-100 uppercase tracking-wide">{t('pages.createProject.logoInstructions.summary.balls')}</span>
                  <span className="bg-[#1f2a3c] text-slate-200 text-[10px] px-1.5 rounded font-bold border border-[#243553]">{bolasList.length}</span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-[#243553] bg-[#1f2a3c] text-slate-100 hover:bg-[#22314d]"
                  onClick={() => {
                    const newIndex = bolasList.length;
                    handleAddBola();
                    setBolasEditMode(prev => ({ ...prev, [newIndex]: true }));
                  }}
                >
                  <Icon icon="lucide:plus" className="w-3 h-3" />
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {bolasList.length > 0 ? (
                  bolasList.map((bola, idx) => {
                    const isEditing = !!bolasEditMode[idx];
                    const coresDisponiveis = getCoresDisponiveisBolas();
                    const acabamentosDisponiveis = bola.corId
                      ? getAcabamentosByCorBola(bola.corId)
                      : materialsData.acabamentos;
                    const tamanhosDisponiveis = bola.corId && bola.acabamentoId
                      ? getTamanhosByCorEAcabamentoBola(bola.corId, bola.acabamentoId)
                      : materialsData.tamanhos;

                    const nomeDisplay = [bola.corNome, bola.acabamentoNome, bola.tamanhoNome || (bola.tamanho ? `${bola.tamanho} cm` : null)]
                      .filter(Boolean)
                      .join(" - ");

                    return (
                      <div key={idx} className="bg-[#0f172a] p-3 rounded-lg border border-[#1f2a3c] flex items-start gap-3 shadow-sm">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              {bola.corNome && (
                                <span className="text-sm font-semibold truncate flex items-center gap-1" style={getColorStyle(bola.corNome)}>
                                  <span className="inline-block w-2 h-2 rounded-full" style={getDotStyle(bola.corNome)} />
                                  {bola.corNome}
                                </span>
                              )}
                              <span className="text-sm font-semibold text-white truncate">
                                {nomeDisplay || t('pages.createProject.logoInstructions.summary.ball')}
                              </span>
                            </div>
                            {bola.referencia && (
                              <span className="text-[11px] text-gray-400">{t('pages.createProject.logoInstructions.summary.reference')} {bola.referencia}</span>
                            )}
                          </div>

                          {isEditing && (
                            <>
                              <Select
                                selectionMode="single"
                                disallowEmptySelection
                                aria-label={`Ball Color ${idx + 1}`}
                                variant="flat"
                                size="sm"
                                selectedKeys={bola.corId ? new Set([String(bola.corId)]) : new Set()}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0];
                                  if (selected !== undefined) {
                                    handleCompositionUpdate("bolas", idx, "corId", selected ? Number(selected) : null);
                                  }
                                }}
                                classNames={{ trigger: "h-9 text-sm bg-[#0f172a]", value: "text-sm text-white" }}
                                placeholder={t('pages.createProject.logoInstructions.summary.chooseColor')}
                              >
                                {coresDisponiveis.map((cor) => (
                                  <SelectItem key={String(cor.id)} textValue={cor.nome}>
                                    {cor.nome}
                                  </SelectItem>
                                ))}
                              </Select>
                              <Select
                                selectionMode="single"
                                disallowEmptySelection
                                aria-label={`Ball Finish ${idx + 1}`}
                                variant="flat"
                                size="sm"
                                selectedKeys={bola.acabamentoId ? new Set([String(bola.acabamentoId)]) : new Set()}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0];
                                  if (selected !== undefined) {
                                    handleCompositionUpdate("bolas", idx, "acabamentoId", selected ? Number(selected) : null);
                                  }
                                }}
                                classNames={{ trigger: "h-9 text-sm bg-[#0f172a]", value: "text-sm text-white" }}
                                placeholder={t('pages.createProject.logoInstructions.summary.chooseFinish')}
                              >
                                {acabamentosDisponiveis.map((acab) => (
                                  <SelectItem key={String(acab.id)} textValue={acab.nome}>
                                    {acab.nome}
                                  </SelectItem>
                                ))}
                              </Select>
                              <Select
                                selectionMode="single"
                                disallowEmptySelection
                                aria-label={`Ball Size ${idx + 1}`}
                                variant="flat"
                                size="sm"
                                selectedKeys={bola.tamanhoId ? new Set([String(bola.tamanhoId)]) : new Set()}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0];
                                  if (selected !== undefined) {
                                    handleCompositionUpdate("bolas", idx, "tamanhoId", selected ? Number(selected) : null);
                                  }
                                }}
                                classNames={{ trigger: "h-9 text-sm bg-[#0f172a]", value: "text-sm text-white" }}
                                placeholder={t('pages.createProject.logoInstructions.summary.chooseSize')}
                              >
                                {tamanhosDisponiveis.map((t) => (
                                  <SelectItem key={String(t.id)} textValue={t.nome || t.medida}>
                                    {t.nome || t.medida}
                                  </SelectItem>
                                ))}
                              </Select>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400">{t('pages.createProject.logoInstructions.summary.reference')}</span>
                                <Input
                                  aria-label={`Ball Reference ${idx + 1}`}
                                  size="sm"
                                  variant="bordered"
                                  classNames={{ input: "text-xs text-gray-200", inputWrapper: "h-7 bg-[#0f172a]" }}
                                  placeholder="Reference"
                                  value={bola.reference || bola.referencia || ""}
                                  onValueChange={(v) => handleCompositionUpdate("bolas", idx, "reference", v)}
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex flex-row gap-2 items-start">
                          <button
                            type="button"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2d3a55] hover:bg-[#35466a] text-gray-200"
                            onClick={() => setBolasEditMode(prev => ({ ...prev, [idx]: !isEditing }))}
                            aria-label={`${isEditing ? "Close" : "Edit"} ball ${idx + 1}`}
                          >
                            <Icon icon={isEditing ? "lucide:check" : "lucide:pencil"} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2a1b1f] hover:bg-[#3a252b] text-rose-200"
                            onClick={() => {
                              setBolasEditMode(prev => {
                                const next = { ...prev };
                                delete next[idx];
                                return next;
                              });
                              handleRemoveBola(idx);
                            }}
                            aria-label={`Remove ball ${idx + 1}`}
                          >
                            <Icon icon="lucide:trash" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[10px] text-gray-500 italic px-2">{t('pages.createProject.logoInstructions.summary.noBalls')}</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

