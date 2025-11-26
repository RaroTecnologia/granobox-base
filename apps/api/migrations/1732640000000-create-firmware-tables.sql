-- Migration: Criar tabelas para gerenciamento de firmware
-- Data: 2025-11-26

-- Criar enum para tipos de firmware
CREATE TYPE firmware_type AS ENUM ('edge-go', 'edge-go-ws', 'edge-pro');

-- Criar enum para status do firmware
CREATE TYPE firmware_status AS ENUM ('development', 'testing', 'stable', 'deprecated');

-- Tabela de versões de firmware disponíveis
CREATE TABLE firmware_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(20) NOT NULL,
    type firmware_type NOT NULL,
    status firmware_status DEFAULT 'development',
    description TEXT,
    checksum VARCHAR(64) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "downloadUrl" VARCHAR(255),
    "gitCommit" VARCHAR(50),
    "gitTag" VARCHAR(50),
    "idfVersion" VARCHAR(20),
    "chipTarget" VARCHAR(20),
    metadata JSONB,
    "isLatest" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabela de versões dos dispositivos
CREATE TABLE device_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "deviceId" VARCHAR(50) NOT NULL,
    "clientId" UUID NOT NULL,
    "currentVersion" VARCHAR(20) NOT NULL,
    "targetVersion" VARCHAR(20),
    "compileDate" VARCHAR(50),
    "compileTime" VARCHAR(50),
    "idfVersion" VARCHAR(20),
    "chipModel" VARCHAR(20),
    "chipCores" INTEGER,
    "chipRevision" INTEGER,
    "runningPartition" VARCHAR(20),
    "lastVersionCheck" TIMESTAMP,
    "lastUpdateAttempt" TIMESTAMP,
    "lastUpdateStatus" VARCHAR(50),
    "lastUpdateError" TEXT,
    metadata JSONB,
    "firmwareVersionId" UUID REFERENCES firmware_versions(id),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_firmware_versions_type_status ON firmware_versions (type, status);
CREATE INDEX idx_firmware_versions_latest ON firmware_versions (type, "isLatest") WHERE "isLatest" = TRUE;
CREATE INDEX idx_device_versions_device_id ON device_versions ("deviceId");
CREATE INDEX idx_device_versions_client_id ON device_versions ("clientId");
CREATE INDEX idx_device_versions_current_version ON device_versions ("currentVersion");
CREATE INDEX idx_device_versions_last_check ON device_versions ("lastVersionCheck");

-- Constraint para garantir apenas uma versão "latest" por tipo
CREATE UNIQUE INDEX idx_firmware_versions_unique_latest 
ON firmware_versions (type) 
WHERE "isLatest" = TRUE AND "isActive" = TRUE;

-- Constraint para garantir apenas um registro por dispositivo
CREATE UNIQUE INDEX idx_device_versions_unique_device 
ON device_versions ("deviceId");

-- Comentários nas tabelas
COMMENT ON TABLE firmware_versions IS 'Registro de versões de firmware disponíveis para dispositivos Edge-Go';
COMMENT ON TABLE device_versions IS 'Registro das versões de firmware instaladas nos dispositivos';

-- Comentários nas colunas principais
COMMENT ON COLUMN firmware_versions.version IS 'Versão semântica do firmware (ex: 1.2.3)';
COMMENT ON COLUMN firmware_versions.checksum IS 'Hash SHA256 do arquivo de firmware';
COMMENT ON COLUMN firmware_versions."isLatest" IS 'Indica se é a versão mais recente estável';
COMMENT ON COLUMN device_versions."deviceId" IS 'ID único do dispositivo Edge-Go';
COMMENT ON COLUMN device_versions."currentVersion" IS 'Versão atualmente instalada no dispositivo';
COMMENT ON COLUMN device_versions."targetVersion" IS 'Versão alvo para atualização (se em progresso)';

-- Inserir versão inicial do Edge-Go-WS
INSERT INTO firmware_versions (
    version,
    type,
    status,
    description,
    checksum,
    "fileSize",
    "gitTag",
    "idfVersion",
    "chipTarget",
    "isLatest",
    metadata
) VALUES (
    '1.0.0',
    'edge-go-ws',
    'stable',
    'Versão inicial do Edge-Go com WebSocket',
    'placeholder-checksum-will-be-updated-on-first-build',
    0,
    'v1.0.0',
    '5.1.0',
    'esp32s3',
    TRUE,
    '{"description": "Primeira versão estável com suporte a WebSocket", "features": ["websocket", "ota", "printer_ping"]}'
);

RAISE NOTICE '✅ Tabelas de firmware criadas com sucesso';
RAISE NOTICE '📦 Versão inicial Edge-Go-WS v1.0.0 registrada';
RAISE NOTICE '🔍 Use SELECT * FROM firmware_versions para verificar';
