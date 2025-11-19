import React from "react";
import {
  Input,
  Checkbox,
  Textarea,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Switch,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import * as Yup from "yup";
import { useFormikStep } from "../hooks/useFormikStep";
import { useLogoPersistence } from "../hooks/useLogoPersistence";
import { updateNestedField, getNestedValue } from "../utils/formikHelpers";
import { materialsData } from "../data/materialsData.js";
import {
  getComponenteById,
  getCorById,
  getAcabamentoById,
  getTamanhoById,
  getCoresByComponente,
  getCombinacaoByComponenteECor,
  getBolaBySelecao,
  getCoresDisponiveisBolas,
  getAcabamentosByCorBola,
  getTamanhosByCorEAcabamentoBola,
} from "../utils/materialsUtils.js";

// Schema de validação para Logo Instructions
const validationSchema = Yup.object({
  logoNumber: Yup.string()
    .required("Logo number is required")
    .min(3, "Logo number must be at least 3 characters"),
  logoName: Yup.string()
    .required("Logo name is required")
    .min(3, "Logo name must be at least 3 characters"),
  requestedBy: Yup.string()
    .required("Requested by is required"),
  dimensions: Yup.object().shape({
    height: Yup.object().shape({
      value: Yup.number().nullable().positive("Height must be positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    length: Yup.object().shape({
      value: Yup.number().nullable().positive("Length must be positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    width: Yup.object().shape({
      value: Yup.number().nullable().positive("Width must be positive"),
      imperative: Yup.boolean(),
    }).nullable(),
    diameter: Yup.object().shape({
      value: Yup.number().nullable().positive("Diameter must be positive"),
      imperative: Yup.boolean(),
    }).nullable(),
  }).nullable(),
});

export function StepLogoInstructions({ formData, onInputChange }) {
  const logoDetails = formData.logoDetails || {};
  const composition = logoDetails.composition || { componentes: [], bolas: [] };
  
  // Estado para controlar a busca nos componentes
  const [componenteSearchValues, setComponenteSearchValues] = React.useState({});
  
  // Estado para controlar quais componentes estão em modo de edição
  const [componentesEditando, setComponentesEditando] = React.useState({});
  
  // Função helper para filtrar componentes (não pode ser hook pois é usada dentro de map)
  const filterComponentes = React.useCallback((searchTerm) => {
    if (!searchTerm) return materialsData.componentes;
    const term = searchTerm.toLowerCase();
    return materialsData.componentes.filter((c) => {
      const nome = c.nome?.toLowerCase() || "";
      const referencia = c.referencia?.toLowerCase() || "";
      return nome.includes(term) || referencia.includes(term);
    });
  }, []);
  
  // Verificar se um componente está completo (tem referência)
  const isComponenteCompleto = React.useCallback((comp) => {
    if (!comp.componenteId) return false;
    const componente = getComponenteById(comp.componenteId);
    if (!componente) return false;
    
    // Se o componente não precisa de cor, só precisa do componenteId
    if (componente.semCor) {
      return true;
    }
    
    // Se precisa de cor, precisa ter corId e referência
    return comp.corId && comp.referencia;
  }, []);

  // Usar Formik para gerenciar estado e validação
  const formik = useFormikStep({
    initialValues: {
      logoNumber: logoDetails.logoNumber || "",
      logoName: logoDetails.logoName || "",
      requestedBy: logoDetails.requestedBy || "",
      dimensions: logoDetails.dimensions || {},
      // Manter outros campos para compatibilidade
      usageOutdoor: logoDetails.usageOutdoor || false,
      usageIndoor: logoDetails.usageIndoor !== undefined ? logoDetails.usageIndoor : true,
      fixationType: logoDetails.fixationType || "",
      lacqueredStructure: logoDetails.lacqueredStructure || false,
      lacquerColor: logoDetails.lacquerColor || "",
      mastDiameter: logoDetails.mastDiameter || "",
      maxWeightConstraint: logoDetails.maxWeightConstraint || false,
      maxWeight: logoDetails.maxWeight || "",
      ballast: logoDetails.ballast || false,
      controlReport: logoDetails.controlReport || false,
      criteria: logoDetails.criteria || "",
      description: logoDetails.description || "",
    },
    validationSchema,
    onChange: (field, value) => {
      // Sincronizar com formData global através de logoDetails
      const updatedLogoDetails = {
        ...logoDetails,
        [field]: value,
      };
      onInputChange("logoDetails", updatedLogoDetails);
    },
    formData: logoDetails,
  });

  // Helper para atualizar logoDetails completo (mantém compatibilidade)
  const handleUpdate = (key, value) => {
    onInputChange("logoDetails", {
      ...logoDetails,
      [key]: value
    });
    // Sincronizar com Formik
    if (formik.values[key] !== undefined) {
      formik.setFieldValue(key, value);
    }
  };

  // Helper melhorado para atualizar dimensões usando Formik
  const handleDimensionUpdate = (dim, field, value) => {
    const dimensions = formik.values.dimensions || {};
    const updatedDimensions = {
      ...dimensions,
      [dim]: {
        ...dimensions[dim],
        [field]: value
      }
    };
    formik.setFieldValue("dimensions", updatedDimensions);
    // Sincronizar com formData global
    handleUpdate("dimensions", updatedDimensions);
  };

  // Handlers para Composition
  const handleCompositionUpdate = (type, index, field, value) => {
    const newComposition = { ...composition };
    if (!newComposition[type]) {
      newComposition[type] = [];
    }
    const newArray = [...newComposition[type]];
    
    if (!newArray[index]) {
      newArray[index] = {};
    }
    
    // Guardar estado anterior para verificar se ficou completo
    const estadoAnterior = { ...newArray[index] };
    
    newArray[index] = {
      ...newArray[index],
      [field]: value
    };
    
    // Se estamos atualizando componenteId, resetar cor e combinação
    if (field === "componenteId") {
      const componente = getComponenteById(value);
      if (componente) {
        newArray[index].componenteNome = componente.nome;
        newArray[index].componenteReferencia = componente.referencia;
        
        // Se semCor === true, usar referência do próprio componente e limpar cor
        if (componente.semCor) {
          newArray[index].corId = null;
          newArray[index].corNome = null;
          newArray[index].combinacaoId = null;
          // Usar a referência do componente se existir
          newArray[index].referencia = componente.referencia || null;
        } else {
          // Se semCor === false, manter cor se já existir, senão limpar
          if (!newArray[index].corId) {
            newArray[index].corId = null;
            newArray[index].corNome = null;
            newArray[index].combinacaoId = null;
            newArray[index].referencia = null;
          }
        }
      }
    }
    
    // Se estamos atualizando corId, atualizar combinação
    if (field === "corId" && newArray[index].componenteId) {
      if (value) {
        const cor = getCorById(value);
        if (cor) {
          newArray[index].corNome = cor.nome;
          const combinacao = getCombinacaoByComponenteECor(newArray[index].componenteId, value);
          if (combinacao) {
            newArray[index].combinacaoId = combinacao.id;
            newArray[index].referencia = combinacao.referencia;
          }
        }
      } else {
        newArray[index].corNome = null;
        newArray[index].combinacaoId = null;
        newArray[index].referencia = null;
      }
    }
    
    newComposition[type] = newArray;
    
    // Verificar se o componente acabou de ficar completo (só para componentes)
    if (type === "componentes") {
      const componenteAtual = newArray[index];
      const estavaCompleto = isComponenteCompleto(estadoAnterior);
      const ficouCompleto = isComponenteCompleto(componenteAtual);
      
      // Se acabou de ficar completo e não estava completo antes, adicionar novo componente
      if (ficouCompleto && !estavaCompleto) {
        newComposition.componentes.push({
          componenteId: null,
          componenteNome: null,
          componenteReferencia: null,
          corId: null,
          corNome: null,
          combinacaoId: null,
          referencia: null
        });
      }
    }
    
    handleUpdate("composition", newComposition);
  };

  const handleAddComponente = () => {
    const newComposition = { ...composition };
    if (!newComposition.componentes) {
      newComposition.componentes = [];
    }
    newComposition.componentes.push({
      componenteId: null,
      componenteNome: null,
      componenteReferencia: null,
      corId: null,
      corNome: null,
      combinacaoId: null,
      referencia: null
    });
    handleUpdate("composition", newComposition);
  };

  const handleRemoveComponente = (index) => {
    const newComposition = { ...composition };
    if (newComposition.componentes) {
      newComposition.componentes = newComposition.componentes.filter((_, i) => i !== index);
      handleUpdate("composition", newComposition);
      // Limpar estado de busca para o índice removido e ajustar índices
      setComponenteSearchValues(prev => {
        const newValues = {};
        Object.keys(prev).forEach(key => {
          const keyIndex = Number(key);
          if (keyIndex < index) {
            newValues[keyIndex] = prev[key];
          } else if (keyIndex > index) {
            newValues[keyIndex - 1] = prev[key];
          }
          // keyIndex === index é ignorado (removido)
        });
        return newValues;
      });
      // Limpar estado de edição
      setComponentesEditando(prev => {
        const newValues = {};
        Object.keys(prev).forEach(key => {
          const keyIndex = Number(key);
          if (keyIndex < index) {
            newValues[keyIndex] = prev[key];
          } else if (keyIndex > index) {
            newValues[keyIndex - 1] = prev[key];
          }
        });
        return newValues;
      });
    }
  };
  
  const handleToggleEditComponente = (index) => {
    setComponentesEditando(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    // Limpar busca quando entrar em modo de edição
    setComponenteSearchValues(prev => {
      const newValues = { ...prev };
      delete newValues[index];
      return newValues;
    });
  };

  const handleAddBola = () => {
    const newComposition = { ...composition };
    if (!newComposition.bolas) {
      newComposition.bolas = [];
    }
    newComposition.bolas.push({
      bolaId: null,
      corId: null,
      corNome: null,
      acabamentoId: null,
      acabamentoNome: null,
      tamanhoId: null,
      tamanhoNome: null,
      referencia: null
    });
    handleUpdate("composition", newComposition);
  };

  const handleRemoveBola = (index) => {
    const newComposition = { ...composition };
    if (newComposition.bolas) {
      newComposition.bolas = newComposition.bolas.filter((_, i) => i !== index);
      handleUpdate("composition", newComposition);
    }
  };

  const handleBolaUpdate = (index, field, value) => {
    const newComposition = { ...composition };
    if (!newComposition.bolas) {
      newComposition.bolas = [];
    }
    const newArray = [...newComposition.bolas];
    
    if (!newArray[index]) {
      newArray[index] = {};
    }
    
    newArray[index] = {
      ...newArray[index],
      [field]: value
    };
    
    // Atualizar nomes quando IDs mudam
    if (field === "corId") {
      if (value) {
        const cor = getCorById(value);
        if (cor) {
          newArray[index].corNome = cor.nome;
        }
      } else {
        newArray[index].corNome = null;
        newArray[index].acabamentoId = null;
        newArray[index].acabamentoNome = null;
        newArray[index].tamanhoId = null;
        newArray[index].tamanhoNome = null;
        newArray[index].referencia = null;
      }
    }
    
    if (field === "acabamentoId") {
      if (value) {
        const acabamento = getAcabamentoById(value);
        if (acabamento) {
          newArray[index].acabamentoNome = acabamento.nome;
        }
      } else {
        newArray[index].acabamentoNome = null;
        newArray[index].tamanhoId = null;
        newArray[index].tamanhoNome = null;
        newArray[index].referencia = null;
      }
    }
    
    if (field === "tamanhoId") {
      if (value) {
        const tamanho = getTamanhoById(value);
        if (tamanho) {
          newArray[index].tamanhoNome = tamanho.nome;
        }
      } else {
        newArray[index].tamanhoNome = null;
        newArray[index].referencia = null;
      }
    }
    
    // Quando todos os três estão selecionados, buscar a bola
    if (newArray[index].corId && newArray[index].acabamentoId && newArray[index].tamanhoId) {
      const bola = getBolaBySelecao(
        newArray[index].corId,
        newArray[index].acabamentoId,
        newArray[index].tamanhoId
      );
      if (bola) {
        newArray[index].bolaId = bola.id;
        newArray[index].referencia = bola.referencia;
      }
    } else {
      newArray[index].bolaId = null;
      newArray[index].referencia = null;
    }
    
    newComposition.bolas = newArray;
    handleUpdate("composition", newComposition);
  };

  // Persistência automática dos dados do logo (PWA)
  useLogoPersistence({
    logoDetails: logoDetails,
    formData: formData,
    onInputChange: onInputChange
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Logo Instructions</h2>
          <p className="text-default-500">Define the technical specifications for the logo</p>
        </div>
        <Button
          color="primary"
          variant="shadow"
          className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white"
          startContent={<Icon icon="lucide:sparkles" className="w-5 h-5" />}
          onPress={() => console.log("Open Chatbot")}
        >
          AI Assistant
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left Column - Main Specs */}
        <div className="xl:col-span-8 space-y-6">

          {/* 1. Identity Section */}
          <Card className="shadow-sm">
            <CardHeader className="px-6 pt-6 pb-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="lucide:fingerprint" className="text-primary" />
                Project Identity
              </h3>
            </CardHeader>
            <CardBody className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Logo Number"
                placeholder="142STE..."
                variant="bordered"
                isRequired
                value={formik.values.logoNumber}
                onValueChange={(v) => formik.updateField("logoNumber", v)}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.logoNumber && !!formik.errors.logoNumber}
                errorMessage={formik.touched.logoNumber && formik.errors.logoNumber}
              />
              <Input
                label="Logo Name"
                placeholder="Project Name"
                variant="bordered"
                isRequired
                value={formik.values.logoName}
                onValueChange={(v) => formik.updateField("logoName", v)}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.logoName && !!formik.errors.logoName}
                errorMessage={formik.touched.logoName && formik.errors.logoName}
              />
              <Input
                label="Requested By"
                placeholder="Name"
                variant="bordered"
                isRequired
                value={formik.values.requestedBy}
                onValueChange={(v) => formik.updateField("requestedBy", v)}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.requestedBy && !!formik.errors.requestedBy}
                errorMessage={formik.touched.requestedBy && formik.errors.requestedBy}
              />
            </CardBody>
          </Card>

          {/* 2. Physical Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimensions */}
            <Card className="shadow-sm">
              <CardHeader className="px-4 pt-4 pb-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="lucide:ruler" className="text-primary" />
                  Dimensions
                </h3>
              </CardHeader>
              <CardBody className="p-4 space-y-2">
                {['Height', 'Length', 'Width', 'Diameter'].map((dim) => {
                  const key = dim.toLowerCase();
                  const dimensionValue = formik.values.dimensions?.[key]?.value || "";
                  const dimensionError = formik.errors.dimensions?.[key]?.value;
                  const isTouched = formik.touched.dimensions?.[key]?.value;
                  
                  return (
                    <div key={key} className="flex items-end gap-3">
                      <Input
                        label={dim}
                        type="number"
                        endContent={<span className="text-default-400 text-xs">m</span>}
                        variant="flat"
                        size="sm"
                        className="flex-1"
                        value={dimensionValue}
                        onValueChange={(v) => handleDimensionUpdate(key, "value", v ? parseFloat(v) : null)}
                        onBlur={() => formik.setFieldTouched(`dimensions.${key}.value`, true)}
                        isInvalid={isTouched && !!dimensionError}
                        errorMessage={isTouched && dimensionError}
                      />
                      <div className="pb-2">
                        <Checkbox
                          size="sm"
                          color="danger"
                          isSelected={formik.values.dimensions?.[key]?.imperative || false}
                          onValueChange={(v) => handleDimensionUpdate(key, "imperative", v)}
                        >
                          Imperative
                        </Checkbox>
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>

            {/* Fixation & Constraints */}
            <Card className="shadow-sm h-full">
              <CardHeader className="px-6 pt-6 pb-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="lucide:anchor" className="text-primary" />
                  Fixation & Constraints
                </h3>
              </CardHeader>
              <CardBody className="p-6 space-y-6">
                {/* Usage Toggle */}
                <div>
                  <p className="text-sm font-medium text-default-700 mb-2">Usage Environment</p>
                  <Tabs
                    fullWidth
                    size="md"
                    aria-label="Usage Options"
                    selectedKey={formik.values.usageOutdoor ? "outdoor" : "indoor"}
                    onSelectionChange={(key) => {
                      if (key === "indoor") {
                        formik.updateFields({
                          usageIndoor: true,
                          usageOutdoor: false,
                        });
                      } else {
                        formik.updateFields({
                          usageIndoor: false,
                          usageOutdoor: true,
                        });
                      }
                    }}
                  >
                    <Tab key="indoor" title="Indoor" />
                    <Tab key="outdoor" title="Outdoor" />
                  </Tabs>
                </div>

                <div>
                  <Select
                    label="Fixation Type"
                    placeholder="Select fixation"
                    selectedKeys={formik.values.fixationType ? [formik.values.fixationType] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] || "";
                      formik.updateField("fixationType", selected);
                    }}
                  >
                    <SelectItem key="ground">Ground</SelectItem>
                    <SelectItem key="wall">Wall</SelectItem>
                    <SelectItem key="suspended">Suspended / Transversal</SelectItem>
                    <SelectItem key="none">None</SelectItem>
                    <SelectItem key="pole_side">Pole (Side)</SelectItem>
                    <SelectItem key="pole_central">Pole (Central)</SelectItem>
                    <SelectItem key="special">Special</SelectItem>
                  </Select>

                  {(formik.values.fixationType === "pole_central" || formik.values.fixationType === "pole_side") && (
                    <Input
                      label="Mast Diameter"
                      size="sm"
                      endContent="mm"
                      className="mt-3"
                      variant="bordered"
                      value={formik.values.mastDiameter}
                      onValueChange={(v) => formik.updateField("mastDiameter", v)}
                    />
                  )}
                </div>

                <Divider />

                {/* Lacquered Structure Moved Here */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-default-600">Lacquered Structure</span>
                    <Switch
                      size="sm"
                      isSelected={formik.values.lacqueredStructure}
                      onValueChange={(v) => formik.updateField("lacqueredStructure", v)}
                    />
                  </div>
                  {formik.values.lacqueredStructure && (
                    <Input
                      placeholder="RAL Color / Reference"
                      size="sm"
                      startContent={<Icon icon="lucide:palette" className="text-default-400" />}
                      value={formik.values.lacquerColor}
                      onValueChange={(v) => formik.updateField("lacquerColor", v)}
                    />
                  )}
                </div>

                <Divider />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Checkbox size="sm" isSelected={formik.values.maxWeightConstraint} onValueChange={(v) => formik.updateField("maxWeightConstraint", v)}>Max Weight</Checkbox>
                    {formik.values.maxWeightConstraint && (
                      <Input
                        placeholder="kg"
                        size="sm"
                        className="w-20"
                        value={formik.values.maxWeight}
                        onValueChange={(v) => formik.updateField("maxWeight", v)}
                      />
                    )}
                  </div>
                  <Checkbox size="sm" isSelected={formik.values.ballast} onValueChange={(v) => formik.updateField("ballast", v)}>Ballast Integration</Checkbox>
                  <Checkbox size="sm" isSelected={formik.values.controlReport} onValueChange={(v) => formik.updateField("controlReport", v)} className="ml-[5px]">Control Bureau Report</Checkbox>
                </div>
              </CardBody>
            </Card>
          </div>

        </div>

        {/* Right Column - Composition & Options */}
        <div className="xl:col-span-4 space-y-6">

          {/* Composition Card */}
          <Card className="shadow-sm h-full">
            <CardHeader className="px-6 pt-6 pb-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="lucide:layers" className="text-primary" />
                Composition
              </h3>
            </CardHeader>
            <CardBody className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              
              {/* Componentes Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-default-900 uppercase tracking-wider">Componentes</p>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
                    onPress={handleAddComponente}
                  >
                    Adicionar
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {composition.componentes && composition.componentes.length > 0 ? (
                    composition.componentes.map((comp, index) => {
                      const componente = comp.componenteId ? getComponenteById(comp.componenteId) : null;
                      const coresDisponiveis = componente && !componente.semCor 
                        ? getCoresByComponente(comp.componenteId) 
                        : [];
                      
                      // Verificar se está completo e não está em modo de edição
                      const completo = isComponenteCompleto(comp);
                      const editando = componentesEditando[index];
                      const mostrarApenasReferencia = completo && !editando;
                      
                      // Filtrar componentes baseado na busca (usando função helper, não hook)
                      const searchValue = componenteSearchValues[index] || "";
                      const componentesFiltrados = filterComponentes(searchValue);
                      
                      // Valor de exibição do componente selecionado
                      const displayValue = componente 
                        ? `${componente.nome}${componente.referencia ? ` (${componente.referencia})` : ""}`
                        : "";
                      
                      // Se está completo e não editando, mostrar apenas referência
                      if (mostrarApenasReferencia) {
                        return (
                          <div key={index} className="p-3 border border-default-200 rounded-lg bg-default-50">
                            <div className="text-sm font-semibold text-default-900 mb-2">
                              {componente?.nome || "Componente"}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 text-xs text-default-600 bg-default-100 p-2 rounded">
                                <span className="font-semibold">Referência: </span>
                                {comp.referencia}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="default"
                                  isIconOnly
                                  onPress={() => handleToggleEditComponente(index)}
                                  title="Editar componente"
                                >
                                  <Icon icon="lucide:pencil" className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  isIconOnly
                                  onPress={() => handleRemoveComponente(index)}
                                  title="Remover componente"
                                >
                                  <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Modo de edição: mostrar todos os campos
                      return (
                        <div key={index} className="p-3 border border-default-200 rounded-lg space-y-3 bg-default-50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-3">
                              <Autocomplete
                                label="Componente"
                                placeholder="Pesquise ou selecione um componente"
                                size="sm"
                                selectedKey={comp.componenteId ? String(comp.componenteId) : null}
                                inputValue={componenteSearchValues[index] || displayValue || ""}
                                onSelectionChange={(key) => {
                                  const selectedId = key ? Number(key) : null;
                                  handleCompositionUpdate("componentes", index, "componenteId", selectedId);
                                  // Limpar busca após seleção
                                  setComponenteSearchValues(prev => {
                                    const newValues = { ...prev };
                                    delete newValues[index];
                                    return newValues;
                                  });
                                }}
                                onInputChange={(value) => {
                                  setComponenteSearchValues(prev => ({
                                    ...prev,
                                    [index]: value
                                  }));
                                }}
                                defaultItems={componentesFiltrados}
                                menuTrigger="input"
                                startContent={<Icon icon="lucide:search" className="text-default-400 w-4 h-4" />}
                                allowsCustomValue={false}
                              >
                                {(c) => (
                                  <AutocompleteItem key={String(c.id)} textValue={`${c.nome} ${c.referencia || ""}`}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{c.nome}</span>
                                      {c.referencia && (
                                        <span className="text-xs text-default-500">Ref: {c.referencia}</span>
                                      )}
                                    </div>
                                  </AutocompleteItem>
                                )}
                              </Autocomplete>
                              
                              {componente && !componente.semCor && (
                                <Select
                                  label="Cor"
                                  placeholder="Selecione uma cor"
                                  size="sm"
                                  selectedKeys={comp.corId ? [String(comp.corId)] : []}
                                  onSelectionChange={(keys) => {
                                    const selectedId = Array.from(keys)[0];
                                    handleCompositionUpdate("componentes", index, "corId", selectedId ? Number(selectedId) : null);
                                  }}
                                >
                                  {coresDisponiveis.map((cor) => (
                                    <SelectItem key={String(cor.id)} value={String(cor.id)}>
                                      {cor.nome}
                                    </SelectItem>
                                  ))}
                                </Select>
                              )}
                              
                              {comp.referencia && (
                                <div className="text-xs text-default-600 bg-default-100 p-2 rounded">
                                  <span className="font-semibold">Referência: </span>
                                  {comp.referencia}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              {completo && (
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="default"
                                  isIconOnly
                                  onPress={() => handleToggleEditComponente(index)}
                                  title="Fechar edição"
                                >
                                  <Icon icon="lucide:check" className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                isIconOnly
                                onPress={() => handleRemoveComponente(index)}
                                title="Remover componente"
                              >
                                <Icon icon="lucide:trash-2" className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-default-400 text-center py-4">Nenhum componente adicionado</p>
                  )}
                </div>
              </div>

              <Divider />

              {/* Bolas Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-default-900 uppercase tracking-wider">Bolas</p>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
                    onPress={handleAddBola}
                  >
                    Adicionar
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {composition.bolas && composition.bolas.length > 0 ? (
                    composition.bolas.map((bola, index) => {
                      const coresDisponiveis = getCoresDisponiveisBolas();
                      const acabamentosDisponiveis = bola.corId 
                        ? getAcabamentosByCorBola(bola.corId)
                        : materialsData.acabamentos;
                      const tamanhosDisponiveis = bola.corId && bola.acabamentoId
                        ? getTamanhosByCorEAcabamentoBola(bola.corId, bola.acabamentoId)
                        : materialsData.tamanhos;
                      
                      return (
                        <div key={index} className="p-3 border border-default-200 rounded-lg space-y-3 bg-default-50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-3">
                              <Select
                                label="Cor"
                                placeholder="Selecione uma cor"
                                size="sm"
                                selectedKeys={bola.corId ? [String(bola.corId)] : []}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleBolaUpdate(index, "corId", selectedId ? Number(selectedId) : null);
                                }}
                              >
                                {coresDisponiveis.map((cor) => (
                                  <SelectItem key={String(cor.id)} value={String(cor.id)}>
                                    {cor.nome}
                                  </SelectItem>
                                ))}
                              </Select>
                              
                              <Select
                                label="Acabamento"
                                placeholder="Selecione um acabamento"
                                size="sm"
                                selectedKeys={bola.acabamentoId ? [String(bola.acabamentoId)] : []}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleBolaUpdate(index, "acabamentoId", selectedId ? Number(selectedId) : null);
                                }}
                                isDisabled={!bola.corId}
                              >
                                {acabamentosDisponiveis.map((acabamento) => (
                                  <SelectItem key={String(acabamento.id)} value={String(acabamento.id)}>
                                    {acabamento.nome}
                                  </SelectItem>
                                ))}
                              </Select>
                              
                              <Select
                                label="Tamanho"
                                placeholder="Selecione um tamanho"
                                size="sm"
                                selectedKeys={bola.tamanhoId ? [String(bola.tamanhoId)] : []}
                                onSelectionChange={(keys) => {
                                  const selectedId = Array.from(keys)[0];
                                  handleBolaUpdate(index, "tamanhoId", selectedId ? Number(selectedId) : null);
                                }}
                                isDisabled={!bola.corId || !bola.acabamentoId}
                              >
                                {tamanhosDisponiveis.map((tamanho) => (
                                  <SelectItem key={String(tamanho.id)} value={String(tamanho.id)}>
                                    {tamanho.nome}
                                  </SelectItem>
                                ))}
                              </Select>
                              
                              {bola.referencia && (
                                <div className="text-xs text-default-600 bg-default-100 p-2 rounded">
                                  <span className="font-semibold">Referência: </span>
                                  {bola.referencia}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="light"
                              color="danger"
                              isIconOnly
                              onPress={() => handleRemoveBola(index)}
                            >
                              <Icon icon="lucide:trash-2" className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-default-400 text-center py-4">Nenhuma bola adicionada</p>
                  )}
                </div>
              </div>

            </CardBody>
          </Card>
        </div>
      </div>

      {/* 3. Details & Criteria (Full Width) */}
      <Card className="shadow-sm">
        <CardHeader className="px-6 pt-6 pb-0">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon icon="lucide:file-text" className="text-primary" />
            Details & Criteria
          </h3>
        </CardHeader>
        <CardBody className="p-6 space-y-4">
          <Textarea
            label="Specific Criteria"
            placeholder="Enter any specific requirements or criteria..."
            minRows={2}
            variant="bordered"
            value={formik.values.criteria}
            onValueChange={(v) => formik.updateField("criteria", v)}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Textarea
              label="Full Description"
              placeholder="Detailed description of the logo..."
              minRows={4}
              className="lg:col-span-2"
              variant="bordered"
              value={formik.values.description}
              onValueChange={(v) => formik.updateField("description", v)}
            />
            <div className="flex flex-col gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-default-700">Attachments</p>
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<Icon icon="lucide:paperclip" />}
                  onPress={() => document.getElementById('logo-file-input').click()}
                  className="w-full"
                >
                  Upload Files
                </Button>
                <input
                  id="logo-file-input"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ai,.eps"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    handleUpdate("attachmentFiles", files);
                    console.log("Files selected:", files);
                  }}
                />
                {logoDetails.attachmentFiles && logoDetails.attachmentFiles.length > 0 && (
                  <div className="text-xs text-default-500">
                    {logoDetails.attachmentFiles.length} file(s) selected
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
