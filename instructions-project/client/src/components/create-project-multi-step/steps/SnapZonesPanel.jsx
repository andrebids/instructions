import React, { useState } from 'react';
import { Card, Button, Input, CardBody, CardHeader } from '@heroui/react';
import { Icon } from '@iconify/react';

export const SnapZonesPanel = ({ 
  zones = [], 
  onAddZone, 
  onRemoveZone, 
  isVisible,
  onToggle 
}) => {
  const [formData, setFormData] = useState({
    x: '',
    y: '',
    width: '',
    height: '',
    label: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddZone = () => {
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

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 shadow-xl">
      <CardHeader className="flex items-center justify-between pb-2">
        <h3 className="text-lg font-semibold">Snap Zones Config</h3>
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
      <CardBody className="gap-4">
        {/* Formulário para adicionar zona */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-default-700">Adicionar Zona</div>
          
          <Input
            label="X"
            type="number"
            placeholder="0"
            value={formData.x}
            onChange={(e) => handleInputChange('x', e.target.value)}
            size="sm"
          />
          
          <Input
            label="Y"
            type="number"
            placeholder="0"
            value={formData.y}
            onChange={(e) => handleInputChange('y', e.target.value)}
            size="sm"
          />
          
          <div className="flex gap-2">
            <Input
              label="Width"
              type="number"
              placeholder="100"
              value={formData.width}
              onChange={(e) => handleInputChange('width', e.target.value)}
              size="sm"
            />
            
            <Input
              label="Height"
              type="number"
              placeholder="100"
              value={formData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              size="sm"
            />
          </div>
          
          <Input
            label="Label (opcional)"
            placeholder="Window 1"
            value={formData.label}
            onChange={(e) => handleInputChange('label', e.target.value)}
            size="sm"
          />
          
          <Button
            color="primary"
            size="sm"
            onPress={handleAddZone}
            className="w-full"
          >
            Adicionar Zona
          </Button>
        </div>
        
        {/* Lista de zonas existentes */}
        <div className="border-t pt-3">
          <div className="text-sm font-medium text-default-700 mb-2">
            Zonas ({zones.length})
          </div>
          
          {zones.length === 0 ? (
            <p className="text-sm text-default-500 text-center py-4">
              Nenhuma zona definida
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {zones.map(function(zone) {
                return (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-2 bg-default-100 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {zone.label}
                      </div>
                      <div className="text-xs text-default-500">
                        ({zone.x}, {zone.y}) - {zone.width}x{zone.height}
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
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
      </CardBody>
    </Card>
  );
};

