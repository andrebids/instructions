/**
 * Script de verificação do estado da migração Auth.js
 * Verifica se todos os componentes estão configurados corretamente
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando estado da migração Auth.js...\n');

let allChecksPassed = true;

// 1. Verificar variáveis de ambiente
console.log('1️⃣ Verificando variáveis de ambiente...');
const requiredEnvVars = {
  backend: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  optional: ['USE_AUTH_JS', 'AUTH_SECRET', 'AUTH_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
};

const missingRequired = [];
requiredEnvVars.backend.forEach(varName => {
  if (!process.env[varName]) {
    missingRequired.push(varName);
    allChecksPassed = false;
  }
});

if (missingRequired.length > 0) {
  console.log('   ❌ Variáveis obrigatórias faltando:', missingRequired.join(', '));
} else {
  console.log('   ✅ Variáveis obrigatórias configuradas');
}

const useAuthJs = process.env.USE_AUTH_JS === 'true';
if (useAuthJs) {
  console.log('   ✅ USE_AUTH_JS=true (Auth.js está ativo)');
  
  if (!process.env.AUTH_SECRET) {
    console.log('   ⚠️  AUTH_SECRET não configurado (execute: npx auth secret)');
    allChecksPassed = false;
  } else {
    console.log('   ✅ AUTH_SECRET configurado');
  }
} else {
  console.log('   ℹ️  USE_AUTH_JS=false (Clerk ainda está ativo)');
}

// 2. Verificar se schema SQL foi executado no Supabase
console.log('\n2️⃣ Verificando schema next_auth no Supabase...');

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verificar se as tabelas existem
    const tables = ['users', 'sessions', 'accounts', 'verification_tokens'];
    let schemaExists = true;

    for (const table of tables) {
      try {
        const { error } = await supabase
          .schema('next_auth')
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.code === '42P01') { // Table does not exist
          console.log(`   ❌ Tabela next_auth.${table} não existe`);
          schemaExists = false;
          allChecksPassed = false;
        }
      } catch (err) {
        // Tentar verificar de outra forma
        if (err.message?.includes('schema') || err.message?.includes('does not exist')) {
          console.log(`   ❌ Schema next_auth ou tabela ${table} não existe`);
          schemaExists = false;
          allChecksPassed = false;
        }
      }
    }

    if (schemaExists) {
      console.log('   ✅ Schema next_auth e tabelas existem');
      
      // Verificar se campo role existe
      try {
        const { data, error } = await supabase
          .schema('next_auth')
          .from('users')
          .select('role')
          .limit(1);

        if (error && error.message?.includes('column "role"')) {
          console.log('   ⚠️  Campo "role" não existe na tabela users');
          console.log('   💡 Execute: ALTER TABLE next_auth.users ADD COLUMN IF NOT EXISTS role text DEFAULT \'comercial\';');
        } else {
          console.log('   ✅ Campo "role" existe na tabela users');
        }
      } catch (err) {
        console.log('   ⚠️  Não foi possível verificar campo role:', err.message);
      }
    }
  } catch (error) {
    console.log('   ❌ Erro ao conectar ao Supabase:', error.message);
    console.log('   💡 Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    allChecksPassed = false;
  }
} else {
  console.log('   ⚠️  Não é possível verificar (variáveis Supabase não configuradas)');
}

// 3. Verificar se arquivos necessários existem
console.log('\n3️⃣ Verificando arquivos do projeto...');

const requiredFiles = [
  '../src/auth.config.js',
  '../src/routes/auth.route.js',
  '../src/middleware/auth.js',
  '../src/migrations/create-next-auth-schema.sql'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} não encontrado`);
    allChecksPassed = false;
  }
});

// 4. Verificar dependências no package.json
console.log('\n4️⃣ Verificando dependências...');

const packageJsonPath = path.join(__dirname, '../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['@auth/express', '@auth/supabase-adapter'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep]) {
      console.log(`   ✅ ${dep} instalado`);
    } else {
      console.log(`   ❌ ${dep} não encontrado (execute: npm install ${dep})`);
      allChecksPassed = false;
    }
  });
}

// Resumo
console.log('\n' + '='.repeat(50));
if (allChecksPassed && useAuthJs) {
  console.log('✅ Migração Auth.js está configurada e pronta!');
  console.log('💡 Para ativar, configure USE_AUTH_JS=true e reinicie o servidor');
} else if (allChecksPassed && !useAuthJs) {
  console.log('✅ Código da migração está pronto!');
  console.log('💡 Para ativar Auth.js:');
  console.log('   1. Execute o SQL schema no Supabase');
  console.log('   2. Configure USE_AUTH_JS=true no .env');
  console.log('   3. Configure VITE_USE_AUTH_JS=true no client/.env');
  console.log('   4. Reinicie os servidores');
} else {
  console.log('⚠️  Migração não está completa. Verifique os itens acima.');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Execute o SQL em server/src/migrations/create-next-auth-schema.sql no Supabase');
  console.log('   2. Configure todas as variáveis de ambiente necessárias');
  console.log('   3. Execute: npm install @auth/express @auth/supabase-adapter');
  console.log('   4. Gere AUTH_SECRET: npx auth secret');
}
console.log('='.repeat(50));

process.exit(allChecksPassed ? 0 : 1);

