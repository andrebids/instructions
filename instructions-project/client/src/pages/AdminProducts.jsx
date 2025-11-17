import React from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Chip,
  Image,
  Checkbox,
  Textarea,
  useDisclosure,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { productsAPI } from "../services/api";
import { PageTitle } from "../components/layout/page-title";
import { useUser } from "../context/UserContext";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import {
  compareProductsByTagHierarchy,
  getProductHierarchyIndex,
  getNormalizedProductTags,
  normalizeTag,
} from "../utils/tagHierarchy";

export default function AdminProducts() {
  var { userName } = useUser();
  var [products, setProducts] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [error, setError] = React.useState(null);
  var [filters, setFilters] = React.useState({});
  var [showArchived, setShowArchived] = React.useState(false);
  var [searchQuery, setSearchQuery] = React.useState("");
  var [availableColorsList, setAvailableColorsList] = React.useState({});
  
  // Função para inicializar anos automaticamente (ano atual até 2020)
  var initializeYears = function() {
    var currentYear = new Date().getFullYear();
    var years = [];
    // Criar lista de anos do ano atual até 2020
    for (var year = currentYear; year >= 2020; year--) {
      years.push(year);
    }
    return years;
  };
  
  var [availableYears, setAvailableYears] = React.useState(initializeYears());
  var { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  var [editingProduct, setEditingProduct] = React.useState(null);
  const { isHandheld } = useResponsiveProfile();
  
  // Função helper para filtrar valores válidos de printColor
  var getValidPrintColors = function(printColor) {
    var validColors = ["WHITE", "DARK BLUE", "ICE BLUE", "GREY", "YELLOW", "BLACK", "GOLD", "ORANGE", "PINK", "RED", "LIGHT GREEN", "DARK GREEN", "PASTEL GREEN", "PURPLE"];
    if (!printColor) {
      return new Set();
    }
    var selectedColors = Array.isArray(printColor) ? printColor : [printColor];
    var validSelectedColors = selectedColors.filter(function(color) {
      if (!color || typeof color !== 'string') {
        return false;
      }
      // Verificar se o valor está na lista de cores válidas (case sensitive)
      var isValid = validColors.includes(color);
      if (!isValid && color.trim() !== '') {
        // Log apenas se for um valor inválido e não vazio
        console.warn("⚠️ [PRINT COLOR] Valor inválido filtrado:", color);
      }
      return isValid;
    });
    return new Set(validSelectedColors);
  };
  
  // Função helper para filtrar valores válidos de effects (LED)
  var getValidLEDEffects = function(effects) {
    var validEffects = ["LED AMBER", "LED WARM WHITE", "LED WARM WHITE + WARM WHITE FLASH", "LED WARM WHITE + PURE WHITE FLASH", "LED WARM WHITE + PURE WHITE SLOW FLASH", "LED PURE WHITE", "LED PURE WHITE + PURE WHITE FLASH", "LED PURE WHITE + WARM WHITE SLOW FLASH", "LED PURE WHITE + PURE WHITE SLOW FLASH", "LED BLUE", "LED BLUE + PURE WHITE FLASH", "LED BLUE + PURE WHITE SLOW FLASH", "LED PINK", "LED PINK + PURE WHITE FLASH", "LED RED", "LED RED + PURE WHITE FLASH", "LED RED + PURE WHITE SLOW FLASH", "LED GREEN", "LED GREEN + PURE WHITE FLASH", "RGB"];
    if (!effects) {
      return new Set();
    }
    var selectedEffects = Array.isArray(effects) ? effects : [effects];
    var validSelectedEffects = selectedEffects.filter(function(effect) {
      if (!effect || typeof effect !== 'string') {
        return false;
      }
      var isValid = validEffects.includes(effect);
      if (!isValid && effect.trim() !== '') {
        console.warn("⚠️ [LED EFFECTS] Valor inválido filtrado:", effect);
      }
      return isValid;
    });
    return new Set(validSelectedEffects);
  };
  
  // Função helper para filtrar valores válidos de sparkles (ANIMATED SPARKLES)
  var getValidSparkles = function(sparkles) {
    var validSparkles = ["WARM WHITE", "WARM WHITE/PURE WHITE", "PURE WHITE", "RGB"];
    if (!sparkles) {
      return new Set();
    }
    var selectedSparkles = Array.isArray(sparkles) ? sparkles : [sparkles];
    var validSelectedSparkles = selectedSparkles.filter(function(sparkle) {
      if (!sparkle || typeof sparkle !== 'string') {
        return false;
      }
      var isValid = validSparkles.includes(sparkle);
      if (!isValid && sparkle.trim() !== '') {
        console.warn("⚠️ [SPARKLES] Valor inválido filtrado:", sparkle);
      }
      return isValid;
    });
    return new Set(validSelectedSparkles);
  };
  
  // Função helper para filtrar valores válidos de aluminium (mesmas cores do Print Color)
  var getValidAluminiumColors = function(aluminium) {
    var validColors = ["WHITE", "DARK BLUE", "ICE BLUE", "GREY", "YELLOW", "BLACK", "GOLD", "ORANGE", "PINK", "RED", "LIGHT GREEN", "DARK GREEN", "PASTEL GREEN", "PURPLE"];
    if (!aluminium) {
      return new Set();
    }
    var selectedColors = Array.isArray(aluminium) ? aluminium : [aluminium];
    var validSelectedColors = selectedColors.filter(function(color) {
      if (!color || typeof color !== 'string') {
        return false;
      }
      var isValid = validColors.includes(color);
      if (!isValid && color.trim() !== '') {
        console.warn("⚠️ [ALUMINIUM] Valor inválido filtrado:", color);
      }
      return isValid;
    });
    return new Set(validSelectedColors);
  };
  
  // Função helper para filtrar valores válidos de SOFT XLED
  var getValidSoftXLED = function(softXLED) {
    var validOptions = ["PURE WHITE"];
    if (!softXLED) {
      return new Set();
    }
    var selectedOptions = Array.isArray(softXLED) ? softXLED : [softXLED];
    var validSelectedOptions = selectedOptions.filter(function(option) {
      if (!option || typeof option !== 'string') {
        return false;
      }
      var isValid = validOptions.includes(option);
      if (!isValid && option.trim() !== '') {
        console.warn("⚠️ [SOFT XLED] Valor inválido filtrado:", option);
      }
      return isValid;
    });
    return new Set(validSelectedOptions);
  };
  
  
  // Mapeamento de cores para valores hexadecimais (versão escura com tom suave)
  var getPrintColorStyle = function(colorName, isSelected) {
    var colorMap = {
      "WHITE": { bg: "#8C8780", text: "#FFF9E6" },
      "DARK BLUE": { bg: "#2C4466", text: "#6BAAFF" },
      "ICE BLUE": { bg: "#3A5F6F", text: "#87E5FF" },
      "GREY": { bg: "#5A5A5A", text: "#E6E6E6" },
      "YELLOW": { bg: "#8C7A3C", text: "#FFE44D" },
      "BLACK": { bg: "#4A4A4A", text: "#D0D0D0" },
      "GOLD": { bg: "#8C7A3C", text: "#FFD700" },
      "ORANGE": { bg: "#8C5C3C", text: "#FF9554" },
      "PINK": { bg: "#8C5C6E", text: "#FFB5DA" },
      "RED": { bg: "#8C3C3C", text: "#FF6B6B" },
      "LIGHT GREEN": { bg: "#5C7A5A", text: "#8FFF8F" },
      "DARK GREEN": { bg: "#4A6642", text: "#6BFF6B" },
      "PASTEL GREEN": { bg: "#6A8C6A", text: "#A8FFA8" },
      "PURPLE": { bg: "#6A5C8C", text: "#C47FFF" },
    };
    // Só aplicar cor se estiver selecionado
    if (!isSelected) return {};
    var colorData = colorMap[colorName] || { bg: "#8C8780", text: "#E0A830" };
    return {
      backgroundColor: colorData.bg,
      color: colorData.text,
    };
  };
  var [formData, setFormData] = React.useState({
    name: "",
    stock: "",
    usedStock: "",
    prices: {
      new: {
        price: "",
        oldPrice: "",
        rentalPrice: "",
      },
      used: {
        price: "",
        rentalPrice: "",
      },
    },
    type: "",
    location: "",
    mount: "",
    tags: [],
    isActive: true,
    specs: {
      descricao: "",
      tecnicas: "",
      weight: "",
      effects: "",
      materiais: "",
      stockPolicy: "",
      printType: "",
      printColor: "",
      aluminium: "",
      softXLED: "",
      sparkle: "",
      sparkles: "",
    },
    availableColors: {},
    videoFile: "",
    releaseYear: "",
    season: "",
  });
  
  var [imageFiles, setImageFiles] = React.useState({
    dayImage: null,
    nightImage: null,
    animation: null,
    animationSimulation: null,
  });
  
  var [imagePreviews, setImagePreviews] = React.useState({
    dayImage: null,
    nightImage: null,
    animation: null,
    animationSimulation: null,
  });
  
  // Referências para inputs de ficheiro escondidos
  var dayImageInputRef = React.useRef(null);
  var nightImageInputRef = React.useRef(null);
  var animationInputRef = React.useRef(null);
  var animationSimulationInputRef = React.useRef(null);

  // Carregar produtos
  var loadProducts = React.useCallback(function() {
    console.log('🔄 [AdminProducts] loadProducts chamado');
    console.log('🔄 [AdminProducts] Filtros originais:', filters);
    
    // Remover filtros vazios antes de enviar
    var cleanedFilters = {};
    for (var key in filters) {
      if (filters.hasOwnProperty(key)) {
        var value = filters[key];
        // Apenas adicionar se não for string vazia, null ou undefined
        if (value !== '' && value !== null && value !== undefined) {
          cleanedFilters[key] = value;
        }
      }
    }
    
    // Adicionar filtro de arquivados
    if (showArchived) {
      cleanedFilters.showArchived = 'true';
    }
    
    console.log('🔄 [AdminProducts] Filtros limpos:', cleanedFilters);
    setLoading(true);
    setError(null);
    
    console.log('🔄 [AdminProducts] Chamando productsAPI.getAll com filtros limpos:', cleanedFilters);
    productsAPI.getAll(cleanedFilters)
      .then(function(data) {
        console.log('✅ [AdminProducts] Produtos recebidos da API:', data.length);
        console.log('✅ [AdminProducts] Primeiros produtos:', data.slice(0, 3));
        setProducts(data);
        
        // Atualizar lista de anos disponíveis com anos dos produtos e ano atual
        var currentYear = new Date().getFullYear();
        var yearsSet = {};
        
        // Adicionar anos do ano atual até 2020
        for (var year = currentYear; year >= 2020; year--) {
          yearsSet[year] = true;
        }
        
        // Adicionar anos dos produtos (mesmo que estejam fora do range padrão)
        for (var i = 0; i < data.length; i++) {
          var productYear = data[i].releaseYear;
          if (productYear) {
            // Garantir que é um número (pode vir como number ou string)
            var yearValue = typeof productYear === 'number' ? productYear : parseInt(productYear, 10);
            if (!isNaN(yearValue)) {
              yearsSet[yearValue] = true;
            }
          }
        }
        
        // Criar array de anos ordenado decrescente
        var updatedYears = [];
        var allYears = [];
        for (var key in yearsSet) {
          if (yearsSet.hasOwnProperty(key)) {
            allYears.push(parseInt(key, 10));
          }
        }
        
        // Ordenar decrescente
        for (var j = 0; j < allYears.length; j++) {
          for (var k = j + 1; k < allYears.length; k++) {
            if (allYears[j] < allYears[k]) {
              var temp = allYears[j];
              allYears[j] = allYears[k];
              allYears[k] = temp;
            }
          }
        }
        
        setAvailableYears(allYears);
        setLoading(false);
      })
      .catch(function(err) {
        console.error("❌ [AdminProducts] Erro ao carregar produtos:", err);
        console.error("❌ [AdminProducts] Erro completo:", JSON.stringify(err, null, 2));
        console.error("❌ [AdminProducts] Mensagem:", err.message);
        console.error("❌ [AdminProducts] Response:", err.response);
        setError(err.message || "Error loading products");
        setLoading(false);
      });
  }, [filters, showArchived]);

  React.useEffect(function() {
    console.log('🔄 [AdminProducts] useEffect inicial - carregando produtos');
    loadProducts();
  }, [loadProducts]);
  
  React.useEffect(function() {
    console.log('🔄 [AdminProducts] Estado atualizado:', {
      loading: loading,
      error: error,
      productsCount: products.length,
      filters: filters
    });
  }, [loading, error, products, filters]);

  // Pesquisar produtos
  var handleSearch = React.useCallback(function() {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }
    
    setLoading(true);
    productsAPI.search(searchQuery)
      .then(function(data) {
        setProducts(data);
        setLoading(false);
      })
      .catch(function(err) {
        console.error("Erro ao pesquisar produtos:", err);
        setError(err.message || "Error searching products");
        setLoading(false);
      });
  }, [searchQuery, loadProducts]);

  // Carregar cores disponíveis
  var loadAvailableColors = React.useCallback(function() {
    productsAPI.getAvailableColors()
      .then(function(colors) {
        // Cores padrão do shop/trending na ordem correta
        var defaultColorsOrder = [
          'brancoQuente',
          'brancoPuro',
          'rgb',
          'vermelho',
          'verde',
          'azul'
        ];
        
        var defaultColors = {
          brancoQuente: "#f4e1a1",
          brancoPuro: "#ffffff",
          rgb: "linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
          vermelho: "#ef4444",
          verde: "#10b981",
          azul: "#3b82f6"
        };
        
        // Combinar cores padrão com cores da base de dados (cores da BD têm prioridade)
        var mergedColors = Object.assign({}, defaultColors, colors || {});
        
        // Criar objeto ordenado mantendo ordem padrão primeiro, depois outras cores
        var orderedColors = {};
        for (var i = 0; i < defaultColorsOrder.length; i++) {
          var colorKey = defaultColorsOrder[i];
          if (mergedColors.hasOwnProperty(colorKey)) {
            orderedColors[colorKey] = mergedColors[colorKey];
          }
        }
        // Adicionar outras cores que não estão na lista padrão
        for (var key in mergedColors) {
          if (mergedColors.hasOwnProperty(key) && !orderedColors.hasOwnProperty(key)) {
            orderedColors[key] = mergedColors[key];
          }
        }
        
        setAvailableColorsList(orderedColors);
      })
      .catch(function(err) {
        console.error("Erro ao carregar cores disponíveis:", err);
        // Mesmo em caso de erro, usar cores padrão
        setAvailableColorsList({
          brancoQuente: "#f4e1a1",
          brancoPuro: "#ffffff",
          rgb: "linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
          vermelho: "#ef4444",
          verde: "#10b981",
          azul: "#3b82f6"
        });
      });
  }, []);

  // Função helper para obter cor hex baseada no nome da cor
  var getColorHex = function(colorName) {
    if (!colorName) return '#cccccc';
    var nameLower = colorName.toLowerCase();
    if (nameLower.indexOf('brancopuro') >= 0 || nameLower === 'brancopuro') {
      return '#ffffff';
    }
    if (nameLower.indexOf('brancoquente') >= 0 || nameLower.indexOf('quente') >= 0 || nameLower === 'brancoquente') {
      return '#f4e1a1';
    }
    if (nameLower.indexOf('vermelho') >= 0) {
      return '#ef4444';
    }
    if (nameLower.indexOf('azul') >= 0) {
      return '#3b82f6';
    }
    if (nameLower.indexOf('verde') >= 0) {
      return '#10b981';
    }
    if (nameLower.indexOf('rgb') >= 0) {
      return '#ef4444'; // Gradiente RGB, usar vermelho como representação
    }
    return '#cccccc';
  };

  // Abrir modal para criar novo produto
  var handleCreateNew = function() {
    setEditingProduct(null);
    setFormData({
      name: "",
      stock: "",
      usedStock: "",
      prices: {
        new: {
          price: "",
          oldPrice: "",
          rentalPrice: "",
        },
        used: {
          price: "",
          rentalPrice: "",
        },
      },
      type: "",
      usage: "",
      location: "",
      mount: "",
      tags: [],
      isActive: true,
      specs: {
        descricao: "",
        tecnicas: "",
        dimensoes: "",
        weight: "",
        effects: "",
        materiais: "",
        stockPolicy: "",
        printType: "",
        printColor: "",
        aluminium: "",
        softXLED: "",
        sparkle: "",
        sparkles: "",
      },
      availableColors: {},
      videoFile: "",
      releaseYear: "",
      season: "",
      height: "",
      width: "",
      depth: "",
      diameter: "",
    });
    setImageFiles({
      dayImage: null,
      nightImage: null,
      animation: null,
      animationSimulation: null,
    });
    setImagePreviews({
      dayImage: null,
      nightImage: null,
      animation: null,
      animationSimulation: null,
    });
    loadAvailableColors();
    onModalOpen();
  };

  // Abrir modal para editar produto
  var handleEdit = function(product) {
    setEditingProduct(product);
    
    // Verificar se o ano do produto está na lista disponível e adicionar se necessário
    var productYear = product.releaseYear;
    var releaseYearStr = "";
    var updatedYears = availableYears.slice();
    
    if (productYear !== null && productYear !== undefined && productYear !== "") {
      // Garantir que é um número (pode vir como number ou string)
      var yearValue = typeof productYear === 'number' ? productYear : parseInt(productYear, 10);
      if (!isNaN(yearValue)) {
        releaseYearStr = String(yearValue);
        var yearExists = false;
        for (var i = 0; i < availableYears.length; i++) {
          if (availableYears[i] === yearValue) {
            yearExists = true;
            break;
          }
        }
        
        if (!yearExists) {
          updatedYears.push(yearValue);
          updatedYears.sort(function(a, b) {
            return b - a;
          });
        }
      }
    }
    
    // Atualizar anos disponíveis ANTES de abrir o modal
    setAvailableYears(updatedYears);
    
    // Filtrar printColor para remover valores inválidos
    var productSpecs = product.specs || {};
    var filteredPrintColor = null;
    if (productSpecs.printColor) {
      var validSet = getValidPrintColors(productSpecs.printColor);
      var validColors = Array.from(validSet);
      filteredPrintColor = validColors.length > 0 ? (validColors.length === 1 ? validColors[0] : validColors) : null;
    }
    
    // Filtrar effects (LED) para remover valores inválidos
    var filteredEffects = null;
    if (productSpecs.effects) {
      var validSet = getValidLEDEffects(productSpecs.effects);
      var validEffects = Array.from(validSet);
      filteredEffects = validEffects.length > 0 ? (validEffects.length === 1 ? validEffects[0] : validEffects) : null;
    }
    
    // Filtrar aluminium para remover valores inválidos
    var filteredAluminium = null;
    if (productSpecs.aluminium) {
      var validSet = getValidAluminiumColors(productSpecs.aluminium);
      var validColors = Array.from(validSet);
      filteredAluminium = validColors.length > 0 ? (validColors.length === 1 ? validColors[0] : validColors) : null;
    }
    
    // Filtrar SOFT XLED para remover valores inválidos
    var filteredSoftXLED = null;
    if (productSpecs.softXLED) {
      var validSet = getValidSoftXLED(productSpecs.softXLED);
      var validOptions = Array.from(validSet);
      filteredSoftXLED = validOptions.length > 0 ? (validOptions.length === 1 ? validOptions[0] : validOptions) : null;
    }
    
    // Filtrar sparkles (ANIMATED SPARKLES) para remover valores inválidos
    var filteredSparkles = null;
    if (productSpecs.sparkles) {
      var validSet = getValidSparkles(productSpecs.sparkles);
      var validSparkles = Array.from(validSet);
      filteredSparkles = validSparkles.length > 0 ? (validSparkles.length === 1 ? validSparkles[0] : validSparkles) : null;
    }
    
    // Sincronizar materiais: garantir que effects e sparkles estejam no campo materiais
    var syncedMateriais = productSpecs.materiais || "";
    if (filteredEffects) {
      var effectsArray = Array.isArray(filteredEffects) ? filteredEffects : [filteredEffects];
      effectsArray.forEach(function(effect) {
        if (effect && syncedMateriais.indexOf(effect) === -1) {
          syncedMateriais = syncedMateriais.trim();
          if (syncedMateriais) {
            syncedMateriais += ", " + effect;
          } else {
            syncedMateriais = effect;
          }
        }
      });
    }
    if (filteredSparkles) {
      var sparklesArray = Array.isArray(filteredSparkles) ? filteredSparkles : [filteredSparkles];
      var validSparklesList = ["WARM WHITE", "WARM WHITE/PURE WHITE", "PURE WHITE", "RGB"];
      sparklesArray.forEach(function(sparkle) {
        if (sparkle && validSparklesList.includes(sparkle)) {
          var pattern = "ANIMATED SPARKLES " + sparkle;
          if (syncedMateriais.indexOf(pattern) === -1) {
            syncedMateriais = syncedMateriais.trim();
            if (syncedMateriais) {
              syncedMateriais += ", " + pattern;
            } else {
              syncedMateriais = pattern;
            }
          }
        }
      });
    }
    
    // Extrair preços: price e oldPrice são para produtos novos
    // usedPrice, usedStock e rental prices podem estar em specs
    var usedPrice = productSpecs.usedPrice || "";
    var usedStock = productSpecs.usedStock || "";
    var newRentalPrice = productSpecs.newRentalPrice || "";
    var usedRentalPrice = productSpecs.usedRentalPrice || "";
    
    // Criar specs sem campos de preços usados e rental (para não duplicar, já que estão em prices)
    var specsWithoutUsed = Object.assign({}, productSpecs);
    delete specsWithoutUsed.usedPrice;
    delete specsWithoutUsed.usedStock;
    delete specsWithoutUsed.newRentalPrice;
    delete specsWithoutUsed.usedRentalPrice;
    
    setFormData({
      name: product.name || "",
      stock: product.stock || "",
      usedStock: usedStock,
      prices: {
        new: {
          price: product.price || "",
          oldPrice: product.oldPrice || "",
          rentalPrice: newRentalPrice,
        },
        used: {
          price: usedPrice,
          rentalPrice: usedRentalPrice,
        },
      },
      type: product.type || "",
      location: product.location || "",
      mount: product.mount || "",
      tags: (function() {
        // Normalizar tags: converter para lowercase e mapear variações
        var productTags = product.tags || [];
        var normalizedTags = [];
        var tagMap = {
          "sale": "sale",
          "priority": "priority",
          "priori": "priority",
          "new": "new",
          "trending": "trending",
          "summer": "summer",
          "christmas": "christmas",
          "xmas": "christmas"
        };
        
        for (var i = 0; i < productTags.length; i++) {
          var tag = String(productTags[i]).toLowerCase().trim();
          // Verificar se é uma tag conhecida
          if (tagMap[tag]) {
            normalizedTags.push(tagMap[tag]);
          } else if (tag === "sale" || tag.indexOf("sale") >= 0) {
            normalizedTags.push("sale");
          } else if (tag === "priority" || tag.indexOf("priority") >= 0 || tag.indexOf("priori") >= 0) {
            normalizedTags.push("priority");
          } else if (tag === "new") {
            normalizedTags.push("new");
          } else if (tag === "trending" || tag.indexOf("trending") >= 0) {
            normalizedTags.push("trending");
          } else if (tag === "summer" || tag.indexOf("summer") >= 0) {
            normalizedTags.push("summer");
          } else if (tag === "christmas" || tag.indexOf("christmas") >= 0 || tag.indexOf("xmas") >= 0) {
            normalizedTags.push("christmas");
          } else {
            // Manter outras tags que não são as principais
            normalizedTags.push(tag);
          }
        }
        
        // Remover duplicados
        return Array.from(new Set(normalizedTags));
      })(),
      isActive: product.isActive !== false,
      specs: Object.assign({}, specsWithoutUsed, {
        printColor: filteredPrintColor !== null ? filteredPrintColor : "",
        effects: filteredEffects !== null ? filteredEffects : null,
        aluminium: filteredAluminium !== null ? filteredAluminium : null,
        softXLED: filteredSoftXLED !== null ? filteredSoftXLED : null,
        sparkles: filteredSparkles !== null ? filteredSparkles : null,
        materiais: syncedMateriais,
      }),
      availableColors: product.availableColors || {},
      videoFile: product.videoFile || "",
      releaseYear: releaseYearStr,
      season: product.season || "",
      height: product.height || "",
      width: product.width || "",
      depth: product.depth || "",
      diameter: product.diameter || "",
    });
    setImagePreviews({
      dayImage: product.imagesDayUrl || null,
      nightImage: product.imagesNightUrl || null,
      animation: product.animationUrl || null,
      animationSimulation: product.animationSimulationUrl || null,
    });
    setImageFiles({
      dayImage: null,
      nightImage: null,
      animation: null,
      animationSimulation: null,
    });
    loadAvailableColors();
    onModalOpen();
  };

  // Arquivar produto
  var handleArchive = function(productId) {
    if (!window.confirm("Are you sure you want to archive this product? It will not be visible.")) {
      return;
    }
    
    productsAPI.archive(productId)
      .then(function() {
        loadProducts();
      })
      .catch(function(err) {
        console.error("Error archiving product:", err);
        alert("Error archiving product: " + (err.message || "Unknown error"));
      });
  };
  
  // Desarquivar produto
  var handleUnarchive = function(productId) {
    productsAPI.unarchive(productId)
      .then(function() {
        loadProducts();
      })
      .catch(function(err) {
        console.error("Error unarchiving product:", err);
        alert("Error unarchiving product: " + (err.message || "Unknown error"));
      });
  };
  
  // Deletar produto permanentemente (hard delete)
  var handleDelete = function(productId) {
    if (!window.confirm("⚠️ WARNING: This action is PERMANENT and cannot be undone!\n\nAre you sure you want to PERMANENTLY DELETE this product from the database?")) {
      return;
    }
    
    productsAPI.delete(productId)
      .then(function() {
        loadProducts();
      })
      .catch(function(err) {
        console.error("Error deleting product:", err);
        alert("Error deleting product: " + (err.message || "Unknown error"));
      });
  };

  // Handler para upload de imagens
  var handleImageChange = function(field, file) {
    if (!file) {
      console.warn('⚠️ [AdminProducts] handleImageChange: arquivo não fornecido para', field);
      return;
    }
    
    console.log('📸 [AdminProducts] handleImageChange:', field, file.name, file.type, file.size);
    
    var reader = new FileReader();
    reader.onerror = function(error) {
      console.error('❌ [AdminProducts] Erro ao ler arquivo:', error);
    };
    reader.onload = function(e) {
      var newPreviews = Object.assign({}, imagePreviews);
      newPreviews[field] = e.target.result;
      setImagePreviews(newPreviews);
      console.log('✅ [AdminProducts] Preview atualizado para', field);
    };
    reader.readAsDataURL(file);
    
    var newFiles = Object.assign({}, imageFiles);
    newFiles[field] = file;
    setImageFiles(newFiles);
    console.log('✅ [AdminProducts] Arquivo adicionado ao estado:', field, file.name);
  };

  // Handler para adicionar cor (selecionar de cores disponíveis)
  var handleAddColor = function(colorName) {
    if (!availableColorsList.hasOwnProperty(colorName)) {
      return;
    }
    var newColors = Object.assign({}, formData.availableColors);
    newColors[colorName] = availableColorsList[colorName];
    setFormData(function(prev) {
      return Object.assign({}, prev, { availableColors: newColors });
    });
  };
  
  // Handler para remover cor
  var handleRemoveColor = function(colorName) {
    var newColors = Object.assign({}, formData.availableColors);
    delete newColors[colorName];
    setFormData(function(prev) {
      return Object.assign({}, prev, { availableColors: newColors });
    });
  };

  // Submeter formulário
  var handleSubmit = function() {
    // Validar campos obrigatórios
    if (!formData.name || formData.name.trim() === '') {
      setError("The 'Name' field is required");
      return;
    }
    
    // Função auxiliar para converter strings vazias ou "null" para null
    var toNullIfEmpty = function(value) {
      if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
        return null;
      }
      return value;
    };
    
    // Processar tags e adicionar/remover tag "sale" automaticamente baseado em oldPrice (apenas para produtos novos)
    var finalTags = formData.tags || [];
    var newPrice = formData.prices.new.price || "";
    var newOldPrice = formData.prices.new.oldPrice || "";
    var hasOldPrice = newOldPrice && parseFloat(newOldPrice) > 0;
    var hasPrice = newPrice && parseFloat(newPrice) > 0;
    var isOnSale = hasOldPrice && hasPrice && parseFloat(newOldPrice) > parseFloat(newPrice);
    
    // Normalizar tags existentes para IDs padrão
    var normalizedFinalTags = [];
    for (var i = 0; i < finalTags.length; i++) {
      var tag = String(finalTags[i]).toLowerCase().trim();
      if (tag === "sale" || tag.indexOf("sale") >= 0) {
        if (normalizedFinalTags.indexOf("sale") === -1) normalizedFinalTags.push("sale");
      } else if (tag === "priority" || tag.indexOf("priority") >= 0 || tag.indexOf("priori") >= 0) {
        if (normalizedFinalTags.indexOf("priority") === -1) normalizedFinalTags.push("priority");
      } else if (tag === "new") {
        if (normalizedFinalTags.indexOf("new") === -1) normalizedFinalTags.push("new");
      } else if (tag === "trending" || tag.indexOf("trending") >= 0) {
        if (normalizedFinalTags.indexOf("trending") === -1) normalizedFinalTags.push("trending");
      } else if (tag === "summer" || tag.indexOf("summer") >= 0) {
        if (normalizedFinalTags.indexOf("summer") === -1) normalizedFinalTags.push("summer");
      } else if (tag === "christmas" || tag.indexOf("christmas") >= 0 || tag.indexOf("xmas") >= 0) {
        if (normalizedFinalTags.indexOf("christmas") === -1) normalizedFinalTags.push("christmas");
      } else {
        // Manter outras tags que não são as principais
        if (normalizedFinalTags.indexOf(tag) === -1) normalizedFinalTags.push(tag);
      }
    }
    finalTags = normalizedFinalTags;
    
    // Verificar se tag "sale" já existe
    var hasSaleTag = finalTags.indexOf("sale") !== -1;
    
    // Adicionar tag "sale" se houver desconto, remover se não houver
    if (isOnSale && !hasSaleTag) {
      finalTags.push("sale");
    } else if (!isOnSale && hasSaleTag) {
      // Remover tag "sale"
      var newTags = [];
      for (var j = 0; j < finalTags.length; j++) {
        if (finalTags[j] !== "sale") {
          newTags.push(finalTags[j]);
        }
      }
      finalTags = newTags;
    }
    
    // Filtrar specs para remover campos vazios
    var cleanedSpecs = {};
    if (formData.specs) {
      Object.keys(formData.specs).forEach(function(key) {
        var value = formData.specs[key];
        // Manter apenas valores não vazios
        // Para strings, verificar se não está vazia após trim
        if (typeof value === 'string') {
          if (value.trim() !== '') {
            cleanedSpecs[key] = value;
          }
        } else if (value !== "" && value !== null && value !== undefined) {
          // Para arrays, verificar se não estão vazios
          if (Array.isArray(value)) {
            if (value.length > 0) {
              cleanedSpecs[key] = value;
            }
          } else {
            cleanedSpecs[key] = value;
          }
        }
      });
    }
    
    // Debug: verificar specs antes de enviar
    console.log('📦 [AdminProducts] Specs limpos a enviar:', JSON.stringify(cleanedSpecs, null, 2));
    if (cleanedSpecs.materiais !== undefined) {
      console.log('📦 [AdminProducts] Materiais a enviar:', cleanedSpecs.materiais);
    }
    if (cleanedSpecs.softXLED !== undefined) {
      console.log('📦 [AdminProducts] SOFT XLED a enviar:', cleanedSpecs.softXLED);
    }
    if (cleanedSpecs.sparkles !== undefined) {
      console.log('📦 [AdminProducts] Sparkles a enviar:', cleanedSpecs.sparkles);
    }
    if (cleanedSpecs.effects !== undefined) {
      console.log('📦 [AdminProducts] Effects a enviar:', cleanedSpecs.effects);
    }
    if (cleanedSpecs.printType !== undefined) {
      console.log('📦 [AdminProducts] Print Type a enviar:', cleanedSpecs.printType);
    }
    
    // Criar objeto com os dados (productsAPI.create cria o FormData internamente)
    // Preços novos: usar price e oldPrice
    // Preço usado, stock usado e rental prices: armazenar em specs
    var newPriceValue = formData.prices.new.price || "";
    var newOldPriceValue = formData.prices.new.oldPrice || "";
    var usedPriceValue = formData.prices.used.price || "";
    var usedStockValue = formData.usedStock || "";
    var newRentalPriceValue = formData.prices.new.rentalPrice || "";
    var usedRentalPriceValue = formData.prices.used.rentalPrice || "";
    
    // Adicionar campos aos specs apenas se existirem valores
    // Se não existirem, garantir que sejam removidos (não incluir no cleanedSpecs)
    if (usedPriceValue && usedPriceValue.trim() !== "") {
      cleanedSpecs.usedPrice = usedPriceValue;
    } else {
      delete cleanedSpecs.usedPrice;
    }
    
    if (usedStockValue && usedStockValue.trim() !== "") {
      cleanedSpecs.usedStock = usedStockValue;
    } else {
      delete cleanedSpecs.usedStock;
    }
    
    if (newRentalPriceValue && newRentalPriceValue.trim() !== "") {
      cleanedSpecs.newRentalPrice = newRentalPriceValue;
    } else {
      delete cleanedSpecs.newRentalPrice;
    }
    
    if (usedRentalPriceValue && usedRentalPriceValue.trim() !== "") {
      cleanedSpecs.usedRentalPrice = usedRentalPriceValue;
    } else {
      delete cleanedSpecs.usedRentalPrice;
    }
    
    var data = {
      name: formData.name,
      price: newPriceValue || 0,
      stock: formData.stock || 0,
      oldPrice: toNullIfEmpty(newOldPriceValue),
      type: toNullIfEmpty(formData.type),
      location: toNullIfEmpty(formData.location),
      mount: toNullIfEmpty(formData.mount),
      videoFile: toNullIfEmpty(formData.videoFile),
      tags: finalTags,
      specs: Object.keys(cleanedSpecs).length > 0 ? cleanedSpecs : null,
      availableColors: formData.availableColors || {},
      variantProductByColor: formData.variantProductByColor || null,
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      season: toNullIfEmpty(formData.season),
      isTrending: formData.isTrending || false,
      releaseYear: formData.releaseYear ? parseInt(formData.releaseYear, 10) : null,
      isOnSale: isOnSale,
      height: formData.height ? parseFloat(formData.height) : null,
      width: formData.width ? parseFloat(formData.width) : null,
      depth: formData.depth ? parseFloat(formData.depth) : null,
      diameter: formData.diameter ? parseFloat(formData.diameter) : null,
    };
    
    // Adicionar ficheiros se existirem
    if (imageFiles.dayImage) data.dayImage = imageFiles.dayImage;
    if (imageFiles.nightImage) data.nightImage = imageFiles.nightImage;
    if (imageFiles.animation) data.animation = imageFiles.animation;
    if (imageFiles.animationSimulation) data.animationSimulation = imageFiles.animationSimulation;
    if (imageFiles.thumbnail) data.thumbnail = imageFiles.thumbnail;
    
    console.log('📦 [AdminProducts] Enviando dados:', {
      name: data.name,
      price: data.price,
      stock: data.stock,
      hasDayImage: !!data.dayImage,
      hasNightImage: !!data.nightImage,
      hasAnimation: !!data.animation,
      fileNames: {
        day: imageFiles?.dayImage?.name || null,
        night: imageFiles?.nightImage?.name || null,
        animation: imageFiles?.animation?.name || null,
      },
      urlsPreview: {
        day: formData?.imagesDayUrl || null,
        night: formData?.imagesNightUrl || null,
        thumb: formData?.thumbnailUrl || null,
      }
    });
    
    setLoading(true);
    setError(null);
    
    var promise = editingProduct
      ? productsAPI.update(editingProduct.id, data)
      : productsAPI.create(data);
    
    promise
      .then(function(saved) {
        try {
          console.log('🟢 [AdminProducts] Produto salvo/atualizado com sucesso:', {
            id: saved?.id || editingProduct?.id || null,
            imagesDayUrl: saved?.imagesDayUrl,
            imagesNightUrl: saved?.imagesNightUrl,
            thumbnailUrl: saved?.thumbnailUrl,
          });
        } catch(_) {}
        setLoading(false);
        onModalClose();
        loadProducts();
      })
      .catch(function(err) {
        console.error("Erro ao salvar produto:", err);
        var errorMessage = err.response?.data?.error || err.message || "Error saving product";
        if (err.response?.data?.details) {
          errorMessage += ": " + err.response.data.details;
        }
        setError(errorMessage);
        setLoading(false);
      });
  };

  // Filtrar produtos
  var filteredProducts = Array.isArray(products) ? products.slice() : [];
  
  // Aplicar filtro de pesquisa
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(function(p) {
      return p.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0;
    });
  }
  
  // Aplicar filtro de tipo
  if (filters.type) {
    filteredProducts = filteredProducts.filter(function(p) {
      return p.type === filters.type;
    });
  }
  
  // Aplicar filtro de localização
  if (filters.location) {
    filteredProducts = filteredProducts.filter(function(p) {
      return p.location === filters.location;
    });
  }
  
  // Aplicar filtro de tag
  if (filters.tag) {
    var rawTagFilter = String(filters.tag).trim().toLowerCase();
    var normalizedFilter = normalizeTag(filters.tag);
    filteredProducts = filteredProducts.filter(function(p) {
      var normalizedTags = getNormalizedProductTags(p);
      if (normalizedFilter && normalizedTags.includes(normalizedFilter)) {
        return true;
      }
      if (!rawTagFilter) return false;
      return normalizedTags.some(function(tag) {
        return tag.indexOf(rawTagFilter) >= 0;
      });
    });
  }

  var getOtherTagsCount = function(product) {
    var normalizedTags = getNormalizedProductTags(product);
    if (!Array.isArray(normalizedTags) || normalizedTags.length === 0) return 0;
    var count = 0;
    for (var i = 0; i < normalizedTags.length; i++) {
      if (normalizedTags[i] !== "priority") count++;
    }
    return count;
  };

  var getStock = function(product) {
    if (typeof product.stock === "number" && Number.isFinite(product.stock)) return product.stock;
    try {
      var sum = 0;
      var id = String(product.id || "");
      for (var idx = 0; idx < id.length; idx++) {
        sum += id.charCodeAt(idx);
      }
      return 5 + (sum % 60);
    } catch (_) {
      return 20;
    }
  };

  filteredProducts = filteredProducts.sort(function(a, b) {
    var hierarchyComparison = compareProductsByTagHierarchy(a, b);
    if (hierarchyComparison !== 0) return hierarchyComparison;

    var hierarchyIndex = getProductHierarchyIndex(a);

    if (hierarchyIndex === 0) {
      var otherTagsA = getOtherTagsCount(a);
      var otherTagsB = getOtherTagsCount(b);
      if (otherTagsA !== otherTagsB) {
        return otherTagsB - otherTagsA;
      }

      var stockA = getStock(a);
      var stockB = getStock(b);
      if (stockA !== stockB) {
        return stockB - stockA;
      }

      var priceA = typeof a.price === "number" && Number.isFinite(a.price) ? a.price : 0;
      var priceB = typeof b.price === "number" && Number.isFinite(b.price) ? b.price : 0;
      if (priceA !== priceB) {
        return priceB - priceA;
      }

      return (a.name || "").localeCompare(b.name || "");
    }

    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <div className={`flex-1 min-h-0 overflow-hidden p-6 flex flex-col ${isHandheld ? "pb-24" : "pb-6"}`}>
      <PageTitle 
        title="Product Administration" 
        userName={userName} 
        lead="Manage store products" 
        subtitle="Create, edit and delete products" 
      />
      
      {/* Barra de ações e filtros */}
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="max-w-xs"
            />
            <Button onPress={handleSearch} color="primary">Search</Button>
          </div>
          <Button 
            color="primary" 
            onPress={handleCreateNew}
            startContent={<Icon icon="lucide:plus" />}
          >
            Create New Product
          </Button>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <Select
            placeholder="Type"
            aria-label="Filter by product type"
            selectedKeys={filters.type ? new Set([filters.type]) : new Set()}
            onSelectionChange={function(keys) {
              var selected = Array.from(keys)[0] || "";
              setFilters(function(prev) {
                return Object.assign({}, prev, { type: selected });
              });
            }}
            className="w-40"
          >
            <SelectItem key="2D" textValue="2D">2D</SelectItem>
            <SelectItem key="3D" textValue="3D">3D</SelectItem>
          </Select>
          
          <Select
            placeholder="Location"
            aria-label="Filter by location"
            selectedKeys={filters.location ? new Set([filters.location]) : new Set()}
            onSelectionChange={function(keys) {
              var selected = Array.from(keys)[0] || "";
              setFilters(function(prev) {
                return Object.assign({}, prev, { location: selected });
              });
            }}
            className="w-40"
          >
            <SelectItem key="Exterior" textValue="Exterior">Exterior</SelectItem>
            <SelectItem key="Interior" textValue="Interior">Interior</SelectItem>
          </Select>
          
          <Select
            placeholder="Tag"
            aria-label="Filter by tag"
            selectedKeys={filters.tag ? new Set([filters.tag]) : new Set()}
            onSelectionChange={function(keys) {
              var selected = Array.from(keys)[0] || "";
              setFilters(function(prev) {
                return Object.assign({}, prev, { tag: selected });
              });
            }}
            className="w-40"
          >
            <SelectItem key="priority" textValue="PRIORITY">PRIORITY</SelectItem>
            <SelectItem key="sale" textValue="Sale">Sale</SelectItem>
            <SelectItem key="new" textValue="New">New</SelectItem>
            <SelectItem key="trending" textValue="Trending">Trending</SelectItem>
            <SelectItem key="summer" textValue="Summer">Summer</SelectItem>
            <SelectItem key="christmas" textValue="Christmas">Christmas</SelectItem>
          </Select>
          
          <Button
            variant="flat"
            onPress={function() {
              setFilters({});
              setSearchQuery("");
            }}
          >
            Clear Filters
          </Button>
          
          <Checkbox
            isSelected={showArchived}
            onValueChange={setShowArchived}
          >
            Show Archived
          </Checkbox>
        </div>
      </div>

      {/* Lista de produtos */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="lucide:loader-2" className="text-4xl animate-spin mx-auto mb-2" />
            <p>Loading products...</p>
          </div>
        </div>
      ) : error ? (
        <Card className="p-6">
          <CardBody>
            <p className="text-danger">Error: {error}</p>
            <Button onPress={loadProducts} className="mt-4">Try Again</Button>
          </CardBody>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-6">
          <CardBody>
            <p className="text-center text-default-500">No products found</p>
            <p className="text-center text-default-400 text-sm mt-2">
              Total products loaded: {products.length} | 
              Search query: "{searchQuery}" | 
              Active filters: {JSON.stringify(filters)}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className={`flex-1 overflow-y-auto ${isHandheld ? "pb-24" : "pb-6"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(function(product) {
              return (
                <Card key={product.id} className="h-full">
                  <CardBody className="p-0">
                    <div className="relative h-48 bg-content2">
                      {function(){
                        var baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '');
                        // Preferir imagem da noite, depois dia, depois thumbnail
                        var choose = product.imagesNightUrl || product.imagesDayUrl || product.thumbnailUrl || "/demo-images/placeholder.png";
                        var abs;
                        if (choose && choose.indexOf('/uploads/') === 0) {
                          abs = baseApi ? (baseApi + choose) : ('/api' + choose);
                        } else {
                          abs = choose;
                        }
                        var src = abs + (abs.indexOf('/demo-images/') === 0 ? '' : ('?v=' + encodeURIComponent(String(product.updatedAt || product.id || '1'))));
                        return (
                          <img
                            src={src}
                            alt={product.name}
                            className="w-full h-full object-contain"
                            decoding="async"
                            loading="lazy"
                            onLoad={function(){ try { console.log('🖼️ [AdminProducts] grid imagem OK', { id: product.id, src: src }); } catch(_) {} }}
                            onError={function(e){
                              if (e.target.dataset.fb === '1') return;
                              e.target.dataset.fb = '1';
                              var day = product.imagesDayUrl;
                              var alt = day ? ((day.indexOf('/uploads/') === 0 ? ((baseApi ? baseApi : '/api') + day) : day) + '?v=' + encodeURIComponent(String(product.updatedAt || product.id || '1'))) : null;
                              console.warn('⚠️ [AdminProducts] grid imagem ERRO', { id: product.id, tried: src, fallback: alt });
                              e.target.src = alt || "/demo-images/placeholder.png";
                            }}
                          />
                        );
                      }()}
                      {!product.isActive && (
                        <Chip size="sm" color="warning" className="absolute top-2 right-2">
                          Archived
                        </Chip>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                      {/* Tags */}
                      {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(function() {
                            // Helper function to get tag priority for sorting (lower number = higher priority)
                            var getTagPriority = function(tag) {
                              var tagLower = String(tag).toLowerCase();
                              if (tagLower === "priority" || tagLower.indexOf("priority") >= 0 || tagLower.indexOf("priori") >= 0) return 1;
                              if (tagLower === "sale" || tagLower.indexOf("sale") >= 0) return 2;
                              if (tagLower === "new") return 3;
                              if (tagLower === "trending" || tagLower.indexOf("trending") >= 0) return 4;
                              if (tagLower === "summer" || tagLower.indexOf("summer") >= 0) return 4;
                              if (tagLower === "christmas" || tagLower.indexOf("christmas") >= 0 || tagLower.indexOf("xmas") >= 0) return 4;
                              return 5; // Other tags
                            };
                            
                            // Sort tags by priority
                            var sortedTags = product.tags.slice().sort(function(a, b) {
                              return getTagPriority(a) - getTagPriority(b);
                            });
                            
                            return sortedTags.map(function(tag) {
                              var tagLower = String(tag).toLowerCase();
                              var tagConfig = null;
                              
                              if (tagLower === "sale" || tagLower.indexOf("sale") >= 0) {
                                tagConfig = { label: "Sale", color: "#ef4444", bgColor: "#ef444420" };
                              } else if (tagLower === "priority" || tagLower.indexOf("priority") >= 0 || tagLower.indexOf("priori") >= 0) {
                                tagConfig = { label: "PRIORITY", color: "#f59e0b", bgColor: "#f59e0b20" };
                              } else if (tagLower === "new") {
                                tagConfig = { label: "New", color: "#10b981", bgColor: "#10b98120" };
                              } else if (tagLower === "trending" || tagLower.indexOf("trending") >= 0) {
                                tagConfig = { label: "Trending", color: "#8b5cf6", bgColor: "#8b5cf620" };
                              } else if (tagLower === "summer" || tagLower.indexOf("summer") >= 0) {
                                tagConfig = { label: "Summer", color: "#f59e0b", bgColor: "#f59e0b20" };
                              } else if (tagLower === "christmas" || tagLower.indexOf("christmas") >= 0 || tagLower.indexOf("xmas") >= 0) {
                                tagConfig = { label: "Christmas", color: "#ef4444", bgColor: "#ef444420" };
                              } else {
                                tagConfig = { label: String(tag), color: "#6b7280", bgColor: "#6b728020" };
                              }
                              
                              return (
                                <Chip
                                  key={tag}
                                  size="sm"
                                  style={{
                                    backgroundColor: tagConfig.bgColor,
                                    color: tagConfig.color,
                                    borderColor: tagConfig.color,
                                    borderWidth: "1px",
                                    borderStyle: "solid"
                                  }}
                                  className="text-xs font-medium"
                                >
                                  {tagConfig.label}
                                </Chip>
                              );
                            });
                          })()}
                        </div>
                      )}
                      <p className="text-default-500 text-sm mb-2">
                        €{product.price}
                        {product.oldPrice && (
                          <span className="line-through text-default-400 ml-2">€{product.oldPrice}</span>
                        )}
                      </p>
                      <p className="text-default-400 text-xs mb-2">Stock: {product.stock}</p>
                      <div className="flex gap-2 mt-4 flex-wrap">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={function() { handleEdit(product); }}
                          startContent={<Icon icon="lucide:edit" />}
                        >
                          Edit
                        </Button>
                        {product.isActive ? (
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            onPress={function() { handleArchive(product.id); }}
                            startContent={<Icon icon="lucide:archive" />}
                          >
                            Archive
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="flat"
                            color="success"
                            onPress={function() { handleUnarchive(product.id); }}
                            startContent={<Icon icon="lucide:archive-restore" />}
                          >
                            Unarchive
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={function() { handleDelete(product.id); }}
                          startContent={<Icon icon="lucide:trash-2" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de criação/edição */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="5xl" scrollBehavior="inside">
        <ModalContent>
          {function(onClose) {
            return (
              <>
                <ModalHeader>
                  {editingProduct ? "Edit Product" : "Create New Product"}
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    {/* Campos básicos */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Name"
                        placeholder="Ex: IPL317R"
                        value={formData.name}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { name: val });
                          });
                        }}
                        isRequired
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      />
                      <div></div>
                      <Input
                        label="Stock"
                        type="number"
                        placeholder="32"
                        value={formData.stock}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { stock: val });
                          });
                        }}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      />
                      <Input
                        label="Used Stock"
                        type="number"
                        placeholder="10"
                        value={formData.usedStock}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { usedStock: val });
                          });
                        }}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      />
                    </div>

                    {/* Preços em Accordion */}
                    <Accordion>
                      <AccordionItem key="prices" title="Prices" subtitle="Configure prices for new and used products">
                        <div className="space-y-4 pt-2">
                          {/* Preços para Produtos Novos */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">New Product</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                label="Price (€)"
                                type="number"
                                placeholder="1299"
                                value={formData.prices.new.price}
                                onValueChange={function(val) {
                                  setFormData(function(prev) {
                                    var newPrices = Object.assign({}, prev.prices);
                                    newPrices.new = Object.assign({}, newPrices.new, { price: val });
                                    return Object.assign({}, prev, { prices: newPrices });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              />
                              <Input
                                label="Old Price (€)"
                                type="number"
                                placeholder="Optional"
                                value={formData.prices.new.oldPrice}
                                onValueChange={function(val) {
                                  setFormData(function(prev) {
                                    var newPrices = Object.assign({}, prev.prices);
                                    newPrices.new = Object.assign({}, newPrices.new, { oldPrice: val });
                                    return Object.assign({}, prev, { prices: newPrices });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              />
                              <Input
                                label="Rental Price (€)"
                                type="number"
                                placeholder="299"
                                value={formData.prices.new.rentalPrice}
                                onValueChange={function(val) {
                                  setFormData(function(prev) {
                                    var newPrices = Object.assign({}, prev.prices);
                                    newPrices.new = Object.assign({}, newPrices.new, { rentalPrice: val });
                                    return Object.assign({}, prev, { prices: newPrices });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              />
                            </div>
                          </div>

                          {/* Preços para Produtos Usados */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Used Product</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                label="Used Price (€)"
                                type="number"
                                placeholder="899"
                                value={formData.prices.used.price}
                                onValueChange={function(val) {
                                  setFormData(function(prev) {
                                    var newPrices = Object.assign({}, prev.prices);
                                    newPrices.used = Object.assign({}, newPrices.used, { price: val });
                                    return Object.assign({}, prev, { prices: newPrices });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              />
                              <Input
                                label="Used Rental Price (€)"
                                type="number"
                                placeholder="199"
                                value={formData.prices.used.rentalPrice}
                                onValueChange={function(val) {
                                  setFormData(function(prev) {
                                    var newPrices = Object.assign({}, prev.prices);
                                    newPrices.used = Object.assign({}, newPrices.used, { rentalPrice: val });
                                    return Object.assign({}, prev, { prices: newPrices });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionItem>
                    </Accordion>

                    {/* Dropdowns */}
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Type"
                        placeholder="Select type"
                        selectedKeys={formData.type ? new Set([formData.type]) : new Set()}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { type: selected });
                          });
                        }}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      >
                        <SelectItem key="2D" textValue="2D">2D</SelectItem>
                        <SelectItem key="3D" textValue="3D">3D</SelectItem>
                      </Select>
                      
                      <Select
                        label="Location"
                        placeholder="Select location"
                        selectedKeys={formData.location ? new Set([formData.location]) : new Set()}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { location: selected });
                          });
                        }}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      >
                        <SelectItem key="Exterior" textValue="Exterior">Exterior</SelectItem>
                        <SelectItem key="Interior" textValue="Interior">Interior</SelectItem>
                      </Select>
                      
                      <Select
                        label="Mount"
                        placeholder="Select mount"
                        selectedKeys={formData.mount ? new Set([formData.mount]) : new Set()}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { mount: selected });
                          });
                        }}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      >
                        <SelectItem key="Poste" textValue="Pole">Pole</SelectItem>
                        <SelectItem key="Chão" textValue="Floor">Floor</SelectItem>
                        <SelectItem key="Transversal" textValue="Transversal">Transversal</SelectItem>
                      </Select>
                      
                      <Select
                        label="Collection Year"
                        placeholder="Select year"
                        selectedKeys={formData.releaseYear ? new Set([String(formData.releaseYear)]) : new Set()}
                        onSelectionChange={function(keys) {
                          var keysArray = Array.from(keys);
                          var selected = keysArray.length > 0 ? String(keysArray[0]) : "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { releaseYear: selected });
                          });
                        }}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      >
                        {function() {
                          var yearItems = [];
                          for (var i = 0; i < availableYears.length; i++) {
                            var year = availableYears[i];
                            var yearStr = String(year);
                            yearItems.push(
                              <SelectItem key={yearStr} textValue={yearStr}>
                                {year}
                              </SelectItem>
                            );
                          }
                          return yearItems;
                        }()}
                      </Select>
                      
                      <Select
                        label="Season"
                        placeholder="Select season"
                        selectedKeys={formData.season ? new Set([formData.season]) : new Set()}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { season: selected });
                          });
                        }}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      >
                        <SelectItem key="xmas" textValue="Xmas">Xmas</SelectItem>
                        <SelectItem key="summer" textValue="Summer">Summer</SelectItem>
                      </Select>
                    </div>

                    {/* Upload de imagens */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Imagem Dia */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Day Image</label>
                        <input
                          ref={dayImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={function(e) {
                            var file = e.target.files && e.target.files[0];
                            if (file) {
                              handleImageChange("dayImage", file);
                            }
                          }}
                          className="hidden"
                          aria-label="Selecionar imagem do dia"
                        />
                        <Button
                          variant="bordered"
                          className="w-full"
                          onPress={function() {
                            dayImageInputRef.current?.click();
                          }}
                          startContent={<Icon icon="lucide:upload" />}
                        >
                          {imageFiles.dayImage ? imageFiles.dayImage.name : "Select Day Image"}
                        </Button>
                        {imagePreviews.dayImage && (
                          <div className="mt-2">
                            <Image
                              src={imagePreviews.dayImage}
                              alt="Day preview"
                              className="max-h-32 object-contain rounded-lg"
                            />
                          </div>
                        )}
                        <p className="text-xs text-default-500 mt-1">Thumbnail will be generated automatically</p>
                      </div>
                      
                      {/* Imagem Noite */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Night Image</label>
                        <input
                          ref={nightImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={function(e) {
                            var file = e.target.files && e.target.files[0];
                            if (file) {
                              handleImageChange("nightImage", file);
                            }
                          }}
                          className="hidden"
                          aria-label="Selecionar imagem da noite"
                        />
                        <Button
                          variant="bordered"
                          className="w-full"
                          onPress={function() {
                            nightImageInputRef.current?.click();
                          }}
                          startContent={<Icon icon="lucide:upload" />}
                        >
                          {imageFiles.nightImage ? imageFiles.nightImage.name : "Select Night Image"}
                        </Button>
                        {imagePreviews.nightImage && (
                          <div className="mt-2">
                            <Image
                              src={imagePreviews.nightImage}
                              alt="Night preview"
                              className="max-h-32 object-contain rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Animação/Vídeo */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Animation/Video</label>
                        <input
                          ref={animationInputRef}
                          type="file"
                          accept="video/*"
                          onChange={function(e) {
                            var file = e.target.files && e.target.files[0];
                            if (file) {
                              handleImageChange("animation", file);
                            }
                          }}
                          className="hidden"
                          aria-label="Selecionar animação ou vídeo"
                        />
                        <Button
                          variant="bordered"
                          className="w-full"
                          onPress={function() {
                            animationInputRef.current?.click();
                          }}
                          startContent={<Icon icon="lucide:video" />}
                        >
                          {imageFiles.animation ? imageFiles.animation.name : "Select Video"}
                        </Button>
                      </div>
                      
                      {/* Vídeo Simulação Animada */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Animation Simulation Video</label>
                        <input
                          ref={animationSimulationInputRef}
                          type="file"
                          accept="video/*"
                          onChange={function(e) {
                            var file = e.target.files && e.target.files[0];
                            if (file) {
                              handleImageChange("animationSimulation", file);
                            }
                          }}
                          className="hidden"
                          aria-label="Selecionar vídeo de simulação animada"
                        />
                        <Button
                          variant="bordered"
                          className="w-full"
                          onPress={function() {
                            animationSimulationInputRef.current?.click();
                          }}
                          startContent={<Icon icon="lucide:play-circle" />}
                        >
                          {imageFiles.animationSimulation ? imageFiles.animationSimulation.name : "Select Simulation Video"}
                        </Button>
                        {imagePreviews.animationSimulation && (
                          <div className="mt-2">
                            <video
                              src={imagePreviews.animationSimulation}
                              controls
                              className="max-h-32 w-full object-contain rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LED Colors */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">LED Colors:</label>
                      <div className="flex flex-wrap gap-3 p-4 border border-default-200 rounded-lg bg-default-50">
                        {Object.keys(availableColorsList).length === 0 ? (
                          <p className="text-sm text-default-500">No colors available in database</p>
                        ) : (
                            Object.keys(availableColorsList).map(function(colorName) {
                              var colorValue = availableColorsList[colorName];
                              var isHex = colorValue && typeof colorValue === 'string' && colorValue.indexOf('#') === 0;
                              var isGradient = colorValue && typeof colorValue === 'string' && colorValue.indexOf('linear-gradient') === 0;
                              var isSelected = formData.availableColors.hasOwnProperty(colorName);
                              // Se não for hex nem gradiente, usar função helper para obter cor hex baseada no nome
                              var displayColor = isHex || isGradient ? colorValue : getColorHex(colorName);
                              
                              return (
                                <button
                                  key={colorName}
                                  type="button"
                                  onClick={function() {
                                    if (isSelected) {
                                      handleRemoveColor(colorName);
                                    } else {
                                      handleAddColor(colorName);
                                    }
                                  }}
                                  title={colorName}
                                  className={isSelected 
                                    ? "w-10 h-10 rounded-full border-4 border-primary-500 shadow-md hover:scale-110 transition-transform cursor-pointer overflow-hidden" 
                                    : "w-10 h-10 rounded-full border-2 border-default-300 hover:border-primary-400 hover:scale-110 transition-transform cursor-pointer overflow-hidden"}
                                  style={isGradient ? { background: displayColor } : { backgroundColor: displayColor }}
                                >
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Select
                        label="Tags"
                        placeholder="Select tags"
                        selectionMode="multiple"
                        selectedKeys={new Set(formData.tags || [])}
                        onSelectionChange={function(keys) {
                          var selectedTags = Array.from(keys);
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { tags: selectedTags });
                          });
                        }}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                        renderValue={function(items) {
                          if (items.length === 0) {
                            return "No tags selected";
                          }
                          var tagConfigs = {
                            "sale": { label: "Sale", color: "#ef4444" },
                            "priority": { label: "PRIORITY", color: "#f59e0b" },
                            "new": { label: "New", color: "#10b981" },
                            "trending": { label: "Trending", color: "#8b5cf6" },
                            "summer": { label: "Summer", color: "#f59e0b" },
                            "christmas": { label: "Christmas", color: "#ef4444" }
                          };
                          return items.map(function(item) {
                            var config = tagConfigs[item.key] || { label: item.key, color: "#6b7280" };
                            return (
                              <Chip
                                key={item.key}
                                size="sm"
                                style={{ backgroundColor: config.color + "20", color: config.color }}
                                className="mr-1"
                              >
                                {config.label}
                              </Chip>
                            );
                          });
                        }}
                      >
                        <SelectItem
                          key="sale"
                          textValue="Sale"
                          startContent={
                            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#ef4444" }}>
                              <Icon icon="lucide:tag" className="text-white text-xs" />
                            </div>
                          }
                        >
                          Sale
                        </SelectItem>
                        <SelectItem
                          key="priority"
                          textValue="PRIORITY"
                          startContent={
                            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#f59e0b" }}>
                              <Icon icon="lucide:star" className="text-white text-xs" />
                            </div>
                          }
                        >
                          PRIORITY
                        </SelectItem>
                        <SelectItem
                          key="new"
                          textValue="New"
                          startContent={
                            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#10b981" }}>
                              <Icon icon="lucide:sparkles" className="text-white text-xs" />
                            </div>
                          }
                        >
                          New
                        </SelectItem>
                        <SelectItem
                          key="trending"
                          textValue="Trending"
                          startContent={
                            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#8b5cf6" }}>
                              <Icon icon="lucide:trending-up" className="text-white text-xs" />
                            </div>
                          }
                        >
                          Trending
                        </SelectItem>
                        <SelectItem
                          key="summer"
                          textValue="Summer"
                          startContent={
                            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#f59e0b" }}>
                              <Icon icon="lucide:sun" className="text-white text-xs" />
                            </div>
                          }
                        >
                          Summer
                        </SelectItem>
                        <SelectItem
                          key="christmas"
                          textValue="Christmas"
                          startContent={
                            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#ef4444" }}>
                              <Icon icon="lucide:gift" className="text-white text-xs" />
                            </div>
                          }
                        >
                          Christmas
                        </SelectItem>
                      </Select>
                    </div>

                    {/* Specs */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Technical Specifications</h4>
                      <Textarea
                        label="Description"
                        placeholder="Product description"
                        value={formData.specs.descricao}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            var newSpecs = Object.assign({}, prev.specs, { descricao: val });
                            return Object.assign({}, prev, { specs: newSpecs });
                          });
                        }}
                        minRows={2}
                        classNames={{
                          label: "text-primary-700 dark:text-primary-400"
                        }}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Technical"
                          placeholder="Ex: 230V AC, IP65, 48W"
                          value={formData.specs.tecnicas}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              var newSpecs = Object.assign({}, prev.specs, { tecnicas: val });
                              return Object.assign({}, prev, { specs: newSpecs });
                            });
                          }}
                          classNames={{
                            label: "text-primary-700 dark:text-primary-400"
                          }}
                        />
                        <Input
                          label="Weight (kg)"
                          placeholder="Ex: 11"
                          value={formData.specs.weight}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              var newSpecs = Object.assign({}, prev.specs, { weight: val });
                              return Object.assign({}, prev, { specs: newSpecs });
                            });
                          }}
                          classNames={{
                            label: "text-primary-700 dark:text-primary-400"
                          }}
                        />
                      </div>
                      
                      {/* Dimensions */}
                      <div className="grid grid-cols-2 gap-2">
                        <h4 className="font-medium col-span-2">Dimensions (in meters)</h4>
                        <Input
                          label="Height (H)"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 2.4"
                          value={formData.height}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              return Object.assign({}, prev, { height: val });
                            });
                          }}
                          classNames={{
                            label: "text-primary-700 dark:text-primary-400"
                          }}
                        />
                        <Input
                          label="Width (W)"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 2.0"
                          value={formData.width}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              return Object.assign({}, prev, { width: val });
                            });
                          }}
                          classNames={{
                            label: "text-primary-700 dark:text-primary-400"
                          }}
                        />
                        <Input
                          label="Depth (D)"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 0.5"
                          value={formData.depth}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              return Object.assign({}, prev, { depth: val });
                            });
                          }}
                          classNames={{
                            label: "text-primary-700 dark:text-primary-400"
                          }}
                        />
                        <Input
                          label="Diameter"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1.2"
                          value={formData.diameter}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              return Object.assign({}, prev, { diameter: val });
                            });
                          }}
                          classNames={{
                            label: "text-primary-700 dark:text-primary-400"
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Accordion>
                          <AccordionItem key="materials" title="Materials">
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  label="Print Type"
                                  placeholder="Select print type"
                                  selectedKeys={formData.specs.printType ? new Set([formData.specs.printType]) : new Set()}
                                  onSelectionChange={function(keys) {
                                    var selected = Array.from(keys)[0] || "";
                                    setFormData(function(prev) {
                                      var newSpecs = Object.assign({}, prev.specs, { printType: selected, printColor: "" });
                                      return Object.assign({}, prev, { specs: newSpecs });
                                    });
                                  }}
                                  classNames={{
                                    label: "text-primary-700 dark:text-primary-400"
                                  }}
                                >
                                  <SelectItem key="BIOPRINT" textValue="BIOPRINT">BIOPRINT</SelectItem>
                                  <SelectItem key="RECYPRINT" textValue="RECYPRINT">RECYPRINT</SelectItem>
                                  <SelectItem key="FLEXIPRINT" textValue="FLEXIPRINT">FLEXIPRINT</SelectItem>
                                  <SelectItem key="FLEXIPRINT IGNIFUGE" textValue="FLEXIPRINT IGNIFUGE">FLEXIPRINT IGNIFUGE</SelectItem>
                                  <SelectItem key="PRINT IGNIFUGE" textValue="PRINT IGNIFUGE">PRINT IGNIFUGE</SelectItem>
                                </Select>
                                <Select
                                  label="Print Color"
                                  placeholder="Select color(s)"
                                  isDisabled={!formData.specs.printType}
                                  selectionMode="multiple"
                                  selectedKeys={(function() {
                                    try {
                                      return getValidPrintColors(formData.specs?.printColor);
                                    } catch (e) {
                                      console.error("Erro ao filtrar printColor:", e);
                                      return new Set();
                                    }
                                  })()}
                                  onSelectionChange={function(keys) {
                                    var selected = Array.from(keys);
                                    setFormData(function(prev) {
                                      var newSpecs = Object.assign({}, prev.specs, { printColor: selected });
                                      return Object.assign({}, prev, { specs: newSpecs });
                                    });
                                  }}
                                  classNames={{
                                    label: "text-primary-700 dark:text-primary-400"
                                  }}
                                >
                                  {function() {
                                    var colors = ["WHITE", "DARK BLUE", "ICE BLUE", "GREY", "YELLOW", "BLACK", "GOLD", "ORANGE", "PINK", "RED", "LIGHT GREEN", "DARK GREEN", "PASTEL GREEN", "PURPLE"];
                                    var selectedColors = formData.specs.printColor ? (Array.isArray(formData.specs.printColor) ? formData.specs.printColor : [formData.specs.printColor]) : [];
                                    return colors.map(function(colorName) {
                                      var isSelected = selectedColors.includes(colorName);
                                      var colorStyle = getPrintColorStyle(colorName, isSelected);
                                      return (
                                        <SelectItem 
                                          key={colorName}
                                          textValue={colorName}
                                          style={colorStyle}
                                        >
                                          {colorName}
                                        </SelectItem>
                                      );
                                    });
                                  }()}
                                </Select>
                              </div>
                              <Select
                                label="LED"
                                placeholder="Select LED type(s)"
                                selectionMode="multiple"
                                selectedKeys={(function() {
                                  try {
                                    return getValidLEDEffects(formData.specs?.effects);
                                  } catch (e) {
                                    console.error("Erro ao filtrar effects:", e);
                                    return new Set();
                                  }
                                })()}
                                onSelectionChange={function(keys) {
                                  var selected = Array.from(keys);
                                  setFormData(function(prev) {
                                    var currentMateriais = prev.specs.materiais || "";
                                    var currentEffects = prev.specs.effects;
                                    
                                    // Obter lista de todas as opções LED válidas
                                    var validLEDEffects = ["LED AMBER", "LED WARM WHITE", "LED WARM WHITE + WARM WHITE FLASH", "LED WARM WHITE + PURE WHITE FLASH", "LED WARM WHITE + PURE WHITE SLOW FLASH", "LED PURE WHITE", "LED PURE WHITE + PURE WHITE FLASH", "LED PURE WHITE + WARM WHITE SLOW FLASH", "LED PURE WHITE + PURE WHITE SLOW FLASH", "LED BLUE", "LED BLUE + PURE WHITE FLASH", "LED BLUE + PURE WHITE SLOW FLASH", "LED PINK", "LED PINK + PURE WHITE FLASH", "LED RED", "LED RED + PURE WHITE FLASH", "LED RED + PURE WHITE SLOW FLASH", "LED GREEN", "LED GREEN + PURE WHITE FLASH", "RGB"];
                                    
                                    // Remover todos os LED existentes do campo materiais
                                    var newMateriais = validLEDEffects.reduce(function(acc, effect) {
                                      return acc
                                        .replace(new RegExp(",\\s*" + effect.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), "")
                                        .replace(new RegExp(effect.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b\\s*,?", "g"), "");
                                    }, currentMateriais);
                                    
                                    // Adicionar os selecionados ao campo materiais
                                    if (selected.length > 0) {
                                      newMateriais = newMateriais.trim();
                                      if (newMateriais) {
                                        newMateriais += ", " + selected.join(", ");
                                      } else {
                                        newMateriais = selected.join(", ");
                                      }
                                    }
                                    
                                    // Limpar vírgulas duplas e espaços extras
                                    newMateriais = newMateriais
                                      .replace(/,\s*,/g, ",")
                                      .replace(/^\s*,\s*|\s*,\s*$/g, "")
                                      .trim();
                                    
                                    var newSpecs = Object.assign({}, prev.specs, {
                                      effects: selected.length > 0 ? (selected.length === 1 ? selected[0] : selected) : null,
                                      materiais: newMateriais
                                    });
                                    return Object.assign({}, prev, { specs: newSpecs });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              >
                                <SelectItem key="LED AMBER" textValue="LED AMBER">LED AMBER</SelectItem>
                                <SelectItem key="LED WARM WHITE" textValue="LED WARM WHITE">LED WARM WHITE</SelectItem>
                                <SelectItem key="LED WARM WHITE + WARM WHITE FLASH" textValue="LED WARM WHITE + WARM WHITE FLASH">LED WARM WHITE + WARM WHITE FLASH</SelectItem>
                                <SelectItem key="LED WARM WHITE + PURE WHITE FLASH" textValue="LED WARM WHITE + PURE WHITE FLASH">LED WARM WHITE + PURE WHITE FLASH</SelectItem>
                                <SelectItem key="LED WARM WHITE + PURE WHITE SLOW FLASH" textValue="LED WARM WHITE + PURE WHITE SLOW FLASH">LED WARM WHITE + PURE WHITE SLOW FLASH</SelectItem>
                                <SelectItem key="LED PURE WHITE" textValue="LED PURE WHITE">LED PURE WHITE</SelectItem>
                                <SelectItem key="LED PURE WHITE + PURE WHITE FLASH" textValue="LED PURE WHITE + PURE WHITE FLASH">LED PURE WHITE + PURE WHITE FLASH</SelectItem>
                                <SelectItem key="LED PURE WHITE + WARM WHITE SLOW FLASH" textValue="LED PURE WHITE + WARM WHITE SLOW FLASH">LED PURE WHITE + WARM WHITE SLOW FLASH</SelectItem>
                                <SelectItem key="LED PURE WHITE + PURE WHITE SLOW FLASH" textValue="LED PURE WHITE + PURE WHITE SLOW FLASH">LED PURE WHITE + PURE WHITE SLOW FLASH</SelectItem>
                                <SelectItem key="LED BLUE" textValue="LED BLUE">LED BLUE</SelectItem>
                                <SelectItem key="LED BLUE + PURE WHITE FLASH" textValue="LED BLUE + PURE WHITE FLASH">LED BLUE + PURE WHITE FLASH</SelectItem>
                                <SelectItem key="LED BLUE + PURE WHITE SLOW FLASH" textValue="LED BLUE + PURE WHITE SLOW FLASH">LED BLUE + PURE WHITE SLOW FLASH</SelectItem>
                                <SelectItem key="LED PINK" textValue="LED PINK">LED PINK</SelectItem>
                                <SelectItem key="LED PINK + PURE WHITE FLASH" textValue="LED PINK + PURE WHITE FLASH">LED PINK + PURE WHITE FLASH</SelectItem>
                                <SelectItem key="LED RED" textValue="LED RED">LED RED</SelectItem>
                                <SelectItem key="LED RED + PURE WHITE FLASH" textValue="LED RED + PURE WHITE FLASH">LED RED + PURE WHITE FLASH</SelectItem>
                                <SelectItem key="LED RED + PURE WHITE SLOW FLASH" textValue="LED RED + PURE WHITE SLOW FLASH">LED RED + PURE WHITE SLOW FLASH</SelectItem>
                                <SelectItem key="LED GREEN" textValue="LED GREEN">LED GREEN</SelectItem>
                                <SelectItem key="LED GREEN + PURE WHITE FLASH" textValue="LED GREEN + PURE WHITE FLASH">LED GREEN + PURE WHITE FLASH</SelectItem>
                                <SelectItem key="RGB" textValue="RGB">RGB</SelectItem>
                              </Select>
                              {console.log("🔍 [DEBUG] Renderizando COMET STRING field") || null}
                              <Select
                                label="COMET STRING"
                                placeholder="Select option"
                                selectedKeys={(function() {
                                  var m = formData.specs?.materiais || "";
                                  return m.includes("COMET STRING LED PURE WHITE") ? new Set(["COMET STRING LED PURE WHITE"]) : new Set();
                                })()}
                                onSelectionChange={function(keys) {
                                  var selected = Array.from(keys)[0] || "";
                                  setFormData(function(prev) {
                                    var currentMateriais = prev.specs.materiais || "";
                                    var newMateriais = "";
                                    
                                    if (selected === "COMET STRING LED PURE WHITE") {
                                      if (!currentMateriais.includes("COMET STRING LED PURE WHITE")) {
                                        newMateriais = currentMateriais.trim();
                                        if (newMateriais) {
                                          newMateriais += ", COMET STRING LED PURE WHITE";
                                        } else {
                                          newMateriais = "COMET STRING LED PURE WHITE";
                                        }
                                      } else {
                                        newMateriais = currentMateriais;
                                      }
                                    } else {
                                      newMateriais = currentMateriais
                                        .replace(/,\s*COMET STRING LED PURE WHITE/g, "")
                                        .replace(/COMET STRING LED PURE WHITE\s*,?/g, "")
                                        .replace(/^\s*,\s*|\s*,\s*$/g, "")
                                        .trim();
                                    }
                                    
                                    var newSpecs = Object.assign({}, prev.specs, { materiais: newMateriais });
                                    return Object.assign({}, prev, { specs: newSpecs });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              >
                                <SelectItem key="COMET STRING LED PURE WHITE" textValue="COMET STRING LED PURE WHITE">COMET STRING LED PURE WHITE</SelectItem>
                              </Select>
                              <Select
                                label="LIGHT STRING"
                                placeholder="Select color(s)"
                                selectionMode="multiple"
                                selectedKeys={(function() {
                                  var m = formData.specs?.materiais || "";
                                  var colors = ["WARM WHITE", "PURE WHITE", "BLUE", "YELLOW", "ORANGE", "PINK", "RED", "GREEN"];
                                  var selected = colors.filter(function(color) {
                                    return m.includes("LIGHT STRING " + color);
                                  });
                                  return new Set(selected);
                                })()}
                                onSelectionChange={function(keys) {
                                  var selected = Array.from(keys);
                                  setFormData(function(prev) {
                                    var currentMateriais = prev.specs.materiais || "";
                                    var colors = ["WARM WHITE", "PURE WHITE", "BLUE", "YELLOW", "ORANGE", "PINK", "RED", "GREEN"];
                                    
                                    // Remover todos os LIGHT STRING existentes
                                    var newMateriais = colors.reduce(function(acc, color) {
                                      var pattern = "LIGHT STRING " + color;
                                      return acc
                                        .replace(new RegExp(",\\s*" + pattern.replace(/\s+/g, "\\s+") + "\\b", "g"), "")
                                        .replace(new RegExp(pattern.replace(/\s+/g, "\\s+") + "\\b\\s*,?", "g"), "");
                                    }, currentMateriais);
                                    
                                    // Adicionar os selecionados
                                    if (selected.length > 0) {
                                      var toAdd = selected.map(function(color) {
                                        return "LIGHT STRING " + color;
                                      });
                                      newMateriais = newMateriais.trim();
                                      if (newMateriais) {
                                        newMateriais += ", " + toAdd.join(", ");
                                      } else {
                                        newMateriais = toAdd.join(", ");
                                      }
                                    }
                                    
                                    // Limpar vírgulas duplas e espaços extras
                                    newMateriais = newMateriais
                                      .replace(/,\s*,/g, ",")
                                      .replace(/^\s*,\s*|\s*,\s*$/g, "")
                                      .trim();
                                    
                                    var newSpecs = Object.assign({}, prev.specs, { materiais: newMateriais });
                                    return Object.assign({}, prev, { specs: newSpecs });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              >
                                <SelectItem key="WARM WHITE" textValue="WARM WHITE">WARM WHITE</SelectItem>
                                <SelectItem key="PURE WHITE" textValue="PURE WHITE">PURE WHITE</SelectItem>
                                <SelectItem key="BLUE" textValue="BLUE">BLUE</SelectItem>
                                <SelectItem key="YELLOW" textValue="YELLOW">YELLOW</SelectItem>
                                <SelectItem key="ORANGE" textValue="ORANGE">ORANGE</SelectItem>
                                <SelectItem key="PINK" textValue="PINK">PINK</SelectItem>
                                <SelectItem key="RED" textValue="RED">RED</SelectItem>
                                <SelectItem key="GREEN" textValue="GREEN">GREEN</SelectItem>
                              </Select>
                              <Select
                                label="Aluminium"
                                placeholder="Select color(s)"
                                selectionMode="multiple"
                                selectedKeys={(function() {
                                  try {
                                    return getValidAluminiumColors(formData.specs?.aluminium);
                                  } catch (e) {
                                    console.error("Erro ao filtrar aluminium:", e);
                                    return new Set();
                                  }
                                })()}
                                onSelectionChange={function(keys) {
                                  var selected = Array.from(keys);
                                  setFormData(function(prev) {
                                    var newSpecs = Object.assign({}, prev.specs, { aluminium: selected.length > 0 ? (selected.length === 1 ? selected[0] : selected) : null });
                                    return Object.assign({}, prev, { specs: newSpecs });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              >
                                {function() {
                                  var colors = ["WHITE", "DARK BLUE", "ICE BLUE", "GREY", "YELLOW", "BLACK", "GOLD", "ORANGE", "PINK", "RED", "LIGHT GREEN", "DARK GREEN", "PASTEL GREEN", "PURPLE"];
                                  var selectedColors = formData.specs.aluminium ? (Array.isArray(formData.specs.aluminium) ? formData.specs.aluminium : [formData.specs.aluminium]) : [];
                                  return colors.map(function(colorName) {
                                    var isSelected = selectedColors.includes(colorName);
                                    var colorStyle = getPrintColorStyle(colorName, isSelected);
                                    return (
                                      <SelectItem 
                                        key={colorName}
                                        textValue={colorName}
                                        style={colorStyle}
                                      >
                                        {colorName}
                                      </SelectItem>
                                    );
                                  });
                                }()}
                              </Select>
                              <Select
                                label="SOFT XLED"
                                placeholder="Select color"
                                selectedKeys={(function() {
                                  try {
                                    return getValidSoftXLED(formData.specs?.softXLED);
                                  } catch (e) {
                                    console.error("Erro ao filtrar softXLED:", e);
                                    return new Set();
                                  }
                                })()}
                                onSelectionChange={function(keys) {
                                  var selected = Array.from(keys)[0] || "";
                                  setFormData(function(prev) {
                                    var newSpecs = Object.assign({}, prev.specs, { softXLED: selected || null });
                                    return Object.assign({}, prev, { specs: newSpecs });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              >
                                <SelectItem key="PURE WHITE" textValue="PURE WHITE">PURE WHITE</SelectItem>
                              </Select>
                              <Select
                                label="ANIMATED SPARKLE"
                                placeholder="Select sparkle color"
                                selectedKeys={formData.specs.sparkle ? new Set([formData.specs.sparkle]) : new Set()}
                                onSelectionChange={function(keys) {
                                  var selected = Array.from(keys)[0] || "";
                                  setFormData(function(prev) {
                                    var newSpecs = Object.assign({}, prev.specs, { sparkle: selected });
                                    return Object.assign({}, prev, { specs: newSpecs });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              >
                                <SelectItem key="WARM WHITE/PURE WHITE" textValue="WARM WHITE/PURE WHITE">WARM WHITE/PURE WHITE</SelectItem>
                                <SelectItem key="PURE WHITE" textValue="PURE WHITE">PURE WHITE</SelectItem>
                              </Select>
                              <Select
                                label="ANIMATED SPARKLES"
                                placeholder="Select sparkles color(s)"
                                selectionMode="multiple"
                                selectedKeys={(function() {
                                  try {
                                    return getValidSparkles(formData.specs?.sparkles);
                                  } catch (e) {
                                    console.error("Erro ao filtrar sparkles:", e);
                                    return new Set();
                                  }
                                })()}
                                onSelectionChange={function(keys) {
                                  var selected = Array.from(keys);
                                  setFormData(function(prev) {
                                    var currentMateriais = prev.specs.materiais || "";
                                    var validSparkles = ["WARM WHITE", "WARM WHITE/PURE WHITE", "PURE WHITE", "RGB"];
                                    
                                    // Remover todos os ANIMATED SPARKLES existentes do campo materiais
                                    var newMateriais = validSparkles.reduce(function(acc, sparkle) {
                                      var pattern = "ANIMATED SPARKLES " + sparkle;
                                      return acc
                                        .replace(new RegExp(",\\s*" + pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), "")
                                        .replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b\\s*,?", "g"), "");
                                    }, currentMateriais);
                                    
                                    // Adicionar os selecionados ao campo materiais
                                    if (selected.length > 0) {
                                      var toAdd = selected.map(function(sparkle) {
                                        return "ANIMATED SPARKLES " + sparkle;
                                      });
                                      newMateriais = newMateriais.trim();
                                      if (newMateriais) {
                                        newMateriais += ", " + toAdd.join(", ");
                                      } else {
                                        newMateriais = toAdd.join(", ");
                                      }
                                    }
                                    
                                    // Limpar vírgulas duplas e espaços extras
                                    newMateriais = newMateriais
                                      .replace(/,\s*,/g, ",")
                                      .replace(/^\s*,\s*|\s*,\s*$/g, "")
                                      .trim();
                                    
                                    var newSpecs = Object.assign({}, prev.specs, {
                                      sparkles: selected.length > 0 ? (selected.length === 1 ? selected[0] : selected) : null,
                                      materiais: newMateriais
                                    });
                                    return Object.assign({}, prev, { specs: newSpecs });
                                  });
                                }}
                                classNames={{
                                  label: "text-primary-700 dark:text-primary-400"
                                }}
                              >
                                <SelectItem key="WARM WHITE" textValue="WARM WHITE">WARM WHITE</SelectItem>
                                <SelectItem key="WARM WHITE/PURE WHITE" textValue="WARM WHITE/PURE WHITE">WARM WHITE/PURE WHITE</SelectItem>
                                <SelectItem key="PURE WHITE" textValue="PURE WHITE">PURE WHITE</SelectItem>
                                <SelectItem key="RGB" textValue="RGB">RGB</SelectItem>
                              </Select>
                            </div>
                          </AccordionItem>
                        </Accordion>
                        <Input
                          label="Stock Policy"
                          placeholder="Ex: Made to order"
                          value={formData.specs.stockPolicy}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              var newSpecs = Object.assign({}, prev.specs, { stockPolicy: val });
                              return Object.assign({}, prev, { specs: newSpecs });
                            });
                          }}
                          classNames={{
                            label: "text-primary-700 dark:text-primary-400"
                          }}
                        />
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex gap-4">
                      <Checkbox
                        isSelected={formData.isActive}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { isActive: val });
                          });
                        }}
                      >
                        Active Product
                      </Checkbox>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    variant="flat" 
                    onPress={onClose}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                  >
                    Cancel
                  </Button>
                  <Button color="primary" onPress={handleSubmit} isLoading={loading}>
                    {editingProduct ? "Update" : "Create"}
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </div>
  );
}

