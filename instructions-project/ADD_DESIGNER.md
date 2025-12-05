# Como adicionar um designer aleatório a um projeto

## Opção 1: Via Console do Navegador

Quando estiver na página de detalhes do projeto, abra o console do navegador (F12) e execute:

```javascript
// Obter ID do projeto da URL
const projectId = window.location.pathname.split('/projects/')[1]?.split('/')[0]?.split('?')[0];

if (!projectId) {
  console.error('❌ Não foi possível encontrar o ID do projeto na URL');
} else {
  console.log('🎨 Adicionando designer aleatório ao projeto:', projectId);
  
  // Importar a API (se disponível) ou fazer requisição direta
  fetch(`/api/projects/${projectId}/add-random-designer`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  })
  .then(data => {
    console.log('✅ Designer adicionado com sucesso!', data);
    // Recarregar a página para ver o designer
    window.location.reload();
  })
  .catch(error => {
    console.error('❌ Erro ao adicionar designer:', error);
  });
}
```

## Opção 2: Via Script do Servidor

Execute no terminal (substitua `<project-id>` pelo ID do projeto):

```bash
cd server
node src/scripts/add-random-designer-to-project.js <project-id>
```

## Opção 3: Via API Direta

Você pode fazer uma requisição PATCH diretamente para:

```
PATCH /api/projects/:id/add-random-designer
```

Exemplo com curl:

```bash
curl -X PATCH http://localhost:5000/api/projects/<project-id>/add-random-designer \
  -H "Content-Type: application/json" \
  --cookie "authjs.session-token=..."
```

