import nodemailer from 'nodemailer';
import { getTransporter, getFromAddress } from '../config/email.js';
import { logInfo, logError } from '../utils/projectLogger.js';

/**
 * Serviço de Email
 * Fornece funções utilitárias para envio de emails comuns
 */

/**
 * Valida formato de email
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Envia email genérico
 * @param {Object} options - Opções do email
 * @param {string|string[]} options.to - Destinatário(s)
 * @param {string} options.subject - Assunto
 * @param {string} options.text - Versão texto plano
 * @param {string} options.html - Versão HTML (opcional)
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    // Verificar se email está habilitado
    if (process.env.EMAIL_ENABLED !== 'true') {
      logInfo('Email desabilitado, não enviando email');
      return { success: false, message: 'Email desabilitado' };
    }

    // Validar email
    const recipients = Array.isArray(to) ? to : [to];
    for (const email of recipients) {
      if (!isValidEmail(email)) {
        logError('Email inválido:', email);
        return { success: false, message: 'Email inválido' };
      }
    }

    const transporter = await getTransporter();
    if (!transporter) {
      logError('Transporter de email não disponível');
      return { success: false, message: 'Transporter não configurado' };
    }

    const fromAddress = getFromAddress();
    if (!fromAddress) {
      logError('Endereço "From" não configurado');
      return { success: false, message: 'Endereço From não configurado' };
    }

    const mailOptions = {
      from: fromAddress,
      to: recipients.join(', '),
      subject: subject,
      text: text,
      html: html || text, // Fallback para texto se HTML não fornecido
    };

    const info = await transporter.sendMail(mailOptions);

    // Se for modo de teste (Ethereal), logar URL de preview
    if (process.env.EMAIL_TEST_MODE === 'true') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logInfo('Email de teste enviado. Preview:', previewUrl);
      }
    }

    logInfo('Email enviado com sucesso', {
      to: recipients.join(', '),
      subject,
      messageId: info.messageId
    });

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.EMAIL_TEST_MODE === 'true' ? nodemailer.getTestMessageUrl(info) : null
    };
  } catch (error) {
    logError('Erro ao enviar email', error);
    return {
      success: false,
      message: 'Erro ao enviar email',
      error: error.message
    };
  }
}

/**
 * Template HTML para email de convite
 */
function getInvitationEmailTemplate(email, role, invitationLink) {
  const roleNames = {
    admin: 'Administrador',
    comercial: 'Comercial',
    editor_stock: 'Editor de Stock'
  };
  const roleName = roleNames[role] || role;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      border: 1px solid #ddd;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2c3e50;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #2980b9;
    }
    .footer {
      text-align: center;
      color: #777;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bem-vindo ao TheCore</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      <p>Você foi convidado para fazer parte do sistema TheCore com o perfil de <strong>${roleName}</strong>.</p>
      <p>Para ativar sua conta e definir sua senha, clique no botão abaixo:</p>
      <p style="text-align: center;">
        <a href="${invitationLink}" class="button">Ativar Conta</a>
      </p>
      <p>Ou copie e cole o seguinte link no seu navegador:</p>
      <p style="word-break: break-all; color: #3498db;">${invitationLink}</p>
      <p>Se você não solicitou este convite, pode ignorar este email.</p>
    </div>
    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
      <p>&copy; ${new Date().getFullYear()} TheCore System</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia email de convite para novo usuário
 * @param {string} email - Email do destinatário
 * @param {string} role - Role do usuário (admin, comercial, editor_stock)
 * @param {string} invitationLink - Link para ativação da conta
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendInvitationEmail(email, role, invitationLink) {
  const roleNames = {
    admin: 'Administrador',
    comercial: 'Comercial',
    editor_stock: 'Editor de Stock'
  };
  const roleName = roleNames[role] || role;

  const subject = 'Convite para TheCore';
  const text = `
Bem-vindo ao TheCore

Você foi convidado para fazer parte do sistema TheCore com o perfil de ${roleName}.

Para ativar sua conta e definir sua senha, acesse o seguinte link:
${invitationLink}

Se você não solicitou este convite, pode ignorar este email.

Este é um email automático, por favor não responda.
  `.trim();

  const html = getInvitationEmailTemplate(email, role, invitationLink);

  return await sendEmail({
    to: email,
    subject: subject,
    text: text,
    html: html
  });
}

/**
 * Template HTML para email de recuperação de senha
 */
function getPasswordResetEmailTemplate(email, resetLink) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      border: 1px solid #ddd;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2c3e50;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #e74c3c;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #c0392b;
    }
    .footer {
      text-align: center;
      color: #777;
      font-size: 12px;
      margin-top: 30px;
    }
    .warning {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recuperação de Senha</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no TheCore.</p>
      <p>Para criar uma nova senha, clique no botão abaixo:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Redefinir Senha</a>
      </p>
      <p>Ou copie e cole o seguinte link no seu navegador:</p>
      <p style="word-break: break-all; color: #3498db;">${resetLink}</p>
      <div class="warning">
        <p><strong>Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta recuperação de senha, ignore este email.</p>
      </div>
    </div>
    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
      <p>&copy; ${new Date().getFullYear()} TheCore System</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia email de recuperação de senha
 * @param {string} email - Email do destinatário
 * @param {string} resetLink - Link para redefinição de senha
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendPasswordResetEmail(email, resetLink) {
  const subject = 'Recuperação de Senha - TheCore';
  const text = `
Recuperação de Senha

Recebemos uma solicitação para redefinir a senha da sua conta no TheCore.

Para criar uma nova senha, acesse o seguinte link:
${resetLink}

Este link expira em 1 hora.

Se você não solicitou esta recuperação de senha, ignore este email.

Este é um email automático, por favor não responda.
  `.trim();

  const html = getPasswordResetEmailTemplate(email, resetLink);

  return await sendEmail({
    to: email,
    subject: subject,
    text: text,
    html: html
  });
}

/**
 * Template HTML para email de notificação genérica
 */
function getNotificationEmailTemplate(subject, message) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      border: 1px solid #ddd;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2c3e50;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
      white-space: pre-wrap;
    }
    .footer {
      text-align: center;
      color: #777;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TheCore</h1>
    </div>
    <div class="content">
      ${message.replace(/\n/g, '<br>')}
    </div>
    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
      <p>&copy; ${new Date().getFullYear()} TheCore System</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia email de notificação genérica
 * @param {string} email - Email do destinatário
 * @param {string} subject - Assunto do email
 * @param {string} message - Mensagem (texto)
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendNotificationEmail(email, subject, message) {
  const text = message;
  const html = getNotificationEmailTemplate(subject, message);

  return await sendEmail({
    to: email,
    subject: subject,
    text: text,
    html: html
  });
}

/**
 * Template HTML para email de notificação de mudança de password
 */
function getPasswordChangedEmailTemplate(changedBy, timestamp) {
  const formattedDate = new Date(timestamp).toLocaleString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      border: 1px solid #ddd;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2c3e50;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .warning {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .info-box {
      background-color: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #777;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Alteração de Password</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      <p>A password da sua conta no TheCore foi alterada por um administrador.</p>
      <div class="info-box">
        <p><strong>Detalhes da alteração:</strong></p>
        <p>📅 <strong>Data:</strong> ${formattedDate}</p>
        <p>👤 <strong>Alterado por:</strong> ${changedBy}</p>
      </div>
      <div class="warning">
        <p><strong>⚠️ Importante:</strong></p>
        <p>Se você não autorizou esta alteração, contacte imediatamente o administrador do sistema.</p>
        <p>Por segurança, recomendamos que altere a sua password após o próximo login.</p>
      </div>
    </div>
    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
      <p>&copy; ${new Date().getFullYear()} TheCore System</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia email de notificação de mudança de password
 * @param {string} email - Email do utilizador
 * @param {string} changedBy - Email do admin que fez a alteração
 * @param {Date} timestamp - Data/hora da alteração
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendPasswordChangedEmail(email, changedBy, timestamp = new Date()) {
  const formattedDate = new Date(timestamp).toLocaleString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = 'Alteração de Password - TheCore';
  const text = `
Alteração de Password

A password da sua conta no TheCore foi alterada por um administrador.

Detalhes da alteração:
Data: ${formattedDate}
Alterado por: ${changedBy}

⚠️ IMPORTANTE:
Se você não autorizou esta alteração, contacte imediatamente o administrador do sistema.
Por segurança, recomendamos que altere a sua password após o próximo login.

Este é um email automático, por favor não responda.
  `.trim();

  const html = getPasswordChangedEmailTemplate(changedBy, timestamp);

  return await sendEmail({
    to: email,
    subject: subject,
    text: text,
    html: html
  });
}

