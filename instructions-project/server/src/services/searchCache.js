/**
 * Serviço de cache in-memory para resultados de pesquisa
 * Cache simples com TTL (Time To Live) para melhorar performance
 */

class SearchCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 3 * 60 * 1000; // 3 minutos por padrão
    this.maxSize = 1000; // Máximo de 1000 entradas no cache
  }

  /**
   * Gera chave de cache baseada em tipo e query
   * @param {string} type - Tipo de pesquisa ('products' ou 'projects')
   * @param {string} query - Query de pesquisa
   * @param {object} filters - Filtros adicionais (opcional)
   * @returns {string} Chave de cache
   */
  generateKey(type, query, filters = {}) {
    const filterStr = JSON.stringify(filters);
    return `${type}:${query}:${filterStr}`;
  }

  /**
   * Obtém valor do cache
   * @param {string} key - Chave de cache
   * @returns {any|null} Valor em cache ou null se não existir/expirado
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Armazena valor no cache
   * @param {string} key - Chave de cache
   * @param {any} data - Dados para armazenar
   * @param {number} ttl - Time to live em milissegundos (opcional)
   */
  set(key, data, ttl = null) {
    // Limpar cache se exceder tamanho máximo
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Remove entrada do cache
   * @param {string} key - Chave de cache
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Limpa todas as entradas expiradas
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // Se ainda estiver cheio após limpeza, remover entradas mais antigas
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      const toRemove = sortedEntries.slice(0, Math.floor(this.maxSize * 0.2)); // Remover 20% mais antigas
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Limpa cache por tipo (ex: limpar apenas cache de produtos)
   * @param {string} type - Tipo de cache a limpar ('products' ou 'projects')
   */
  clearByType(type) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Obtém estatísticas do cache
   * @returns {object} Estatísticas do cache
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize
    };
  }
}

// Instância singleton do cache
const searchCache = new SearchCache();

// Limpeza automática a cada 5 minutos
setInterval(() => {
  searchCache.cleanup();
}, 5 * 60 * 1000);

export default searchCache;





