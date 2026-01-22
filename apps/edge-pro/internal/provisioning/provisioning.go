package provisioning

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/rs/zerolog"
)

const (
	ConfigDir  = "/etc/edge-pro"
	ConfigFile = "/etc/edge-pro/config.json"
	FlagFile   = "/etc/edge-pro/configured"
)

// Config estrutura de configuração persistente
type Config struct {
	WiFiSSID       string `json:"wifi_ssid"`
	WiFiPassword   string `json:"wifi_password"`
	Fingerprint    string `json:"fingerprint"`
	APIKey         string `json:"api_key,omitempty"`
	BackendURL     string `json:"backend_url,omitempty"`
	Configured     bool   `json:"configured"`
	ConfiguredAt   string `json:"configured_at,omitempty"`
}

// ProvisioningManager gerencia o modo de provisionamento
type ProvisioningManager struct {
	log       zerolog.Logger
	config    *Config
	isConfigured bool
}

// New cria um novo ProvisioningManager
func New(log zerolog.Logger) *ProvisioningManager {
	return &ProvisioningManager{
		log: log,
	}
}

// IsConfigured verifica se o device já foi configurado
func (pm *ProvisioningManager) IsConfigured() bool {
	// Verificar se arquivo de flag existe
	if _, err := os.Stat(FlagFile); err == nil {
		pm.isConfigured = true
		return true
	}

	// Verificar se config.json existe e tem WiFi configurado
	if cfg, err := pm.LoadConfig(); err == nil {
		if cfg.WiFiSSID != "" && cfg.Configured {
			pm.isConfigured = true
			return true
		}
	}

	pm.isConfigured = false
	return false
}

// LoadConfig carrega a configuração do arquivo
func (pm *ProvisioningManager) LoadConfig() (*Config, error) {
	data, err := os.ReadFile(ConfigFile)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler config: %w", err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("erro ao parsear config: %w", err)
	}

	pm.config = &cfg
	return &cfg, nil
}

// SaveConfig salva a configuração no arquivo
func (pm *ProvisioningManager) SaveConfig(cfg *Config) error {
	// Criar diretório se não existir
	if err := os.MkdirAll(ConfigDir, 0755); err != nil {
		return fmt.Errorf("erro ao criar diretório: %w", err)
	}

	// Serializar config
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("erro ao serializar config: %w", err)
	}

	// Salvar arquivo
	if err := os.WriteFile(ConfigFile, data, 0600); err != nil {
		return fmt.Errorf("erro ao salvar config: %w", err)
	}

	// Criar arquivo de flag
	if cfg.Configured {
		if err := os.WriteFile(FlagFile, []byte("configured"), 0644); err != nil {
			return fmt.Errorf("erro ao criar flag: %w", err)
		}
	}

	pm.config = cfg
	pm.log.Info().Str("file", ConfigFile).Msg("Configuração salva")
	return nil
}

// GetConfig retorna a configuração atual
func (pm *ProvisioningManager) GetConfig() *Config {
	if pm.config == nil {
		cfg, _ := pm.LoadConfig()
		return cfg
	}
	return pm.config
}

// ResetConfig remove a configuração (para re-provisioning)
func (pm *ProvisioningManager) ResetConfig() error {
	// Remover flag
	os.Remove(FlagFile)
	
	// Remover config
	os.Remove(ConfigFile)
	
	pm.config = nil
	pm.isConfigured = false
	
	pm.log.Warn().Msg("Configuração resetada - entrando em modo provisioning")
	return nil
}

// GetProvisioningData retorna os dados para o QR code
func (pm *ProvisioningManager) GetProvisioningData(fingerprint, hotspotSSID, hotspotPassword string) map[string]string {
	return map[string]string{
		"ssid":        hotspotSSID,
		"password":    hotspotPassword,
		"fingerprint": fingerprint,
		"ip":          "192.168.4.1",
		"port":        "80",
	}
}

// GetConfigDir retorna o diretório de configuração
func GetConfigDir() string {
	// Em desenvolvimento, usar diretório local
	if os.Getenv("EDGE_PRO_DEV") == "true" {
		homeDir, _ := os.UserHomeDir()
		return filepath.Join(homeDir, ".edge-pro")
	}
	return ConfigDir
}

// GetConfigFile retorna o caminho do arquivo de configuração
func GetConfigFile() string {
	dir := GetConfigDir()
	return filepath.Join(dir, "config.json")
}

// GetFlagFile retorna o caminho do arquivo de flag
func GetFlagFile() string {
	dir := GetConfigDir()
	return filepath.Join(dir, "configured")
}


