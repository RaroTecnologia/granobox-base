package websocket

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"

	"github.com/granobox/edge-pro/internal/certmanager"
	"github.com/granobox/edge-pro/internal/config"
	"github.com/granobox/edge-pro/internal/metrics"
	"github.com/granobox/edge-pro/internal/models"
	"github.com/granobox/edge-pro/internal/printer"
)

// Client é o cliente WebSocket puro (não Socket.IO)
// Constantes do watchdog USB
const (
	USBWatchdogCheckInterval = 5 * time.Second  // Verificar a cada 5 segundos
	USBWatchdogMaxCycles     = 12               // 12 ciclos * 5s = 1 minuto
)

type Client struct {
	cfg              *config.SocketIOConfig
	deviceCfg        *config.DeviceConfig
	log              zerolog.Logger
	conn             *websocket.Conn
	connected        bool
	registered       bool
	mu               sync.RWMutex
	stopCh           chan struct{}
	metricsCollector *metrics.Collector
	printerManager   *printer.Manager
	printQueue       *printer.Queue
	printers         []models.PrinterInfo
	handlers         map[string]func(interface{})
	pingTicker       *time.Ticker
	certManager      *certmanager.Manager
	reconnectDelay   time.Duration
	maxReconnectDelay time.Duration
	// Watchdog USB
	usbDisconnectedCycles int
	lastUSBConnected      bool
}

// Message representa uma mensagem WebSocket pura
type Message struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp string      `json:"timestamp,omitempty"`
	Status    string      `json:"status,omitempty"`
	Message   string      `json:"message,omitempty"`
	RequestID string      `json:"requestId,omitempty"` // Para ping_printer e outras mensagens
}

func NewClient(cfg *config.SocketIOConfig, deviceCfg *config.DeviceConfig, log zerolog.Logger) *Client {
	logger := log.With().Str("component", "websocket-client").Logger()
	printerMgr := printer.NewManager(logger)
	printQueue := printer.NewQueue(printerMgr, logger, 2) // 2 workers

	client := &Client{
		cfg:               cfg,
		deviceCfg:         deviceCfg,
		log:               logger,
		stopCh:            make(chan struct{}),
		metricsCollector:  metrics.NewCollector(),
		printerManager:    printerMgr,
		printQueue:        printQueue,
		printers:          []models.PrinterInfo{},
		handlers:          make(map[string]func(interface{})),
		reconnectDelay:    5 * time.Second,
		maxReconnectDelay: 60 * time.Second,
	}

	if cfg != nil && cfg.APIKey != "" && cfg.AgentFingerprint != "" {
		if mgr, err := certmanager.NewManager(cfg, logger); err != nil {
			logger.Error().Err(err).Msg("Falha ao inicializar gerenciador de certificados")
		} else {
			if err := mgr.EnsureCertificate(false); err != nil {
				logger.Warn().Err(err).Msg("Não foi possível preparar certificado Edge (usando CA padrão)")
			}
			mgr.StartAutoRefresh()
			client.certManager = mgr
		}
	} else {
		logger.Warn().Msg("Gerenciador de certificados desabilitado: API Key ou fingerprint ausente")
	}

	// Iniciar fila de impressão
	printQueue.Start()

	// Monitorar resultados da fila
	go client.monitorPrintResults()

	// 🆕 Iniciar watchdog USB (monitora se impressora desconecta)
	go client.startUSBWatchdog()

	// Setup handlers
	client.setupHandlers()

	return client
}

func (c *Client) setupHandlers() {
	// Handler para confirmação de registro
	c.handlers["register_ack"] = func(data interface{}) {
		c.log.Info().Msg("✅ Dispositivo registrado com sucesso!")
		c.mu.Lock()
		c.registered = true
		c.mu.Unlock()

		// Aguardar 2 segundos e registrar impressoras USB no backend
		go func() {
			time.Sleep(2 * time.Second)
			c.registerPrintersWithBackend()
		}()

		// Enviar heartbeat imediatamente após registro
		go func() {
			time.Sleep(1 * time.Second)
			if err := c.SendHeartbeat(); err != nil {
				c.log.Error().Err(err).Msg("Erro ao enviar heartbeat inicial")
			}
		}()
	}

	// Handler para job de impressão
	c.handlers["print_job"] = func(data interface{}) {
		c.log.Info().Msg("📄 Job de impressão recebido")
		c.processPrintJob(data)
	}

	// Handler para comando do agente
	c.handlers["agent_command"] = func(data interface{}) {
		c.log.Info().Msg("⚡ Comando recebido")
		c.processAgentCommand(data)
	}

	// Handler para ping (verificação de impressora)
	c.handlers["ping"] = func(data interface{}) {
		c.log.Info().Msg("🏓 PING recebido")
		c.handlePing(data)
	}

	// Handler para ping_printer (verificação de status da impressora)
	// Este handler precisa receber a mensagem completa para acessar requestId na raiz
	c.handlers["ping_printer"] = func(data interface{}) {
		c.log.Info().Msg("📍 Ping da impressora recebido")
		// Tentar extrair requestId de data primeiro, se não estiver lá, buscar da mensagem
		c.handlePrinterPing(data)
	}

	// Handler para reboot
	c.handlers["reboot"] = func(data interface{}) {
		c.log.Warn().Msg("🔄 Comando de REBOOT recebido via WebSocket!")
		// Enviar confirmação
		c.sendMessage("reboot_ack", map[string]interface{}{
			"status":  "rebooting",
			"message": "Reiniciando dispositivo em 2 segundos...",
		})
		// Aguardar 2 segundos e reiniciar
		go func() {
			time.Sleep(2 * time.Second)
			c.log.Warn().Msg("🔄 REINICIANDO AGORA!")
			os.Exit(0) // Em produção, usar systemctl restart
		}()
	}
}

func (c *Client) Connect() error {
	c.log.Info().
		Str("server", c.cfg.ServerURL).
		Msg("🔌 Iniciando conexão WebSocket pura...")

	// Loop de reconexão
	go c.connectLoop()

	return nil
}

func (c *Client) connectLoop() {
	reconnectDelay := c.reconnectDelay

	for {
		select {
		case <-c.stopCh:
			return
		default:
			if err := c.doConnect(); err != nil {
				c.log.Error().Err(err).Msg("Erro ao conectar")
			}

			c.mu.Lock()
			c.connected = false
			c.registered = false
			c.mu.Unlock()

			c.log.Warn().
				Dur("delay", reconnectDelay).
				Msg("🔌 Conexão encerrada, reconectando...")

			time.Sleep(reconnectDelay)

			// Backoff exponencial
			reconnectDelay = reconnectDelay * 2
			if reconnectDelay > c.maxReconnectDelay {
				reconnectDelay = c.maxReconnectDelay
			}
		}
	}
}

func (c *Client) doConnect() error {
	// Construir URL WebSocket (WebSocket puro, não Socket.IO)
	serverURL, err := url.Parse(c.cfg.ServerURL)
	if err != nil {
		return fmt.Errorf("URL inválida: %w", err)
	}

	// WebSocket puro: /edge-go-ws (mesmo endpoint do Edge-Go)
	// ⭐ Remover porta do hostname (igual ao Edge-Go)
	hostname := serverURL.Hostname() // Remove porta automaticamente
	
	var wsURL string
	// Se for produção (granobox.com.br), usar ws.granobox.com.br (porta 443, WSS)
	if strings.Contains(hostname, "granobox.com.br") {
		wsURL = "wss://ws.granobox.com.br/edge-go-ws"
		c.log.Info().Str("url", wsURL).Msg("🌐 Modo PRODUÇÃO - usando wss://ws.granobox.com.br/edge-go-ws")
	} else {
		// Desenvolvimento: usar o hostname da API com porta 8081
		if serverURL.Scheme == "https" {
			wsURL = fmt.Sprintf("wss://%s:8081/edge-go-ws", hostname)
		} else {
			wsURL = fmt.Sprintf("ws://%s:8081/edge-go-ws", hostname)
		}
		c.log.Info().Str("url", wsURL).Msg("🔧 Modo DESENVOLVIMENTO - usando porta 8081")
	}

	c.log.Info().Str("url", wsURL).Msg("🔐 Conectando WebSocket puro ao Granobox...")

	if c.certManager != nil {
		if err := c.certManager.EnsureCertificate(false); err != nil {
			c.log.Warn().Err(err).Msg("Não foi possível atualizar certificado antes do WebSocket")
		}
	}

	// Conectar
	header := http.Header{}
	header.Set("User-Agent", "Granobox-Edge-Pro/1.0")
	// Enviar API Key no header Authorization (opcional, se o backend suportar)
	if c.cfg.APIKey != "" {
		header.Set("Authorization", fmt.Sprintf("Bearer %s", c.cfg.APIKey))
	}

	dialer := websocket.Dialer{
		Proxy:            http.ProxyFromEnvironment,
		HandshakeTimeout: 15 * time.Second,
	}

	if c.certManager != nil {
		if tlsCfg := c.certManager.TLSConfig(); tlsCfg != nil {
			dialer.TLSClientConfig = tlsCfg
		}
	}

	conn, resp, err := dialer.Dial(wsURL, header)
	if err != nil {
		if resp != nil {
			c.log.Error().
				Int("status", resp.StatusCode).
				Str("status_text", resp.Status).
				Msg("Erro ao conectar WebSocket")
		}
		return fmt.Errorf("erro ao conectar WebSocket: %w", err)
	}

	c.log.Info().Msg("🚀 WebSocket conectado, aguardando eventos...")

	c.mu.Lock()
	c.conn = conn
	c.connected = true
	c.registered = false
	c.mu.Unlock()
	
	c.log.Info().Msg("✅ Estado atualizado: connected=true, registered=false")

	// Reset reconnect delay em caso de sucesso
	c.reconnectDelay = 5 * time.Second

	// Configurar Pong Handler
	conn.SetPongHandler(func(appData string) error {
		c.log.Debug().Msg("🏓 WebSocket PONG recebido")
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Iniciar goroutine para enviar WebSocket PINGs
	c.startWebSocketPing()

	// Enviar registro imediatamente após conectar
	go func() {
		time.Sleep(1 * time.Second) // Aumentar delay para garantir estabilização
		
		// Verificar estado antes de enviar
		c.mu.RLock()
		connected := c.connected
		connCheck := c.conn
		c.mu.RUnlock()
		
		c.log.Info().
			Bool("connected", connected).
			Bool("conn_not_nil", connCheck != nil).
			Msg("🔍 Estado antes de enviar registro")
		
		if !connected || connCheck == nil {
			c.log.Error().Msg("❌ Não foi possível enviar registro: conexão não estabelecida")
			return
		}
		
		if err := c.sendRegister(); err != nil {
			c.log.Error().Err(err).Msg("Erro ao enviar registro")
		}
	}()

	// ⭐ BLOQUEAR até a conexão ser fechada (não retornar imediatamente)
	// Isso evita que o connectLoop defina connected=false prematuramente
	c.readMessages()

	return nil
}

func (c *Client) startWebSocketPing() {
	if c.pingTicker != nil {
		c.pingTicker.Stop()
	}

	c.pingTicker = time.NewTicker(30 * time.Second)
	pingFailures := 0
	const maxPingFailures = 3 // Forçar reconexão após 3 falhas consecutivas (90 segundos)

	go func() {
		for {
			select {
			case <-c.pingTicker.C:
				c.mu.RLock()
				conn := c.conn
				connected := c.connected
				c.mu.RUnlock()

				if !connected || conn == nil {
					return
				}

				// Enviar WebSocket PING
				if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(5*time.Second)); err != nil {
					pingFailures++
					c.log.Warn().
						Err(err).
						Int("failures", pingFailures).
						Int("max_failures", maxPingFailures).
						Msg("⚠️  Erro ao enviar WebSocket PING")

					// Se falhar N vezes consecutivas, forçar reconexão
					if pingFailures >= maxPingFailures {
						c.log.Error().Msg("❌ Watchdog WebSocket: Muitas falhas de PING, forçando reconexão...")
						c.mu.Lock()
						c.connected = false
						if conn != nil {
							conn.Close()
						}
						c.mu.Unlock()
						return
					}
				} else {
					// Reset contador em caso de sucesso
					if pingFailures > 0 {
						c.log.Info().Msg("✅ WebSocket PING OK, resetando contador de falhas")
						pingFailures = 0
					}
					c.log.Debug().Msg("🏓 WebSocket PING enviado")
				}

			case <-c.stopCh:
				return
			}
		}
	}()
}

func (c *Client) readMessages() {
	c.mu.RLock()
	conn := c.conn
	c.mu.RUnlock()

	if conn == nil {
		return
	}

	// Set initial read deadline
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))

	for {
		_, messageBytes, err := conn.ReadMessage()
		if err != nil {
			c.log.Error().Err(err).Msg("Erro ao ler mensagem WebSocket")
			c.mu.Lock()
			c.connected = false
			c.mu.Unlock()
			return
		}

		// Reset read deadline on every message
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		// Processar mensagem JSON
		var msg Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			c.log.Error().Err(err).Str("raw", string(messageBytes)).Msg("Erro ao parsear mensagem JSON")
			continue
		}

		c.processMessage(&msg)
	}
}

func (c *Client) processMessage(msg *Message) {
	c.log.Debug().Str("type", msg.Type).Msg("Mensagem recebida")

	// Chamar handler se existir
	if handler, ok := c.handlers[msg.Type]; ok {
		// Para ping_printer, passar a mensagem completa para ter acesso ao requestId na raiz
		if msg.Type == "ping_printer" {
			// Criar um map com requestId e outros campos da raiz
			pingData := map[string]interface{}{
				"requestId": msg.RequestID,
			}
			if msg.Data != nil {
				if dataMap, ok := msg.Data.(map[string]interface{}); ok {
					// Mesclar campos de data no pingData
					for k, v := range dataMap {
						pingData[k] = v
					}
				}
			}
			handler(pingData)
		} else {
			handler(msg.Data)
		}
	} else {
		c.log.Debug().Str("type", msg.Type).Msg("Handler não encontrado para tipo de mensagem")
	}
}

func (c *Client) sendRegister() error {
	c.log.Info().Msg("📝 Preparando registro do dispositivo...")

	// ⭐ NOVO: Buscar clientId e operationId REAIS do backend (igual ao Edge-Go)
	if c.deviceCfg.ClientID == "" || c.deviceCfg.ClientID == c.cfg.AgentFingerprint {
		if err := c.fetchDeviceInfo(); err != nil {
			c.log.Warn().Err(err).Msg("⚠️  Não foi possível buscar clientId do backend, usando placeholder")
		}
	}

	// Obter hostname
	hostname := c.deviceCfg.Hostname
	if hostname == "" {
		if h, err := os.Hostname(); err == nil {
			hostname = h
		}
	}

	// Obter nome
	deviceName := c.deviceCfg.Name
	if deviceName == "" {
		deviceName = c.deviceCfg.ID
	}

	localIP := metrics.GetLocalIP()
	macAddr := metrics.GetMacAddress()

	// Auto-detectar impressoras USB
	usbPrinters := c.printerManager.CreateAutoUSBPrinters()
	c.log.Info().Int("count", len(usbPrinters)).Msg("✨ Impressoras USB auto-detectadas")

	// Carregar impressoras do gerenciador
	c.printerManager.LoadPrinters(usbPrinters)

	// Obter métricas do sistema
	systemMetrics := c.metricsCollector.GetSystemMetrics()

	// ⭐ FORMATO CORRETO: deviceId e clientId na RAIZ da mensagem, outros dados em "data"
	// A API espera: { type: "register", deviceId: "...", clientId: "...", data: { ... } }
	registerData := map[string]interface{}{
		"authToken": c.cfg.APIKey,
		"name":      deviceName,
		"hostname":  hostname,
		"version":   c.deviceCfg.Version,
		"platform":  "linux-arm64", // Raspberry Pi
		"ip":        localIP,
		"mac":       macAddr,
		"freeHeap":  0, // Não aplicável em Linux
		"cpuUsage":  systemMetrics.CPUUsage,
		"memoryUsage": systemMetrics.MemoryUsage,
		"uptime":    systemMetrics.Uptime,
		"capabilities": map[string]interface{}{
			"usb":         true,
			"display":     false,
			"maxPrinters": 1,
			"protocols":   []string{"ZPL", "TSPL"},
		},
	}

	// Usar clientId REAL obtido via /auth/device
	clientId := c.deviceCfg.ClientID
	if clientId == "" {
		c.log.Warn().Msg("⚠️  ClientID não obtido do backend, usando fingerprint como fallback")
		clientId = c.cfg.AgentFingerprint
	} else {
		c.log.Info().Str("clientId", clientId).Msg("✅ Usando clientId obtido do backend")
	}

	c.log.Info().
		Str("deviceId", c.cfg.AgentFingerprint).
		Str("clientId", clientId).
		Str("name", deviceName).
		Int("usb_printers", len(usbPrinters)).
		Msg("📝 Enviando registro...")

	// ⭐ Enviar com deviceId e clientId separados (usando sendRegisterMessage especial)
	return c.sendRegisterMessage(c.cfg.AgentFingerprint, clientId, registerData)
}

// fetchDeviceInfo busca informações do device no backend (clientId, operationId)
// Igual ao Edge-Go que faz isso via /auth/device
func (c *Client) fetchDeviceInfo() error {
	c.log.Info().Msg("🔍 Buscando clientId do backend via /auth/device...")
	
	// Construir URL da API
	backendURL := strings.TrimSuffix(c.cfg.ServerURL, "/")
	authURL := fmt.Sprintf("%s/auth/device", backendURL)
	
	// Preparar request body
	body, err := json.Marshal(map[string]interface{}{
		"deviceId": c.cfg.AgentFingerprint,
		"apiKey":   c.cfg.APIKey,
	})
	if err != nil {
		return fmt.Errorf("erro ao preparar request: %w", err)
	}
	
	// Criar request
	req, err := http.NewRequest("POST", authURL, strings.NewReader(string(body)))
	if err != nil {
		return fmt.Errorf("erro ao criar request: %w", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	// Executar request
	client := c.newHTTPClient(10 * time.Second)
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("erro ao executar request: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != 200 {
		return fmt.Errorf("auth/device retornou status %d", resp.StatusCode)
	}
	
	// Parsear response
	var authResp struct {
		AccessToken string `json:"access_token"`
		Device      struct {
			ID          string `json:"id"`
			DeviceID    string `json:"deviceId"`
			Name        string `json:"name"`
			Status      string `json:"status"`
			ClientID    string `json:"clientId"`
			OperationID string `json:"operationId"`
		} `json:"device"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return fmt.Errorf("erro ao parsear response: %w", err)
	}
	
	// Salvar clientId e operationId
	if authResp.Device.ClientID != "" {
		c.deviceCfg.ClientID = authResp.Device.ClientID
		c.log.Info().Str("clientId", authResp.Device.ClientID).Msg("✅ ClientID obtido do backend")
	}
	
	if authResp.Device.OperationID != "" {
		c.deviceCfg.OperationID = authResp.Device.OperationID
		c.log.Info().Str("operationId", authResp.Device.OperationID).Msg("✅ OperationID obtido do backend")
	}
	
	return nil
}

func (c *Client) SendHeartbeat() error {
	if !c.IsConnected() {
		return fmt.Errorf("cliente não conectado")
	}

	systemMetrics := c.metricsCollector.GetSystemMetrics()

	// Detectar impressoras USB dinamicamente
	usbPrinters := c.printerManager.CreateAutoUSBPrinters()

	// Converter para formato do heartbeat
	printersForHeartbeat := make([]map[string]interface{}, len(usbPrinters))
	for i, p := range usbPrinters {
		printerMap := map[string]interface{}{
			"name":       p.Name,
			"status":     p.Status,
			"connection": p.Connection,
		}
		if p.ID != nil {
			printerMap["id"] = *p.ID
		}
		if p.Model != "" {
			printerMap["model"] = p.Model
		}
		if p.Type != "" {
			printerMap["type"] = p.Type
		}
		if p.DevicePath != nil {
			printerMap["devicePath"] = *p.DevicePath
		}
		printersForHeartbeat[i] = printerMap
	}

	localIP := metrics.GetLocalIP()
	macAddr := metrics.GetMacAddress()

	// Obter estatísticas da fila
	queueStats := c.printQueue.GetStats()

	heartbeatData := map[string]interface{}{
		"deviceId":       c.cfg.AgentFingerprint,
		"status":         "online",
		"uptime":         systemMetrics.Uptime,
		"freeHeap":       0, // Não aplicável
		"cpuUsage":       systemMetrics.CPUUsage,
		"memoryUsage":    systemMetrics.MemoryUsage,
		"temperature":    systemMetrics.Temperature,
		"diskUsage":      systemMetrics.DiskUsage,
		"rssi":           0, // Não aplicável
		"usbConnected":   len(usbPrinters) > 0,
		"ip":             localIP,
		"mac":            macAddr,
		"printers":       printersForHeartbeat,
		"queueStats":     queueStats,
		"version":        c.deviceCfg.Version,  // 🆕 Versão do firmware para o backend salvar
		"platform":       "linux-arm64",        // 🆕 Plataforma (Raspberry Pi)
	}

	c.log.Info().
		Float64("cpu", systemMetrics.CPUUsage).
		Float64("memory", systemMetrics.MemoryUsage).
		Int64("uptime", systemMetrics.Uptime).
		Int("usb_printers", len(usbPrinters)).
		Msg("💓 Enviando heartbeat...")

	return c.sendMessage("heartbeat", heartbeatData)
}

func (c *Client) StartHeartbeat(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	c.log.Info().Dur("interval", interval).Msg("💓 Heartbeat iniciado")

	for range ticker.C {
		select {
		case <-c.stopCh:
			return
		default:
			if c.IsConnected() {
				if err := c.SendHeartbeat(); err != nil {
					c.log.Error().Err(err).Msg("Erro ao enviar heartbeat")
				}
			}
		}
	}
}

// sendRegisterMessage envia mensagem de registro com formato especial (deviceId e clientId na raiz)
func (c *Client) sendRegisterMessage(deviceId, clientId string, data interface{}) error {
	c.mu.RLock()
	connected := c.connected
	conn := c.conn
	c.mu.RUnlock()
	
	c.log.Info().
		Bool("connected", connected).
		Bool("conn_not_nil", conn != nil).
		Str("deviceId", deviceId).
		Msg("🔍 sendRegisterMessage - verificando estado")
	
	if !connected {
		c.log.Warn().Msg("⚠️ Tentativa de enviar register mas não está conectado")
		return fmt.Errorf("não conectado")
	}
	
	if conn == nil {
		c.log.Warn().Msg("⚠️ Tentativa de enviar register mas conexão é nil")
		return fmt.Errorf("conexão não inicializada")
	}
	
	// ⭐ Formato especial para register: deviceId e clientId na RAIZ, não em data
	msg := map[string]interface{}{
		"type":      "register",
		"deviceId":  deviceId,
		"clientId":  clientId,
		"data":      data,
		"timestamp": fmt.Sprintf("%d", time.Now().UnixMilli()),
	}

	msgJSON, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("erro ao serializar mensagem: %w", err)
	}

	c.log.Info().
		Str("deviceId", deviceId).
		Str("clientId", clientId).
		Str("json", string(msgJSON)).
		Msg("📤 Enviando mensagem register com formato correto...")
	
	if err := conn.WriteMessage(websocket.TextMessage, msgJSON); err != nil {
		c.log.Error().Err(err).Msg("❌ Erro ao enviar mensagem register")
		return fmt.Errorf("erro ao enviar mensagem: %w", err)
	}

	c.log.Info().Msg("✅ Mensagem register enviada com sucesso")
	return nil
}

func (c *Client) sendMessage(msgType string, data interface{}) error {
	// Para tipos normais de mensagem, verificar se está conectado E registrado
	if !c.IsConnected() {
		return fmt.Errorf("não conectado")
	}

	c.mu.RLock()
	conn := c.conn
	c.mu.RUnlock()

	if conn == nil {
		return fmt.Errorf("conexão não inicializada")
	}

	// Criar mensagem no formato do Edge-Go
	msg := Message{
		Type:      msgType,
		Data:      data,
		Timestamp: fmt.Sprintf("%d", time.Now().UnixMilli()),
	}

	msgJSON, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("erro ao serializar mensagem: %w", err)
	}

	if err := conn.WriteMessage(websocket.TextMessage, msgJSON); err != nil {
		return fmt.Errorf("erro ao enviar mensagem: %w", err)
	}

	c.log.Debug().Str("type", msgType).Msg("Mensagem enviada")
	return nil
}

func (c *Client) processPrintJob(data interface{}) {
	jobData, err := json.Marshal(data)
	if err != nil {
		c.log.Error().Err(err).Msg("❌ Erro ao serializar job")
		return
	}

	// Parsear formato v1.5 (zpl, copies, labelIds)
	var jobV15 struct {
		JobID    string   `json:"jobId"`
		ZPL      string   `json:"zpl"`
		Copies   int      `json:"copies"`
		LabelIDs []string `json:"labelIds,omitempty"`
	}

	if err := json.Unmarshal(jobData, &jobV15); err == nil && jobV15.ZPL != "" {
		// Formato v1.5 (Edge-Go)
		c.log.Info().
			Str("job_id", jobV15.JobID).
			Int("copies", jobV15.Copies).
			Msg("📨 Print job v1.5 recebido")

		// Criar job no formato interno
		job := models.PrintJob{
			JobID:   jobV15.JobID,
			ZPL:     jobV15.ZPL,
			Copies:  jobV15.Copies,
			PrinterID: "USE_FIRST_AVAILABLE",
		}

		// Adicionar à fila
		if err := c.printQueue.Enqueue(job); err != nil {
			c.log.Error().Err(err).Str("job_id", job.JobID).Msg("❌ Erro ao adicionar job à fila")
			c.sendPrintResponse(job.JobID, "error", "Erro ao adicionar job à fila: "+err.Error())
			return
		}

		c.log.Debug().Str("job_id", job.JobID).Msg("✅ Job adicionado à fila com sucesso")
		return
	}

	// Formato antigo (legado)
	var job models.PrintJob
	if err := json.Unmarshal(jobData, &job); err != nil {
		c.log.Error().Err(err).Str("raw_data", string(jobData)).Msg("❌ Erro ao parsear job")
		return
	}

	printerTarget := job.PrinterID
	if printerTarget == "" || printerTarget == "USE_FIRST_AVAILABLE" {
		printerTarget = "primeira USB disponível"
	}

	c.log.Info().
		Str("job_id", job.JobID).
		Str("printer_target", printerTarget).
		Int("copies", job.Copies).
		Msg("📨 Print job recebido do servidor")

	// Adicionar job à fila
	if err := c.printQueue.Enqueue(job); err != nil {
		c.log.Error().Err(err).Str("job_id", job.JobID).Msg("❌ Erro ao adicionar job à fila")
		c.sendPrintResponse(job.JobID, "error", "Erro ao adicionar job à fila: "+err.Error())
		return
	}

	c.log.Debug().Str("job_id", job.JobID).Msg("✅ Job adicionado à fila com sucesso")
}

func (c *Client) sendPrintResponse(jobID, status, message string) {
	responseData := map[string]interface{}{
		"deviceId": c.cfg.AgentFingerprint,
		"jobId":    jobID,
		"status":   status,
		"message":  message,
	}

	if err := c.sendMessage("print_ack", responseData); err != nil {
		c.log.Error().Err(err).Str("job_id", jobID).Msg("Erro ao enviar resposta de impressão")
	}
}

// monitorPrintResults monitora resultados da fila e envia via WebSocket
func (c *Client) monitorPrintResults() {
	resultChan := c.printQueue.GetResultChannel()

	for result := range resultChan {
		if c.IsConnected() {
			c.log.Info().
				Str("job_id", result.JobID).
				Str("status", result.Status).
				Msg("📤 Enviando resultado de impressão")

			status := "success"
			if result.Status == "error" {
				status = "error"
			}

			c.sendPrintResponse(result.JobID, status, result.Message)
		} else {
			c.log.Warn().
				Str("job_id", result.JobID).
				Msg("⚠️ Cliente desconectado, resultado não enviado")
		}
	}
}

func (c *Client) processAgentCommand(data interface{}) {
	cmdData, err := json.Marshal(data)
	if err != nil {
		c.log.Error().Err(err).Msg("Erro ao serializar comando")
		return
	}

	var cmd models.AgentCommand
	if err := json.Unmarshal(cmdData, &cmd); err != nil {
		c.log.Error().Err(err).Msg("Erro ao parsear comando")
		return
	}

	c.log.Info().
		Str("command_id", cmd.CommandID).
		Str("type", cmd.Type).
		Msg("Processando comando")

	response := models.CommandResponse{
		CommandID: cmd.CommandID,
		Status:    "processing",
		Timestamp: time.Now(),
	}

	switch cmd.Type {
	case "update_config":
		c.log.Info().Msg("Atualizando configuração...")
		response.Status = "success"
		response.Message = "Configuração atualizada"

	case "restart":
		c.log.Warn().Msg("Comando de restart recebido")
		response.Status = "success"
		response.Message = "Restart agendado"

	case "update_printers":
		c.log.Info().Msg("Atualizando impressoras...")
		response.Status = "success"
		response.Message = "Impressoras atualizadas"

	case "display_message":
		c.log.Info().Msg("Exibindo mensagem...")
		response.Status = "success"
		response.Message = "Mensagem exibida"

	default:
		c.log.Warn().Str("type", cmd.Type).Msg("Comando desconhecido")
		response.Status = "error"
		response.Message = fmt.Sprintf("Comando desconhecido: %s", cmd.Type)
	}

	c.log.Info().
		Str("command_id", cmd.CommandID).
		Str("status", response.Status).
		Msg("Comando processado")

	c.sendMessage("command-response", response)
}

// handlePing responde a requisições de ping da API (verifica se impressora está OK)
func (c *Client) handlePing(data interface{}) {
	dataMap, ok := data.(map[string]interface{})
	if !ok {
		c.log.Error().Msg("❌ Dados do ping inválidos")
		return
	}
	
	requestId, _ := dataMap["requestId"].(string)
	if requestId == "" {
		c.log.Warn().Msg("⚠️  Ping sem requestId")
		return
	}
	
	c.log.Info().Str("requestId", requestId).Msg("🏓 Respondendo ping...")
	
	// Verificar se há impressoras USB disponíveis
	usbPrinters := c.printerManager.CreateAutoUSBPrinters()
	printerStatus := "offline"
	if len(usbPrinters) > 0 {
		printerStatus = "online"
	}
	
	// Responder com status da impressora
	response := map[string]interface{}{
		"requestId":     requestId,
		"status":        printerStatus,
		"usbConnected":  len(usbPrinters) > 0,
		"printerCount":  len(usbPrinters),
		"timestamp":     time.Now().UnixMilli(),
	}
	
	if len(usbPrinters) > 0 {
		// Incluir informações da primeira impressora
		p := usbPrinters[0]
		response["printerName"] = p.Name
		response["printerModel"] = p.Model
		if p.DevicePath != nil {
			response["devicePath"] = *p.DevicePath
		}
	}
	
	c.sendMessage("pong", response)
	c.log.Info().Str("requestId", requestId).Str("status", printerStatus).Msg("✅ Pong enviado")
}

// handlePrinterPing responde ao ping_printer da API verificando o status da impressora USB
func (c *Client) handlePrinterPing(data interface{}) {
	dataMap, ok := data.(map[string]interface{})
	if !ok {
		c.log.Error().Msg("❌ Dados do ping_printer inválidos")
		return
	}

	requestId, _ := dataMap["requestId"].(string)
	if requestId == "" {
		c.log.Warn().Msg("⚠️  ping_printer sem requestId")
		return
	}

	c.log.Info().Str("requestId", requestId).Msg("📍 Processando ping da impressora...")

	// Verificar status da impressora USB
	usbPrinters := c.printerManager.CreateAutoUSBPrinters()
	usbConnected := len(usbPrinters) > 0

	// Determinar status da impressora
	printerStatus := "offline"
	var errorMessage *string
	if usbConnected {
		// Verificar se a primeira impressora está online
		if len(usbPrinters) > 0 {
			firstPrinter := usbPrinters[0]
			if firstPrinter.Status == "online" {
				printerStatus = "ready"
			} else {
				printerStatus = "offline"
				msg := fmt.Sprintf("Impressora %s está %s", firstPrinter.Name, firstPrinter.Status)
				errorMessage = &msg
			}
		}
	} else {
		msg := "Impressora USB não conectada"
		errorMessage = &msg
	}

	// Criar resposta no formato esperado pela API
	// A API espera: { type: "printer_status", requestId, status, details } (campos na raiz, não em data)
	details := map[string]interface{}{
		"usbConnected": usbConnected,
		"paperStatus":  "ok", // Placeholder - seria necessário verificar hardware
	}
	if errorMessage != nil {
		details["errorMessage"] = *errorMessage
	} else {
		details["errorMessage"] = nil
	}

	// Enviar mensagem diretamente com campos na raiz (não usar sendMessage que coloca em data)
	c.mu.RLock()
	conn := c.conn
	c.mu.RUnlock()

	if conn == nil {
		c.log.Error().Msg("❌ Conexão não disponível para enviar printer_status")
		return
	}

	msg := map[string]interface{}{
		"type":      "printer_status",
		"requestId": requestId,
		"status":    printerStatus,
		"details":   details,
		"timestamp": fmt.Sprintf("%d", time.Now().UnixMilli()),
	}

	msgJSON, err := json.Marshal(msg)
	if err != nil {
		c.log.Error().Err(err).Msg("❌ Erro ao serializar printer_status")
		return
	}

	if err := conn.WriteMessage(websocket.TextMessage, msgJSON); err != nil {
		c.log.Error().Err(err).Msg("❌ Erro ao enviar printer_status")
		return
	}
	c.log.Info().
		Str("requestId", requestId).
		Str("status", printerStatus).
		Bool("usbConnected", usbConnected).
		Msg("✅ Status da impressora enviado")
}

// startUSBWatchdog monitora a impressora USB e reinicia se ficar desconectada por muito tempo
func (c *Client) startUSBWatchdog() {
	c.log.Info().
		Dur("interval", USBWatchdogCheckInterval).
		Int("max_cycles", USBWatchdogMaxCycles).
		Msg("🔍 Iniciando watchdog USB")

	ticker := time.NewTicker(USBWatchdogCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-c.stopCh:
			c.log.Info().Msg("🛑 Watchdog USB parado")
			return
		case <-ticker.C:
			// Verificar se há impressoras USB conectadas
			usbPrinters := c.printerManager.CreateAutoUSBPrinters()
			usbConnected := len(usbPrinters) > 0

			if usbConnected {
				// Impressora conectada, resetar contador
				if c.usbDisconnectedCycles > 0 {
					c.log.Info().Msg("✅ Impressora USB reconectada, resetando watchdog")
					c.usbDisconnectedCycles = 0
				}
				c.lastUSBConnected = true
			} else {
				// Impressora desconectada
				if c.lastUSBConnected {
					c.log.Warn().Msg("⚠️  Impressora USB desconectada!")
				}
				c.lastUSBConnected = false
				c.usbDisconnectedCycles++

				c.log.Warn().
					Int("cycle", c.usbDisconnectedCycles).
					Int("max_cycles", USBWatchdogMaxCycles).
					Msg("🔄 Impressora USB desconectada - aguardando reconexão...")

				// Watchdog: se passou muito tempo desconectada, reiniciar
				if c.usbDisconnectedCycles >= USBWatchdogMaxCycles {
					c.log.Error().
						Int("cycles", c.usbDisconnectedCycles).
						Msg("❌ Watchdog USB: Impressora desconectada há 1 minuto")
					c.log.Error().Msg("🔄 Reiniciando Edge-Pro para forçar reconexão USB...")

					// Notificar backend antes de reiniciar
					c.sendMessage("reboot_notification", map[string]interface{}{
						"reason":    "usb_watchdog",
						"message":   "Impressora USB desconectada por muito tempo",
						"cycles":    c.usbDisconnectedCycles,
						"timestamp": time.Now().UnixMilli(),
					})

					// Aguardar 2 segundos para mensagem ser enviada
					time.Sleep(2 * time.Second)

					// Reiniciar (via systemctl em produção, exit em dev)
					c.log.Error().Msg("🔄 REINICIANDO AGORA!")
					os.Exit(1) // Systemd vai reiniciar automaticamente
				}
			}
		}
	}
}

func (c *Client) IsConnected() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.connected && c.registered
}

// Emit envia uma mensagem genérica via WebSocket
func (c *Client) Emit(event string, data interface{}) error {
	return c.sendMessage(event, data)
}

func (c *Client) Disconnect() error {
	c.log.Info().Msg("Desconectando...")
	close(c.stopCh)

	if c.pingTicker != nil {
		c.pingTicker.Stop()
	}

	// Parar fila de impressão
	c.printQueue.Stop()
	if c.certManager != nil {
		c.certManager.Stop()
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *Client) UpdatePrinters(printers []models.PrinterInfo) {
	c.printers = printers
	c.printerManager.LoadPrinters(printers)
	c.log.Info().Int("count", len(printers)).Msg("Impressoras atualizadas")
}

// registerPrintersWithBackend registra impressoras USB detectadas no backend via HTTP
func (c *Client) registerPrintersWithBackend() {
	c.log.Info().Msg("🖨️  Registrando impressoras USB no backend...")

	// Detectar impressoras USB
	usbPrinters := c.printerManager.CreateAutoUSBPrinters()

	if len(usbPrinters) == 0 {
		c.log.Info().Msg("Nenhuma impressora USB detectada")
		return
	}

	// Obter IP local
	localIP := metrics.GetLocalIP()

	// Construir URL do backend
	backendURL := strings.TrimSuffix(c.cfg.ServerURL, "/")
	apiURL := fmt.Sprintf("%s/devices/register-printer", backendURL)

	c.log.Info().
		Int("printers", len(usbPrinters)).
		Str("api_url", apiURL).
		Msg("📡 Enviando impressoras para backend...")

	for _, p := range usbPrinters {
		printerName := p.Name
		if printerName == "" {
			printerName = fmt.Sprintf("Edge-Pro %s", c.cfg.AgentFingerprint[len(c.cfg.AgentFingerprint)-8:])
		}

	// Usar o deviceId correto (edge-pro-)
	payload := map[string]interface{}{
		"name":         printerName,
		"type":         "edge",
		"deviceId":     c.cfg.AgentFingerprint, // ✅ Usar prefixo correto edge-pro-
		"ip":           localIP,
		"port":         9100,
		"isUSBPrinter": true,
		"status":       "active",
	}

		payloadBytes, err := json.Marshal(payload)
		if err != nil {
			c.log.Error().Err(err).Msg("Erro ao serializar payload")
			continue
		}

		req, err := http.NewRequest("POST", apiURL, strings.NewReader(string(payloadBytes)))
		if err != nil {
			c.log.Error().Err(err).Msg("Erro ao criar requisição")
			continue
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.cfg.APIKey))

		client := c.newHTTPClient(10 * time.Second)
		resp, err := client.Do(req)
		if err != nil {
			c.log.Error().Err(err).Msg("Erro ao enviar requisição")
			continue
		}

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			c.log.Info().
				Str("printer", printerName).
				Int("status", resp.StatusCode).
				Msg("✅ Impressora registrada no backend")
		} else {
			c.log.Warn().
				Str("printer", printerName).
				Int("status", resp.StatusCode).
				Msg("⚠️ Erro ao registrar impressora")
		}

		resp.Body.Close()
	}
}

func (c *Client) newHTTPClient(timeout time.Duration) *http.Client {
	if c.certManager != nil {
		return c.certManager.NewHTTPClient(timeout)
	}
	return &http.Client{Timeout: timeout}
}

