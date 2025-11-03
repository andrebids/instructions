import { decorationsAPI } from './api';

// Serviço fino para busca de decorações com filtros
// Aceita params: { q, category, heightMin, heightMax, priceMin, priceMax, page, limit, sort, order }
export async function fetchDecorations(params) {
  return await decorationsAPI.search(params || {});
}

export default {
  fetchDecorations,
};


