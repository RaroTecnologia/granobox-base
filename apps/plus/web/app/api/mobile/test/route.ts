import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'API Mobile funcionando',
      timestamp: new Date().toISOString(),
      data: {
        planos: [
          {
            id: '1',
            receitaId: '1',
            receita: {
              id: '1',
              nome: 'Receita Teste',
              descricao: 'Receita para teste do app mobile',
              rendimento: 10,
              unidadeRendimento: 'porções',
              etapas: [],
              ingredientes: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            quantidade: 5,
            dataProducao: new Date().toISOString(),
            status: 'PENDENTE' as const,
            observacoes: 'Plano de teste para o app mobile',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 