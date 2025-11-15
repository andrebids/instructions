import React, { useState, useEffect } from 'react';
import { Input, Button, Slider, Checkbox, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { Icon } from '@iconify/react';

export const DecorationFiltersCompact = ({
  value,
  onChange,
  decorations = [],
  disabled = false,
  className = '',
  isInCategory = false,
}) => {
  // Calcular limites de height baseados nos dados reais
  var heightLimits = React.useMemo(function(){
    if (!Array.isArray(decorations) || decorations.length === 0) {
      return { min: 0, max: 3.0 }; // Valor padrão mais razoável
    }
    var heights = [];
    
    for (var i = 0; i < decorations.length; i++) {
      var d = decorations[i];
      var hMeters = null;
      
      // Prioridade 1: Campo height direto do produto (mais recente)
      if (d && typeof d.height === 'number' && Number.isFinite(d.height)) {
        hMeters = Number(d.height);
      }
      
      // Prioridade 2: specs.dimensions.heightM (formato antigo)
      if (hMeters === null) {
        try {
          var dims = d && d.specs && d.specs.dimensions ? d.specs.dimensions : null;
          if (dims && typeof dims.heightM === 'number' && Number.isFinite(dims.heightM)) {
            hMeters = Number(dims.heightM);
          }
        } catch(_) {}
      }
      
      // Prioridade 3: Tentar extrair de specs.dimensoes (texto)
      if (hMeters === null) {
        try {
          var dimensoesText = d && d.specs && d.specs.dimensoes ? String(d.specs.dimensoes) : null;
          if (dimensoesText) {
            // Procurar padrão "X.XX m" ou "X,XX m"
            var regex = /([0-9]+(?:[\.,][0-9]+)?)\s*m/gi;
            var matches = [];
            var match;
            while ((match = regex.exec(dimensoesText)) !== null && matches.length < 3) {
              var num = parseFloat(String(match[1]).replace(',', '.'));
              if (!isNaN(num) && num > 0) matches.push(num);
            }
            // Assumir que a altura é o segundo valor (formato W x H x D)
            if (matches.length >= 2) {
              hMeters = matches[1];
            } else if (matches.length === 1) {
              hMeters = matches[0];
            }
          }
        } catch(_) {}
      }
      
      if (hMeters !== null && Number.isFinite(hMeters) && hMeters > 0) {
        heights.push(hMeters);
      }
    }
    
    if (heights.length === 0) {
      return { min: 0, max: 3.0 }; // Valor padrão mais razoável
    }
    
    // Encontrar min e max
    var min = heights[0];
    var max = heights[0];
    for (var j = 0; j < heights.length; j++) {
      var h = Number(heights[j]);
      if (h < min) min = h;
      if (h > max) max = h;
    }
    
    // Arredondar para cima para ter margem visual
    // Arredondar min para baixo e max para cima com passo de 0.1
    min = Math.floor(min * 10) / 10;
    max = Math.ceil(max * 10) / 10;
    
    // Garantir valores mínimos razoáveis
    if (min < 0.1) min = 0.1;
    if (max < 0.5) max = 0.5;
    
    // Garantir que há pelo menos uma diferença mínima
    if (max - min < 0.1) {
      max = min + 0.1;
    }
    
    
    return { min: min, max: max };
  }, [decorations]);

  // Estado interno controlado para UX rápida; emite onChange com debounce externo no hook
  const [heightMin, setHeightMin] = useState(value && value.heightMin ? value.heightMin : heightLimits.min);
  const [heightMax, setHeightMax] = useState(value && value.heightMax ? value.heightMax : heightLimits.max);

  // Sincronizar valores iniciais quando heightLimits mudar ou não houver valor definido
  useEffect(function(){
    if (!value || (value && typeof value.heightMin === 'undefined')) {
      setHeightMin(heightLimits.min);
    }
    if (!value || (value && typeof value.heightMax === 'undefined')) {
      setHeightMax(heightLimits.max);
    }
  }, [heightLimits.min, heightLimits.max, value]);
  const [priceRange, setPriceRange] = useState(Array.isArray(value && value.priceRange) ? value.priceRange : [0, 0]);
  const [colors, setColors] = useState(Array.isArray(value && value.color) ? value.color : []);
  const [mount, setMount] = useState((value && value.mount) || '');
  const [dimKey, setDimKey] = useState((value && value.dimKey) || '');
  const [dimRange, setDimRange] = useState(Array.isArray(value && value.dimRange) ? value.dimRange : null);

  // Calcular limites de preço (quando disponíveis)
  const priceLimits = React.useMemo(function(){
    if (!Array.isArray(decorations) || decorations.length === 0) return { min: 0, max: 0 };
    var min = null;
    var max = null;
    for (var i = 0; i < decorations.length; i++) {
      var d = decorations[i];
      var p = (d && typeof d.price === 'number' && Number.isFinite(d.price)) ? Number(d.price) : null;
      if (p === null) continue;
      if (min === null || p < min) min = p;
      if (max === null || p > max) max = p;
    }
    if (min === null || max === null) return { min: 0, max: 0 };
    // Arredondar para números inteiros agradáveis
    var rmin = Math.floor(min);
    var rmax = Math.ceil(max);
    if (rmin < 0) rmin = 0;
    if (rmax < rmin + 1) rmax = rmin + 1;
    return { min: rmin, max: rmax };
  }, [decorations]);

  function emit(next){
    if (onChange) onChange(next);
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar compacta: botões com popover para Preço e Cores */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Preço em Popover */}
          {priceLimits.max > 0 && (
            <Popover placement="bottom-start">
              <PopoverTrigger>
                <Button size="sm" variant="bordered" isDisabled={disabled} startContent={<Icon icon="lucide:tag" className="text-default-500" />}>
                  {(priceRange && priceRange[0] && priceRange[1]) ? `$${Number(priceRange[0]).toFixed(0)} - $${Number(priceRange[1]).toFixed(0)}` : 'Price'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-4 min-w-[240px]">
                <div className="text-sm font-medium mb-2">Price range</div>
                <Slider
                  minValue={priceLimits.min}
                  maxValue={priceLimits.max}
                  step={1}
                  value={[Number(priceRange && priceRange[0]) || priceLimits.min, Number(priceRange && priceRange[1]) || priceLimits.max]}
                  onChange={function(val){
                    var pair = Array.isArray(val) ? val : [val, val];
                    var pmin = Math.max(priceLimits.min, Number(pair[0]) || priceLimits.min);
                    var pmax = Math.min(priceLimits.max, Number(pair[1]) || priceLimits.max);
                    if (pmin > pmax) { var t = pmin; pmin = pmax; pmax = t; }
                    setPriceRange([pmin, pmax]);
                    emit({ heightMin: heightMin, heightMax: heightMax, priceRange: [pmin, pmax], color: colors });
                  }}
                  isDisabled={disabled}
                  size="sm"
                  range
                />
                <div className="flex justify-between text-xs text-default-400 mt-1">
                  <span>${priceLimits.min}</span>
                  <span>${priceLimits.max}</span>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Filtro de Cores em Popover */}
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button size="sm" variant="bordered" isDisabled={disabled} startContent={<Icon icon="lucide:palette" className="text-default-500" />}>
                {Array.isArray(colors) && colors.length > 0 ? `${colors.length} color${colors.length > 1 ? 's' : ''}` : 'Colors'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3">
              <div className="flex flex-wrap gap-3 items-center">
                {[
                  { key: 'brancoQuente', swatch: '#f4e1a1', label: 'Warm White' },
                  { key: 'brancoPuro', swatch: '#ffffff', label: 'Pure White', bordered: true },
                  { key: 'rgb', gradient: 'linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)', label: 'RGB' },
                  { key: 'vermelho', swatch: '#ef4444', label: 'Red' },
                  { key: 'verde', swatch: '#10b981', label: 'Green' },
                  { key: 'azul', swatch: '#3b82f6', label: 'Blue' },
                ].map(function(c){
                  var isActive = false;
                  for (var i = 0; i < colors.length; i++) {
                    if (colors[i] === c.key) { isActive = true; break; }
                  }
                  return (
                    <Tooltip key={c.key} content={c.label} placement="top" showArrow>
                      <button
                        type="button"
                        onClick={function(){
                          var next = [];
                          if (isActive) {
                            for (var j = 0; j < colors.length; j++) { if (colors[j] !== c.key) next.push(colors[j]); }
                          } else {
                            for (var k = 0; k < colors.length; k++) next.push(colors[k]);
                            next.push(c.key);
                          }
                          console.log('[FILTER UI] Toggle color', c.key, { before: colors, after: next });
                          setColors(next);
                          emit({ heightMin: heightMin, heightMax: heightMax, priceRange: priceRange, color: next });
                        }}
                        className={`w-6 h-6 rounded-full flex-shrink-0 transition-all ${isActive ? 'border-2 border-primary' : 'border border-default-200'}`}
                        style={{ 
                          background: c.gradient || c.swatch,
                          boxShadow: (function(){
                            var shadows = [];
                            if (isActive) {
                              shadows.push('0 0 4px 2px rgba(59, 130, 246, 0.55)');
                              shadows.push('0 0 10px 4px rgba(59, 130, 246, 0.35)');
                              shadows.push('0 0 16px 6px rgba(59, 130, 246, 0.20)');
                            }
                            if (c.bordered) { shadows.push('inset 0 0 0 1px rgba(0,0,0,0.2)'); }
                            return shadows.length > 0 ? shadows.join(', ') : undefined;
                          })()
                        }}
                        aria-label={`Filter color ${c.label}`}
                      />
                    </Tooltip>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Ações */}
        <div className="flex">
          <Button 
            size="sm" 
            variant="flat" 
            isIconOnly
            onPress={function(){ setHeightMin(heightLimits.min); setHeightMax(heightLimits.max); setPriceRange([0,0]); setColors([]); emit({}); }} 
            isDisabled={disabled}
            aria-label="Reset filters"
          >
            <Icon icon="lucide:refresh-ccw" className="text-base" />
          </Button>
        </div>
      </div>

      {/* Height apenas quando não está dentro de categoria (para economizar espaço quando estiver) */}
      {!isInCategory && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">Height</label>
            <div className="text-xs text-default-500">
              {(heightMin || heightLimits.min).toFixed(1)} - {(heightMax || heightLimits.max).toFixed(1)} m
            </div>
          </div>
          <Slider
            className="max-w-md"
            minValue={heightLimits.min}
            maxValue={heightLimits.max}
            step={0.1}
            value={[heightMin || heightLimits.min, heightMax || heightLimits.max]}
            onChange={function(val){
              var pair = Array.isArray(val) ? val : [val, val];
              var min = Math.max(heightLimits.min, Number(pair[0]) || heightLimits.min);
              var max = Math.min(heightLimits.max, Number(pair[1]) || heightLimits.max);
              if (min > max) { var temp = min; min = max; max = temp; }
              setHeightMin(min);
              setHeightMax(max);
              emit({ heightMin: min, heightMax: max, priceRange: priceRange, color: colors });
            }}
            isDisabled={disabled}
            showSteps={false}
            color="primary"
            size="sm"
            range
          />
          <div className="flex justify-between text-xs text-default-400">
            <span>{heightLimits.min.toFixed(1)} m</span>
            <span>{heightLimits.max.toFixed(1)} m</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecorationFiltersCompact;


