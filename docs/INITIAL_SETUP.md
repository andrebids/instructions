## Initial Setup

### Requirements

- Mac OS X, Windows ou Linux
- NPM package + Node.js v8 ou superior
- Editor de texto ou IDE configurado para React/JSX/ESLint

### Quick Start

1. Clone o repositório mais recente:
   ```bash
   git clone https://github.com/Atyantik/react-pwa.git
   cd react-pwa
   ```
2. Execute `npm install` para instalar dependências (tanto de runtime quanto ferramentas de desenvolvimento listadas em `package.json`).
3. Inicie o projeto com `npm start` e acesse a app em `http://localhost:3003`.
4. Para gerar o build de produção, execute `npm run build`; o resultado será gerado a partir de `/src` e emitido em `/dist`.

### Directory Structure

```
project-root
  |-- /dist/                        # Compilados de saída
  |-- /node_modules/                # Bibliotecas/utilitários de terceiros
  |-- /src/                         # Código-fonte da aplicação
  |    |-- /routes.js               # Componentes de página e configuração de rotas
  |    |-- /client.js               # Script de inicialização do cliente
  |    |-- /server.js               # Script de inicialização do servidor
  |    |__ /webpack.js              # Configuração extra de compilação para pawjs
  |-- package.json                  # Lista de dependências de terceiros
  |__ pawconfig.json                # Configuração do PawJS
```

### PawJS Configuration

O ficheiro `pawconfig.json` controla o comportamento do boilerplate (framework PawJS). Configuração padrão fornecida:

```json
{
  "port": "3003",
  "host": "0.0.0.0",
  "appRootUrl": "/",
  "serviceWorker": false,
  "serverSideRender": true,
  "singlePageApplication": false
}
```

#### Opções disponíveis

- **port** (`String`, valor padrão `"9090"`): porta onde a aplicação irá correr.
- **host** (`String`, `"0.0.0.0"`): IP/hostname sem esquema (ex.: `127.0.0.1`, `localhost`).
- **appRootUrl** (`String`, `"/"`): raiz da app; útil para deploy em subdiretórios, ex. `/react-pwa`.
- **cdnUrl** (`String`, vazio): URL base de CDN para servir assets. Em CDNs do tipo *push*, enviar arquivos antes do deploy.
- **serviceWorker** (`Boolean`, `true`): ativa/desativa o Service Worker (evitar em desenvolvimento).
- **serverSideRender** (`Boolean`, `true`): ativa SSR para melhor SEO e desempenho.
- **asyncCSS** (`Boolean`, `true`): carrega CSS de forma assíncrona; `false` força carregamento antes do HTML.
- **clientRootElementId** (`String`, `"app"`): ID do elemento root para montar React.
- **hstsEnabled** (`Boolean`, `true`): ativa HTTP Strict Transport Security.
- **hstsmaxAge** (`Integer`, `31536000`): `max-age` do HSTS em segundos.
- **hstsIncludeSubDomains** (`Boolean`, `true`): aplica HSTS a subdomínios.
- **hstsPreload** (`Boolean`, `false`): ativa pré-carregamento HSTS em navegadores.
- **singlePageApplication** (`Boolean`, `false`): força modo SPA com `HashRouter`, indicado para apps sem SSR/SEO.

### Web App Manifest

Configurar o `manifest.json` torna a aplicação progressiva com identidade própria. Configuração padrão do boilerplate:

```json
{
  "name": "PawJS",
  "short_name": "PawJS",
  "dir": "ltr",
  "lang": "en-US",
  "orientation": "any",
  "start_url": "/",
  "background_color": "#fff",
  "theme_color": "#fff",
  "display": "standalone",
  "description": "A highly scalable & plug-able, Progressive Web Application foundation with the best Developer Experience.",
  "icons": [
    {
      "src": "/path-to-pwa-icon-size-192x192.png",
      "sizes": "192x192"
    },
    {
      "src": "/path-to-pwa-icon-size-512x512.png",
      "sizes": "512x512"
    }
  ]
}
```

**Configuração via `src/routes.js`**

```js
import PwaIcon192 from "./resources/images/path-to-pwa-icon-192x192.png";
import PwaIcon512 from "./resources/images/path-to-pwa-icon-512x512.png";

export default class Routes {
  apply(router) {
    router.setPwaSchema({
      name: "MyProgressiveWebApp",
      short_name: "MyPWA",
      dir: "ltr",
      lang: "en-US",
      icons: [
        { src: PwaIcon192, sizes: "192x192" },
        { src: PwaIcon512, sizes: "512x512" }
      ]
    });
    // ... restante configuração de rotas
  }
}
```

#### Propriedades-chave

- **name / short_name**: `short_name` aparece em ecrãs com espaço reduzido (home screen); `name` surge no prompt de instalação.
- **icons**: array de objetos `{ src, type, sizes }`. Recomenda-se ao menos `192x192` e `512x512`. Pode adicionar mais tamanhos para ajuste fino.
- **start_url**: URL inicial quando a app é lançada; pode incluir query string para tracking (`"/?utm_source=pwa"`). Deve apontar diretamente para a experiência principal e estar dentro do `scope`.
- **background_color**: cor do ecrã de splash ao iniciar.
- **display**: controla UI do browser (`standalone`, `fullscreen`, `minimal-ui`, `browser`). Para poder mostrar o prompt “Add to Home Screen”, use `standalone`.
- **orientation**: força orientação específica (usar com parcimónia; ex. jogos `landscape`).
- **scope**: delimita URLs consideradas dentro da app. Sem escopo explícito, assume diretório do manifest. `start_url` deve estar dentro deste escopo.
- **theme_color**: cor da toolbar e do task switcher.

Mais detalhes: [Web App Manifest - Google Developers](https://developers.google.com/web/fundamentals/web-app-manifest/).

### External Resources

#### Carregar JavaScript externo

Duas abordagens:

1. **Função `loadScript`** (carrega após `componentDidMount` e evita downloads duplicados):

```js
import { loadScript } from "@pawjs/pawjs/src/utils/utils";

componentDidMount() {
  loadScript("https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLEMAPS_APIKEY&ver=4.9.4")
    .then(() => {
      // callback
    })
    .catch(() => {
      // tratar erro
    });
}
```

2. **Inserir `<script>` no head** (apenas se SSR estiver ativo):

```js
import React from "react";

export default class Server {
  apply(serverHandler) {
    serverHandler.hooks.beforeHtmlRender.tap("Add Google Maps JS", (Application) => {
      Application.htmlProps.head.push(
        <script
          key="google_maps"
          async
          src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLEMAPS_APIKEY&ver=4.9.4"
        />
      );
      return Application;
    });
  }
}
```

#### Carregar CSS externo

1. **Função `loadStyle`** (garante que o stylesheet não é baixado novamente):

```js
import { loadStyle } from "@pawjs/pawjs/src/utils/utils";

componentDidMount() {
  loadStyle("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css")
    .then(() => {
      // callback
    })
    .catch(() => {
      // tratar erro
    });
}
```

2. **Inserir `<link>`/`<script>` no head** quando SSR está ativo:

```js
import React from "react";

export default class Server {
  apply(serverHandler) {
    serverHandler.hooks.beforeHtmlRender.tap("Add BootStrap CSS", (Application) => {
      Application.htmlProps.head.push(
        <link
          key="bootstrap_css"
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
        />
      );
      return Application;
    });
  }
}
```

### Internal API com ExpressJS

O PawJS (base do ReactPWA) executa a camada SSR com ExpressJS, permitindo expor APIs internas diretamente na aplicação.

#### Limitações

- Necessário estar em modo **não-SPA** (`singlePageApplication` deve permanecer `false` em `pawconfig.json`).
- Caso precise de um backend com outro framework (HapiJS, SailsJS, etc.), utilize um projeto separado.

```json
{
  "singlePageApplication": false
}
```

#### Implementação em 3 passos

1. **Isolar API**: criar `src/api` para controllers/middlewares.

2. **Criar app Express** (exemplo `src/api/index.js`):

```js
import express from "express";

const app = express();

app.get("/api/timestamp", (req, res) => {
  res.json({ timestamp: new Date().getTime() });
});

export default app;
```

3. **Registar middleware** no servidor (`src/server.js`):

```js
import ApiMiddleware from "./api/index";

export default class ProjectServer {
  constructor({ addMiddleware }) {
    addMiddleware(ApiMiddleware);
  }
}
```

Agora `/api/timestamp` responde com JSON. Prefira prefixos como `/api/v1` para evitar conflito com rotas do frontend (`src/routes.js`). Pode empilhar middlewares Express e configurar cache conforme necessário.

