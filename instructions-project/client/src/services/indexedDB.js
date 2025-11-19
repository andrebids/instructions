/**
 * Serviço para gerenciar IndexedDB - armazenamento robusto para mobile/PWA
 * Guarda estado do editor (step atual, canvas state) localmente
 */

const DB_NAME = 'projectEditorDB';
const DB_VERSION = 1;
const STORE_NAME = 'projectEditorState';

let dbInstance = null;

/**
 * Abrir conexão com IndexedDB
 */
export async function openDB() {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ [IndexedDB] Erro ao abrir database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Criar object store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
        objectStore.createIndex('projectId', 'projectId', { unique: true });
        objectStore.createIndex('lastModified', 'lastModified', { unique: false });
      }
    };
  });
}

/**
 * Salvar estado do editor para um projeto
 */
export async function saveEditorState(projectId, state) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const editorState = {
      projectId,
      lastEditedStep: state.lastEditedStep,
      canvasDecorations: state.canvasDecorations || [],
      canvasImages: state.canvasImages || [],
      snapZonesByImage: state.snapZonesByImage || {},
      decorationsByImage: state.decorationsByImage || {},
      logoDetails: state.logoDetails || {},
      lastModified: new Date().toISOString(),
      pendingSync: state.pendingSync || false,
    };

    await new Promise((resolve, reject) => {
      const request = store.put(editorState);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        console.error(`❌ [IndexedDB] Erro ao salvar estado:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao salvar estado do editor:', error);
    throw error;
  }
}

/**
 * Ler estado do editor de um projeto
 */
export async function getEditorState(projectId) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      request.onerror = () => {
        console.error(`❌ [IndexedDB] Erro ao ler estado:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao ler estado do editor:', error);
    return null;
  }
}

/**
 * Salvar apenas o step atual (mais leve)
 */
export async function saveLastStep(projectId, stepId) {
  try {
    const existingState = await getEditorState(projectId);
    
    // Se o step já é o mesmo, não salvar novamente (evita logs duplicados)
    if (existingState?.lastEditedStep === stepId) {
      return;
    }
    
    await saveEditorState(projectId, {
      ...existingState,
      lastEditedStep: stepId,
      canvasDecorations: existingState?.canvasDecorations || [],
      canvasImages: existingState?.canvasImages || [],
      snapZonesByImage: existingState?.snapZonesByImage || {},
      decorationsByImage: existingState?.decorationsByImage || {},
      logoDetails: existingState?.logoDetails || {},
    });
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao salvar step:', error);
  }
}

/**
 * Verificar se há mudanças pendentes de sincronização
 */
export async function getPendingSyncProjects() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('lastModified');

    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => {
        const allStates = request.result;
        const pending = allStates.filter(state => state.pendingSync === true);
        resolve(pending.map(state => state.projectId));
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao verificar pending sync:', error);
    return [];
  }
}

/**
 * Marcar projeto como sincronizado
 */
export async function markAsSynced(projectId) {
  try {
    const existingState = await getEditorState(projectId);
    if (existingState) {
      await saveEditorState(projectId, {
        ...existingState,
        pendingSync: false,
      });
    }
  } catch (error) {
    console.error('❌ [IndexedDB] Erro ao marcar como sincronizado:', error);
  }
}

