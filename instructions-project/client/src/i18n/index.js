import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ptTranslations from '../locales/pt.json';
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

/**
 * Mapeia a locale do navegador para idioma baseado no país
 * @param {string} locale - Locale do navegador (ex: 'pt-PT', 'en-GB', 'fr-FR')
 * @returns {string} - Código do idioma ('pt', 'fr', 'en')
 */
const mapCountryToLanguage = (locale) => {
  if (!locale) return 'en';
  
  const localeLower = locale.toLowerCase();
  
  // Português (qualquer variação pt-*) → Português
  // Isso inclui pt-PT (Portugal), pt-BR (Brasil), etc.
  if (localeLower.startsWith('pt-') || localeLower === 'pt') {
    return 'pt';
  }
  
  // França (fr-FR ou qualquer fr-*) → Francês
  if (localeLower.startsWith('fr-') || localeLower === 'fr') {
    return 'fr';
  }
  
  // Reino Unido (en-GB) → Inglês
  if (localeLower === 'en-gb' || localeLower === 'en') {
    return 'en';
  }
  
  // Outros países → Inglês (fallback)
  return 'en';
};

// Na inicialização, limpar localStorage se o valor salvo não corresponder ao idioma detectado do navegador
// Isso garante que a detecção automática baseada no país tenha prioridade
if (typeof window !== 'undefined' && navigator.language) {
  const savedLang = localStorage.getItem('i18nextLng');
  const detectedLang = mapCountryToLanguage(navigator.language);
  
  // Se o idioma salvo for diferente do detectado, limpar para permitir detecção automática
  if (savedLang && savedLang !== detectedLang) {
    localStorage.removeItem('i18nextLng');
  }
}

// Only initialize if not already initialized (prevents multiple init during hot reload)
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        pt: {
          translation: ptTranslations,
        },
        en: {
          translation: enTranslations,
        },
        fr: {
          translation: frTranslations,
        },
      },
      // Configuração do LanguageDetector
      detection: {
        // Ordem de lookup: navigator primeiro (detectar do navegador), depois localStorage (preferência salva)
        // Isso garante que a detecção baseada no país do navegador tenha prioridade
        order: ['navigator', 'localStorage'],
        // Cache do idioma detectado no localStorage
        caches: ['localStorage'],
        // Chave usada no localStorage
        lookupLocalStorage: 'i18nextLng',
        // Converter locale detectado usando função customizada
        convertDetectedLanguage: (lng) => {
          // Se já for um código de idioma válido salvo (pt, en, fr), usar direto
          if (['pt', 'en', 'fr'].includes(lng)) {
            return lng;
          }
          // Caso contrário, mapear baseado no país
          return mapCountryToLanguage(lng);
        },
      },
      fallbackLng: 'pt',
      interpolation: {
        escapeValue: false, // React já faz escape
      },
      react: {
        useSuspense: false, // Evitar suspense para melhor compatibilidade
      },
      debug: false, // Debug desativado
      returnEmptyString: false, // Retornar chave se não encontrar tradução
      returnNull: false,
      missingKeyHandler: (lng, ns, key) => {
        console.warn(`[i18n] Missing translation key: ${key} for language: ${lng}`);
      },
    });
}

// Salvar idioma no localStorage quando mudar
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});


export default i18n;

