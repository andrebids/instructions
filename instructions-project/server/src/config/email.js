import nodemailer from 'nodemailer';
import 'dotenv/config';
import { logError, logInfo } from '../utils/projectLogger.js';

/**
 * Configuração de Email usando Nodemailer
 * Suporta Gmail, SMTP genérico e Ethereal.email para testes
 * 
 * Variáveis de Ambiente Necessárias:
 * 
 * EMAIL_ENABLED=true                    - Habilita/desabilita envio de emails
 * EMAIL_SERVICE=gmail|smtp              - Tipo de serviço (gmail ou smtp)
 * 
 * Para Gmail (EMAIL_SERVICE=gmail):
 *   EMAIL_USER=seu-email@gmail.com     - Email do Gmail
 *   EMAIL_PASS=sua-app-password        - App Password do Gmail (não a senha normal)
 * 
 * Para SMTP genérico (EMAIL_SERVICE=smtp ou EMAIL_HOST definido):
 *   EMAIL_HOST=smtp.exemplo.com        - Servidor SMTP
 *   EMAIL_PORT=587                     - Porta (587 para TLS, 465 para SSL)
 *   EMAIL_SECURE=false                 - true para porta 465 (SSL), false para 587 (TLS)
 *   EMAIL_USER=usuario                  - Usuário SMTP
 *   EMAIL_PASS=senha                    - Senha SMTP
 * 
 * Configurações opcionais:
 *   EMAIL_FROM_NAME="TheCore System"    - Nome do remetente (padrão: "TheCore System")
 *   EMAIL_FROM_ADDRESS=email@exemplo.com - Email do remetente (padrão: EMAIL_USER)
 *   EMAIL_TEST_MODE=false               - Se true, usa Ethereal.email para testes
 *   FRONTEND_URL=http://localhost:3003  - URL do frontend para links de convite (opcional)
 * 
 * Nota para Gmail:
 * - É necessário criar uma "App Password" em vez de usar a senha normal
 * - Acesse: https://myaccount.google.com/apppasswords
 * - Ou habilite "Acesso a apps menos seguros" (não recomendado)
 */

let transporter = null;

/**
 * Cria um transporter do Nodemailer baseado nas variáveis de ambiente
 * @returns {Promise<nodemailer.Transporter>} Transporter configurado
 */
export async function createEmailTransporter() {
  // Se já existe um transporter, retornar ele
  if (transporter) {
    return transporter;
  }

  // Verificar se email está habilitado
  if (process.env.EMAIL_ENABLED !== 'true') {
    logInfo('Email desabilitado (EMAIL_ENABLED != true)');
    return null;
  }

  // Modo de teste com Ethereal.email
  if (process.env.EMAIL_TEST_MODE === 'true') {
    logInfo('Usando Ethereal.email para testes');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logInfo('Conta de teste Ethereal criada:', { user: testAccount.user });
      return transporter;
    } catch (error) {
      logError('Erro ao criar conta de teste Ethereal', error);
      return null;
    }
  }

  // Configuração para Gmail
  if (process.env.EMAIL_SERVICE === 'gmail') {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      logError('EMAIL_USER e EMAIL_PASS são obrigatórios para Gmail');
      return null;
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    logInfo('Transporter Gmail configurado');
    return transporter;
  }

  // Configuração SMTP genérico
  if (process.env.EMAIL_SERVICE === 'smtp' || process.env.EMAIL_HOST) {
    const emailHost = process.env.EMAIL_HOST || 'localhost';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailSecure = process.env.EMAIL_SECURE === 'true';
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      logError('EMAIL_USER e EMAIL_PASS são obrigatórios para SMTP');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      // Configurações adicionais de TLS
      tls: {
        rejectUnauthorized: false, // Aceitar certificados self-signed
      },
    });

    logInfo('Transporter SMTP configurado', { host: emailHost, port: emailPort });
    return transporter;
  }

  logError('Configuração de email inválida. Defina EMAIL_SERVICE (gmail/smtp) ou EMAIL_HOST');
  return null;
}

/**
 * Verifica se a configuração de email está funcionando
 * @returns {Promise<boolean>} true se a configuração está válida
 */
export async function verifyEmailConfig() {
  try {
    const emailTransporter = await createEmailTransporter();
    
    if (!emailTransporter) {
      logError('Transporter de email não foi criado');
      return false;
    }

    // Verificar conexão SMTP
    await emailTransporter.verify();
    logInfo('Configuração de email verificada com sucesso');
    return true;
  } catch (error) {
    logError('Erro ao verificar configuração de email', error);
    return false;
  }
}

/**
 * Obtém o endereço "From" formatado
 * @returns {string} Endereço formatado (ex: "Nome <email@exemplo.com>")
 */
export function getFromAddress() {
  const fromName = process.env.EMAIL_FROM_NAME || 'TheCore System';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;

  if (!fromAddress) {
    return null;
  }

  return `"${fromName}" <${fromAddress}>`;
}

/**
 * Obtém o transporter atual (singleton)
 * @returns {Promise<nodemailer.Transporter|null>}
 */
export async function getTransporter() {
  if (!transporter) {
    await createEmailTransporter();
  }
  return transporter;
}

