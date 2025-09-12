import { WhatsappLogo } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function WhatsApp() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">
            Integração com WhatsApp Cloud API para mensagens.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WhatsappLogo size={20} />
            WhatsApp Business
          </CardTitle>
          <CardDescription>
            Envie mensagens via WhatsApp Cloud API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção será implementada com funcionalidades para:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Integração com WhatsApp Cloud API</li>
            <li>• Templates de mensagem aprovados</li>
            <li>• Envio de mensagens em massa</li>
            <li>• Chatbot automatizado</li>
            <li>• Métricas de entrega e leitura</li>
            <li>• Gerenciamento de conversas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
