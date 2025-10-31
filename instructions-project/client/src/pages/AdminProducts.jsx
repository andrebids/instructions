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
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { productsAPI } from "../services/api";
import { PageTitle } from "../components/page-title";
import { useUser } from "../context/UserContext";

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
  
  var [availableYears, setAvailableYears] = React.useState(initializeYears);
  var { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  var [editingProduct, setEditingProduct] = React.useState(null);
  var [formData, setFormData] = React.useState({
    name: "",
    price: "",
    stock: "",
    oldPrice: "",
    type: "",
    usage: "",
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
    },
    availableColors: {},
    videoFile: "",
  });
  
  var [imageFiles, setImageFiles] = React.useState({
    dayImage: null,
    nightImage: null,
    animation: null,
  });
  
  var [imagePreviews, setImagePreviews] = React.useState({
    dayImage: null,
    nightImage: null,
    animation: null,
  });
  
  // Referências para inputs de ficheiro escondidos
  var dayImageInputRef = React.useRef(null);
  var nightImageInputRef = React.useRef(null);
  var animationInputRef = React.useRef(null);

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
            var yearValue = parseInt(productYear, 10);
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
      price: "",
      stock: "",
      oldPrice: "",
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
      },
      availableColors: {},
      videoFile: "",
      releaseYear: "",
      height: "",
      width: "",
      depth: "",
      diameter: "",
    });
    setImageFiles({
      dayImage: null,
      nightImage: null,
      animation: null,
    });
    setImagePreviews({
      dayImage: null,
      nightImage: null,
      animation: null,
    });
    loadAvailableColors();
    onModalOpen();
  };

  // Abrir modal para editar produto
  var handleEdit = function(product) {
    setEditingProduct(product);
    
    // Verificar se o ano do produto está na lista disponível e adicionar se necessário
    var productYear = product.releaseYear;
    if (productYear) {
      var yearValue = parseInt(productYear, 10);
      if (!isNaN(yearValue)) {
        var yearExists = false;
        for (var i = 0; i < availableYears.length; i++) {
          if (availableYears[i] === yearValue) {
            yearExists = true;
            break;
          }
        }
        
        if (!yearExists) {
          var updatedYears = availableYears.slice();
          updatedYears.push(yearValue);
          updatedYears.sort(function(a, b) {
            return b - a;
          });
          setAvailableYears(updatedYears);
        }
      }
    }
    
    setFormData({
      name: product.name || "",
      price: product.price || "",
      stock: product.stock || "",
      oldPrice: product.oldPrice || "",
      type: product.type || "",
      usage: product.usage || "",
      location: product.location || "",
      mount: product.mount || "",
      tags: product.tags || [],
      isActive: product.isActive !== false,
      specs: product.specs || {
        descricao: "",
        tecnicas: "",
        dimensoes: "",
        weight: "",
        effects: "",
        materiais: "",
        stockPolicy: "",
      },
      availableColors: product.availableColors || {},
      videoFile: product.videoFile || "",
      releaseYear: product.releaseYear ? String(product.releaseYear) : "",
      height: product.height || "",
      width: product.width || "",
      depth: product.depth || "",
      diameter: product.diameter || "",
    });
    setImagePreviews({
      dayImage: product.imagesDayUrl || null,
      nightImage: product.imagesNightUrl || null,
      animation: product.animationUrl || null,
    });
    setImageFiles({
      dayImage: null,
      nightImage: null,
      animation: null,
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
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(e) {
      var newPreviews = Object.assign({}, imagePreviews);
      newPreviews[field] = e.target.result;
      setImagePreviews(newPreviews);
    };
    reader.readAsDataURL(file);
    
    var newFiles = Object.assign({}, imageFiles);
    newFiles[field] = file;
    setImageFiles(newFiles);
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
    
    // Processar tags e adicionar/remover tag "sale" automaticamente baseado em oldPrice
    var finalTags = formData.tags || [];
    var hasOldPrice = formData.oldPrice && parseFloat(formData.oldPrice) > 0;
    var hasPrice = formData.price && parseFloat(formData.price) > 0;
    var isOnSale = hasOldPrice && hasPrice && parseFloat(formData.oldPrice) > parseFloat(formData.price);
    
    // Verificar se tag "sale" já existe
    var hasSaleTag = false;
    for (var i = 0; i < finalTags.length; i++) {
      if (finalTags[i].toLowerCase() === 'sale') {
        hasSaleTag = true;
        break;
      }
    }
    
    // Adicionar tag "sale" se houver desconto, remover se não houver
    if (isOnSale && !hasSaleTag) {
      finalTags.push('sale');
    } else if (!isOnSale && hasSaleTag) {
      // Remover tag "sale"
      var newTags = [];
      for (var j = 0; j < finalTags.length; j++) {
        if (finalTags[j].toLowerCase() !== 'sale') {
          newTags.push(finalTags[j]);
        }
      }
      finalTags = newTags;
    }
    
    // Criar objeto com os dados (productsAPI.create cria o FormData internamente)
    var data = {
      name: formData.name,
      price: formData.price || 0,
      stock: formData.stock || 0,
      oldPrice: toNullIfEmpty(formData.oldPrice),
      type: toNullIfEmpty(formData.type),
      usage: toNullIfEmpty(formData.usage),
      location: toNullIfEmpty(formData.location),
      mount: toNullIfEmpty(formData.mount),
      videoFile: toNullIfEmpty(formData.videoFile),
      tags: finalTags,
      specs: formData.specs || null,
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
    if (imageFiles.thumbnail) data.thumbnail = imageFiles.thumbnail;
    
    console.log('📦 [AdminProducts] Enviando dados:', {
      name: data.name,
      price: data.price,
      stock: data.stock,
      hasDayImage: !!data.dayImage,
      hasNightImage: !!data.nightImage,
      hasAnimation: !!data.animation
    });
    
    setLoading(true);
    setError(null);
    
    var promise = editingProduct
      ? productsAPI.update(editingProduct.id, data)
      : productsAPI.create(data);
    
    promise
      .then(function() {
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
  var filteredProducts = products;
  if (searchQuery) {
    filteredProducts = products.filter(function(p) {
      return p.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0;
    });
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col">
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
            selectedKeys={filters.type ? [filters.type] : []}
            onSelectionChange={function(keys) {
              var selected = Array.from(keys)[0] || "";
              setFilters(function(prev) {
                return Object.assign({}, prev, { type: selected });
              });
            }}
            className="w-40"
          >
            <SelectItem key="2D">2D</SelectItem>
            <SelectItem key="3D">3D</SelectItem>
          </Select>
          
          <Select
            placeholder="Location"
            selectedKeys={filters.location ? [filters.location] : []}
            onSelectionChange={function(keys) {
              var selected = Array.from(keys)[0] || "";
              setFilters(function(prev) {
                return Object.assign({}, prev, { location: selected });
              });
            }}
            className="w-40"
          >
            <SelectItem key="Exterior">Exterior</SelectItem>
            <SelectItem key="Interior">Interior</SelectItem>
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
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(function(product) {
              return (
                <Card key={product.id} className="h-full">
                  <CardBody className="p-0">
                    <div className="relative h-48 bg-content2">
                      <Image
                        removeWrapper
                        src={product.imagesNightUrl || product.imagesDayUrl || "/demo-images/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                      {!product.isActive && (
                        <Chip size="sm" color="warning" className="absolute top-2 right-2">
                          Archived
                        </Chip>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
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
                      />
                      <Input
                        label="Price (€)"
                        type="number"
                        placeholder="1299"
                        value={formData.price}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { price: val });
                          });
                        }}
                      />
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
                      />
                      <Input
                        label="Old Price (€)"
                        type="number"
                        placeholder="Optional"
                        value={formData.oldPrice}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { oldPrice: val });
                          });
                        }}
                      />
                    </div>

                    {/* Dropdowns */}
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Type"
                        placeholder="Select type"
                        selectedKeys={formData.type ? [formData.type] : []}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { type: selected });
                          });
                        }}
                      >
                        <SelectItem key="2D">2D</SelectItem>
                        <SelectItem key="3D">3D</SelectItem>
                      </Select>
                      
                      <Select
                        label="Location"
                        placeholder="Select location"
                        selectedKeys={formData.location ? [formData.location] : []}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { location: selected });
                          });
                        }}
                      >
                        <SelectItem key="Exterior">Exterior</SelectItem>
                        <SelectItem key="Interior">Interior</SelectItem>
                      </Select>
                      
                      <Input
                        label="Usage"
                        placeholder="Ex: Shopping"
                        value={formData.usage}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { usage: val });
                          });
                        }}
                      />
                      
                      <Select
                        label="Mount"
                        placeholder="Select mount"
                        selectedKeys={formData.mount ? [formData.mount] : []}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { mount: selected });
                          });
                        }}
                      >
                        <SelectItem key="Poste">Pole</SelectItem>
                        <SelectItem key="Chão">Floor</SelectItem>
                        <SelectItem key="Transversal">Transversal</SelectItem>
                      </Select>
                      
                      <Select
                        label="Ano da Coleção"
                        placeholder="Selecione o ano"
                        selectedKeys={formData.releaseYear ? [formData.releaseYear] : []}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { releaseYear: selected });
                          });
                        }}
                      >
                        {function() {
                          var yearItems = [];
                          for (var i = 0; i < availableYears.length; i++) {
                            var year = availableYears[i];
                            yearItems.push(
                              <SelectItem key={String(year)} value={String(year)}>
                                {year}
                              </SelectItem>
                            );
                          }
                          return yearItems;
                        }()}
                      </Select>
                    </div>

                    {/* Upload de imagens */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Imagem Dia */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Day Image</label>
                        <input
                          ref={dayImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={function(e) {
                            handleImageChange("dayImage", e.target.files[0]);
                          }}
                          className="hidden"
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
                        <label className="block text-sm font-medium mb-2">Night Image</label>
                        <input
                          ref={nightImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={function(e) {
                            handleImageChange("nightImage", e.target.files[0]);
                          }}
                          className="hidden"
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
                        <label className="block text-sm font-medium mb-2">Animation/Video</label>
                        <input
                          ref={animationInputRef}
                          type="file"
                          accept="video/*"
                          onChange={function(e) {
                            handleImageChange("animation", e.target.files[0]);
                          }}
                          className="hidden"
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
                    </div>

                    {/* Cores Disponíveis */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Selecionar cores:</label>
                      <div className="flex flex-wrap gap-3 p-4 border border-default-200 rounded-lg bg-default-50">
                        {Object.keys(availableColorsList).length === 0 ? (
                          <p className="text-sm text-default-500">Nenhuma cor disponível na base de dados</p>
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
                      <Input
                        label="Tags (comma separated)"
                        placeholder="trending, christmas, sale"
                        value={formData.tags.join(", ")}
                        onValueChange={function(val) {
                          var tagsArray = val.split(",").map(function(tag) {
                            return tag.trim();
                          }).filter(function(tag) {
                            return tag.length > 0;
                          });
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { tags: tagsArray });
                          });
                        }}
                      />
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
                        />
                        <Input
                          label="Weight"
                          placeholder="Ex: 11 kg"
                          value={formData.specs.weight}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              var newSpecs = Object.assign({}, prev.specs, { weight: val });
                              return Object.assign({}, prev, { specs: newSpecs });
                            });
                          }}
                        />
                      </div>
                      
                      {/* Dimensões */}
                      <div className="grid grid-cols-2 gap-2">
                        <h4 className="font-medium col-span-2">Dimensões (em metros)</h4>
                        <Input
                          label="Altura (H)"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 2.4"
                          value={formData.height}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              return Object.assign({}, prev, { height: val });
                            });
                          }}
                        />
                        <Input
                          label="Largura (W)"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 2.0"
                          value={formData.width}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              return Object.assign({}, prev, { width: val });
                            });
                          }}
                        />
                        <Input
                          label="Profundidade (D)"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 0.5"
                          value={formData.depth}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              return Object.assign({}, prev, { depth: val });
                            });
                          }}
                        />
                        <Input
                          label="Diâmetro"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1.2"
                          value={formData.diameter}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              return Object.assign({}, prev, { diameter: val });
                            });
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Effects"
                          placeholder="Ex: SLOWFLASH & SOFT XLED"
                          value={formData.specs.effects}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              var newSpecs = Object.assign({}, prev.specs, { effects: val });
                              return Object.assign({}, prev, { specs: newSpecs });
                            });
                          }}
                        />
                        <Input
                          label="Materials"
                          placeholder="Ex: LED modules, aluminum"
                          value={formData.specs.materiais}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              var newSpecs = Object.assign({}, prev.specs, { materiais: val });
                              return Object.assign({}, prev, { specs: newSpecs });
                            });
                          }}
                        />
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

