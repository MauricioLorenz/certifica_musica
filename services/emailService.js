const axios = require('axios');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

exports.enviarResetSenha = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = `${frontendUrl}/reset-senha?token=${token}`;

  await axios.post(
    BREVO_URL,
    {
      sender: { name: 'CertificaMúsica', email: 'noreply@certifica.com.br' },
      to: [{ email }],
      subject: 'Redefinição de senha — CertificaMúsica',
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1117;border-radius:12px;color:#e6edf3">
          <h2 style="margin:0 0 8px;color:#ffffff">Redefinição de senha</h2>
          <p style="color:#8b949e;margin:0 0 24px">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo — o link é válido por <strong style="color:#e6edf3">30 minutos</strong>.</p>
          <a href="${link}" style="display:inline-block;background:#17c8eb;color:#06080c;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none">Redefinir minha senha</a>
          <p style="color:#8b949e;font-size:12px;margin:24px 0 0">Se você não solicitou isso, ignore este e-mail. Sua senha não será alterada.</p>
        </div>
      `,
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
};
