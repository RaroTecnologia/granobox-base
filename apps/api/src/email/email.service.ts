import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required');
    }
    
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'cadastro@granobox.com.br';
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5174'}/reset-password?token=${resetToken}`;
    
    const html = this.generatePasswordResetLinkEmailHTML({
      userName,
      resetUrl,
    });

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Recuperação de Senha - Granobox',
        html,
      });
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw error;
    }
  }

  async sendNewPasswordEmail({
    to,
    userName,
    newPassword,
  }: {
    to: string;
    userName: string;
    newPassword: string;
  }): Promise<void> {
    const html = this.generatePasswordResetEmailHTML({
      userName,
      newPassword,
    });

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Nova senha - Granobox',
        html,
      });
    } catch (error) {
      console.error('Erro ao enviar email de reset de senha:', error);
      throw new Error('Falha ao enviar email de reset de senha');
    }
  }

  async sendInviteEmail({
    to,
    clientName,
    inviteToken,
    message,
  }: {
    to: string;
    clientName: string;
    message?: string;
    inviteToken: string;
  }): Promise<void> {
    const inviteUrl = `${this.configService.get<string>('FRONTEND_URL')}/accept-invite?token=${inviteToken}`;
    
    const html = this.generateInviteEmailHTML({
      clientName,
      inviteUrl,
      message,
    });

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: `Convite para acessar a plataforma Granobox - ${clientName}`,
        html,
      });
    } catch (error) {
      console.error('Erro ao enviar email de convite:', error);
      throw new Error('Falha ao enviar email de convite');
    }
  }

  private generatePasswordResetEmailHTML({
    userName,
    newPassword,
  }: {
    userName: string;
    newPassword: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Senha - Granobox</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background-color: #1DA154;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .logo-text {
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            color: #1DA154;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
          }
          .content {
            margin-bottom: 30px;
          }
          .password-box {
            background-color: #f8f9fa;
            border: 2px solid #1DA154;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .password {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            color: #1DA154;
            letter-spacing: 2px;
            margin: 10px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span class="logo-text">GB</span>
            </div>
            <h1 class="title">Granobox</h1>
            <p class="subtitle">Smart Tag. Smart Food.</p>
          </div>

          <div class="content">
            <h2>Olá, ${userName}!</h2>
            <p>Sua senha foi resetada com sucesso. Aqui está sua nova senha:</p>
            
            <div class="password-box">
              <p><strong>Sua nova senha é:</strong></p>
              <div class="password">${newPassword}</div>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere esta senha no seu primeiro login.
            </div>

            <p>Você pode fazer login na plataforma usando seu email e esta nova senha.</p>
          </div>

          <div class="footer">
            <p>Se você não solicitou este reset de senha, entre em contato conosco imediatamente.</p>
            <p>
              <strong>Granobox</strong><br>
              Wdezoito Tecnologia - CNPJ 26.058.346/0001-34<br>
              <a href="mailto:cadastro@granobox.com.br">cadastro@granobox.com.br</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateInviteEmailHTML({
    clientName,
    inviteUrl,
    message,
  }: {
    clientName: string;
    inviteUrl: string;
    message?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite Granobox</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background-color: #1DA154;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .logo-text {
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            color: #1DA154;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
          }
          .content {
            margin-bottom: 30px;
          }
          .message {
            background-color: #f8f9fa;
            border-left: 4px solid #1DA154;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .cta-button {
            display: inline-block;
            background-color: #1DA154;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s;
          }
          .cta-button:hover {
            background-color: #16a085;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span class="logo-text">GB</span>
            </div>
            <h1 class="title">Granobox</h1>
            <p class="subtitle">Smart Tag. Smart Food.</p>
          </div>

          <div class="content">
            <h2>Olá!</h2>
            <p>Você foi convidado para acessar a plataforma Granobox para <strong>${clientName}</strong>.</p>
            
            ${message ? `
              <div class="message">
                <strong>Mensagem personalizada:</strong><br>
                ${message}
              </div>
            ` : ''}

            <p>Para ativar sua conta e começar a usar a plataforma, clique no botão abaixo:</p>

            <div style="text-align: center;">
              <a href="${inviteUrl}" class="cta-button">
                Aceitar Convite e Ativar Conta
              </a>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Este convite expira em 7 dias. Se você não conseguir acessar o link, entre em contato conosco.
            </div>

            <p>Após ativar sua conta, você poderá:</p>
            <ul>
              <li>Gerenciar etiquetas de validade dos seus produtos</li>
              <li>Acompanhar relatórios e estatísticas</li>
              <li>Configurar alertas e notificações</li>
              <li>Criar e gerenciar usuários da sua equipe</li>
            </ul>
          </div>

          <div class="footer">
            <p>Se você não solicitou este convite, pode ignorar este email.</p>
            <p>
              <strong>Granobox</strong><br>
              Wdezoito Tecnologia - CNPJ 26.058.346/0001-34<br>
              <a href="mailto:cadastro@granobox.com.br">cadastro@granobox.com.br</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetLinkEmailHTML({
    userName,
    resetUrl,
  }: {
    userName: string;
    resetUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - Granobox</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background-color: #1DA154;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .logo-text {
            color: white;
            font-weight: bold;
            font-size: 24px;
          }
          .title {
            color: #1DA154;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .subtitle {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 14px;
          }
          .content {
            margin-bottom: 30px;
          }
          .content h2 {
            color: #333;
            margin-bottom: 20px;
          }
          .content p {
            margin-bottom: 15px;
          }
          .cta-button {
            display: inline-block;
            background-color: #1DA154;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          .cta-button:hover {
            background-color: #16844a;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .footer a {
            color: #1DA154;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span class="logo-text">GB</span>
            </div>
            <h1 class="title">Granobox</h1>
            <p class="subtitle">Smart Tag. Smart Food.</p>
          </div>

          <div class="content">
            <h2>Olá, ${userName}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta Granobox.</p>
            
            <p>Para criar uma nova senha, clique no botão abaixo:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="cta-button">
                Redefinir Minha Senha
              </a>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança. Se você não solicitou esta recuperação, pode ignorar este email.
            </div>

            <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
          </div>

          <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>© 2025 Granobox. Todos os direitos reservados.</p>
            <p><a href="https://granobox.com.br">granobox.com.br</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
}
}
