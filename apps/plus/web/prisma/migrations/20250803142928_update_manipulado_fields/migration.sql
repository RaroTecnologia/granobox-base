/*
  Warnings:

  - You are about to drop the column `dataValidade1` on the `manipulados` table. All the data in the column will be lost.
  - You are about to drop the column `dataValidade2` on the `manipulados` table. All the data in the column will be lost.
  - You are about to drop the column `dataValidade3` on the `manipulados` table. All the data in the column will be lost.
  - You are about to drop the column `localArmazenamento` on the `manipulados` table. All the data in the column will be lost.
  - You are about to drop the column `lote` on the `manipulados` table. All the data in the column will be lost.
  - You are about to drop the column `statusConservacao` on the `manipulados` table. All the data in the column will be lost.
  - Added the required column `conservacaoRecomendada` to the `manipulados` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "manipulados" DROP COLUMN "dataValidade1",
DROP COLUMN "dataValidade2",
DROP COLUMN "dataValidade3",
DROP COLUMN "localArmazenamento",
DROP COLUMN "lote",
DROP COLUMN "statusConservacao",
ADD COLUMN     "conservacaoRecomendada" "StatusConservacaoProduto" NOT NULL,
ADD COLUMN     "validadeCongelado" INTEGER,
ADD COLUMN     "validadeRefrigerado" INTEGER,
ADD COLUMN     "validadeTemperaturaAmbiente" INTEGER;
