import { Envelope } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function Email() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground">
            Gerencie campanhas de email e comunicação por email.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Envelope size={20} />
            Marketing por Email
          </CardTitle>
          <CardDescription>
            Crie e gerencie campanhas de email marketing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção será implementada com funcionalidades para:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Criar campanhas de email</li>
            <li>• Templates de email responsivos</li>
            <li>• Segmentação de clientes</li>
            <li>• Automação de email</li>
            <li>• Métricas de abertura e cliques</li>
            <li>• Integração com provedores de email</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
