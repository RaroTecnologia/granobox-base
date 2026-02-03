package api

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/granobox/edge-pro/internal/config"
	"github.com/granobox/edge-pro/internal/display"
	"github.com/granobox/edge-pro/internal/models"
	"github.com/granobox/edge-pro/internal/provisioning"
	"github.com/granobox/edge-pro/internal/websocket"
	"github.com/granobox/edge-pro/pkg/logger"
	"github.com/rs/zerolog"
	"gopkg.in/yaml.v3"
)

// Server servidor HTTP API
type Server struct {
	cfg        *config.Config
	display    *display.Client
	wsClient   *websocket.Client
	log        zerolog.Logger
	startTime  time.Time
	router     *chi.Mux
	httpServer *http.Server
	configPath string                            // ⭐ Caminho do config.yaml para atualização
	pm         *provisioning.ProvisioningManager // ⭐ Provisioning manager para atualizar API Key
}

// New cria um novo servidor API
func New(cfg *config.Config, displayClient *display.Client, wsClient *websocket.Client) *Server {
	s := &Server{
		cfg:        cfg,
		display:    displayClient,
		wsClient:   wsClient,
		log:        logger.New("api"),
		startTime:  time.Now(),
		configPath: "/etc/edge-pro/config.yaml",         // ⭐ Caminho padrão do config
		pm:         provisioning.New(logger.New("api")), // ⭐ Provisioning manager
	}

	s.setupRoutes()
	return s
}

// SetConfigPath define o caminho do config.yaml (para atualização)
func (s *Server) SetConfigPath(path string) {
	s.configPath = path
}

// setupRoutes configura as rotas da API
func (s *Server) setupRoutes() {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// Rotas
	r.Get("/health", s.handleHealth)
	r.Get("/info", s.handleInfo)

	// Display
	r.Post("/display/status", s.handleDisplayStatus)
	r.Post("/display/qrcode", s.handleDisplayQRCode)
	r.Post("/display/text", s.handleDisplayText)
	r.Post("/display/clear", s.handleDisplayClear)
	r.Post("/display/brightness", s.handleDisplayBrightness)
	r.Post("/display/refresh", s.handleDisplayRefresh)

	// WebSocket
	r.Post("/websocket/emit", s.handleWebSocketEmit)
	r.Get("/websocket/status", s.handleWebSocketStatus)

	// ⭐ Configuração (para adoção)
	r.Post("/update-api-key", s.handleUpdateAPIKey)

	s.router = r
}

// Start inicia o servidor HTTP
func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%d", s.cfg.API.Host, s.cfg.API.Port)

	s.httpServer = &http.Server{
		Addr:         addr,
		Handler:      s.router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	s.log.Info().Str("addr", addr).Msg("🚀 API HTTP iniciada")

	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("erro ao iniciar servidor HTTP: %w", err)
	}

	return nil
}

// Stop para o servidor HTTP
func (s *Server) Stop() error {
	if s.httpServer != nil {
		return s.httpServer.Close()
	}
	return nil
}

// handleHealth retorna o status de saúde
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	s.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"uptime":  time.Since(s.startTime).Seconds(),
		"version": s.cfg.Device.Version,
	})
}

// handleInfo retorna informações do dispositivo
func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	ip := getLocalIP()
	mac := getMacAddress()

	info := &models.DeviceInfo{
		DeviceID:   s.cfg.Device.ID,
		MacAddress: mac,
		IPAddress:  ip,
		Version:    s.cfg.Device.Version,
		Uptime:     int64(time.Since(s.startTime).Seconds()),
		LastSeen:   time.Now(),
	}

	s.jsonResponse(w, http.StatusOK, info)
}

// handleDisplayStatus exibe status no display
func (s *Server) handleDisplayStatus(w http.ResponseWriter, r *http.Request) {
	var content models.StatusContent
	if err := json.NewDecoder(r.Body).Decode(&content); err != nil {
		s.errorResponse(w, http.StatusBadRequest, "payload inválido")
		return
	}

	if err := s.display.ShowStatus(content.Icon, content.Message, content.IP, content.DeviceID, content.Version, content.Brightness); err != nil {
		s.errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleDisplayQRCode exibe QR code no display
func (s *Server) handleDisplayQRCode(w http.ResponseWriter, r *http.Request) {
	var content models.QRCodeContent
	if err := json.NewDecoder(r.Body).Decode(&content); err != nil {
		s.errorResponse(w, http.StatusBadRequest, "payload inválido")
		return
	}

	if err := s.display.ShowQRCode(content.Data, content.Size); err != nil {
		s.errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleDisplayText exibe texto no display
func (s *Server) handleDisplayText(w http.ResponseWriter, r *http.Request) {
	var content models.TextContent
	if err := json.NewDecoder(r.Body).Decode(&content); err != nil {
		s.errorResponse(w, http.StatusBadRequest, "payload inválido")
		return
	}

	if err := s.display.ShowText(content.Text, content.FontSize, content.Brightness); err != nil {
		s.errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleDisplayClear limpa o display
func (s *Server) handleDisplayClear(w http.ResponseWriter, r *http.Request) {
	if err := s.display.Clear(); err != nil {
		s.errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleDisplayBrightness ajusta brilho do display
func (s *Server) handleDisplayBrightness(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Brightness int `json:"brightness"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.errorResponse(w, http.StatusBadRequest, "payload inválido")
		return
	}

	if err := s.display.SetBrightness(req.Brightness); err != nil {
		s.errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleDisplayRefresh força refresh do dashboard do Granobox
func (s *Server) handleDisplayRefresh(w http.ResponseWriter, r *http.Request) {
	ip := getLocalIP()

	if err := s.display.ShowStatus(
		"✅",
		"Online",
		ip,
		s.cfg.Device.ID,
		s.cfg.Device.Version,
		80,
	); err != nil {
		s.errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.jsonResponse(w, http.StatusOK, map[string]string{"status": "ok", "message": "Dashboard refreshed"})
}

// handleWebSocketEmit emite evento WebSocket
func (s *Server) handleWebSocketEmit(w http.ResponseWriter, r *http.Request) {
	var msg models.WebSocketMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		s.errorResponse(w, http.StatusBadRequest, "payload inválido")
		return
	}

	// Emitir evento via WebSocket client
	s.log.Debug().Str("event", msg.Event).Interface("data", msg.Data).Msg("Emitindo evento WebSocket")

	if s.wsClient == nil {
		s.errorResponse(w, http.StatusServiceUnavailable, "WebSocket client não disponível")
		return
	}

	if !s.wsClient.IsConnected() {
		s.errorResponse(w, http.StatusServiceUnavailable, "WebSocket não conectado")
		return
	}

	if err := s.wsClient.Emit(msg.Event, msg.Data); err != nil {
		s.errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.jsonResponse(w, http.StatusOK, map[string]string{
		"status": "ok",
		"event":  msg.Event,
	})
}

// handleWebSocketStatus retorna status do WebSocket
func (s *Server) handleWebSocketStatus(w http.ResponseWriter, r *http.Request) {
	connected := false
	if s.wsClient != nil {
		connected = s.wsClient.IsConnected()
	}

	s.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"connected":   connected,
		"timestamp":   time.Now(),
		"server_url":  s.cfg.SocketIO.ServerURL,
		"fingerprint": s.cfg.SocketIO.AgentFingerprint,
		"ws_url":      fmt.Sprintf("wss://edge.granobox.com.br/edge-go-ws"),
		"protocol":    "websocket-pure",
	})
}

// jsonResponse envia resposta JSON
func (s *Server) jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// errorResponse envia resposta de erro
func (s *Server) errorResponse(w http.ResponseWriter, status int, message string) {
	s.jsonResponse(w, status, map[string]string{"error": message})
}

// handleUpdateAPIKey atualiza a API Key no config.yaml e reinicia o serviço
func (s *Server) handleUpdateAPIKey(w http.ResponseWriter, r *http.Request) {
	var req struct {
		APIKey           string `json:"api_key"`
		Fingerprint      string `json:"fingerprint,omitempty"`
		AgentFingerprint string `json:"agent_fingerprint,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.errorResponse(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.APIKey == "" {
		s.errorResponse(w, http.StatusBadRequest, "api_key é obrigatório")
		return
	}

	s.log.Info().Str("api_key", req.APIKey[:min(20, len(req.APIKey))]+"...").Msg("🔄 Atualizando API Key...")

	// 1. Atualizar provisioning config (JSON)
	provisioningCfg, err := s.pm.LoadConfig()
	if err == nil {
		provisioningCfg.APIKey = req.APIKey
		if req.Fingerprint != "" {
			provisioningCfg.Fingerprint = req.Fingerprint
		}
		if err := s.pm.SaveConfig(provisioningCfg); err != nil {
			s.log.Warn().Err(err).Msg("⚠️  Erro ao salvar provisioning config")
		} else {
			s.log.Info().Msg("✅ Provisioning config atualizado")
		}
	}

	// 2. Atualizar config.yaml
	if err := s.updateYAMLConfig(req.APIKey, req.Fingerprint, req.AgentFingerprint); err != nil {
		s.log.Error().Err(err).Msg("❌ Erro ao atualizar config.yaml")
		s.errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Erro ao atualizar config: %v", err))
		return
	}

	s.log.Info().Msg("✅ Config.yaml atualizado")

	// 3. Reiniciar serviço systemd
	go func() {
		time.Sleep(1 * time.Second)
		cmd := exec.Command("sudo", "systemctl", "restart", "edge-pro.service")
		if err := cmd.Run(); err != nil {
			s.log.Error().Err(err).Msg("❌ Erro ao reiniciar serviço")
		} else {
			s.log.Info().Msg("🔄 Serviço reiniciado")
		}
	}()

	s.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "API Key atualizada com sucesso! Reiniciando serviço...",
	})
}

// updateYAMLConfig atualiza a API Key no config.yaml
func (s *Server) updateYAMLConfig(apiKey, fingerprint, agentFingerprint string) error {
	// Ler YAML atual
	data, err := os.ReadFile(s.configPath)
	if err != nil {
		return fmt.Errorf("erro ao ler config: %w", err)
	}

	// Parse YAML
	var yamlData map[string]interface{}
	if err := yaml.Unmarshal(data, &yamlData); err != nil {
		return fmt.Errorf("erro ao fazer parse do YAML: %w", err)
	}

	// Atualizar API Key
	if socketio, ok := yamlData["socketio"].(map[string]interface{}); ok {
		socketio["api_key"] = apiKey
		if agentFingerprint != "" {
			socketio["agent_fingerprint"] = agentFingerprint
		} else if fingerprint != "" {
			socketio["agent_fingerprint"] = fingerprint
		}
	} else {
		yamlData["socketio"] = map[string]interface{}{
			"api_key": apiKey,
		}
		if agentFingerprint != "" {
			yamlData["socketio"].(map[string]interface{})["agent_fingerprint"] = agentFingerprint
		} else if fingerprint != "" {
			yamlData["socketio"].(map[string]interface{})["agent_fingerprint"] = fingerprint
		}
	}

	// Atualizar device.id se fornecido
	if fingerprint != "" {
		if device, ok := yamlData["device"].(map[string]interface{}); ok {
			device["id"] = fingerprint
		} else {
			yamlData["device"] = map[string]interface{}{
				"id": fingerprint,
			}
		}
	}

	// Salvar YAML
	updatedData, err := yaml.Marshal(yamlData)
	if err != nil {
		return fmt.Errorf("erro ao serializar YAML: %w", err)
	}

	if err := os.WriteFile(s.configPath, updatedData, 0644); err != nil {
		return fmt.Errorf("erro ao salvar config: %w", err)
	}

	return nil
}

// min retorna o menor valor entre dois inteiros
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// getLocalIP retorna o IP local
func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}

	return ""
}

// getMacAddress retorna o endereço MAC
func getMacAddress() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return ""
	}

	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagLoopback == 0 {
			return iface.HardwareAddr.String()
		}
	}

	return ""
}
