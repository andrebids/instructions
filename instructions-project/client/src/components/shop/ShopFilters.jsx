import React from "react";
import { RadioGroup, Radio, CheckboxGroup, Checkbox, Input } from "@heroui/react";

export default function ShopFilters({ filters, onChange, query, onQueryChange }) {
  const handle = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="mb-4">
      <div className="mb-4">
        <Input size="sm" placeholder="Buscar produtos" value={query || ""} onChange={(e)=>onQueryChange && onQueryChange(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-content1/40 border border-divider rounded-lg p-4">
          <div className="text-sm text-default-500 mb-2">Tipo (2D/3D)</div>
          <RadioGroup orientation="horizontal" value={filters.type || ""} onValueChange={(v) => handle("type", v)}>
            <Radio value="">Todos</Radio>
            <Radio value="2D">2D</Radio>
            <Radio value="3D">3D</Radio>
          </RadioGroup>
        </div>

        <div className="bg-content1/40 border border-divider rounded-lg p-4">
          <div className="text-sm text-default-500 mb-2">Uso</div>
          <RadioGroup orientation="horizontal" value={filters.usage || ""} onValueChange={(v) => handle("usage", v)}>
            <Radio value="">Todos</Radio>
            <Radio value="Shopping">Shopping</Radio>
          </RadioGroup>
        </div>

        <div className="bg-content1/40 border border-divider rounded-lg p-4">
          <div className="text-sm text-default-500 mb-2">Interior/Exterior</div>
          <RadioGroup orientation="horizontal" value={filters.location || ""} onValueChange={(v) => handle("location", v)}>
            <Radio value="">Todos</Radio>
            <Radio value="Interior">Interior</Radio>
            <Radio value="Exterior">Exterior</Radio>
          </RadioGroup>
        </div>

        <div className="bg-content1/40 border border-divider rounded-lg p-4">
          <div className="text-sm text-default-500 mb-2">Cor</div>
          <CheckboxGroup
            orientation="horizontal"
            value={Array.isArray(filters.color) && filters.color.length > 0 ? filters.color : ["all"]}
            onChange={(values) => {
              const arr = Array.from(new Set(values));
              if (arr.includes("all")) {
                const wasAll = !Array.isArray(filters.color) || filters.color.length === 0;
                if (wasAll) {
                  // Previously 'Todas' active, user picked another -> remove 'Todas'
                  handle("color", arr.filter((v) => v !== "all"));
                } else {
                  // User clicked 'Todas' while colors selected -> clear to only 'Todas'
                  handle("color", []);
                }
              } else {
                handle("color", arr);
              }
            }}
          >
            <Checkbox value="all">Todas</Checkbox>
            <Checkbox value="brancoPuro">Branco Puro</Checkbox>
            <Checkbox value="brancoQuente">Branco Quente</Checkbox>
            <Checkbox value="rgb">RGB</Checkbox>
            <Checkbox value="vermelho">Vermelho</Checkbox>
            <Checkbox value="verde">Verde</Checkbox>
            <Checkbox value="azul">Azul</Checkbox>
          </CheckboxGroup>
          <div className="text-xs text-default-500 mt-1">Pode selecionar múltiplas cores. A opção "Todas" é exclusiva.</div>
        </div>

        <div className="bg-content1/40 border border-divider rounded-lg p-4 md:col-span-2">
          <div className="text-sm text-default-500 mb-2">Poste/Transversal/Chão</div>
          <RadioGroup orientation="horizontal" value={filters.mount || ""} onValueChange={(v) => handle("mount", v)}>
            <Radio value="">Todos</Radio>
            <Radio value="Poste">Poste</Radio>
            <Radio value="Transversal">Transversal</Radio>
            <Radio value="Chão">Chão</Radio>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}


