-- Adicionar campos de configuração de impressoras Tagment na tabela clients
-- Executar este script no banco de dados de produção

ALTER TABLE "clients" 
ADD COLUMN IF NOT EXISTS "tagmentPrinterValidadeId" varchar(255),
ADD COLUMN IF NOT EXISTS "tagmentPrinterRotuloId" varchar(255);

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('tagmentPrinterValidadeId', 'tagmentPrinterRotuloId');


