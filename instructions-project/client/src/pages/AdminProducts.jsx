import React from 'react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Checkbox,
  Skeleton,
  useDisclosure,
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { PageTitle } from '../components/layout/page-title';
import { useUser } from '../context/UserContext';
import { useResponsiveProfile } from '../hooks/useResponsiveProfile';
import { Scroller } from '../components/ui/scroller';
import { useTranslation } from 'react-i18next';
import { PLACEHOLDER_SVG } from '../utils/imageUtils';
import { useUserRole } from '../hooks/useUserRole';
import { useProductForm } from './hooks/useProductForm';
import { useProductImages } from './hooks/useProductImages';
import { useProductSelection } from './hooks/useProductSelection';
import { useProductFilters } from './hooks/useProductFilters';
import { useProductManagement } from './hooks/useProductManagement';
import {
  ProductModal,
  ProductFilters,
  ProductBulkActions,
} from '../components/admin/products';
import { TAG_CONFIGS } from '../utils/products';

export default function AdminProducts() {
  const { t } = useTranslation();
  const { userName } = useUser();
  const { isAdmin, isEditorStock, isLoaded } = useUserRole();
  const { isHandheld } = useResponsiveProfile();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  // Role verification
  React.useEffect(() => {
    if (isLoaded && !isAdmin && !isEditorStock) {
      window.location.href = '/';
    }
  }, [isLoaded, isAdmin, isEditorStock]);

  // Tag translation helper
  const getTranslatedTag = React.useCallback((tag) => {
    if (!tag) return tag;
    const tagLower = String(tag).toLowerCase();
    const tagMap = {
      'priority': t('pages.dashboard.adminProducts.tags.priority'),
      'priori': t('pages.dashboard.adminProducts.tags.priority'),
      'sale': t('pages.dashboard.adminProducts.tags.sale'),
      'new': t('pages.dashboard.adminProducts.tags.new'),
      'trending': t('pages.dashboard.adminProducts.tags.trending'),
      'summer': t('pages.dashboard.adminProducts.tags.summer'),
      'christmas': t('pages.dashboard.adminProducts.tags.christmas'),
      'xmas': t('pages.dashboard.adminProducts.tags.christmas'),
    };

    if (tagMap[tagLower]) return tagMap[tagLower];
    
    for (const [key, value] of Object.entries(tagMap)) {
      if (tagLower.indexOf(key) >= 0) return value;
    }
    
    return String(tag).toUpperCase();
  }, [t]);

  // Custom hooks
  const imageHandlers = useProductImages();
  const {
    products,
    loading,
    error,
    setError,
    editingProduct,
    formData,
    setFormData,
    availableYears,
    availableColorsList,
    loadProducts,
    handleCreateNew,
    handleEdit,
    handleArchive,
    handleUnarchive,
    handleDelete,
    handleBulkArchive,
    handleBulkUnarchive,
    handleBulkDelete,
    handleAddColor,
    handleRemoveColor,
    handleSubmit,
  } = useProductManagement(
    onModalOpen,
    onModalClose,
    imageHandlers,
    new Set(), // Will be updated by useProductSelection
    () => {} // Will be updated by useProductSelection
  );

  const {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
    filteredProducts,
    handleSearch,
    clearFilters,
  } = useProductFilters(products);

  const {
    isSelectionMode,
    selectedProducts,
    toggleSelectionMode,
    toggleProductSelection,
    toggleSelectAll,
    clearSelection,
  } = useProductSelection(filteredProducts);

  // Formik for form validation
  const formik = useProductForm(formData, () => {});

  // Load products on mount and when filters change
  React.useEffect(() => {
    loadProducts(filters, showArchived);
  }, [filters, showArchived]);

  // Render helper for product tags
  const renderProductTags = (product) => {
    if (!product.tags || !Array.isArray(product.tags) || product.tags.length === 0) {
      return null;
    }

    const getTagPriority = (tag) => {
      const tagLower = String(tag).toLowerCase();
      if (tagLower === 'priority' || tagLower.indexOf('priority') >= 0 || tagLower.indexOf('priori') >= 0) return 1;
      if (tagLower === 'sale' || tagLower.indexOf('sale') >= 0) return 2;
      if (tagLower === 'new') return 3;
      if (tagLower === 'trending' || tagLower.indexOf('trending') >= 0) return 4;
      if (tagLower === 'summer' || tagLower.indexOf('summer') >= 0) return 4;
      if (tagLower === 'christmas' || tagLower.indexOf('christmas') >= 0 || tagLower.indexOf('xmas') >= 0) return 4;
      return 5;
    };

    const sortedTags = product.tags.slice().sort((a, b) => getTagPriority(a) - getTagPriority(b));

    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {sortedTags.map((tag) => {
          const tagLower = String(tag).toLowerCase();
          let tagConfig = TAG_CONFIGS[tagLower] || { label: getTranslatedTag(tag) || String(tag), color: '#6b7280', bgColor: '#6b728020' };
          
          // Handle tag variations
          if (tagLower.indexOf('sale') >= 0) tagConfig = TAG_CONFIGS.sale;
          else if (tagLower.indexOf('priority') >= 0 || tagLower.indexOf('priori') >= 0) tagConfig = TAG_CONFIGS.priority;
          else if (tagLower.indexOf('trending') >= 0) tagConfig = TAG_CONFIGS.trending;
          else if (tagLower.indexOf('summer') >= 0) tagConfig = TAG_CONFIGS.summer;
          else if (tagLower.indexOf('christmas') >= 0 || tagLower.indexOf('xmas') >= 0) tagConfig = TAG_CONFIGS.christmas;

          return (
            <Chip
              key={tag}
              size="sm"
              style={{
                backgroundColor: tagConfig.bgColor || tagConfig.color + '20',
                color: tagConfig.color,
                borderColor: tagConfig.color,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
              className="text-xs font-medium"
            >
              {tagConfig.label}
            </Chip>
          );
        })}
      </div>
    );
  };

  // Render helper for product image
  const renderProductImage = (product) => {
    // Get base URL for uploads (same logic as ProductModal and ProductMediaViewer)
    // Em desenvolvimento, usar caminhos relativos para passar pelo proxy do Vite
    // Em produção, usar /api/uploads diretamente
    const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || '';
    const isProduction = !baseApi || baseApi === '';
    
    const mapPath = function (path) {
      if (!path) return path;
      // Se já começa com /api/uploads/, retornar como está
      if (path.startsWith('/api/uploads/')) return path;
      // Se começa com /uploads/, converter para /api/uploads/
      // Em desenvolvimento: usar caminho relativo para passar pelo proxy do Vite
      // Em produção: usar caminho relativo também (mesma origem)
      if (path.startsWith('/uploads/')) {
        return '/api' + path;
      }
      return path;
    };
    
    const choose = product.imagesNightUrl || product.imagesDayUrl || product.thumbnailUrl || PLACEHOLDER_SVG;
    let src;
    
    // Construir URL corretamente baseado no tipo de caminho
    if (choose.startsWith('data:')) {
      // Data URL (SVG inline)
      src = choose;
    } else if (choose.startsWith('/SHOP/')) {
      // Imagens em /SHOP/ são servidas diretamente do client/public
      src = choose;
    } else {
      // Usar mapPath para /uploads/ e outros caminhos
      src = mapPath(choose);
    }

    return (
      <img
        src={src}
        alt={product.name}
        className="w-full h-full object-contain"
        decoding="async"
        loading="lazy"
        onLoad={() => {
          // Image loaded successfully
        }}
        onError={(e) => {
          // Prevent infinite error loop
          const attemptCount = parseInt(e.target.getAttribute('data-attempt') || '0');
          
          // Log detalhado do erro apenas em caso de erro crítico
          if (attemptCount >= 2) {
            e.target.src = PLACEHOLDER_SVG;
            return;
          }
          e.target.setAttribute('data-attempt', String(attemptCount + 1));
          
          // Try day image as fallback on first error
          if (attemptCount === 0) {
            const day = product.imagesDayUrl;
            if (day && day !== choose) {
              let fallbackSrc;
              if (day.startsWith('/SHOP/')) {
                fallbackSrc = day;
              } else {
                fallbackSrc = mapPath(day);
              }
              e.target.src = fallbackSrc;
              return;
            }
          }
          
          // Use SVG placeholder as final fallback
          e.target.src = PLACEHOLDER_SVG;
        }}
      />
    );
  };

  return (
    <div className={`flex-1 min-h-0 overflow-hidden p-6 flex flex-col ${isHandheld ? 'pb-24' : 'pb-6'}`}>
      <PageTitle
        title={t('pages.dashboard.adminProducts.title')}
        userName={userName}
        lead={t('pages.dashboard.adminProducts.lead')}
        subtitle={t('pages.dashboard.adminProducts.subtitle')}
      />

      {/* Filters and Create Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <ProductFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          filters={filters}
          onFilterChange={setFilters}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          onClearFilters={clearFilters}
        />
        <Button
          color="primary"
          onPress={handleCreateNew}
          startContent={<Icon icon="lucide:plus" />}
        >
          {t('pages.dashboard.adminProducts.createNewProduct')}
        </Button>
      </div>

      {/* Bulk Actions */}
      <ProductBulkActions
        isSelectionMode={isSelectionMode}
        selectedProducts={selectedProducts}
        filteredProducts={filteredProducts}
        onToggleSelectionMode={toggleSelectionMode}
        onSelectAll={toggleSelectAll}
        onClearSelection={clearSelection}
        onBulkArchive={handleBulkArchive}
        onBulkUnarchive={handleBulkUnarchive}
        onBulkDelete={handleBulkDelete}
      />

      {/* Product List */}
      {loading ? (
        <Scroller className={`flex-1 ${isHandheld ? 'pb-24' : 'pb-6'}`} hideScrollbar>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-full" radius="lg">
                <CardBody className="p-0 overflow-hidden">
                  <Skeleton className="rounded-none">
                    <div className="h-48 bg-default-300"></div>
                  </Skeleton>
                  <div className="p-4 space-y-3">
                    <Skeleton className="w-3/4 rounded-lg">
                      <div className="h-6 w-3/4 rounded-lg bg-default-200"></div>
                    </Skeleton>
                    <div className="flex gap-2">
                      <Skeleton className="w-16 rounded-lg">
                        <div className="h-6 w-16 rounded-lg bg-default-200"></div>
                      </Skeleton>
                      <Skeleton className="w-16 rounded-lg">
                        <div className="h-6 w-16 rounded-lg bg-default-200"></div>
                      </Skeleton>
                    </div>
                    <Skeleton className="w-1/2 rounded-lg">
                      <div className="h-4 w-1/2 rounded-lg bg-default-200"></div>
                    </Skeleton>
                    <div className="flex gap-2 mt-4">
                      <Skeleton className="w-20 rounded-lg">
                        <div className="h-8 w-20 rounded-lg bg-default-200"></div>
                      </Skeleton>
                      <Skeleton className="w-20 rounded-lg">
                        <div className="h-8 w-20 rounded-lg bg-default-200"></div>
                      </Skeleton>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </Scroller>
      ) : error ? (
        <Card className="p-6">
          <CardBody>
            <p className="text-danger">Error: {error}</p>
            <Button onPress={() => loadProducts(filters, showArchived)} className="mt-4">
              {t('pages.dashboard.adminProducts.status.tryAgain')}
            </Button>
          </CardBody>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-6">
          <CardBody>
            <p className="text-center text-default-500">{t('pages.dashboard.adminProducts.status.noProductsFound')}</p>
            <p className="text-center text-default-400 text-sm mt-2">
              Total products loaded: {products.length} |
              Search query: "{searchQuery}" |
              Active filters: {JSON.stringify(filters)}
            </p>
          </CardBody>
        </Card>
      ) : (
        <Scroller className={`flex-1 ${isHandheld ? 'pb-24' : 'pb-6'}`} hideScrollbar>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full hover:scale-[1.02] transition-transform duration-200 shadow-sm hover:shadow-md">
                    <CardBody className="p-0">
                      <div className="relative h-48 bg-content2">
                        {/* Selection checkbox */}
                        {isSelectionMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              isSelected={selectedProducts.has(product.id)}
                              onValueChange={() => toggleProductSelection(product.id)}
                              classNames={{
                                base: 'bg-white/90 dark:bg-black/90 rounded-md p-1',
                              }}
                            />
                          </div>
                        )}
                        {renderProductImage(product)}
                        {!product.isActive && (
                          <Chip size="sm" color="warning" className="absolute top-2 right-2">
                            {t('pages.dashboard.adminProducts.status.archived')}
                          </Chip>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                        {renderProductTags(product)}
                        <p className="text-default-500 text-sm mb-2">
                          €{product.price}
                          {product.oldPrice && (
                            <span className="line-through text-default-400 ml-2">€{product.oldPrice}</span>
                          )}
                        </p>
                        <p className="text-default-400 text-xs mb-2">
                          {t('pages.dashboard.adminProducts.status.stock')} {product.stock}
                        </p>
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => handleEdit(product)}
                            startContent={<Icon icon="lucide:edit" />}
                          >
                            {t('pages.dashboard.adminProducts.actions.edit')}
                          </Button>
                          {product.isActive ? (
                            <Button
                              size="sm"
                              variant="flat"
                              color="warning"
                              onPress={() => handleArchive(product.id)}
                              startContent={<Icon icon="lucide:archive" />}
                            >
                              {t('pages.dashboard.adminProducts.actions.archive')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="flat"
                              color="success"
                              onPress={() => handleUnarchive(product.id)}
                              startContent={<Icon icon="lucide:archive-restore" />}
                            >
                              {t('pages.dashboard.adminProducts.actions.unarchive')}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => handleDelete(product.id)}
                            startContent={<Icon icon="lucide:trash-2" />}
                          >
                            {t('pages.dashboard.adminProducts.actions.delete')}
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Scroller>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        editingProduct={editingProduct}
        formik={formik}
        formData={formData}
        setFormData={setFormData}
        availableYears={availableYears}
        imageFiles={imageHandlers.imageFiles}
        imagePreviews={imageHandlers.imagePreviews}
        onImageChange={imageHandlers.handleImageChange}
        onClearPreview={imageHandlers.clearPreview}
        availableColors={availableColorsList}
        onAddColor={handleAddColor}
        onRemoveColor={handleRemoveColor}
        onSubmit={() => handleSubmit(formik)}
        loading={loading}
      />
    </div>
  );
}
