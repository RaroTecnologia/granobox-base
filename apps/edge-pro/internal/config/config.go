package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

// Config estrutura de configuração do edge
type Config struct {
	Device   DeviceConfig   `mapstructure:"device"`
	SocketIO SocketIOConfig `mapstructure:"socketio"`
	API      APIConfig      `mapstructure:"api"`
	Display  DisplayConfig  `mapstructure:"display"`
	Debug    bool           `mapstructure:"debug"`
}

// DeviceConfig configurações do dispositivo
type DeviceConfig struct {
	ID          string `mapstructure:"id"`
	Version     string `mapstructure:"version"`
	Name        string `mapstructure:"name"`        // Nome personalizado do dispositivo
	Location    string `mapstructure:"location"`    // Localização do dispositivo
	Hostname    string `mapstructure:"hostname"`    // Hostname personalizado
	ClientID    string `mapstructure:"client_id"`   // UUID do cliente (obtido via autenticação)
	OperationID string `mapstructure:"operation_id"` // UUID da operação (obtido via autenticação)
}

// SocketIOConfig configurações do Socket.IO
type SocketIOConfig struct {
	ServerURL        string `mapstructure:"server_url"`        // URL do servidor remoto (api.granobox.com.br)
	APIKey           string `mapstructure:"api_key"`           // API Key para autenticação
	LocalPort        int    `mapstructure:"local_port"`        // Porta do servidor local
	AgentFingerprint string `mapstructure:"agent_fingerprint"` // Fingerprint único do agent
	Namespace        string `mapstructure:"namespace"`         // Namespace (default: /agents)
	ReconnectDelay   int    `mapstructure:"reconnect_delay"`   // Delay de reconnect em segundos
}

// APIConfig configurações da API HTTP
type APIConfig struct {
	Port int    `mapstructure:"port"`
	Host string `mapstructure:"host"`
}

// DisplayConfig configurações do display
type DisplayConfig struct {
	Enabled    bool   `mapstructure:"enabled"`
	ServiceURL string `mapstructure:"service_url"`
	Type       string `mapstructure:"type"` // "rgb", "oled", "none"
}

// Load carrega a configuração
func Load(configPath string) (*Config, error) {
	v := viper.New()

	// Valores padrão - Edge-Pro Granobox
	v.SetDefault("device.version", "1.0.0")
	v.SetDefault("socketio.server_url", "https://api.granobox.com.br")
	v.SetDefault("socketio.local_port", 3000)
	v.SetDefault("socketio.namespace", "/agents")
	v.SetDefault("socketio.reconnect_delay", 5)
	v.SetDefault("api.port", 8080)
	v.SetDefault("api.host", "0.0.0.0")
	v.SetDefault("display.enabled", false)
	v.SetDefault("display.service_url", "localhost:3006")
	v.SetDefault("display.type", "rgb")
	v.SetDefault("debug", false)

	// Ler de variáveis de ambiente
	v.SetEnvPrefix("EDGE_PRO")
	v.AutomaticEnv()

	// Ler arquivo de configuração se fornecido
	if configPath != "" {
		v.SetConfigFile(configPath)
		if err := v.ReadInConfig(); err != nil {
			return nil, fmt.Errorf("erro ao ler config: %w", err)
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("erro ao decodificar config: %w", err)
	}

	// Gerar device ID se não fornecido
	if cfg.Device.ID == "" {
		hostname, _ := os.Hostname()
		cfg.Device.ID = hostname
	}

	// Gerar agent fingerprint se não fornecido
	if cfg.SocketIO.AgentFingerprint == "" {
		cfg.SocketIO.AgentFingerprint = fmt.Sprintf("edge-%s", cfg.Device.ID)
	}

	return &cfg, nil
}
