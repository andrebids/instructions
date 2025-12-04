# Scripts de Gerenciamento do Projeto

Este diretório contém scripts organizados para gerenciar operações Docker e GitHub Packages.

## Estrutura

```
scripts/
├── docker/
│   ├── rebuild-dev.bat          # Rebuild do ambiente de desenvolvimento
│   └── cleanup-images.bat        # Limpeza de imagens Docker
├── github/
│   ├── build-and-push.bat       # Build e push para GitHub Packages
│   └── login.bat                 # Autenticação GitHub
└── utils/
    ├── common.bat                # Funções comuns (cores, validações)
    └── docker-check.bat          # Verificações do Docker
```

## Uso

Execute o script principal na raiz do projeto:

```batch
manage-project.bat
```

O script apresenta um menu interativo com as seguintes opções:

1. **Rebuild Ambiente Dev (sem cache)** - Reconstrói o ambiente de desenvolvimento sem usar cache
2. **Build e Push para GitHub Packages** - Constrói e envia a imagem Docker para GitHub Container Registry
3. **Sair**

## Configuração

### Variáveis de Ambiente (.env)

Para usar a funcionalidade de build e push para GitHub Packages, crie ou edite o arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# GitHub Container Registry
GITHUB_USERNAME=seu_usuario_github
GITHUB_TOKEN=seu_personal_access_token
GITHUB_REPO=username/repo-name
```

### Criar Personal Access Token

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" > "Generate new token (classic)"
3. Dê um nome ao token (ex: "Docker Push")
4. Selecione a permissão: `write:packages`
5. Clique em "Generate token"
6. Copie o token e adicione ao arquivo `.env` como `GITHUB_TOKEN`

## Funcionalidades

### Rebuild Dev Environment

- Para e remove o container atual
- Limpa imagens antigas do projeto
- Reconstrói a imagem sem cache
- Inicia o novo container
- Limpa imagens intermediárias após o build

### Build e Push GitHub Packages

- Carrega credenciais do arquivo `.env`
- Faz login automático no GitHub Container Registry
- Constrói a imagem de produção
- Cria tags `latest` e versionada
- Envia ambas as tags para GitHub Packages
- Opção de limpar imagens locais após push

## Requisitos

- Docker Desktop instalado e rodando
- Docker Compose (v2 ou v1)
- Windows 10/11
- Arquivo `.env` configurado (para GitHub Packages)

## Notas

- Os scripts usam caminhos relativos e funcionam a partir do diretório do projeto
- As imagens antigas são automaticamente limpas para evitar duplicação
- O script garante que apenas a última build seja usada no ambiente dev

