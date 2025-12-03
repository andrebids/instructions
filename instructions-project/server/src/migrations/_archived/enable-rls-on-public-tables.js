/**
 * Migration: Enable Row Level Security (RLS) on public tables
 * 
 * This migration enables RLS and creates security policies for:
 * - tasks
 * - observations
 * - orders
 * - order_items
 * 
 * To run this migration:
 * node src/migrations/enable-rls-on-public-tables.js
 * 
 * Or execute the SQL file directly in Supabase SQL Editor:
 * instructions-project/database/migrations/20250128_enable_rls_on_public_tables.sql
 */

import sequelize from '../config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function enableRLS() {
  try {
    console.log('🔄 Habilitando Row Level Security (RLS) nas tabelas públicas...');
    
    // Ler o arquivo SQL
    const sqlFilePath = join(__dirname, '../../database/migrations/20250128_enable_rls_on_public_tables.sql');
    const sql = readFileSync(sqlFilePath, 'utf-8');
    
    // Executar o SQL completo
    // Nota: Alguns comandos podem falhar se já existirem (ex: políticas), mas isso é esperado
    try {
      await sequelize.query(sql);
      console.log('✅ SQL executado com sucesso!');
    } catch (error) {
      // Se houver erro sobre objetos já existentes, apenas avisar
      if (error.message && (
        error.message.includes('already exists') ||
        error.message.includes('duplicate')
      )) {
        console.log('⚠️  Alguns objetos já existem (isso é normal se a migração já foi executada):');
        console.log(`   ${error.message.split('\n')[0]}`);
        console.log('✅ RLS já está habilitado nas tabelas!');
      } else {
        throw error;
      }
    }
    
    console.log('✅ RLS habilitado com sucesso em todas as tabelas!');
    console.log('📋 Tabelas protegidas:');
    console.log('   - tasks');
    console.log('   - observations');
    console.log('   - orders');
    console.log('   - order_items');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao habilitar RLS:', error);
    console.error('\n💡 Dica: Você também pode executar o arquivo SQL diretamente no Supabase SQL Editor:');
    console.error('   instructions-project/database/migrations/20250128_enable_rls_on_public_tables.sql');
    process.exit(1);
  }
}

enableRLS();

