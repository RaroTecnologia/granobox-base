package ble

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-ble/ble"
	"github.com/go-ble/ble/linux"
	"github.com/rs/zerolog"
	"github.com/granobox/edge-pro/internal/provisioning"
)

// UUIDs (mesmos do Edge-Go para compatibilidade)
var (
	// Service UUID: 4fac (16-bit)
	serviceUUID = ble.MustParse("4fac")
	
	// Characteristic UUIDs
	charConfigUUID = ble.MustParse("beb5") // Config (Write)
	charStatusUUID = ble.MustParse("beb6") // Status (Read/Notify)
)

// Manager gerencia BLE usando go-ble
type Manager struct {
	log            zerolog.Logger
	deviceName     string
	isActive       bool
	configCallback func(*provisioning.Config) error
	statusJSON     string
	device         *linux.Device
}

// New cria um novo BLE Manager
func New(log zerolog.Logger, deviceName string) *Manager {
	return &Manager{
		log:        log,
		deviceName: deviceName,
		statusJSON: `{"status":"initializing"}`,
	}
}

// Init inicializa o BLE
func (m *Manager) Init() error {
	m.log.Info().Msg("🔵 Inicializando BLE Manager...")

	// Criar device BLE usando o driver Linux
	d, err := linux.NewDeviceWithName(m.deviceName)
	if err != nil {
		return fmt.Errorf("erro ao criar device BLE: %w", err)
	}

	m.device = d
	ble.SetDefaultDevice(d)
	m.log.Info().Msg("✅ BLE Manager inicializado")
	return nil
}

// Start inicia advertising BLE e GATT server
func (m *Manager) Start() error {
	m.log.Info().Msg("🔵 Iniciando BLE advertising e GATT server...")

	// Adicionar service e characteristics
	svc := ble.NewService(serviceUUID)
	
	// Characteristic de configuração (Write)
	configChar := svc.NewCharacteristic(charConfigUUID)
	configChar.HandleWrite(ble.WriteHandlerFunc(m.handleConfigWrite))

	// Characteristic de status (Read/Notify)
	statusChar := svc.NewCharacteristic(charStatusUUID)
	statusChar.HandleRead(ble.ReadHandlerFunc(m.handleStatusRead))
	statusChar.HandleNotify(ble.NotifyHandlerFunc(m.handleStatusNotify))

	// Adicionar service ao device
	if err := m.device.AddService(svc); err != nil {
		return fmt.Errorf("erro ao adicionar service: %w", err)
	}

	m.isActive = true
	m.log.Info().
		Str("device_name", m.deviceName).
		Msg("✅ BLE advertising e GATT server iniciados")

	// ⭐ Iniciar advertising em goroutine (é bloqueante!)
	go func() {
		ctx := context.Background()
		m.log.Info().Str("device_name", m.deviceName).Msg("📡 Iniciando BLE advertising (goroutine)...")
		
		if err := m.device.AdvertiseNameAndServices(ctx, m.deviceName, serviceUUID); err != nil {
			m.log.Error().Err(err).Msg("❌ Erro no BLE advertising")
			m.isActive = false
		}
	}()
	
	return nil
}

// Stop para o BLE
func (m *Manager) Stop() error {
	if !m.isActive {
		return nil
	}

	m.log.Info().Msg("🔴 Parando BLE...")
	
	// Parar device (para advertising e serviços)
	if m.device != nil {
		if err := m.device.Stop(); err != nil {
			m.log.Warn().Err(err).Msg("⚠️  Erro ao parar device BLE")
		}
	}
	
	m.isActive = false
	return nil
}

// IsActive retorna se BLE está ativo
func (m *Manager) IsActive() bool {
	return m.isActive
}

// RegisterConfigCallback registra callback para quando receber configuração
func (m *Manager) RegisterConfigCallback(callback func(*provisioning.Config) error) {
	m.configCallback = callback
}

// UpdateStatus atualiza o status JSON (para característica STATUS)
func (m *Manager) UpdateStatus(statusJSON string) {
	m.statusJSON = statusJSON
}

// handleConfigWrite processa escrita na characteristic de configuração
func (m *Manager) handleConfigWrite(req ble.Request, rsp ble.ResponseWriter) {
	m.log.Info().Msg("📥 Configuração recebida via BLE...")

	// Ler dados usando req.Data()
	data := req.Data()
	if len(data) == 0 {
		m.log.Error().Msg("❌ Dados vazios recebidos")
		rsp.SetStatus(ble.ErrInvalidHandle)
		return
	}

	// Processar JSON
	if err := m.processConfigJSON(string(data)); err != nil {
		m.log.Error().Err(err).Msg("❌ Erro ao processar configuração")
		rsp.SetStatus(ble.ErrInvalidHandle)
		return
	}

	m.log.Info().Msg("✅ Configuração processada com sucesso")
}

// handleStatusRead retorna o status atual
func (m *Manager) handleStatusRead(req ble.Request, rsp ble.ResponseWriter) {
	rsp.Write([]byte(m.statusJSON))
}

// handleStatusNotify envia notificação de status
func (m *Manager) handleStatusNotify(req ble.Request, n ble.Notifier) {
	// Enviar status atual
	n.Write([]byte(m.statusJSON))
}

// processConfigJSON processa JSON de configuração
func (m *Manager) processConfigJSON(jsonData string) error {
	m.log.Info().Str("json", jsonData).Msg("📥 Processando configuração BLE...")

	var configData map[string]interface{}
	if err := json.Unmarshal([]byte(jsonData), &configData); err != nil {
		return fmt.Errorf("erro ao fazer parse do JSON: %w", err)
	}

	// Extrair campos (igual Edge-Go)
	deviceID, _ := configData["device_id"].(string)
	wifiSSID, _ := configData["wifi_ssid"].(string)
	wifiPassword, _ := configData["wifi_password"].(string)
	useStaticIP, _ := configData["use_static_ip"].(bool)
	staticIP, _ := configData["static_ip"].(string)
	gateway, _ := configData["gateway"].(string)
	netmask, _ := configData["netmask"].(string)
	fingerprint, _ := configData["fingerprint"].(string)
	apiKey, _ := configData["api_key"].(string)
	apiURL, _ := configData["api_url"].(string)
	backendURL, _ := configData["backend_url"].(string)

	// Usar api_url ou backend_url (compatibilidade)
	if apiURL == "" && backendURL != "" {
		apiURL = backendURL
	}
	if apiURL == "" {
		apiURL = "https://api.granobox.com.br"
	}

	// Criar configuração (igual Edge-Go)
	cfg := &provisioning.Config{
		DeviceID:     deviceID,
		WiFiSSID:     wifiSSID,
		WiFiPassword: wifiPassword,
		UseStaticIP:  useStaticIP,
		StaticIP:     staticIP,
		Gateway:      gateway,
		Netmask:      netmask,
		Fingerprint:  fingerprint,
		APIKey:       apiKey,
		BackendURL:   apiURL,
		Configured:   true,
		ConfiguredAt: time.Now().Format(time.RFC3339),
	}

	// Chamar callback
	if m.configCallback != nil {
		return m.configCallback(cfg)
	}

	return nil
}
