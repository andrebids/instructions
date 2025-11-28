import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptTranslations from '../locales/pt.json';
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';


// Detectar idioma do localStorage ou navegador
const getInitialLanguage = () => {
  // Verificar localStorage primeiro
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage && ['pt', 'en', 'fr'].includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // Detectar idioma do navegador
  const browserLanguage = navigator.language || navigator.userLanguage;
  const languageCode = browserLanguage.split('-')[0].toLowerCase();
  
  // Mapear para idiomas suportados
  if (['pt', 'en', 'fr'].includes(languageCode)) {
    return languageCode;
  }
  
  // Fallback para português
  return 'pt';
};

// Only initialize if not already initialized (prevents multiple init during hot reload)
if (!i18n.isInitialized) {
  i18n
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
      lng: getInitialLanguage(),
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

