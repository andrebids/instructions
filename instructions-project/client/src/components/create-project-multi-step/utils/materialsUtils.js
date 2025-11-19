import { materialsData } from '../data/materialsData.js';

/**
 * Busca um componente pelo ID
 */
export const getComponenteById = (id) => {
  return materialsData.componentes.find(c => c.id === id) || null;
};

/**
 * Busca uma cor pelo ID
 */
export const getCorById = (id) => {
  return materialsData.cores.find(c => c.id === id) || null;
};

/**
 * Busca um acabamento pelo ID
 */
export const getAcabamentoById = (id) => {
  return materialsData.acabamentos.find(a => a.id === id) || null;
};

/**
 * Busca um tamanho pelo ID
 */
export const getTamanhoById = (id) => {
  return materialsData.tamanhos.find(t => t.id === id) || null;
};

/**
 * Retorna as cores disponíveis para um componente específico
 * baseado nas combinações existentes
 */
export const getCoresByComponente = (componenteId) => {
  if (!componenteId) return [];
  
  // Buscar todas as combinações para este componente
  const combinacoes = materialsData.combinacoes.filter(
    c => c.componenteId === componenteId
  );
  
  // Extrair IDs de cores únicos
  const corIds = [...new Set(combinacoes.map(c => c.corId))];
  
  // Buscar os objetos de cores correspondentes
  return corIds
    .map(corId => getCorById(corId))
    .filter(cor => cor !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome));
};

/**
 * Retorna a combinação correspondente a um componente e cor
 * Retorna a primeira combinação encontrada (pode haver múltiplas com unidades diferentes)
 */
export const getCombinacaoByComponenteECor = (componenteId, corId) => {
  if (!componenteId || !corId) return null;
  
  return materialsData.combinacoes.find(
    c => c.componenteId === componenteId && c.corId === corId
  ) || null;
};

/**
 * Retorna todas as combinações para um componente e cor
 */
export const getCombinacoesByComponenteECor = (componenteId, corId) => {
  if (!componenteId || !corId) return [];
  
  return materialsData.combinacoes.filter(
    c => c.componenteId === componenteId && c.corId === corId
  );
};

/**
 * Retorna a bola correspondente à combinação de cor, acabamento e tamanho
 */
export const getBolaBySelecao = (corId, acabamentoId, tamanhoId) => {
  if (!corId || !acabamentoId || !tamanhoId) return null;
  
  return materialsData.bolas.find(
    b => b.corId === corId && b.acabamentoId === acabamentoId && b.tamanhoId === tamanhoId
  ) || null;
};

/**
 * Retorna todas as cores disponíveis nas bolas
 */
export const getCoresDisponiveisBolas = () => {
  const corIds = [...new Set(materialsData.bolas.map(b => b.corId))];
  return corIds
    .map(corId => getCorById(corId))
    .filter(cor => cor !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome));
};

/**
 * Retorna os acabamentos disponíveis para uma cor específica nas bolas
 */
export const getAcabamentosByCorBola = (corId) => {
  if (!corId) return materialsData.acabamentos;
  
  const bolasFiltradas = materialsData.bolas.filter(b => b.corId === corId);
  const acabamentoIds = [...new Set(bolasFiltradas.map(b => b.acabamentoId))];
  
  return acabamentoIds
    .map(id => getAcabamentoById(id))
    .filter(a => a !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome));
};

/**
 * Retorna os tamanhos disponíveis para uma cor e acabamento específicos nas bolas
 */
export const getTamanhosByCorEAcabamentoBola = (corId, acabamentoId) => {
  if (!corId || !acabamentoId) return materialsData.tamanhos;
  
  const bolasFiltradas = materialsData.bolas.filter(
    b => b.corId === corId && b.acabamentoId === acabamentoId
  );
  const tamanhoIds = [...new Set(bolasFiltradas.map(b => b.tamanhoId))];
  
  return tamanhoIds
    .map(id => getTamanhoById(id))
    .filter(t => t !== null)
    .sort((a, b) => {
      // Ordenar por tamanho numérico
      const sizeA = parseFloat(a.nome);
      const sizeB = parseFloat(b.nome);
      return sizeA - sizeB;
    });
};

