/**
 * Product Components
 * Centralized exports for all product admin components
 */

// Form Components
export { ProductFormBasicFields } from './ProductFormBasicFields';
export { ProductFormPrices } from './ProductFormPrices';
export { ProductFormImages } from './ProductFormImages';
export { ProductFormColors } from './ProductFormColors';
export { ProductFormSpecs } from './ProductFormSpecs';
export { ProductModal } from './ProductModal';

// List Components  
export { ProductFilters } from './ProductFilters';
export { ProductBulkActions } from './ProductBulkActions';

// Note: ProductCard and ProductList are kept in AdminProducts.jsx for now
// to minimize integration risk. They can be extracted in a future refactoring.
