/**
 * Script de verificação básica da refatoração
 * Verifica se todos os imports estão corretos
 */

import * as projectService from './server/src/services/projectService.js';
import * as projectUploadService from './server/src/services/projectUploadService.js';
import * as projectImageService from './server/src/services/projectImageService.js';
import { validateDescription, validateProjectId, validateFiles } from './server/src/validators/projectValidator.js';
import { logInfo, logError, formatErrorMessage } from './server/src/utils/projectLogger.js';
import * as projectController from './server/src/controllers/projectController.js';

console.log('✅ Verificando imports dos serviços...');

// Verificar se todas as funções exportadas existem
const projectServiceFunctions = [
  'checkTableExists',
  'findAllProjects',
  'findProjectById',
  'createProject',
  'updateProject',
  'deleteProjectWithRelations',
  'updateProjectStatus',
  'toggleProjectFavorite',
  'updateProjectCanvas',
  'getProjectStats'
];

const projectUploadServiceFunctions = [
  'processUploadedFiles',
  'collectUploadDebugInfo',
  'handleImageUpload',
  'debugProjectImageFiles'
];

const projectImageServiceFunctions = [
  'updateImageNightVersion',
  'receiveNightImage',
  'markConversionFailed'
];

const controllerFunctions = [
  'getAll',
  'getById',
  'create',
  'update',
  'deleteProject',
  'updateStatus',
  'toggleFavorite',
  'updateCanvas',
  'uploadImages',
  'receiveNightImage',
  'markConversionFailed',
  'debugProjectImages',
  'getStats'
];

let errors = 0;

console.log('\n📋 Verificando projectService...');
projectServiceFunctions.forEach(func => {
  if (typeof projectService[func] === 'function') {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ ${func} - NÃO ENCONTRADO`);
    errors++;
  }
});

console.log('\n📋 Verificando projectUploadService...');
projectUploadServiceFunctions.forEach(func => {
  if (typeof projectUploadService[func] === 'function') {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ ${func} - NÃO ENCONTRADO`);
    errors++;
  }
});

console.log('\n📋 Verificando projectImageService...');
projectImageServiceFunctions.forEach(func => {
  if (typeof projectImageService[func] === 'function') {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ ${func} - NÃO ENCONTRADO`);
    errors++;
  }
});

console.log('\n📋 Verificando validators...');
if (typeof validateDescription === 'function') {
  console.log('  ✅ validateDescription');
} else {
  console.log('  ❌ validateDescription - NÃO ENCONTRADO');
  errors++;
}

if (typeof validateProjectId === 'function') {
  console.log('  ✅ validateProjectId');
} else {
  console.log('  ❌ validateProjectId - NÃO ENCONTRADO');
  errors++;
}

if (typeof validateFiles === 'function') {
  console.log('  ✅ validateFiles');
} else {
  console.log('  ❌ validateFiles - NÃO ENCONTRADO');
  errors++;
}

console.log('\n📋 Verificando logger...');
if (typeof logInfo === 'function') {
  console.log('  ✅ logInfo');
} else {
  console.log('  ❌ logInfo - NÃO ENCONTRADO');
  errors++;
}

if (typeof formatErrorMessage === 'function') {
  console.log('  ✅ formatErrorMessage');
} else {
  console.log('  ❌ formatErrorMessage - NÃO ENCONTRADO');
  errors++;
}

console.log('\n📋 Verificando projectController...');
controllerFunctions.forEach(func => {
  if (typeof projectController[func] === 'function') {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ ${func} - NÃO ENCONTRADO`);
    errors++;
  }
});

console.log('\n' + '='.repeat(50));
if (errors === 0) {
  console.log('✅ TODAS AS VERIFICAÇÕES PASSARAM!');
  console.log('\n📝 Próximos passos para teste manual:');
  console.log('   1. Iniciar servidor: cd server && npm run dev');
  console.log('   2. Testar endpoints da API (GET /api/projects, POST /api/projects, etc)');
  console.log('   3. Iniciar cliente: cd client && npm run dev');
  console.log('   4. Testar funcionalidade do StepAIDesigner');
  console.log('   5. Verificar upload de imagens');
  console.log('   6. Verificar conversão day/night');
  console.log('   7. Verificar funcionalidade de cartouche');
  process.exit(0);
} else {
  console.log(`❌ ENCONTRADOS ${errors} ERRO(S)!`);
  process.exit(1);
}

