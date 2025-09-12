import { ChatCircle } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function Messages() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensagens</h1>
          <p className="text-muted-foreground">
            Central de mensagens e comunicação com clientes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChatCircle size={20} />
            Central de Mensagens
          </CardTitle>
          <CardDescription>
            Gerencie toda comunicação com seus clientes em um só lugar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção será implementada com funcionalidades para:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Visualizar histórico de mensagens</li>
            <li>• Criar templates de mensagem</li>
            <li>• Enviar mensagens em massa</li>
            <li>• Acompanhar status de entrega</li>
            <li>• Relatórios de engajamento</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
