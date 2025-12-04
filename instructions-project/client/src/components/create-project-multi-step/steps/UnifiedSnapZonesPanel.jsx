import React, { useState } from 'react';
import { Card, Button, Input, CardBody, CardHeader, Chip, Divider } from '@heroui/react';
import { Icon } from '@iconify/react';

export const UnifiedSnapZonesPanel = ({ 
  selectedImage = null,
  zones = [],
  tempZones = [],
  isEditingZones = false,
  isDayMode = true,
  isAnalyzed = false,
  onToggleEditMode = null,
  onSaveZones = null,
  onCancelEdit = null,
  onAddZone = null,
  onRemoveZone = null,
  isVisible = false,
  onToggle = null
}) => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [formData, setFormData] = useState({
    x: '',
    y: '',
    width: '',
    height: '',
    label: ''
  });

  if (!isVisible) {
    return null;
  }

  const handleInputChange = function(field, value) {
    setFormData(function(prev) {
      var updated = {};
      for (var key in prev) {
        updated[key] = prev[key];
      }
      updated[field] = value;
      return updated;
    });
  };

  const handleAddZoneManual = function() {
    var x = parseFloat(formData.x);
    var y = parseFloat(formData.y);
    var width = parseFloat(formData.width);
    var height = parseFloat(formData.height);
    
    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
      alert('Por favor, preencha todos os campos numéricos.');
      return;
    }
    
    if (width <= 0 || height <= 0) {
      alert('Largura e altura devem ser maiores que 0.');
      return;
    }
    
    var newZone = {
      id: 'zone-' + Date.now(),
      x: x,
      y: y,
      width: width,
      height: height,
      label: formData.label || 'Zone ' + (zones.length + 1)
    };
    
    if (onAddZone) {
      onAddZone(newZone);
    }
    
    // Limpar formulário
    setFormData({
      x: '',
      y: '',
      width: '',
      height: '',
      label: ''
    });
  };

  return (
    <Card className="fixed top-4 right-4 w-96 z-[100] shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
      <CardHeader className="flex items-center justify-between pb-2 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">
            {selectedImage ? selectedImage.name : 'Nenhuma imagem selecionada'}
          </h3>
          {selectedImage && (
            <div className="flex items-center gap-2 mt-1">
              <Chip size="sm" color={isDayMode ? 'primary' : 'secondary'} variant="flat">
                {isDayMode ? '🌞 Dia' : '🌙 Noite'}
              </Chip>
              <Chip size="sm" color={isAnalyzed ? 'success' : 'warning'} variant="flat">
                {isAnalyzed ? 'YOLO12 Completo' : 'YOLO12 Pendente'}
              </Chip>
              <span className="text-xs text-default-500">
                {zones.length} zona{zones.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onToggle}
          aria-label="Close panel"
        >
          <Icon icon="lucide:x" />
        </Button>
      </CardHeader>
      
      <CardBody className="gap-4 flex-1 overflow-y-auto">
        {!selectedImage ? (
          <div className="text-center py-8 text-default-500">
            <Icon icon="lucide:image-off" className="text-4xl mb-2" />
            <p className="text-sm">Selecione uma imagem para configurar zonas</p>
          </div>
        ) : (
          <>
            {/* Seção: Modo Edição */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-default-700">Modo Edição Visual</span>
                {isEditingZones && (
                  <Chip size="sm" color="warning" variant="flat">
                    Ativo
                  </Chip>
                )}
              </div>
              <Button
                color={isEditingZones ? 'danger' : 'warning'}
                variant={isEditingZones ? 'flat' : 'solid'}
                size="sm"
                onPress={onToggleEditMode}
                startContent={<Icon icon={isEditingZones ? 'lucide:x' : 'lucide:edit'} />}
                className="w-full"
              >
                {isEditingZones ? 'Sair do Modo Edição' : 'Entrar em Modo Edição'}
              </Button>
              {isEditingZones && (
                <p className="text-xs text-default-500">
                  Arraste no canvas para criar zonas. Zonas temporárias: {tempZones.length}
                </p>
              )}
            </div>

            <Divider />

            {/* Seção: Lista de Zonas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-default-700">
                  Zonas ({zones.length})
                </span>
                <span className="text-xs text-default-500">
                  (compartilhadas dia/noite)
                </span>
              </div>
              
              {zones.length === 0 ? (
                <p className="text-sm text-default-500 text-center py-4">
                  Nenhuma zona definida. Use o modo edição visual ou adicione manualmente.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {zones.map(function(zone) {
                    return (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between p-2 bg-default-100 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {zone.label || 'Sem rótulo'}
                          </div>
                          <div className="text-xs text-default-500">
                            ({Math.round(zone.x)}, {Math.round(zone.y)}) - {Math.round(zone.width)}x{Math.round(zone.height)}
                          </div>
                        </div>
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          aria-label={`Remove zone ${zone.label || zone.id}`}
                          onPress={function() {
                            if (onRemoveZone) {
                              onRemoveZone(zone.id);
                            }
                          }}
          aria-label="Remove zone"
                        >
                          <Icon icon="lucide:trash-2" className="text-sm" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seção: Gravação (apenas modo edição) */}
            {isEditingZones && (
              <>
                <Divider />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-default-700">
                    Zonas Temporárias ({tempZones.length})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      color="success"
                      size="sm"
                      onPress={onSaveZones}
                      startContent={<Icon icon="lucide:save" />}
                      isDisabled={tempZones.length === 0}
                      className="flex-1"
                    >
                      Gravar ({tempZones.length})
                    </Button>
                    <Button
                      color="danger"
                      variant="flat"
                      size="sm"
                      onPress={onCancelEdit}
                      startContent={<Icon icon="lucide:x" />}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Seção: Formulário Manual (expandível) */}
            <Divider />
            <div className="space-y-2">
              <Button
                size="sm"
                variant="light"
                onPress={function() {
                  setShowManualForm(!showManualForm);
                }}
                startContent={<Icon icon={showManualForm ? 'lucide:chevron-up' : 'lucide:chevron-down'} />}
                className="w-full"
              >
                {showManualForm ? 'Ocultar' : 'Mostrar'} Formulário Manual
              </Button>
              
              {showManualForm && (
                <div className="space-y-3 p-3 bg-default-50 rounded-lg">
                  <div className="text-sm font-medium text-default-700">Adicionar Zona Manualmente</div>
                  
                  <Input
                    label="X"
                    type="number"
                    placeholder="0"
                    value={formData.x}
                    onChange={function(e) {
                      handleInputChange('x', e.target.value);
                    }}
                    size="sm"
                  />
                  
                  <Input
                    label="Y"
                    type="number"
                    placeholder="0"
                    value={formData.y}
                    onChange={function(e) {
                      handleInputChange('y', e.target.value);
                    }}
                    size="sm"
                  />
                  
                  <div className="flex gap-2">
                    <Input
                      label="Width"
                      type="number"
                      placeholder="100"
                      value={formData.width}
                      onChange={function(e) {
                        handleInputChange('width', e.target.value);
                      }}
                      size="sm"
                    />
                    
                    <Input
                      label="Height"
                      type="number"
                      placeholder="100"
                      value={formData.height}
                      onChange={function(e) {
                        handleInputChange('height', e.target.value);
                      }}
                      size="sm"
                    />
                  </div>
                  
                  <Input
                    label="Label (opcional)"
                    placeholder="Window 1"
                    value={formData.label}
                    onChange={function(e) {
                      handleInputChange('label', e.target.value);
                    }}
                    size="sm"
                  />
                  
                  <Button
                    color="primary"
                    size="sm"
                    onPress={handleAddZoneManual}
                    className="w-full"
                  >
                    Adicionar Zona
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

