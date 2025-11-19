/**
 * Helpers para gerenciamento de usuários
 * Funções utilitárias para formatação e manipulação de dados de usuários
 */

/**
 * Formata uma data para exibição
 * @param {string} dateString - Data em formato string
 * @returns {string} - Data formatada ou '-'
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Obtém a cor do HeroUI baseada no role do usuário
 * @param {string} role - Role do usuário
 * @returns {string} - Nome da cor do HeroUI
 */
export function getRoleColor(role) {
  switch (role) {
    case 'admin':
      return 'danger';
    case 'comercial':
      return 'primary';
    case 'editor_stock':
      return 'secondary';
    default:
      return 'default';
  }
}

/**
 * Obtém o label traduzido do role
 * @param {string} role - Role do usuário
 * @param {Function} t - Função de tradução do i18next
 * @returns {string} - Label traduzido
 */
export function getRoleLabel(role, t) {
  if (!role) return t('pages.dashboard.adminUsers.status.noRole');
  return t(`pages.dashboard.adminUsers.roles.${role}`);
}

