-- CreateTable
CREATE TABLE "ingredientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "estoqueAtual" DOUBLE PRECISION NOT NULL,
    "estoqueMinimo" DOUBLE PRECISION NOT NULL,
    "custoUnitario" DOUBLE PRECISION NOT NULL,
    "fornecedor" TEXT,
    "dataValidade" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_lista_compras" (
    "id" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "unidade" TEXT NOT NULL,
    "comprado" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "adicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_lista_compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receitas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "rendimento" INTEGER NOT NULL,
    "tempoPreparo" INTEGER NOT NULL,
    "custoTotal" DOUBLE PRECISION NOT NULL,
    "precoVenda" DOUBLE PRECISION NOT NULL,
    "instrucoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "pesoUnitario" DOUBLE PRECISION,
    "tamanhoForma" TEXT,
    "pesoTotalBase" DOUBLE PRECISION,
    "sistemaCalculo" TEXT NOT NULL DEFAULT 'peso',

    CONSTRAINT "receitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_receita" (
    "id" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "isIngredienteBase" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "itens_receita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" JSONB,
    "dataNascimento" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCompras" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "formaPagamento" TEXT,
    "observacoes" TEXT,
    "dataHoraPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataHoraEntrega" TIMESTAMP(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_producao" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "observacoes" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_producao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_producao" (
    "id" TEXT NOT NULL,
    "planoProducaoId" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "itens_producao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataMovimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_impressora" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "interface" TEXT NOT NULL,
    "largura" INTEGER NOT NULL DEFAULT 48,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "configuracao" TEXT,

    CONSTRAINT "configuracoes_impressora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas_receita" (
    "id" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "descricao" TEXT,
    "tempoMin" INTEGER,
    "tempoMax" INTEGER,
    "temperatura" DOUBLE PRECISION,
    "umidade" DOUBLE PRECISION,
    "observacoes" TEXT,

    CONSTRAINT "etapas_receita_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "itens_lista_compras" ADD CONSTRAINT "itens_lista_compras_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_receita" ADD CONSTRAINT "itens_receita_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_receita" ADD CONSTRAINT "itens_receita_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "receitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "receitas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_producao" ADD CONSTRAINT "itens_producao_planoProducaoId_fkey" FOREIGN KEY ("planoProducaoId") REFERENCES "planos_producao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_producao" ADD CONSTRAINT "itens_producao_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "receitas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapas_receita" ADD CONSTRAINT "etapas_receita_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "receitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

