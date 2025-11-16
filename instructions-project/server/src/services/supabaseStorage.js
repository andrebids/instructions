/**
 * Serviço de Storage Supabase
 * Gerencia uploads de arquivos para Supabase Storage
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Inicializar cliente Supabase
let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no .env');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseClient;
}

/**
 * Verifica se Supabase está configurado
 */
export function isSupabaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Upload de arquivo para Supabase Storage
 * @param {Buffer|File} file - Arquivo a fazer upload
 * @param {string} bucket - Nome do bucket (products, projects, editor)
 * @param {string} filePath - Caminho do arquivo no bucket (ex: 'projects/123/day/image.jpg')
 * @param {object} options - Opções adicionais (contentType, cacheControl, etc)
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadFile(file, bucket, filePath, options = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  }

  const supabase = getSupabaseClient();

  // Converter file para Buffer se necessário
  let fileBuffer;
  if (Buffer.isBuffer(file)) {
    fileBuffer = file;
  } else if (file.buffer) {
    fileBuffer = file.buffer;
  } else if (file.data) {
    fileBuffer = Buffer.from(file.data);
  } else {
    throw new Error('Formato de arquivo não suportado');
  }

  // Opções de upload
  const uploadOptions = {
    contentType: options.contentType || 'image/jpeg',
    cacheControl: options.cacheControl || '3600',
    upsert: options.upsert || false,
    ...options
  };

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, uploadOptions);

    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: data.path,
      id: data.id
    };
  } catch (error) {
    console.error('❌ [SUPABASE STORAGE] Erro no upload:', error);
    throw error;
  }
}

/**
 * Upload de múltiplos arquivos
 * @param {Array} files - Array de arquivos
 * @param {string} bucket - Nome do bucket
 * @param {Function} getFilePath - Função que retorna o caminho para cada arquivo: (file, index) => string
 * @returns {Promise<Array>}
 */
export async function uploadFiles(files, bucket, getFilePath) {
  const uploadPromises = files.map((file, index) => {
    const filePath = getFilePath(file, index);
    return uploadFile(file, bucket, filePath, {
      contentType: file.mimetype || 'image/jpeg'
    });
  });

  return Promise.all(uploadPromises);
}

/**
 * Deletar arquivo do Supabase Storage
 * @param {string} bucket - Nome do bucket
 * @param {string} filePath - Caminho do arquivo
 */
export async function deleteFile(bucket, filePath) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado');
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Erro ao deletar arquivo: ${error.message}`);
  }
}

/**
 * Obter URL pública de um arquivo
 * @param {string} bucket - Nome do bucket
 * @param {string} filePath - Caminho do arquivo
 * @returns {string} URL pública
 */
export function getPublicUrl(bucket, filePath) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado');
  }

  const supabase = getSupabaseClient();
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Listar arquivos em um diretório
 * @param {string} bucket - Nome do bucket
 * @param {string} folderPath - Caminho da pasta (opcional)
 * @returns {Promise<Array>}
 */
export async function listFiles(bucket, folderPath = '') {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado');
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folderPath);

  if (error) {
    throw new Error(`Erro ao listar arquivos: ${error.message}`);
  }

  return data || [];
}

