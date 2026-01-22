package ota

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"

	"github.com/rs/zerolog"
)

// OTAManager gerencia atualizações OTA do Edge-Pro
type OTAManager struct {
	log            zerolog.Logger
	currentVersion string
	binaryPath     string
	serviceName    string
	mu             sync.Mutex
	inProgress     bool
	firmwareBuffer []byte
	totalSize      int64
	bytesReceived  int64
	expectedChecksum string
	version        string
}

// NewOTAManager cria um novo gerenciador OTA
func NewOTAManager(log zerolog.Logger, version string) *OTAManager {
	return &OTAManager{
		log:            log,
		currentVersion: version,
		binaryPath:     "/usr/local/bin/edge-pro",
		serviceName:    "edge-pro",
	}
}

// StartOTA inicia processo de atualização OTA
func (o *OTAManager) StartOTA(version string, totalSize int64, checksum string) error {
	o.mu.Lock()
	defer o.mu.Unlock()

	if o.inProgress {
		return fmt.Errorf("OTA já está em progresso")
	}

	o.log.Info().
		Str("version", version).
		Int64("size", totalSize).
		Str("checksum", checksum).
		Msg("🔄 Iniciando OTA")

	o.inProgress = true
	o.version = version
	o.totalSize = totalSize
	o.expectedChecksum = checksum
	o.bytesReceived = 0
	o.firmwareBuffer = make([]byte, 0, totalSize)

	return nil
}

// ProcessChunk processa um chunk do firmware
func (o *OTAManager) ProcessChunk(sequence int, chunkData []byte) error {
	o.mu.Lock()
	defer o.mu.Unlock()

	if !o.inProgress {
		return fmt.Errorf("OTA não está em progresso")
	}

	o.log.Debug().
		Int("sequence", sequence).
		Int("chunk_size", len(chunkData)).
		Int64("bytes_received", o.bytesReceived).
		Int64("total_size", o.totalSize).
		Msg("📦 Processando chunk OTA")

	// Adicionar chunk ao buffer
	o.firmwareBuffer = append(o.firmwareBuffer, chunkData...)
	o.bytesReceived += int64(len(chunkData))

	// Calcular progresso
	progress := int((float64(o.bytesReceived) / float64(o.totalSize)) * 100)
	
	o.log.Info().
		Int("progress", progress).
		Int64("bytes", o.bytesReceived).
		Int64("total", o.totalSize).
		Msg("📊 Progresso OTA")

	return nil
}

// FinishOTA finaliza OTA e instala o novo binário
func (o *OTAManager) FinishOTA() error {
	o.mu.Lock()
	defer o.mu.Unlock()

	if !o.inProgress {
		return fmt.Errorf("OTA não está em progresso")
	}

	o.log.Info().Msg("🔍 Finalizando OTA...")

	// Verificar se recebeu todos os bytes
	if o.bytesReceived != o.totalSize {
		o.inProgress = false
		return fmt.Errorf("tamanho incorreto: recebido %d, esperado %d", 
			o.bytesReceived, o.totalSize)
	}

	// Validar checksum
	if err := o.validateChecksum(); err != nil {
		o.inProgress = false
		return fmt.Errorf("checksum inválido: %w", err)
	}

	// Fazer backup do binário atual
	backupPath := fmt.Sprintf("%s.backup.%s", o.binaryPath, o.currentVersion)
	if err := o.backupCurrentBinary(backupPath); err != nil {
		o.log.Warn().Err(err).Msg("⚠️ Não foi possível fazer backup")
	}

	// Salvar novo binário temporariamente
	tempFile := "/tmp/edge-pro-new"
	if err := o.saveTempBinary(tempFile); err != nil {
		o.restoreBackup(backupPath)
		o.inProgress = false
		return fmt.Errorf("erro ao salvar binário temporário: %w", err)
	}

	// Substituir binário
	if err := o.replaceBinary(tempFile); err != nil {
		o.restoreBackup(backupPath)
		o.inProgress = false
		return fmt.Errorf("erro ao substituir binário: %w", err)
	}

	o.log.Info().Msg("✅ OTA concluído com sucesso!")
	o.inProgress = false

	return nil
}

// GetProgress retorna o progresso atual (0-100)
func (o *OTAManager) GetProgress() int {
	o.mu.Lock()
	defer o.mu.Unlock()

	if !o.inProgress || o.totalSize == 0 {
		return 0
	}

	return int((float64(o.bytesReceived) / float64(o.totalSize)) * 100)
}

// GetBytesReceived retorna bytes recebidos
func (o *OTAManager) GetBytesReceived() int64 {
	o.mu.Lock()
	defer o.mu.Unlock()
	return o.bytesReceived
}

// GetVersion retorna versão do OTA
func (o *OTAManager) GetVersion() string {
	o.mu.Lock()
	defer o.mu.Unlock()
	return o.version
}

// IsInProgress retorna se OTA está em progresso
func (o *OTAManager) IsInProgress() bool {
	o.mu.Lock()
	defer o.mu.Unlock()
	return o.inProgress
}

// Cancel cancela OTA em progresso
func (o *OTAManager) Cancel() {
	o.mu.Lock()
	defer o.mu.Unlock()

	if o.inProgress {
		o.log.Warn().Msg("❌ OTA cancelado")
		o.inProgress = false
		o.firmwareBuffer = nil
		o.bytesReceived = 0
	}
}

// RestartService reinicia o serviço systemd
func (o *OTAManager) RestartService() error {
	o.log.Info().Msg("🔄 Reiniciando serviço systemd...")

	cmd := exec.Command("systemctl", "restart", o.serviceName)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("erro ao reiniciar serviço: %w", err)
	}

	o.log.Info().Msg("✅ Serviço reiniciado")
	return nil
}

// validateChecksum valida o checksum SHA256 do firmware recebido
func (o *OTAManager) validateChecksum() error {
	o.log.Info().Msg("🔍 Validando checksum SHA256...")

	hash := sha256.Sum256(o.firmwareBuffer)
	calculated := hex.EncodeToString(hash[:])

	if calculated != o.expectedChecksum {
		return fmt.Errorf("checksum inválido: esperado %s, calculado %s",
			o.expectedChecksum, calculated)
	}

	o.log.Info().Msg("✅ Checksum válido")
	return nil
}

// saveTempBinary salva o binário em arquivo temporário
func (o *OTAManager) saveTempBinary(filePath string) error {
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	if _, err := file.Write(o.firmwareBuffer); err != nil {
		os.Remove(filePath)
		return err
	}

	// Tornar executável
	if err := os.Chmod(filePath, 0755); err != nil {
		os.Remove(filePath)
		return err
	}

	return nil
}

// replaceBinary substitui o binário atual pelo novo
func (o *OTAManager) replaceBinary(newBinaryPath string) error {
	o.log.Info().Msg("🔄 Substituindo binário...")

	// Remover binário antigo
	if err := os.Remove(o.binaryPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("erro ao remover binário antigo: %w", err)
	}

	// Mover novo binário para o local correto
	if err := os.Rename(newBinaryPath, o.binaryPath); err != nil {
		return fmt.Errorf("erro ao mover novo binário: %w", err)
	}

	o.log.Info().Msg("✅ Binário substituído")
	return nil
}

// backupCurrentBinary faz backup do binário atual
func (o *OTAManager) backupCurrentBinary(backupPath string) error {
	o.log.Info().Str("backup", backupPath).Msg("💾 Fazendo backup...")

	src, err := os.Open(o.binaryPath)
	if err != nil {
		return err
	}
	defer src.Close()

	// Criar diretório se não existir
	if err := os.MkdirAll(filepath.Dir(backupPath), 0755); err != nil {
		return err
	}

	dst, err := os.Create(backupPath)
	if err != nil {
		return err
	}
	defer dst.Close()

	if _, err := dst.ReadFrom(src); err != nil {
		os.Remove(backupPath)
		return err
	}

	o.log.Info().Msg("✅ Backup criado")
	return nil
}

// restoreBackup restaura backup em caso de erro
func (o *OTAManager) restoreBackup(backupPath string) {
	o.log.Warn().Str("backup", backupPath).Msg("🔄 Restaurando backup...")

	if _, err := os.Stat(backupPath); err == nil {
		os.Rename(backupPath, o.binaryPath)
		o.log.Info().Msg("✅ Backup restaurado")
	}
}
