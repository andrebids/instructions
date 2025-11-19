import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptTranslations from '../locales/pt.json';
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

// Debug: Verificar se as traduções foram importadas corretamente
if (process.env.NODE_ENV === 'development') {
  console.log('[i18n] ptTranslations loaded:', !!ptTranslations);
  console.log('[i18n] ptTranslations.pages exists:', !!ptTranslations?.pages);
  console.log('[i18n] ptTranslations.pages.projectDetails exists:', !!ptTranslations?.pages?.projectDetails);
  console.log('[i18n] projectDetails.title:', ptTranslations?.pages?.projectDetails?.title);
}

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
    debug: process.env.NODE_ENV === 'development', // Ativar debug em desenvolvimento
    returnEmptyString: false, // Retornar chave se não encontrar tradução
    returnNull: false,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`[i18n] Missing translation key: ${key} for language: ${lng}`);
    },
  });

// Salvar idioma no localStorage quando mudar
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

// Debug: Verificar se as traduções foram carregadas
if (process.env.NODE_ENV === 'development') {
  i18n.on('initialized', () => {
    console.log('i18n initialized with language:', i18n.language);
    console.log('ptTranslations keys:', Object.keys(ptTranslations.pages || {}));
    console.log('projectDetails exists:', !!ptTranslations.pages?.projectDetails);
    console.log('projectDetails title:', ptTranslations.pages?.projectDetails?.title);
    console.log('i18n can find title:', !!i18n.getResource(i18n.language, 'translation', 'pages.projectDetails.title'));
    console.log('i18n.t result:', i18n.t('pages.projectDetails.title'));
  });
}

export default i18n;

