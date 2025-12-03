/**
 * Script para mostrar status das migrations
 * 
 * Uso: npm run migrations:status
 * ou: node src/scripts/migration-status.js
 */

import { getMigrationStatus } from '../utils/migrationRunner.js';

async function showStatus() {
  try {
    const status = await getMigrationStatus();
    
    console.log('\n📊 Status das Migrations');
    console.log('='.repeat(50));
    console.log(`   Total: ${status.total}`);
    console.log(`   ✅ Executadas: ${status.executed}`);
    console.log(`   ⏳ Pendentes: ${status.pending}`);
    
    if (status.executed > 0) {
      console.log('\n📋 Migrations Executadas:');
      status.executedMigrations.forEach(name => {
        console.log(`   ✅ ${name}`);
      });
    }
    
    if (status.pending > 0) {
      console.log('\n⏳ Migrations Pendentes:');
      status.pendingMigrations.forEach(name => {
        console.log(`   ⏸️  ${name}`);
      });
    } else {
      console.log('\n✅ Todas as migrations foram executadas!');
    }
    
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao obter status das migrations:', error);
    process.exit(1);
  }
}

showStatus();

