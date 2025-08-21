/*
  Warnings:

  - You are about to drop the column `localArmazenamento` on the `tipos_manipulado` table. All the data in the column will be lost.
  - You are about to drop the column `statusConservacao` on the `tipos_manipulado` table. All the data in the column will be lost.
  - You are about to drop the column `tempoValidade` on the `tipos_manipulado` table. All the data in the column will be lost.
  - Added the required column `conservacaoRecomendada` to the `tipos_manipulado` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tipos_manipulado" DROP COLUMN "localArmazenamento",
DROP COLUMN "statusConservacao",
DROP COLUMN "tempoValidade",
ADD COLUMN     "conservacaoRecomendada" "StatusConservacaoProduto" NOT NULL,
ADD COLUMN     "validadeCongelado" INTEGER,
ADD COLUMN     "validadeRefrigerado" INTEGER,
ADD COLUMN     "validadeTemperaturaAmbiente" INTEGER;
