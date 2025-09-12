import { ChartBar } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e relatórios detalhados do seu negócio.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBar size={20} />
            Analytics e Relatórios
          </CardTitle>
          <CardDescription>
            Visualize métricas e gere relatórios personalizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção será implementada com funcionalidades para:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Relatórios de vendas e receita</li>
            <li>• Análise de uso de vouchers</li>
            <li>• Métricas de engajamento</li>
            <li>• Relatórios de clientes</li>
            <li>• Dashboards personalizáveis</li>
            <li>• Exportação de dados</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
