import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['pt', 'en', 'fr'],
  
  extract: {
    input: ['src/**/*.{js,jsx,ts,tsx}'],
    output: 'src/locales/{{language}}.json',
    
    // Arquivo único por idioma (sem namespaces)
    mergeNamespaces: true,
    
    // Idioma primário
    primaryLanguage: 'pt',
    
    // Idiomas secundários
    secondaryLanguages: ['en', 'fr'],
    
    // Valor padrão para chaves não traduzidas
    defaultValue: '',
    
    // Remover chaves não utilizadas
    removeUnusedKeys: true,
    
    // Funções de tradução a detectar
    functions: ['t', '*.t'],
    
    // Hooks do React
    useTranslationNames: ['useTranslation'],
    
    // Componentes React
    transComponents: ['Trans'],
    
    // Separadores
    nsSeparator: ':',
    keySeparator: '.',
    contextSeparator: '_',
    pluralSeparator: '_',
    
    // Formatação de saída
    sort: true,
    indentation: 2,
    
    // Gerar formas plurais base
    generateBasePluralForms: true,
    
    // Não desabilitar plurais
    disablePlurals: false,
    
    // Ignorar arquivos
    ignore: ['node_modules/**', 'dist/**', 'build/**'],
  },
  
  // Geração de tipos TypeScript
  types: {
    input: ['src/locales/pt.json'],
    output: 'src/types/i18next.d.ts',
    resourcesFile: 'src/types/resources.d.ts',
    enableSelector: true,
  },
});

