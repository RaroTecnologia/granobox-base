package provisioning

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog"
)

// HTTPServer servidor HTTP para configuração
type HTTPServer struct {
	log        zerolog.Logger
	pm         *ProvisioningManager
	port       int
	server     *http.Server
	onConfigured func(*Config) error
}

// ConfigRequest estrutura da requisição de configuração
type ConfigRequest struct {
	WiFiSSID     string `json:"wifi_ssid"`
	WiFiPassword string `json:"wifi_password"`
	Fingerprint  string `json:"fingerprint"`
	APIKey       string `json:"api_key,omitempty"`       // ⭐ API Key (opcional - pode ser obtida depois)
	BackendURL   string `json:"backend_url,omitempty"`   // ⭐ URL do backend (opcional)
}

// ConfigResponse estrutura da resposta de configuração
type ConfigResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// NewHTTPServer cria um novo servidor HTTP
func NewHTTPServer(log zerolog.Logger, pm *ProvisioningManager, port int) *HTTPServer {
	return &HTTPServer{
		log:  log,
		pm:   pm,
		port: port,
	}
}

// OnConfigured define callback para quando o device for configurado
func (hs *HTTPServer) OnConfigured(callback func(*Config) error) {
	hs.onConfigured = callback
}

// Start inicia o servidor HTTP
func (hs *HTTPServer) Start() error {
	r := chi.NewRouter()

	// Middlewares
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(corsMiddleware)

	// Rotas
	r.Get("/", hs.handleIndex)
	r.Get("/health", hs.handleHealth)
	r.Post("/configure", hs.handleConfigure)
	r.Get("/status", hs.handleStatus)
	r.Post("/reset", hs.handleReset)

	addr := fmt.Sprintf(":%d", hs.port)
	hs.server = &http.Server{
		Addr:    addr,
		Handler: r,
	}

	hs.log.Info().
		Int("port", hs.port).
		Msg("🌐 Servidor HTTP de provisionamento iniciado")

	if err := hs.server.ListenAndServe(); err != http.ErrServerClosed {
		return err
	}

	return nil
}

// Stop para o servidor HTTP
func (hs *HTTPServer) Stop() error {
	if hs.server != nil {
		return hs.server.Close()
	}
	return nil
}

// handleIndex página inicial
func (hs *HTTPServer) handleIndex(w http.ResponseWriter, r *http.Request) {
	html := `
<!DOCTYPE html>
<html>
<head>
    <title>Edge-Pro Provisioning</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-top: 0;
        }
        .status {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .btn {
            background: #2196F3;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .btn:hover {
            background: #1976D2;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚀 Edge-Pro Provisioning</h1>
        <div class="status">
            <strong>Status:</strong> Aguardando configuração
        </div>
        <p>Use o aplicativo Granobox para configurar este dispositivo.</p>
        <p>Ou configure manualmente via POST /configure</p>
        <button class="btn" onclick="location.href='/status'">Ver Status</button>
    </div>
</body>
</html>
`
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
}

// handleHealth health check
func (hs *HTTPServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "ok",
		"timestamp":  time.Now().Format(time.RFC3339),
		"configured": hs.pm.IsConfigured(),
	})
}

// handleConfigure recebe configuração
func (hs *HTTPServer) handleConfigure(w http.ResponseWriter, r *http.Request) {
	var req ConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hs.respondError(w, "JSON inválido", err)
		return
	}

	// Validar
	if req.WiFiSSID == "" {
		hs.respondError(w, "WiFi SSID é obrigatório", nil)
		return
	}

	if req.WiFiPassword == "" {
		hs.respondError(w, "WiFi Password é obrigatório", nil)
		return
	}

	if req.Fingerprint == "" {
		hs.respondError(w, "Fingerprint é obrigatório", nil)
		return
	}

	// Criar configuração
	backendURL := req.BackendURL
	if backendURL == "" {
		backendURL = "https://api.granobox.com.br"
	}

	cfg := &Config{
		WiFiSSID:     req.WiFiSSID,
		WiFiPassword: req.WiFiPassword,
		Fingerprint:  req.Fingerprint,
		APIKey:       req.APIKey,  // ⭐ Salvar API Key se fornecida
		BackendURL:   backendURL,
		Configured:   true,
		ConfiguredAt: time.Now().Format(time.RFC3339),
	}

	// Salvar
	if err := hs.pm.SaveConfig(cfg); err != nil {
		hs.respondError(w, "Erro ao salvar configuração", err)
		return
	}

	hs.log.Info().
		Str("wifi_ssid", req.WiFiSSID).
		Str("fingerprint", req.Fingerprint).
		Msg("✅ Device configurado com sucesso")

	// Callback
	if hs.onConfigured != nil {
		go func() {
			time.Sleep(2 * time.Second)
			if err := hs.onConfigured(cfg); err != nil {
				hs.log.Error().Err(err).Msg("Erro no callback onConfigured")
			}
		}()
	}

	// Responder
	hs.respondSuccess(w, "Configuração salva com sucesso! Reiniciando...")
}

// handleStatus status da configuração
func (hs *HTTPServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	cfg := hs.pm.GetConfig()
	
	response := map[string]interface{}{
		"configured": hs.pm.IsConfigured(),
		"timestamp":  time.Now().Format(time.RFC3339),
	}

	if cfg != nil {
		response["wifi_ssid"] = cfg.WiFiSSID
		response["fingerprint"] = cfg.Fingerprint
		response["backend_url"] = cfg.BackendURL
		response["configured_at"] = cfg.ConfiguredAt
	}

	json.NewEncoder(w).Encode(response)
}

// handleReset reset da configuração
func (hs *HTTPServer) handleReset(w http.ResponseWriter, r *http.Request) {
	if err := hs.pm.ResetConfig(); err != nil {
		hs.respondError(w, "Erro ao resetar configuração", err)
		return
	}

	hs.log.Warn().Msg("⚠️  Configuração resetada")
	hs.respondSuccess(w, "Configuração resetada. Reinicie o dispositivo.")
}

// Helpers

func (hs *HTTPServer) respondSuccess(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ConfigResponse{
		Success: true,
		Message: message,
	})
}

func (hs *HTTPServer) respondError(w http.ResponseWriter, message string, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	
	resp := ConfigResponse{
		Success: false,
		Message: message,
	}
	
	if err != nil {
		resp.Error = err.Error()
		hs.log.Error().Err(err).Msg(message)
	}
	
	json.NewEncoder(w).Encode(resp)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}


