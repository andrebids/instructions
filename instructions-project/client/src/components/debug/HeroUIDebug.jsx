import { useEffect } from 'react';

/**
 * Componente de debug para verificar se as variáveis CSS do HeroUI estão sendo geradas
 */
export function HeroUIDebug() {
  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Verificar variáveis CSS do HeroUI
    const primaryVars = [
      '--heroui-primary-50',
      '--heroui-primary-100',
      '--heroui-primary-500',
      '--heroui-primary-DEFAULT',
    ];
    
    const foundVars = primaryVars.filter(varName => {
      const value = computedStyle.getPropertyValue(varName);
      return value && value.trim() !== '';
    });
    
    console.log('🔍 [HeroUI Debug] Verificando variáveis CSS...');
    console.log(`✅ Variáveis encontradas: ${foundVars.length}/${primaryVars.length}`);
    
    primaryVars.forEach(varName => {
      const value = computedStyle.getPropertyValue(varName);
      console.log(`  ${varName}: ${value || '❌ NÃO ENCONTRADA'}`);
    });
    
    // Verificar se bg-primary está disponível
    const testElement1 = document.createElement('div');
    testElement1.className = 'bg-primary';
    testElement1.style.display = 'none';
    document.body.appendChild(testElement1);
    
    const bgColor1 = getComputedStyle(testElement1).backgroundColor;
    console.log(`🎨 bg-primary background-color: ${bgColor1}`);
    
    document.body.removeChild(testElement1);
    
    // Verificar bg-primary-500
    const testElement2 = document.createElement('div');
    testElement2.className = 'bg-primary-500';
    testElement2.style.display = 'none';
    document.body.appendChild(testElement2);
    
    const bgColor2 = getComputedStyle(testElement2).backgroundColor;
    console.log(`🎨 bg-primary-500 background-color: ${bgColor2}`);
    
    document.body.removeChild(testElement2);
    
    // Verificar classes Tailwind geradas no DOM
    const hasPrimaryClasses = document.querySelector('[class*="bg-primary"]');
    console.log(`📦 Elementos com bg-primary no DOM: ${hasPrimaryClasses ? '✅ Encontrados' : '❌ Não encontrados'}`);
    
    // Verificar se as classes estão no stylesheet
    const stylesheets = Array.from(document.styleSheets);
    let foundPrimaryClass = false;
    stylesheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          if (rule.selectorText && (rule.selectorText.includes('.bg-primary') || rule.selectorText.includes('bg-primary'))) {
            foundPrimaryClass = true;
            console.log(`📋 Classe encontrada no stylesheet: ${rule.selectorText}`);
          }
        });
      } catch (e) {
        // Ignorar erros de CORS em stylesheets externos
      }
    });
    console.log(`📋 Classes bg-primary no stylesheet: ${foundPrimaryClass ? '✅ Encontradas' : '❌ Não encontradas'}`);
    
  }, []);
  
  return null;
}

