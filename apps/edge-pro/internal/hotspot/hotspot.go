package hotspot

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

const (
	DefaultSSIDPrefix = "Edge-Pro"
	DefaultPassword   = "granobox123"
	DefaultIP         = "192.168.4.1"
	DefaultInterface  = "wlan0"
)

// HotspotManager gerencia o hotspot WiFi
type HotspotManager struct {
	log        zerolog.Logger
	ssid       string
	password   string
	ip         string
	interface_ string
	isActive   bool
}

// New cria um novo HotspotManager
func New(log zerolog.Logger, ssid, password string) *HotspotManager {
	if ssid == "" {
		ssid = fmt.Sprintf("%s-%s", DefaultSSIDPrefix, generateSuffix())
	}
	if password == "" {
		password = DefaultPassword
	}

	return &HotspotManager{
		log:        log,
		ssid:       ssid,
		password:   password,
		ip:         DefaultIP,
		interface_: DefaultInterface,
		isActive:   false,
	}
}

// Start inicia o hotspot
func (hm *HotspotManager) Start() error {
	hm.log.Info().
		Str("ssid", hm.ssid).
		Str("ip", hm.ip).
		Msg("🔥 Iniciando hotspot WiFi")

	// Em desenvolvimento, apenas simular
	if os.Getenv("EDGE_PRO_DEV") == "true" {
		hm.log.Warn().Msg("⚠️  Modo desenvolvimento - hotspot simulado")
		hm.isActive = true
		return nil
	}

	// Verificar se está no Linux
	if !isLinux() {
		hm.log.Warn().Msg("⚠️  Hotspot só funciona no Linux - simulando")
		hm.isActive = true
		return nil
	}

	// Parar NetworkManager (se estiver rodando)
	if err := hm.stopNetworkManager(); err != nil {
		hm.log.Warn().Err(err).Msg("Erro ao parar NetworkManager")
	}

	// Configurar interface
	if err := hm.configureInterface(); err != nil {
		return fmt.Errorf("erro ao configurar interface: %w", err)
	}

	// Iniciar dnsmasq (DHCP + DNS)
	if err := hm.startDNSMasq(); err != nil {
		return fmt.Errorf("erro ao iniciar dnsmasq: %w", err)
	}

	// Iniciar hostapd (AP)
	if err := hm.startHostAPD(); err != nil {
		return fmt.Errorf("erro ao iniciar hostapd: %w", err)
	}

	hm.isActive = true
	hm.log.Info().Msg("✅ Hotspot iniciado com sucesso")
	return nil
}

// Stop para o hotspot
func (hm *HotspotManager) Stop() error {
	hm.log.Info().Msg("Parando hotspot WiFi")

	if os.Getenv("EDGE_PRO_DEV") == "true" {
		hm.isActive = false
		return nil
	}

	// Parar serviços
	exec.Command("killall", "hostapd").Run()
	exec.Command("killall", "dnsmasq").Run()

	// Limpar interface
	exec.Command("ip", "addr", "flush", "dev", hm.interface_).Run()

	// Reiniciar NetworkManager
	hm.startNetworkManager()

	hm.isActive = false
	hm.log.Info().Msg("✅ Hotspot parado")
	return nil
}

// IsActive retorna se o hotspot está ativo
func (hm *HotspotManager) IsActive() bool {
	return hm.isActive
}

// GetSSID retorna o SSID do hotspot
func (hm *HotspotManager) GetSSID() string {
	return hm.ssid
}

// GetPassword retorna a senha do hotspot
func (hm *HotspotManager) GetPassword() string {
	return hm.password
}

// GetIP retorna o IP do hotspot
func (hm *HotspotManager) GetIP() string {
	return hm.ip
}

// configureInterface configura a interface de rede
func (hm *HotspotManager) configureInterface() error {
	// Derrubar interface
	if err := runCommand("ip", "link", "set", hm.interface_, "down"); err != nil {
		return err
	}

	// Configurar IP
	if err := runCommand("ip", "addr", "add", hm.ip+"/24", "dev", hm.interface_); err != nil {
		return err
	}

	// Levantar interface
	if err := runCommand("ip", "link", "set", hm.interface_, "up"); err != nil {
		return err
	}

	return nil
}

// startDNSMasq inicia o dnsmasq
func (hm *HotspotManager) startDNSMasq() error {
	// Criar arquivo de configuração temporário
	config := fmt.Sprintf(`interface=%s
dhcp-range=192.168.4.10,192.168.4.50,255.255.255.0,24h
dhcp-option=3,%s
dhcp-option=6,%s
`, hm.interface_, hm.ip, hm.ip)

	configFile := "/tmp/edge-pro-dnsmasq.conf"
	if err := os.WriteFile(configFile, []byte(config), 0644); err != nil {
		return err
	}

	// Iniciar dnsmasq
	cmd := exec.Command("dnsmasq", "-C", configFile, "-d")
	if err := cmd.Start(); err != nil {
		return err
	}

	time.Sleep(500 * time.Millisecond)
	return nil
}

// startHostAPD inicia o hostapd
func (hm *HotspotManager) startHostAPD() error {
	// Criar arquivo de configuração temporário
	config := fmt.Sprintf(`interface=%s
driver=nl80211
ssid=%s
hw_mode=g
channel=6
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=%s
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
`, hm.interface_, hm.ssid, hm.password)

	configFile := "/tmp/edge-pro-hostapd.conf"
	if err := os.WriteFile(configFile, []byte(config), 0644); err != nil {
		return err
	}

	// Iniciar hostapd
	cmd := exec.Command("hostapd", configFile)
	if err := cmd.Start(); err != nil {
		return err
	}

	time.Sleep(1 * time.Second)
	return nil
}

// stopNetworkManager para o NetworkManager
func (hm *HotspotManager) stopNetworkManager() error {
	return runCommand("systemctl", "stop", "NetworkManager")
}

// startNetworkManager inicia o NetworkManager
func (hm *HotspotManager) startNetworkManager() error {
	return runCommand("systemctl", "start", "NetworkManager")
}

// Funções auxiliares

func runCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("comando '%s %s' falhou: %w\nOutput: %s",
			name, strings.Join(args, " "), err, string(output))
	}
	return nil
}

func isLinux() bool {
	return os.Getenv("GOOS") == "linux" || 
		   exec.Command("uname", "-s").Run() == nil
}

func generateSuffix() string {
	// Gerar sufixo baseado no timestamp
	return fmt.Sprintf("%d", time.Now().Unix()%100000)
}


