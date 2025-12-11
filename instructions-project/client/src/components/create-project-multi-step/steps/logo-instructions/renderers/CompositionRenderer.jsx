import React from "react";
import { Button, Select, SelectItem, AutocompleteItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { materialsData } from "../../../data/materialsData.js";
import {
  getComponenteById,
  getCoresByComponente,
  getCoresDisponiveisBolas,
  getAcabamentosByCorBola,
  getTamanhosByCorEAcabamentoBola,
} from "../../../utils/materialsUtils.js";
import { AutocompleteWithMarquee } from "../components/AutocompleteWithMarquee";
import { SelectWithMarquee } from "../components/SelectWithMarquee";

export const CompositionRenderer = ({
  composition,
  isCompact,
  isComponenteCompleto,
  isBolaCompleta,
  componenteSearchValues,
  setComponenteSearchValues,
  componentesEditando,
  bolasEditando,
  filterComponentes,
  handleCompositionUpdate,
  handleAddComponente,
  handleRemoveComponente,
  handleClearAllComponentes,
  handleToggleEditComponente,
  handleAddBola,
  handleRemoveBola,
  handleToggleEditBola,
  handleBolaUpdate,
}) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Components Section */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10 flex flex-col`}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 dark:border-gray-600/30 shadow-md gap-2 sm:gap-0 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <Icon icon="lucide:box" className="w-3.5 h-3.5" />
              <h4 className="text-xs font-bold uppercase tracking-wide">Components</h4>
            </div>
            <div className="flex gap-1.5 w-full sm:w-auto">
              {composition.componentes && composition.componentes.length > 0 && (
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  isIconOnly
                  onPress={handleClearAllComponentes}
                  className="bg-white dark:bg-gray-800 h-7 w-7 min-w-7"
                  aria-label="Clear all components"
                >
                  <Icon icon="lucide:trash-2" className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="sm"
                color="primary"
                className="font-medium h-7 text-xs flex-1 sm:flex-initial"
                startContent={<Icon icon="lucide:plus" className="w-3 h-3" />}
                onPress={handleAddComponente}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {composition.componentes && composition.componentes.length > 0 ? (
              composition.componentes.map((comp, index) => {
                const componente = comp.componenteId ? getComponenteById(comp.componenteId) : null;
                const coresDisponiveis = componente && !componente.semCor
                  ? getCoresByComponente(comp.componenteId)
                  : [];
                const completo = isComponenteCompleto(comp);
                const editando = componentesEditando[index];
                const mostrarApenasReferencia = completo && !editando;
                const searchValue = componenteSearchValues[index] || "";
                const componentesFiltrados = filterComponentes(searchValue);
                const displayValue = componente
                  ? `${componente.nome}${componente.referencia ? ` (${componente.referencia})` : ""} `
                  : "";

                if (mostrarApenasReferencia) {
                  return (
                    <div key={index} className="p-2 sm:p-2 md:p-2.5 lg:p-2 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0">
                            <div className="text-sm md:text-base lg:text-sm font-bold truncate text-gray-900 dark:text-white">{componente?.nome}</div>
                          </div>
                          <div className="text-xs md:text-sm lg:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-xs md:text-sm lg:text-xs">{comp.referencia}</span>
                          </div>
                          {comp.corNome && (
                            <div className="text-xs md:text-sm lg:text-xs font-semibold flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full" style={getDotStyle(comp.corNome)} />
                              <span style={getColorStyle(comp.corNome)}>{comp.corNome}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="flat"
                            isIconOnly
                            onPress={() => handleToggleEditComponente(index)}
                            className="h-6 w-6 min-w-6"
                            aria-label={`Edit component ${index + 1}`}
                          >
                            <Icon icon="lucide:pencil" className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isIconOnly
                            onPress={() => handleRemoveComponente(index)}
                            className="h-6 w-6 min-w-6"
                            aria-label={`Remove component ${index + 1}`}
                          >
                            <Icon icon="lucide:trash-2" className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={index} className="p-1.5 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm space-y-1.5 shadow-md">
                    <AutocompleteWithMarquee
                      label="Component"
                      aria-label="Search component"
                      placeholder="Search component"
                      size="sm"
                      variant="bordered"
                      selectedKey={comp.componenteId ? String(comp.componenteId) : null}
                      inputValue={componenteSearchValues[index] || displayValue || ""}
                      onSelectionChange={(key) => {
                        const selectedId = key ? Number(key) : null;
                        handleCompositionUpdate("componentes", index, "componenteId", selectedId);
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
                      startContent={<Icon icon="lucide:search" className="w-3 h-3 text-gray-500" />}
                      allowsCustomValue={false}
                      classNames={{ listboxWrapper: "max-h-[300px]", trigger: "text-xs h-8", input: "text-xs" }}
                    >
                      {(c) => (
                        <AutocompleteItem key={String(c.id)} textValue={`${c.nome} ${c.referencia || ""} `}>
                          <div className="text-xs font-medium">{c.nome}</div>
                          {c.referencia && <div className="text-xs text-gray-500">Ref: {c.referencia}</div>}
                        </AutocompleteItem>
                      )}
                    </AutocompleteWithMarquee>

                    {componente && !componente.semCor && (
                      <SelectWithMarquee
                        label="Color"
                        placeholder="Select color"
                        size="sm"
                        variant="bordered"
                        selectedKeys={comp.corId ? new Set([String(comp.corId)]) : new Set()}
                        onSelectionChange={(keys) => {
                          const selectedId = Array.from(keys)[0];
                          handleCompositionUpdate("componentes", index, "corId", selectedId ? Number(selectedId) : null);
                        }}
                        startContent={<Icon icon="lucide:palette" className="w-3 h-3 text-gray-500" />}
                        classNames={{ trigger: "text-xs h-8" }}
                      >
                        {coresDisponiveis.map((cor) => (
                          <SelectItem key={String(cor.id)} textValue={cor.nome}>
                            {cor.nome}
                          </SelectItem>
                        ))}
                      </SelectWithMarquee>
                    )}

                    <div className="flex gap-1.5 justify-end mt-1">
                      {completo && (
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          className="font-medium h-6 text-xs"
                          startContent={<Icon icon="lucide:check" className="w-3 h-3" />}
                          onPress={() => handleToggleEditComponente(index)}
                        >
                          Done
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        isIconOnly
                        className="h-6 w-6 min-w-6"
                        onPress={() => handleRemoveComponente(index)}
                        aria-label={`Remove component ${index + 1}`}
                      >
                        <Icon icon="lucide:trash-2" className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-white/30 dark:border-gray-600/40 rounded-lg bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm">
                <Icon icon="lucide:box" className="w-8 h-8 text-gray-300 mb-1" />
                <p className="text-xs text-gray-400">No components added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Balls Section */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10 flex flex-col`}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 dark:border-gray-600/30 shadow-md gap-2 sm:gap-0 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <Icon icon="lucide:circle-dot" className="w-3.5 h-3.5" />
              <h4 className="text-xs font-bold uppercase tracking-wide">Balls</h4>
            </div>
            <Button
              size="sm"
              color="primary"
              className="font-medium h-7 text-xs w-full sm:w-auto"
              startContent={<Icon icon="lucide:plus" className="w-3 h-3" />}
              onPress={handleAddBola}
            >
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {composition.bolas && composition.bolas.length > 0 ? (
              composition.bolas.map((bola, index) => {
                const coresDisponiveis = getCoresDisponiveisBolas();
                const acabamentosDisponiveis = bola.corId
                  ? getAcabamentosByCorBola(bola.corId)
                  : materialsData.acabamentos;
                const tamanhosDisponiveis = bola.corId && bola.acabamentoId
                  ? getTamanhosByCorEAcabamentoBola(bola.corId, bola.acabamentoId)
                  : materialsData.tamanhos;
                const completa = isBolaCompleta(bola);
                const editando = bolasEditando[index];
                const mostrarApenasReferencia = completa && !editando;

                if (mostrarApenasReferencia) {
                  const nomeBola = [bola.acabamentoNome, bola.tamanhoNome].filter(Boolean).join(" - ");

                  return (
                    <div key={index} className="p-1.5 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0">
                            {bola.corNome && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold truncate" style={getColorStyle(bola.corNome)}>
                                <span className="inline-block w-2 h-2 rounded-full" style={getDotStyle(bola.corNome)} />
                                {bola.corNome}
                              </span>
                            )}
                            {nomeBola && (
                              <div className="text-xs font-bold truncate text-gray-900 dark:text-white">{nomeBola}</div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            Ref: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-xs">{bola.referencia}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="flat"
                            isIconOnly
                            onPress={() => handleToggleEditBola(index)}
                            className="h-6 w-6 min-w-6"
                            aria-label={`Edit ball ${index + 1}`}
                          >
                            <Icon icon="lucide:pencil" className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isIconOnly
                            onPress={() => handleRemoveBola(index)}
                            className="h-6 w-6 min-w-6"
                            aria-label={`Remove ball ${index + 1}`}
                          >
                            <Icon icon="lucide:trash-2" className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={index} className="p-1.5 border border-white/20 dark:border-gray-600/30 rounded-lg bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm space-y-1.5 shadow-md">
                    <div className="flex items-center gap-1.5 mb-0">
                      <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-700">
                        {index + 1}
                      </div>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Ball Configuration</span>
                    </div>

                    <Select
                      label="Color"
                      placeholder="Select color"
                      size="sm"
                      variant="bordered"
                      selectedKeys={bola.corId ? [String(bola.corId)] : []}
                      onSelectionChange={(keys) => {
                        const selectedId = Array.from(keys)[0];
                        handleBolaUpdate(index, "corId", selectedId ? Number(selectedId) : null);
                      }}
                      classNames={{ trigger: "text-xs h-8" }}
                    >
                      {coresDisponiveis.map((cor) => (
                        <SelectItem key={String(cor.id)}>{cor.nome}</SelectItem>
                      ))}
                    </Select>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <Select
                        label="Finish"
                        placeholder="Finish"
                        size="sm"
                        variant="bordered"
                        selectedKeys={bola.acabamentoId ? [String(bola.acabamentoId)] : []}
                        onSelectionChange={(keys) => {
                          const selectedId = Array.from(keys)[0];
                          handleBolaUpdate(index, "acabamentoId", selectedId ? Number(selectedId) : null);
                        }}
                        isDisabled={!bola.corId}
                        classNames={{ trigger: "text-xs h-8" }}
                      >
                        {acabamentosDisponiveis.map((acabamento) => (
                          <SelectItem key={String(acabamento.id)}>{acabamento.nome}</SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Size"
                        placeholder="Size"
                        size="sm"
                        variant="bordered"
                        selectedKeys={bola.tamanhoId ? [String(bola.tamanhoId)] : []}
                        onSelectionChange={(keys) => {
                          const selectedId = Array.from(keys)[0];
                          handleBolaUpdate(index, "tamanhoId", selectedId ? Number(selectedId) : null);
                        }}
                        isDisabled={!bola.corId || !bola.acabamentoId}
                        classNames={{ trigger: "text-xs h-8" }}
                      >
                        {tamanhosDisponiveis.map((tamanho) => (
                          <SelectItem key={String(tamanho.id)}>{tamanho.nome}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="flex gap-1.5 justify-end mt-0.5">
                      {completa && (
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          className="font-medium h-6 text-xs"
                          startContent={<Icon icon="lucide:check" className="w-3 h-3" />}
                          onPress={() => handleToggleEditBola(index)}
                        >
                          Done
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        className="h-6 w-6 min-w-6"
                        onPress={() => handleRemoveBola(index)}
                        aria-label={`Remove ball ${index + 1}`}
                      >
                        <Icon icon="lucide:trash-2" className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-white/30 dark:border-gray-600/40 rounded-lg bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm">
                <Icon icon="lucide:circle-dashed" className="w-8 h-8 text-gray-300 mb-1" />
                <p className="text-xs text-gray-400">No balls added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


