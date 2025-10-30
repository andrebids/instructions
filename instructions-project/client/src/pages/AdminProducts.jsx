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
    isSourceImage: false,
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
        setLoading(false);
      })
      .catch(function(err) {
        console.error("❌ [AdminProducts] Erro ao carregar produtos:", err);
        console.error("❌ [AdminProducts] Erro completo:", JSON.stringify(err, null, 2));
        console.error("❌ [AdminProducts] Mensagem:", err.message);
        console.error("❌ [AdminProducts] Response:", err.response);
        setError(err.message || "Erro ao carregar produtos");
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
        setError(err.message || "Erro ao pesquisar produtos");
        setLoading(false);
      });
  }, [searchQuery, loadProducts]);

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
      isSourceImage: false,
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
    onModalOpen();
  };

  // Abrir modal para editar produto
  var handleEdit = function(product) {
    setEditingProduct(product);
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
      isSourceImage: product.isSourceImage || false,
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
    onModalOpen();
  };

  // Arquivar produto
  var handleArchive = function(productId) {
    if (!window.confirm("Tem certeza que deseja arquivar este produto? Ele não ficará visível.")) {
      return;
    }
    
    productsAPI.archive(productId)
      .then(function() {
        loadProducts();
      })
      .catch(function(err) {
        console.error("Erro ao arquivar produto:", err);
        alert("Erro ao arquivar produto: " + (err.message || "Erro desconhecido"));
      });
  };
  
  // Desarquivar produto
  var handleUnarchive = function(productId) {
    productsAPI.unarchive(productId)
      .then(function() {
        loadProducts();
      })
      .catch(function(err) {
        console.error("Erro ao desarquivar produto:", err);
        alert("Erro ao desarquivar produto: " + (err.message || "Erro desconhecido"));
      });
  };
  
  // Deletar produto permanentemente (hard delete)
  var handleDelete = function(productId) {
    if (!window.confirm("⚠️ ATENÇÃO: Esta ação é PERMANENTE e não pode ser desfeita!\n\nTem certeza que deseja DELETAR PERMANENTEMENTE este produto da base de dados?")) {
      return;
    }
    
    productsAPI.delete(productId)
      .then(function() {
        loadProducts();
      })
      .catch(function(err) {
        console.error("Erro ao deletar produto:", err);
        alert("Erro ao deletar produto: " + (err.message || "Erro desconhecido"));
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

  // Handler para adicionar cor
  var handleAddColor = function() {
    var newColors = Object.assign({}, formData.availableColors);
    var colorName = 'Nova Cor ' + (Object.keys(newColors).length + 1);
    newColors[colorName] = '#FFFFFF';
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
  
  // Handler para atualizar cor
  var handleColorChange = function(colorName, hexValue) {
    var newColors = Object.assign({}, formData.availableColors);
    newColors[colorName] = hexValue;
    setFormData(function(prev) {
      return Object.assign({}, prev, { availableColors: newColors });
    });
  };
  
  // Handler para renomear cor
  var handleColorNameChange = function(oldName, newName) {
    if (!newName || newName.trim() === '') return;
    var newColors = Object.assign({}, formData.availableColors);
    var colorValue = newColors[oldName];
    delete newColors[oldName];
    newColors[newName] = colorValue;
    setFormData(function(prev) {
      return Object.assign({}, prev, { availableColors: newColors });
    });
  };

  // Submeter formulário
  var handleSubmit = function() {
    // Validar campos obrigatórios
    if (!formData.name || formData.name.trim() === '') {
      setError("O campo 'Nome' é obrigatório");
      return;
    }
    
    // Função auxiliar para converter strings vazias ou "null" para null
    var toNullIfEmpty = function(value) {
      if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
        return null;
      }
      return value;
    };
    
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
      tags: formData.tags || [],
      specs: formData.specs || null,
      availableColors: formData.availableColors || {},
      variantProductByColor: formData.variantProductByColor || null,
      isSourceImage: formData.isSourceImage || false,
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      season: toNullIfEmpty(formData.season),
      isTrending: formData.isTrending || false,
      releaseYear: formData.releaseYear ? parseInt(formData.releaseYear, 10) : null,
      isOnSale: formData.isOnSale || false,
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
        var errorMessage = err.response?.data?.error || err.message || "Erro ao salvar produto";
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
        title="Administração de Produtos" 
        userName={userName} 
        lead="Gerir produtos da loja" 
        subtitle="Criar, editar e deletar produtos" 
      />
      
      {/* Barra de ações e filtros */}
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Pesquisar produtos..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="max-w-xs"
            />
            <Button onPress={handleSearch} color="primary">Pesquisar</Button>
          </div>
          <Button 
            color="primary" 
            onPress={handleCreateNew}
            startContent={<Icon icon="lucide:plus" />}
          >
            Criar Novo Produto
          </Button>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <Select
            placeholder="Tipo"
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
            placeholder="Localização"
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
          
          <Select
            placeholder="Source Image"
            selectedKeys={filters.isSourceImage !== "" ? [filters.isSourceImage] : []}
            onSelectionChange={function(keys) {
              var selected = Array.from(keys)[0] || "";
              setFilters(function(prev) {
                return Object.assign({}, prev, { isSourceImage: selected });
              });
            }}
            className="w-40"
          >
            <SelectItem key="true">Sim</SelectItem>
            <SelectItem key="false">Não</SelectItem>
          </Select>
          
          <Button
            variant="flat"
            onPress={function() {
              setFilters({});
              setSearchQuery("");
            }}
          >
            Limpar Filtros
          </Button>
          
          <Checkbox
            isSelected={showArchived}
            onValueChange={setShowArchived}
          >
            Mostrar Arquivados
          </Checkbox>
        </div>
      </div>

      {/* Lista de produtos */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="lucide:loader-2" className="text-4xl animate-spin mx-auto mb-2" />
            <p>A carregar produtos...</p>
          </div>
        </div>
      ) : error ? (
        <Card className="p-6">
          <CardBody>
            <p className="text-danger">Erro: {error}</p>
            <Button onPress={loadProducts} className="mt-4">Tentar Novamente</Button>
          </CardBody>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-6">
          <CardBody>
            <p className="text-center text-default-500">Nenhum produto encontrado</p>
            <p className="text-center text-default-400 text-sm mt-2">
              Total de produtos carregados: {products.length} | 
              Query de pesquisa: "{searchQuery}" | 
              Filtros ativos: {JSON.stringify(filters)}
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
                      {product.isSourceImage && (
                        <Chip size="sm" color="primary" className="absolute top-2 left-2">
                          Source Image
                        </Chip>
                      )}
                      {!product.isActive && (
                        <Chip size="sm" color="warning" className="absolute top-2 right-2">
                          Arquivado
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
                          Editar
                        </Button>
                        {product.isActive ? (
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            onPress={function() { handleArchive(product.id); }}
                            startContent={<Icon icon="lucide:archive" />}
                          >
                            Arquivar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="flat"
                            color="success"
                            onPress={function() { handleUnarchive(product.id); }}
                            startContent={<Icon icon="lucide:archive-restore" />}
                          >
                            Desarquivar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={function() { handleDelete(product.id); }}
                          startContent={<Icon icon="lucide:trash-2" />}
                        >
                          Deletar
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
                  {editingProduct ? "Editar Produto" : "Criar Novo Produto"}
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    {/* Campos básicos */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Nome"
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
                        label="Preço (€)"
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
                        label="Preço Antigo (€)"
                        type="number"
                        placeholder="Opcional"
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
                        label="Tipo"
                        placeholder="Selecione o tipo"
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
                        label="Localização"
                        placeholder="Selecione a localização"
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
                        label="Uso"
                        placeholder="Ex: Shopping"
                        value={formData.usage}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { usage: val });
                          });
                        }}
                      />
                      
                      <Select
                        label="Montagem"
                        placeholder="Selecione a montagem"
                        selectedKeys={formData.mount ? [formData.mount] : []}
                        onSelectionChange={function(keys) {
                          var selected = Array.from(keys)[0] || "";
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { mount: selected });
                          });
                        }}
                      >
                        <SelectItem key="Poste">Poste</SelectItem>
                        <SelectItem key="Chão">Chão</SelectItem>
                        <SelectItem key="Transversal">Transversal</SelectItem>
                      </Select>
                    </div>

                    {/* Upload de imagens */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Imagem Dia */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Imagem Dia</label>
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
                          {imageFiles.dayImage ? imageFiles.dayImage.name : "Selecionar Imagem Dia"}
                        </Button>
                        {imagePreviews.dayImage && (
                          <div className="mt-2">
                            <Image
                              src={imagePreviews.dayImage}
                              alt="Preview dia"
                              className="max-h-32 object-contain rounded-lg"
                            />
                          </div>
                        )}
                        <p className="text-xs text-default-500 mt-1">Thumbnail será gerado automaticamente</p>
                      </div>
                      
                      {/* Imagem Noite */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Imagem Noite</label>
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
                          {imageFiles.nightImage ? imageFiles.nightImage.name : "Selecionar Imagem Noite"}
                        </Button>
                        {imagePreviews.nightImage && (
                          <div className="mt-2">
                            <Image
                              src={imagePreviews.nightImage}
                              alt="Preview noite"
                              className="max-h-32 object-contain rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Animação/Vídeo */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Animação/Vídeo</label>
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
                          {imageFiles.animation ? imageFiles.animation.name : "Selecionar Vídeo"}
                        </Button>
                      </div>
                    </div>

                    {/* Cores Disponíveis */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Cores Disponíveis</label>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={handleAddColor}
                          startContent={<Icon icon="lucide:plus" />}
                        >
                          Adicionar Cor
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-3 p-4 border border-default-200 rounded-lg">
                        {Object.keys(formData.availableColors).length === 0 ? (
                          <p className="text-sm text-default-500">Nenhuma cor adicionada</p>
                        ) : (
                          Object.keys(formData.availableColors).map(function(colorName) {
                            return (
                              <div key={colorName} className="flex items-center gap-2 p-2 bg-default-100 rounded-lg">
                                <div
                                  className="w-8 h-8 rounded-full border-2 border-default-300"
                                  style={{ backgroundColor: formData.availableColors[colorName] }}
                                />
                                <input
                                  type="text"
                                  value={colorName}
                                  onChange={function(e) {
                                    handleColorNameChange(colorName, e.target.value);
                                  }}
                                  className="text-sm px-2 py-1 bg-default-50 rounded border border-default-200 min-w-[100px]"
                                />
                                <input
                                  type="color"
                                  value={formData.availableColors[colorName]}
                                  onChange={function(e) {
                                    handleColorChange(colorName, e.target.value);
                                  }}
                                  className="w-8 h-8 rounded border border-default-300 cursor-pointer"
                                />
                                <Button
                                  size="sm"
                                  isIconOnly
                                  variant="light"
                                  color="danger"
                                  onPress={function() {
                                    handleRemoveColor(colorName);
                                  }}
                                >
                                  <Icon icon="lucide:x" />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Input
                        label="Tags (separadas por vírgula)"
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
                      <h4 className="font-medium">Especificações Técnicas</h4>
                      <Textarea
                        label="Descrição"
                        placeholder="Descrição do produto"
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
                          label="Técnicas"
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
                          label="Dimensões"
                          placeholder="Ex: 2.80 m x 0.80 m"
                          value={formData.specs.dimensoes}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              var newSpecs = Object.assign({}, prev.specs, { dimensoes: val });
                              return Object.assign({}, prev, { specs: newSpecs });
                            });
                          }}
                        />
                        <Input
                          label="Peso"
                          placeholder="Ex: 11 kg"
                          value={formData.specs.weight}
                          onValueChange={function(val) {
                            setFormData(function(prev) {
                              var newSpecs = Object.assign({}, prev.specs, { weight: val });
                              return Object.assign({}, prev, { specs: newSpecs });
                            });
                          }}
                        />
                        <Input
                          label="Efeitos"
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
                          label="Materiais"
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
                          label="Política de Stock"
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
                        isSelected={formData.isSourceImage}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { isSourceImage: val });
                          });
                        }}
                      >
                        É Source Image
                      </Checkbox>
                      <Checkbox
                        isSelected={formData.isActive}
                        onValueChange={function(val) {
                          setFormData(function(prev) {
                            return Object.assign({}, prev, { isActive: val });
                          });
                        }}
                      >
                        Produto Ativo
                      </Checkbox>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" onPress={handleSubmit} isLoading={loading}>
                    {editingProduct ? "Atualizar" : "Criar"}
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

