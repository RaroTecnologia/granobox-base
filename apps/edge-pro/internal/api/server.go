package api

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog"
	"github.com/granobox/edge-pro/internal/config"
	"github.com/granobox/edge-pro/internal/display"
	"github.com/granobox/edge-pro/internal/models"
	"github.com/granobox/edge-pro/internal/websocket"
	"github.com/granobox/edge-pro/pkg/logger"
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
}

// New cria um novo servidor API
func New(cfg *config.Config, displayClient *display.Client, wsClient *websocket.Client) *Server {
	s := &Server{
		cfg:       cfg,
		display:   displayClient,
		wsClient:  wsClient,
		log:       logger.New("api"),
		startTime: time.Now(),
	}

	s.setupRoutes()
	return s
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
		"ws_url":      fmt.Sprintf("wss://ws.granobox.com.br/edge-go-ws"),
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
