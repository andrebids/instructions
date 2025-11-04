import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar snap zones
 * Gerencia criação, remoção, edição e migração de zonas
 * 
 * @param {Object} params
 * @param {Object | null} params.selectedImage - Imagem selecionada atual
 * @param {boolean} params.isDayMode - Se está em modo dia
 * @param {Object} params.formData - Dados do formulário
 * @param {Function} params.onInputChange - Callback para atualizar formData
 * @param {Object} params.analysisComplete - Mapeia quais imagens completaram análise
 * @returns {Object} - Estados e funções de gestão de snap zones
 */
export const useSnapZones = ({ selectedImage, isDayMode, formData, onInputChange, analysisComplete }) => {
  const [snapZonesByImage, setSnapZonesByImage] = useState({}); // Mapeia zonas de snap por imagem
  const [tempZones, setTempZones] = useState([]); // Zonas temporárias sendo criadas no modo edição
  const [isEditingZones, setIsEditingZones] = useState(false); // Modo de edição visual

  // Carregar zonas do formData ao inicializar E quando formData mudar
  useEffect(function() {
    console.log('📦 [DEBUG] Verificando formData para carregar zonas:', {
      temSnapZones: !!formData?.snapZonesByImage,
      snapZonesKeys: formData?.snapZonesByImage ? Object.keys(formData.snapZonesByImage) : [],
      snapZonesValue: formData?.snapZonesByImage,
      estadoAtual: Object.keys(snapZonesByImage),
      formDataId: formData?.id
    });
    
    // Tentar carregar do formData primeiro
    if (formData?.snapZonesByImage && Object.keys(formData.snapZonesByImage).length > 0) {
      // Só atualizar se for diferente do estado atual
      var formDataKeys = Object.keys(formData.snapZonesByImage).sort().join(',');
      var currentKeys = Object.keys(snapZonesByImage).sort().join(',');
      
      if (formDataKeys !== currentKeys || JSON.stringify(formData.snapZonesByImage) !== JSON.stringify(snapZonesByImage)) {
        console.log('📦 [DEBUG] Carregando zonas salvas do formData:', formData.snapZonesByImage);
        setSnapZonesByImage(formData.snapZonesByImage);
      } else {
        console.log('📦 [DEBUG] Zonas já estão carregadas, pulando...');
      }
    } else {
      // Se não há no formData, tentar carregar do localStorage como backup
      // Usar chave temporária baseada na sessão ou projeto
      var storageKey = 'snapZonesByImage_temp';
      if (formData?.id) {
        storageKey = 'snapZonesByImage_' + formData.id;
      }
      
      try {
        var savedZones = localStorage.getItem(storageKey);
        if (savedZones) {
          var parsedZones = JSON.parse(savedZones);
          if (parsedZones && Object.keys(parsedZones).length > 0) {
            console.log('📦 [DEBUG] Carregando zonas do localStorage:', parsedZones);
            setSnapZonesByImage(parsedZones);
            // Atualizar formData também
            onInputChange("snapZonesByImage", parsedZones);
          } else {
            console.log('📦 [DEBUG] Nenhuma zona encontrada no formData nem localStorage');
          }
        } else {
          console.log('📦 [DEBUG] Nenhuma zona encontrada no formData nem localStorage');
        }
      } catch (e) {
        console.log('⚠️ Erro ao carregar do localStorage:', e);
      }
    }
  }, [formData?.snapZonesByImage, formData?.id]); // Executar quando formData.snapZonesByImage ou formData.id mudar

  // Migração: se imageZones é um array (estrutura antiga), converter para nova estrutura
  useEffect(function() {
    if (!selectedImage) return;
    
    var imageZones = snapZonesByImage[selectedImage.id];
    if (Array.isArray(imageZones)) {
      console.log('⚠️ Migrando zonas antigas para nova estrutura:', selectedImage.id);
      setSnapZonesByImage(function(prev) {
        var updated = {};
        var needsUpdate = false;
        
        for (var key in prev) {
          if (Array.isArray(prev[key])) {
            // Migrar para ambos os modos (dia e noite) - manter compatibilidade
            updated[key] = { day: prev[key], night: prev[key] };
            needsUpdate = true;
          } else {
            updated[key] = prev[key];
          }
        }
        
        // Só retornar atualizado se realmente houve mudança
        return needsUpdate ? updated : prev;
      });
    }
  }, [selectedImage?.id]); // Removido snapZonesByImage das dependências para evitar loop

  /**
   * Adicionar zona de snap
   * @param {Object} zone - Zona a adicionar
   */
  const handleAddSnapZone = (zone) => {
    if (!selectedImage) {
      console.log('⚠️ Nenhuma imagem selecionada para adicionar zona');
      return;
    }
    
    var mode = isDayMode ? 'day' : 'night';
    console.log('➕ [DEBUG] Adicionando zona manual:', zone, 'para imagem:', selectedImage.id, 'no modo:', mode);
    
    var imageZones = snapZonesByImage[selectedImage.id] || { day: [], night: [] };
    // Usar zonas do modo atual (dia ou noite)
    var currentZones = imageZones[mode] || [];
    var updatedZones = [...currentZones, zone];
    
    console.log('➕ [DEBUG] Zonas antes:', currentZones.length, '| Zonas depois:', updatedZones.length, '(modo:', mode + ')');
    
    // Salvar apenas no modo atual, mantendo o outro modo intacto
    setSnapZonesByImage(prev => {
      var updated = {};
      for (var key in prev) {
        updated[key] = prev[key];
      }
      // Obter valores atuais da imagem selecionada ou criar estrutura vazia
      var currentDayZones = prev[selectedImage.id]?.day || [];
      var currentNightZones = prev[selectedImage.id]?.night || [];
      
      updated[selectedImage.id] = {
        day: mode === 'day' ? updatedZones : currentDayZones,
        night: mode === 'night' ? updatedZones : currentNightZones
      };
      console.log('➕ [DEBUG] Estado snapZonesByImage atualizado:', {
        imagem: selectedImage.id,
        modo: mode,
        zonasDay: updated[selectedImage.id].day.length,
        zonasNight: updated[selectedImage.id].night.length
      });
      return updated;
    });
    
    console.log('✅ Zona de snap adicionada:', zone.id, 'para imagem:', selectedImage.id, '(modo:', mode + ')');
  };

  /**
   * Remover zona de snap
   * @param {string} zoneId - ID da zona a remover
   */
  const handleRemoveSnapZone = (zoneId) => {
    if (!selectedImage) return;
    
    var mode = isDayMode ? 'day' : 'night';
    console.log('🗑️ [DEBUG] Removendo zona:', zoneId, 'da imagem:', selectedImage.id, 'no modo:', mode);
    
    var imageZones = snapZonesByImage[selectedImage.id] || { day: [], night: [] };
    // Remover apenas do modo atual
    var currentZones = imageZones[mode] || [];
    var updatedZones = currentZones.filter(function(z) {
      return z.id !== zoneId;
    });
    
    // Remover apenas do modo atual, mantendo o outro modo intacto
    setSnapZonesByImage(prev => ({
      ...prev,
      [selectedImage.id]: {
        day: mode === 'day' ? updatedZones : (prev[selectedImage.id]?.day || []),
        night: mode === 'night' ? updatedZones : (prev[selectedImage.id]?.night || [])
      }
    }));
    
    console.log('🗑️ Zona de snap removida:', zoneId, '(modo:', mode + ')');
  };

  /**
   * Salvar zonas temporárias e sair do modo edição
   */
  const handleSaveZones = function() {
    if (!selectedImage) {
      console.log('⚠️ Nenhuma imagem selecionada para salvar zonas');
      return;
    }
    
    if (tempZones.length === 0) {
      console.log('⚠️ Nenhuma zona temporária para salvar');
      return;
    }
    
    var mode = isDayMode ? 'day' : 'night';
    console.log('💾 [DEBUG] Salvando zonas temporárias:', tempZones.length, 'zonas para imagem:', selectedImage.id, 'no modo:', mode);
    
    var imageZones = snapZonesByImage[selectedImage.id] || { day: [], night: [] };
    // Usar zonas existentes do modo atual
    var currentZones = imageZones[mode] || [];
    var updatedZones = [...currentZones, ...tempZones];
    
    console.log('💾 [DEBUG] Zonas antes:', currentZones.length, '| Zonas depois:', updatedZones.length, '(modo:', mode + ')');
    
    // Salvar apenas no modo atual, mantendo o outro modo intacto
    setSnapZonesByImage(function(prev) {
      var updated = {};
      for (var key in prev) {
        updated[key] = prev[key];
      }
      updated[selectedImage.id] = {
        day: mode === 'day' ? updatedZones : (prev[selectedImage.id]?.day || []),
        night: mode === 'night' ? updatedZones : (prev[selectedImage.id]?.night || [])
      };
      console.log('💾 [DEBUG] Estado snapZonesByImage atualizado:', updated);
      return updated;
    });
    
    console.log('✅ Zonas salvas:', updatedZones.length, 'zonas para imagem:', selectedImage.id, '(modo:', mode + ')');
    setTempZones([]);
    setIsEditingZones(false);
  };

  /**
   * Cancelar edição de zonas
   */
  const handleCancelEditZones = function() {
    setTempZones([]);
    setIsEditingZones(false);
    console.log('❌ Edição de zonas cancelada');
  };

  // Obter zonas de snap da imagem atual baseadas no modo atual (dia ou noite)
  var imageZones = selectedImage ? (snapZonesByImage[selectedImage.id] || { day: [], night: [] }) : { day: [], night: [] };
  // Usar zonas do modo atual (dia ou noite), não ambas
  var mode = isDayMode ? 'day' : 'night';
  // Filtrar zonas apenas se análise foi completada
  var rawZones = imageZones[mode] || [];
  var currentSnapZones = (selectedImage && analysisComplete[selectedImage.id]) ? rawZones : [];
  var allZonesForDisplay = isEditingZones ? [...currentSnapZones, ...tempZones] : currentSnapZones;

  // Debug: log detalhado quando imagem é selecionada ou modo muda
  useEffect(function() {
    if (selectedImage) {
      var mode = isDayMode ? 'day' : 'night';
      console.log('🔍 [DEBUG] Imagem selecionada:', selectedImage.id, '| Modo:', mode);
      console.log('🔍 [DEBUG] Estado snapZonesByImage:', snapZonesByImage);
      console.log('🔍 [DEBUG] Zonas para esta imagem:', snapZonesByImage[selectedImage.id]);
      var imageZones = snapZonesByImage[selectedImage.id] || { day: [], night: [] };
      var currentZones = imageZones[mode] || [];
      console.log('🔍 [DEBUG] Zonas finais calculadas (modo', mode + '):', currentZones.length, 'zonas', currentZones);
    }
  }, [selectedImage?.id, snapZonesByImage, isDayMode]);

  return {
    snapZonesByImage,
    setSnapZonesByImage,
    tempZones,
    setTempZones,
    isEditingZones,
    setIsEditingZones,
    handleAddSnapZone,
    handleRemoveSnapZone,
    handleSaveZones,
    handleCancelEditZones,
    currentSnapZones,
    allZonesForDisplay
  };
};

