import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import ProjectNote from '../models/ProjectNote.js';

/**
 * Servidor Hocuspocus para sincronização colaborativa de documentos
 * Usa extensão Database para persistir dados na PostgreSQL
 */
export function createHocuspocusServer() {
  const port = parseInt(process.env.HOCUSPOCUS_PORT || '1234', 10);
  
  const server = new Server({
    port,
    name: 'hocuspocus-server',
    
    extensions: [
      new Database({
        // Fetch: Carregar dados do documento da base de dados
        fetch: async ({ documentName }) => {
          try {
            const note = await ProjectNote.findOne({
              where: { documentName },
            });
            
            if (!note || !note.data) {
              console.log(`📄 [Hocuspocus] Documento não encontrado: ${documentName}`);
              return null;
            }
            
            // Converter Buffer para Uint8Array
            const data = note.data instanceof Buffer 
              ? new Uint8Array(note.data) 
              : note.data;
            
            console.log(`📥 [Hocuspocus] Carregado documento: ${documentName} (${data.length} bytes)`);
            return data;
          } catch (error) {
            console.error(`❌ [Hocuspocus] Erro ao carregar documento ${documentName}:`, error);
            return null;
          }
        },
        
        // Store: Guardar dados do documento na base de dados
        store: async ({ documentName, state }) => {
          try {
            // Converter Uint8Array para Buffer se necessário
            const data = state instanceof Uint8Array 
              ? Buffer.from(state) 
              : state;
            
            // Extrair projectId do documentName (formato: project-{projectId})
            const projectId = documentName.replace('project-', '');
            
            await ProjectNote.upsert({
              documentName,
              projectId,
              data,
              updatedAt: new Date(),
            }, {
              conflictFields: ['documentName'],
            });
            
            console.log(`💾 [Hocuspocus] Guardado documento: ${documentName} (${data.length} bytes)`);
          } catch (error) {
            console.error(`❌ [Hocuspocus] Erro ao guardar documento ${documentName}:`, error);
            throw error;
          }
        },
      }),
    ],
    
    // Configurações adicionais
    onConnect: () => {
      console.log('🔌 [Hocuspocus] Cliente conectado');
    },
    
    onDisconnect: () => {
      console.log('🔌 [Hocuspocus] Cliente desconectado');
    },
    
    onDestroy: () => {
      console.log('🛑 [Hocuspocus] Servidor destruído');
    },
  });
  
  // Iniciar servidor
  server.listen(() => {
    console.log(`🔌 [Hocuspocus] Servidor iniciado na porta ${port}`);
  });
  
  return server;
}

