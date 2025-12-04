/**
 * Migration para atualizar caminhos de imagens do AIGENERATOR para /api/files/
 * Converte caminhos antigos (/AIGENERATOR/ ou /api/AIGENERATOR/) para /api/files/
 * Execute com: node src/migrations/20250101_update_aigenerator_paths.js
 */

import sequelize from '../config/database.js';
import { Project } from '../models/index.js';

/**
 * Normaliza URL de imagem do AIGENERATOR para /api/files/
 */
function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Converter caminhos antigos /AIGENERATOR/ ou /api/AIGENERATOR/ para /api/files/
  if (url.includes('AIGENERATOR/')) {
    const filename = url.split('AIGENERATOR/')[1];
    return `/api/files/${filename}`;
  }
  
  return url;
}

/**
 * Atualiza caminhos em um objeto logoDetails recursivamente
 */
function updateLogoDetailsPaths(logoDetails) {
  if (!logoDetails || typeof logoDetails !== 'object') return logoDetails;
  
  const updated = { ...logoDetails };
  
  // Atualizar currentLogo.aiAssistantState.generatedImageUrl
  if (updated.currentLogo?.aiAssistantState?.generatedImageUrl) {
    updated.currentLogo = {
      ...updated.currentLogo,
      aiAssistantState: {
        ...updated.currentLogo.aiAssistantState,
        generatedImageUrl: normalizeImageUrl(updated.currentLogo.aiAssistantState.generatedImageUrl)
      }
    };
  }
  
  // Atualizar logos array
  if (Array.isArray(updated.logos)) {
    updated.logos = updated.logos.map(logo => {
      if (logo?.aiAssistantState?.generatedImageUrl) {
        return {
          ...logo,
          aiAssistantState: {
            ...logo.aiAssistantState,
            generatedImageUrl: normalizeImageUrl(logo.aiAssistantState.generatedImageUrl)
          }
        };
      }
      return logo;
    });
  }
  
  return updated;
}

export async function migrate() {
  try {
    console.log('🔄 Atualizando caminhos de imagens do AIGENERATOR para /api/files/...\n');
    
    // Buscar todos os projetos com logoDetails
    const projects = await Project.findAll({
      where: {
        logoDetails: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    });
    
    console.log(`📋 Encontrados ${projects.length} projetos com logoDetails`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const project of projects) {
      try {
        const logoDetails = project.logoDetails;
        
        if (!logoDetails) {
          skipped++;
          continue;
        }
        
        // Verificar se há caminhos do AIGENERATOR para atualizar
        const hasAIGeneratorPath = 
          (logoDetails.currentLogo?.aiAssistantState?.generatedImageUrl?.includes('AIGENERATOR/')) ||
          (Array.isArray(logoDetails.logos) && logoDetails.logos.some(logo => 
            logo?.aiAssistantState?.generatedImageUrl?.includes('AIGENERATOR/')
          ));
        
        if (!hasAIGeneratorPath) {
          skipped++;
          continue;
        }
        
        // Atualizar caminhos
        const updatedLogoDetails = updateLogoDetailsPaths(logoDetails);
        
        // Atualizar na base de dados
        await project.update({ logoDetails: updatedLogoDetails });
        
        console.log(`✅ Projeto ${project.id}: Caminhos atualizados`);
        updated++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar projeto ${project.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n🎉 Migração concluída!');
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente (não quando importado)
const isMainModule = process.argv[1] && process.argv[1].endsWith('20250101_update_aigenerator_paths.js');
if (isMainModule) {
  migrate()
    .then(() => {
      console.log('✅ Migração executada com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar migração:', error);
      process.exit(1);
    });
}

