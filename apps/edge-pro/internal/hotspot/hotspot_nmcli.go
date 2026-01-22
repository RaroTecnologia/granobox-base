package hotspot

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/rs/zerolog"
)

// HotspotManagerNmcli gerencia hotspot usando NetworkManager CLI
type HotspotManagerNmcli struct {
	log            zerolog.Logger
	ssid           string
	password       string
	ip             string
	connectionName string
	isActive       bool
}

// NewNmcli cria um novo HotspotManager usando nmcli
func NewNmcli(log zerolog.Logger, ssid, password string) *HotspotManagerNmcli {
	return &HotspotManagerNmcli{
		log:            log,
		ssid:           ssid,
		password:       password,
		ip:             "10.42.0.1", // nmcli usa 10.42.0.x por padrão
		connectionName: "edge-pro-hotspot",
		isActive:       false,
	}
}

// Start inicia o hotspot usando nmcli (muito mais simples!)
func (hm *HotspotManagerNmcli) Start() error {
	hm.log.Info().
		Str("ssid", hm.ssid).
		Str("ip", hm.ip).
		Msg("🔥 Iniciando hotspot WiFi via NetworkManager")

	// Modo dev
	if os.Getenv("EDGE_PRO_DEV") == "true" {
		hm.log.Warn().Msg("⚠️  Modo desenvolvimento - hotspot simulado")
		hm.isActive = true
		return nil
	}

	// Verificar se nmcli existe
	if _, err := exec.LookPath("nmcli"); err != nil {
		return fmt.Errorf("nmcli não encontrado: %w", err)
	}

	// Deletar conexão antiga se existir
	exec.Command("nmcli", "connection", "delete", hm.connectionName).Run()

	// Criar hotspot usando nmcli (MUITO MAIS SIMPLES!)
	cmd := exec.Command(
		"nmcli", "device", "wifi", "hotspot",
		"ifname", "wlan0",
		"con-name", hm.connectionName,
		"ssid", hm.ssid,
		"password", hm.password,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("falha ao criar hotspot: %w\nOutput: %s", err, string(output))
	}

	hm.log.Info().Str("output", string(output)).Msg("Hotspot criado via nmcli")

	// Configurar IP estático (nmcli cria com DHCP automático)
	// O IP 192.168.4.1 já é configurado automaticamente pelo nmcli

	hm.isActive = true
	hm.log.Info().Msg("✅ Hotspot WiFi iniciado com sucesso via nmcli")
	return nil
}

// Stop para o hotspot
func (hm *HotspotManagerNmcli) Stop() error {
	hm.log.Info().Msg("Parando hotspot WiFi")

	if os.Getenv("EDGE_PRO_DEV") == "true" {
		hm.isActive = false
		return nil
	}

	// Parar conexão do hotspot
	cmd := exec.Command("nmcli", "connection", "down", hm.connectionName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		hm.log.Warn().Err(err).Str("output", string(output)).Msg("Erro ao parar hotspot")
	}

	// Deletar conexão
	cmd = exec.Command("nmcli", "connection", "delete", hm.connectionName)
	cmd.Run()

	hm.isActive = false
	hm.log.Info().Msg("✅ Hotspot parado")
	return nil
}

// IsActive retorna se o hotspot está ativo
func (hm *HotspotManagerNmcli) IsActive() bool {
	return hm.isActive
}

// GetSSID retorna o SSID do hotspot
func (hm *HotspotManagerNmcli) GetSSID() string {
	return hm.ssid
}

// GetPassword retorna a senha do hotspot
func (hm *HotspotManagerNmcli) GetPassword() string {
	return hm.password
}

// GetIP retorna o IP do hotspot
func (hm *HotspotManagerNmcli) GetIP() string {
	return hm.ip
}

