import 'dotenv/config';
import { createEmailTransporter, verifyEmailConfig, getFromAddress } from './src/config/email.js';
import { sendInvitationEmail } from './src/services/emailService.js';

/**
 * Script de teste para verificar configuração de email
 */

async function testEmailConfiguration() {
    console.log('='.repeat(60));
    console.log('TESTE DE CONFIGURAÇÃO DE EMAIL');
    console.log('='.repeat(60));
    console.log();

    // 1. Verificar variáveis de ambiente
    console.log('📋 Variáveis de Ambiente:');
    console.log('  EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
    console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('  EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('  EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE);
    console.log('  EMAIL_USER:', process.env.EMAIL_USER);
    console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'não definido');
    console.log('  EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME);
    console.log('  EMAIL_FROM_ADDRESS:', process.env.EMAIL_FROM_ADDRESS);
    console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('  EMAIL_TEST_MODE:', process.env.EMAIL_TEST_MODE);
    console.log();

    // 2. Verificar endereço From
    console.log('📧 Endereço From:');
    const fromAddress = getFromAddress();
    console.log('  ', fromAddress || '❌ Não configurado');
    console.log();

    // 3. Criar transporter
    console.log('🔧 Criando Transporter...');
    try {
        const transporter = await createEmailTransporter();
        if (transporter) {
            console.log('  ✅ Transporter criado com sucesso');
        } else {
            console.log('  ❌ Falha ao criar transporter');
            return;
        }
    } catch (error) {
        console.log('  ❌ Erro ao criar transporter:', error.message);
        return;
    }
    console.log();

    // 4. Verificar conexão SMTP
    console.log('🔌 Verificando Conexão SMTP...');
    try {
        const isValid = await verifyEmailConfig();
        if (isValid) {
            console.log('  ✅ Conexão SMTP verificada com sucesso');
        } else {
            console.log('  ❌ Falha na verificação da conexão SMTP');
            return;
        }
    } catch (error) {
        console.log('  ❌ Erro ao verificar conexão:', error.message);
        return;
    }
    console.log();

    // 5. Teste de envio (opcional - comentado por padrão)
    console.log('📨 Teste de Envio de Email:');
    console.log('  ⚠️  Para testar o envio real, descomente o código no script');
    console.log();

    /*
    // Descomente para testar envio real
    console.log('  Enviando email de teste...');
    try {
      const testEmail = 'seu-email-de-teste@exemplo.com'; // ALTERE AQUI
      const result = await sendInvitationEmail(
        testEmail,
        'comercial',
        `${process.env.FRONTEND_URL}/signin?email=${encodeURIComponent(testEmail)}&invited=true`
      );
      
      if (result.success) {
        console.log('  ✅ Email enviado com sucesso!');
        console.log('  Message ID:', result.messageId);
        if (result.previewUrl) {
          console.log('  Preview URL:', result.previewUrl);
        }
      } else {
        console.log('  ❌ Falha ao enviar email:', result.message);
      }
    } catch (error) {
      console.log('  ❌ Erro ao enviar email:', error.message);
    }
    */

    console.log('='.repeat(60));
    console.log('✅ TESTE CONCLUÍDO');
    console.log('='.repeat(60));
}

// Executar teste
testEmailConfiguration()
    .then(() => {
        console.log('\n✨ Configuração de email está pronta para uso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro durante o teste:', error);
        process.exit(1);
    });
