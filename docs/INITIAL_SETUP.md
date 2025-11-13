
# Getting Started

## Visão Geral de PWA

- Progressive Web Apps (PWAs) são aplicações web que utilizam APIs modernas para oferecer capacidades avançadas, confiabilidade e instalabilidade numa única base de código.
- Uma PWA típica inclui um manifesto da aplicação web (manifest) para informar o navegador sobre a app e um service worker para gerir a experiência offline.
- Para quem está a começar, vale a pena explorar o curso **Learn PWA** do Google.

## Service Worker

- Funciona como um proxy entre a aplicação web, o navegador e a rede, permitindo experiências offline eficazes, interceptação de pedidos e atualização de assets.
- É um ficheiro JavaScript registado por origem e caminho, capaz de controlar a página associada, interceptar/modificar pedidos e gerir caches de forma granular.
- Também expõe APIs como notificações push e background sync.
- Consulte a documentação oficial da **Service Worker API** para mais detalhes.

## Introdução ao Vite PWA

- O `vite-plugin-pwa` facilita a transformação de aplicações existentes em PWAs com configurações mínimas, fornecendo defaults adequados a casos de uso comuns.
- Principais funcionalidades do plugin:
  - Geração do manifesto da aplicação web e sua injeção no ponto de entrada.
  - Geração do service worker de acordo com a estratégia configurada.
  - Criação do script de registo do service worker no navegador.

## Requisitos de Compatibilidade

- O Vite requer Node.js 18.x.x ou 20+.
- Alguns templates podem necessitar versões superiores; atualize o Node se o gestor de pacotes alertar.

## Scaffold do Projeto

```bash
pnpm create @vite-pwa/pwa
```

- Siga as instruções solicitadas.
- Para definir nome do projeto e template diretamente (ex. Vue):

```bash
pnpm create @vite-pwa/pwa my-vue-app --template vue
```

- Templates suportados: `vanilla`, `vanilla-ts`, `vue`, `vue-ts`, `react`, `react-ts`, `preact`, `preact-ts`, `lit`, `lit-ts`, `svelte`, `svelte-ts`, `solid`, `solid-ts`.

## Instalação do Plugin

```bash
pnpm add -D vite-plugin-pwa
```

## Configuração Básica

- Edite `vite.config.js` ou `vite.config.ts`:

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({ registerType: 'autoUpdate' })
  ]
})
```

- Esta configuração mínima gera o manifest, cria o service worker e trata do registo no browser.
- Veja todas as opções disponíveis em `client.d.ts` do plugin.

## Opções de Registo do Service Worker

- A opção `injectRegister` controla como o plugin regista o service worker:
  - `auto` (default): ajusta-se automaticamente; se não importar módulos virtuais, injeta um script; caso contrário, o módulo responsável fará o registo.
  - `inline`: regista o service worker com um script inline no entry point.
  - `script`: adiciona uma tag `<script>` no `<head>` apontando para um `registerSW.js` gerado.
  - `script-defer` (desde v0.17.2+): semelhante a `script`, mas com `defer`.
  - `null`: não faz nada; deverá registar manualmente ou importar módulos virtuais do plugin.

- Exemplo de configuração explícita:

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      injectRegister: 'auto'
    })
  ]
})
```

- Consulte a secção de Frameworks da documentação do plugin para detalhes sobre os módulos virtuais disponíveis.

## Precache do Service Worker

- Um service worker com capacidades PWA precisa de um manifest de pré-cache contendo todos os recursos essenciais da aplicação.
- Durante a instalação, o navegador descarrega os recursos listados, garantindo funcionamento offline e durante interceções de rede.
- Os recursos são descarregados em background, permitindo que a app continue utilizável enquanto o service worker instala ou atualiza.
- O `vite-plugin-pwa` (via `workbox-build`) inclui por padrão ficheiros `css`, `js` e `html` gerados no `dist`.
- Para cachear outros formatos (ex. `ico`, `png`, `svg`), configure `globPatterns` na secção `workbox` (estratégia `generateSW`) ou `injectManifest` conforme necessário.

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
```

- Para estratégias específicas e inclusão de ativos estáticos, consulte a secção **Static assets handling** da documentação.

## Gestão de Atualizações e Prompts

- O plugin ativa automaticamente `cleanupOutdatedCaches`, removendo ativos antigos quando uma nova versão é publicada; evite desativar esta opção.
- Em `injectManifest` (v0.18.0+), pode configurar `minify`, `sourcemap` e `enableWorkboxModulesLogs`; a geração de source maps segue `build.sourcemap`.
- Para gerar source maps do service worker com `generateSW`, defina:

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      workbox: {
        sourcemap: true
      }
    })
  ]
})
```

- Para recarregamento automático (`registerType: 'autoUpdate'`) sem intervenção do utilizador:

```javascript
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })
```

- Tenha atenção: páginas com formulários podem perder dados ao recarregar automaticamente; avalie usar prompts em vez desta abordagem.
- Para mostrar prompts ao utilizador (ex. atualização ou modo offline), importe `registerSW`:

```javascript
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // mostrar modal com opções Atualizar / Cancelar
  },
  onOfflineReady() {
    // informar que a app está pronta para funcionar offline (exibir botão OK)
  },
})

// Quando o utilizador aceitar atualizar:
// updateSW()
```

- Em SSR/SSG, registe o service worker apenas no cliente, por exemplo:

```javascript
if (typeof window !== 'undefined')
  import('./pwa')
```

- Garanta que os prompts são fechados quando o utilizador confirma ou recusa a ação.

## Nota Importante (versões < 0.12.2)

- Existe um bug relacionado com `injectRegister`; utilize:

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
})
```

## Opção para Ambiente de Desenvolvimento

- Ative `devOptions` para testar o manifest e o service worker em `dev`:

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      }
    })
  ]
})
```

- Após o build, o manifest é gerado e ligado ao entry point, o service worker é criado e o script de registo é incluído.

## Referências

- O plugin `vite-plugin-pwa` utiliza a biblioteca `workbox-build` para construir o service worker.
- Consulte as secções **Service Worker Strategies And Behaviors** e **Workbox** para aprofundar conhecimentos.

