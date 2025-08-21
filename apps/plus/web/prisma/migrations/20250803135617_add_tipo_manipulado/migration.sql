/*
  Warnings:

  - Added the required column `organizacaoId` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `configuracoes_impressora` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `ingredientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `planos_producao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `receitas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusConservacaoProduto" AS ENUM ('TEMPERATURA_AMBIENTE', 'CONGELADO', 'RESFRIADO');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "configuracoes_impressora" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ingredientes" ADD COLUMN     "organizacaoId" TEXT NOT NULL,
ALTER COLUMN "custoUnitario" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "planos_producao" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "receitas" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tipos_manipulado" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "unidade" TEXT NOT NULL DEFAULT 'kg',
    "estoqueMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "custoUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statusConservacao" "StatusConservacaoProduto" NOT NULL,
    "tempoValidade" INTEGER NOT NULL DEFAULT 7,
    "localArmazenamento" TEXT,
    "instrucoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_manipulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manipulados" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "unidade" TEXT NOT NULL DEFAULT 'kg',
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estoqueMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "custoUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statusConservacao" "StatusConservacaoProduto" NOT NULL,
    "dataManipulacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataValidade1" TIMESTAMP(3),
    "dataValidade2" TIMESTAMP(3),
    "dataValidade3" TIMESTAMP(3),
    "localArmazenamento" TEXT,
    "instrucoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "receitaId" TEXT,
    "tipoManipuladoId" TEXT,
    "usuarioCriacao" TEXT,

    CONSTRAINT "manipulados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_manipulado" (
    "id" TEXT NOT NULL,
    "manipuladoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "quantidadeAnterior" DOUBLE PRECISION NOT NULL,
    "quantidadeNova" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataMovimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "movimentacoes_manipulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos_prontos" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "unidade" TEXT NOT NULL DEFAULT 'unidade',
    "statusConservacao" "StatusConservacaoProduto" NOT NULL,
    "dataProducao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_prontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_produto_pronto" (
    "id" TEXT NOT NULL,
    "produtoProntoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataMovimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "movimentacoes_produto_pronto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizacoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "documento" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "endereco" JSONB,
    "logo" TEXT,
    "dominio" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "periodo" TEXT NOT NULL DEFAULT 'mensal',
    "recursos" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "dataCancelamento" TIMESTAMP(3),
    "valor" DOUBLE PRECISION NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "observacoes" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "assinaturaId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "metodoPagamento" TEXT,
    "observacoes" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "telefone" TEXT,
    "cargo" TEXT,
    "avatar" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "recursos" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes_usuarios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,
    "dataConcessao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissoes_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_organizacao" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "tema" TEXT NOT NULL DEFAULT 'light',
    "idioma" TEXT NOT NULL DEFAULT 'pt-BR',
    "fusoHorario" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "formatoData" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    "formatoHora" TEXT NOT NULL DEFAULT 'HH:mm',
    "configuracoes" JSONB,

    CONSTRAINT "configuracoes_organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_sistema" (
    "id" TEXT NOT NULL,
    "nomeEmpresa" TEXT NOT NULL,
    "emailSuporte" TEXT NOT NULL,
    "telefoneSuporte" TEXT,
    "endereco" TEXT,
    "cnpj" TEXT,
    "logo" TEXT,
    "corPrimaria" TEXT NOT NULL DEFAULT '#f2811d',
    "corSecundaria" TEXT NOT NULL DEFAULT '#0ea5e9',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "idioma" TEXT NOT NULL DEFAULT 'pt-BR',
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "backupAutomatico" BOOLEAN NOT NULL DEFAULT true,
    "notificacoesEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificacoesSMS" BOOLEAN NOT NULL DEFAULT false,
    "politicaSenha" JSONB NOT NULL DEFAULT '{"tamanhoMinimo":8,"caracteresEspeciais":true,"numeros":true,"maiusculas":true}',
    "sessao" JSONB NOT NULL DEFAULT '{"tempoExpiracao":24,"maximoSessoes":5}',
    "pagamento" JSONB NOT NULL DEFAULT '{"gateway":"stripe","modoTeste":true,"webhookUrl":""}',
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_documento_key" ON "organizacoes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_dominio_key" ON "organizacoes"("dominio");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_organizacaoId_key" ON "assinaturas"("organizacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "faturas_numero_key" ON "faturas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_organizacaoId_key" ON "usuarios"("email", "organizacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_nome_key" ON "permissoes"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_usuarios_usuarioId_permissaoId_key" ON "permissoes_usuarios"("usuarioId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_organizacao_organizacaoId_key" ON "configuracoes_organizacao"("organizacaoId");

-- AddForeignKey
ALTER TABLE "ingredientes" ADD CONSTRAINT "ingredientes_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_producao" ADD CONSTRAINT "planos_producao_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_impressora" ADD CONSTRAINT "configuracoes_impressora_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_manipulado" ADD CONSTRAINT "tipos_manipulado_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manipulados" ADD CONSTRAINT "manipulados_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manipulados" ADD CONSTRAINT "manipulados_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "receitas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manipulados" ADD CONSTRAINT "manipulados_tipoManipuladoId_fkey" FOREIGN KEY ("tipoManipuladoId") REFERENCES "tipos_manipulado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manipulados" ADD CONSTRAINT "manipulados_usuarioCriacao_fkey" FOREIGN KEY ("usuarioCriacao") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_manipulado" ADD CONSTRAINT "movimentacoes_manipulado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_manipulado" ADD CONSTRAINT "movimentacoes_manipulado_manipuladoId_fkey" FOREIGN KEY ("manipuladoId") REFERENCES "manipulados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_prontos" ADD CONSTRAINT "produtos_prontos_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_prontos" ADD CONSTRAINT "produtos_prontos_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "receitas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_produto_pronto" ADD CONSTRAINT "movimentacoes_produto_pronto_produtoProntoId_fkey" FOREIGN KEY ("produtoProntoId") REFERENCES "produtos_prontos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "assinaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes_usuarios" ADD CONSTRAINT "permissoes_usuarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes_usuarios" ADD CONSTRAINT "permissoes_usuarios_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_organizacao" ADD CONSTRAINT "configuracoes_organizacao_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
