// Script para adicionar designer aleatório ao projeto atual
// Copie e cole este código no console do navegador (F12) quando estiver na página do projeto

(async function() {
  try {
    // Obter ID do projeto da URL
    const pathParts = window.location.pathname.split('/projects/');
    const projectId = pathParts[1]?.split('/')[0]?.split('?')[0];
    
    if (!projectId) {
      console.error('❌ Não foi possível encontrar o ID do projeto na URL');
      console.log('📝 URL atual:', window.location.pathname);
      return;
    }
    
    console.log('🎨 Adicionando designer aleatório ao projeto:', projectId);
    console.log('⏳ Aguarde...');
    
    // Fazer requisição para adicionar designer
    const response = await fetch(`/api/projects/${projectId}/add-random-designer`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(`Erro ${response.status}: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Designer adicionado com sucesso!', data);
    console.log('🔄 Recarregando página...');
    
    // Recarregar a página após 1 segundo para mostrar o designer
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro ao adicionar designer:', error);
    console.log('💡 Verifique se está autenticado e se o servidor está rodando');
  }
})();

