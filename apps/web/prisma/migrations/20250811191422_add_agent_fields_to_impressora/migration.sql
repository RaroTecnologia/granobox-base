-- AlterTable
ALTER TABLE "configuracoes_impressora" ADD COLUMN     "agentProfile" TEXT,
ADD COLUMN     "usarAgent" BOOLEAN NOT NULL DEFAULT false;
