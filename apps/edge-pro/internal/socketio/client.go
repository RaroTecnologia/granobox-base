package socketio

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

type Client struct {
	cfg              *config.SocketIOConfig
	deviceCfg        *config.DeviceConfig
	log              zerolog.Logger
	conn             *websocket.Conn
	connected        bool
	mu               sync.RWMutex
	stopCh           chan struct{}
	metricsCollector *metrics.Collector
	printerManager   *printer.Manager
	printQueue       *printer.Queue
	printers         []models.PrinterInfo
	handlers         map[string]func(interface{})
	pingTicker       *time.Ticker
	certManager      *certmanager.Manager
}

func NewClient(cfg *config.SocketIOConfig, deviceCfg *config.DeviceConfig, log zerolog.Logger) *Client {
	logger := log.With().Str("component", "socketio-client").Logger()
	printerMgr := printer.NewManager(logger)
	printQueue := printer.NewQueue(printerMgr, logger, 2) // 2 workers

	client := &Client{
		cfg:              cfg,
		deviceCfg:        deviceCfg,
		log:              logger,
		stopCh:           make(chan struct{}),
		metricsCollector: metrics.NewCollector(),
		printerManager:   printerMgr,
		printQueue:       printQueue,
		printers:         []models.PrinterInfo{},
		handlers:         make(map[string]func(interface{})),
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

	return client
}

func (c *Client) Connect() error {
	c.log.Info().
		Str("server", c.cfg.ServerURL).
		Str("namespace", c.cfg.Namespace).
		Msg("🔌 Iniciando conexão Socket.IO...")

	// Loop de reconexão
	go c.connectLoop()

	return nil
}

func (c *Client) connectLoop() {
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
			c.mu.Unlock()

			c.log.Warn().Msg("🔌 Conexão encerrada, reconectando...")
			time.Sleep(time.Duration(c.cfg.ReconnectDelay) * time.Second)
		}
	}
}

// Linha 99 nos logs: "✅ Conexão estabelecida"
func (c *Client) setupHandlers() {
	c.handlers["connection-established"] = func(data interface{}) {
		c.log.Info().Msg("✅ Conexão estabelecida")
	}

	// Linha 108 nos logs: "✅ Agent registrado com sucesso!"
	c.handlers["agent-registered"] = func(data interface{}) {
		c.log.Info().Interface("data", data).Msg("✅ Agent registrado com sucesso!")

		// Aguardar 2 segundos e registrar impressoras USB no backend
		go func() {
			time.Sleep(2 * time.Second)
			c.registerPrintersWithBackend()
		}()
	}

	c.handlers["registration-error"] = func(data interface{}) {
		c.log.Error().Interface("error", data).Msg("❌ Erro no registro do agent")
	}

	c.handlers["auth-error"] = func(data interface{}) {
		c.log.Error().Interface("error", data).Msg("❌ Erro de autenticação")
	}

	c.handlers["heartbeat-ack"] = func(data interface{}) {
		c.log.Debug().Msg("💓 Heartbeat ACK")
	}

	c.handlers["printers-update"] = func(data interface{}) {
		c.log.Info().Msg("🖨️ Atualização de impressoras")
		c.processPrintersUpdate(data)
	}

	c.handlers["print-job"] = func(data interface{}) {
		c.log.Info().Msg("📄 Job de impressão recebido")
		c.processPrintJob(data)
	}

	c.handlers["agent-command"] = func(data interface{}) {
		c.log.Info().Msg("⚡ Comando recebido")
		c.processAgentCommand(data)
	}
}

// Linha 195 nos logs: "🔐 Conectando WebSocket..."
func (c *Client) doConnect() error {
	c.setupHandlers()

	// Construir URL WebSocket
	serverURL, err := url.Parse(c.cfg.ServerURL)
	if err != nil {
		return fmt.Errorf("URL inválida: %w", err)
	}

	scheme := "ws"
	if serverURL.Scheme == "https" {
		scheme = "wss"
	}

	wsURL := fmt.Sprintf("%s://%s/socket.io/?EIO=4&transport=websocket&token=%s",
		scheme, serverURL.Host, url.QueryEscape(c.cfg.APIKey))

	c.log.Info().Str("url", serverURL.Host).Msg("🔐 Conectando WebSocket ao Granobox...")

	if c.certManager != nil {
		if err := c.certManager.EnsureCertificate(false); err != nil {
			c.log.Warn().Err(err).Msg("Não foi possível atualizar certificado antes do WebSocket")
		}
	}

	// Conectar
	header := http.Header{}
	header.Set("User-Agent", "Granobox-Edge-Pro/1.0")

	dialer := websocket.Dialer{Proxy: http.ProxyFromEnvironment}
	if c.certManager != nil {
		if tlsCfg := c.certManager.TLSConfig(); tlsCfg != nil {
			dialer.TLSClientConfig = tlsCfg
		}
	}

	conn, _, err := dialer.Dial(wsURL, header)
	if err != nil {
		return fmt.Errorf("erro ao conectar WebSocket: %w", err)
	}

	// Linha 208 nos logs: "🚀 WebSocket conectado, aguardando eventos..."
	c.log.Info().Msg("🚀 WebSocket conectado, aguardando eventos...")

	c.mu.Lock()
	c.conn = conn
	c.connected = true
	c.mu.Unlock()

	// ⭐ CONFIGURAR WEBSOCKET PING/PONG ⭐
	// Configurar Pong Handler
	conn.SetPongHandler(func(appData string) error {
		c.log.Debug().Msg("🏓 WebSocket PONG recebido")
		// Reset read deadline quando receber pong
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Iniciar goroutine para enviar WebSocket PINGs
	c.startWebSocketPing()

	// Iniciar leitura de mensagens
	c.readMessages()

	return nil
}

// ⭐ NOVA FUNÇÃO: Envia WebSocket PING a cada 10 segundos ⭐
func (c *Client) startWebSocketPing() {
	if c.pingTicker != nil {
		c.pingTicker.Stop()
	}

	c.pingTicker = time.NewTicker(10 * time.Second)

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

				// Enviar WebSocket PING (não Socket.IO ping)
				if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(5*time.Second)); err != nil {
					c.log.Debug().Err(err).Msg("Erro ao enviar WebSocket PING")
					return
				}
				c.log.Info().Msg("🏓 WebSocket PING enviado")

			case <-c.stopCh:
				return
			}
		}
	}()
}

// Linha 252 nos logs: "Erro ao ler mensagem WebSocket"
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
		_, message, err := conn.ReadMessage()
		if err != nil {
			c.log.Error().Err(err).Msg("Erro ao ler mensagem WebSocket")
			c.mu.Lock()
			c.connected = false
			c.mu.Unlock()
			return
		}

		// Reset read deadline on every message
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		c.processMessage(message)
	}
}

// Linha 279 nos logs: "Socket.IO OPEN"
func (c *Client) processMessage(message []byte) {
	msgStr := string(message)
	if len(msgStr) < 1 {
		return
	}

	// Tipo de mensagem Socket.IO
	msgType := msgStr[0:1]

	switch msgType {
	case "0": // OPEN
		c.log.Info().Msg("Socket.IO OPEN")
		// Após OPEN, enviar conexão ao namespace
		c.connectToNamespace()
	case "2": // PING
		c.sendPong()
	case "3": // PONG
		c.log.Debug().Msg("Socket.IO PONG")
	case "4": // MESSAGE
		c.handleSocketIOMessage(msgStr[1:])
	}
}

// Linha 303 nos logs: "✅ Socket.IO conectado"
func (c *Client) handleSocketIOMessage(msgData string) {
	if len(msgData) < 1 {
		return
	}

	eventType := msgData[0:1]

	if eventType == "0" {
		// Connect to namespace
		c.log.Info().Msg("✅ Socket.IO conectado")
		// Aguardar 1 segundo antes de registrar
		time.AfterFunc(1*time.Second, func() {
			if err := c.sendRegister(); err != nil {
				c.log.Error().Err(err).Msg("Erro ao enviar registro")
			}
		})
		return
	}

	if eventType == "2" {
		// Event
		c.processEvent(msgData[1:])
	}
}

func (c *Client) processEvent(eventData string) {
	// Remove namespace se presente
	if strings.HasPrefix(eventData, c.cfg.Namespace+",") {
		eventData = eventData[len(c.cfg.Namespace)+1:]
	}

	// Parse evento: ["event-name", data]
	var eventArray []json.RawMessage
	if err := json.Unmarshal([]byte(eventData), &eventArray); err != nil {
		c.log.Error().Err(err).Str("data", eventData).Msg("Erro ao parsear evento")
		return
	}

	if len(eventArray) < 1 {
		return
	}

	var eventName string
	if err := json.Unmarshal(eventArray[0], &eventName); err != nil {
		c.log.Error().Err(err).Msg("Erro ao parsear nome do evento")
		return
	}

	var eventPayload interface{}
	if len(eventArray) > 1 {
		if err := json.Unmarshal(eventArray[1], &eventPayload); err != nil {
			c.log.Warn().Err(err).Str("event", eventName).Msg("Erro ao parsear payload do evento")
		}
	}

	c.log.Debug().Str("event", eventName).Msg("Evento recebido")

	// Chamar handler
	if handler, ok := c.handlers[eventName]; ok {
		handler(eventPayload)
	}
}

func (c *Client) sendPong() {
	c.mu.RLock()
	conn := c.conn
	c.mu.RUnlock()

	if conn != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("3"))
		c.log.Debug().Msg("Socket.IO PONG enviado")
	}
}

func (c *Client) connectToNamespace() {
	c.mu.RLock()
	conn := c.conn
	c.mu.RUnlock()

	if conn == nil {
		return
	}

	namespace := c.cfg.Namespace
	if namespace == "" {
		namespace = "/agents"
	}

	// Enviar: 40/agents
	message := fmt.Sprintf("40%s", namespace)
	if err := conn.WriteMessage(websocket.TextMessage, []byte(message)); err != nil {
		c.log.Error().Err(err).Msg("Erro ao conectar ao namespace")
		return
	}

	c.log.Info().Str("namespace", namespace).Msg("🔌 Conectando ao namespace...")
}

// Linha 385 nos logs: "✨ Impressoras USB auto-detectadas"
// Linha 413 nos logs: "📝 Enviando agent-register..."
func (c *Client) sendRegister() error {
	c.log.Info().Msg("📝 Preparando registro do agent...")

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

	// Auto-detectar impressoras USB (EFÊMERO - não cadastra na API permanentemente)
	usbPrinters := c.printerManager.CreateAutoUSBPrinters()
	c.log.Info().Int("count", len(usbPrinters)).Msg("✨ Impressoras USB auto-detectadas (efêmero)")

	// Carregar impressoras do gerenciador (para jobs locais)
	c.printerManager.LoadPrinters(usbPrinters)

	// Converter impressoras para registro
	// ⚠️ IMPORTANTE: Impressoras USB não devem ser enviadas no agent-register
	// Elas são enviadas APENAS no heartbeat (registro efêmero)
	printersForRegister := make([]map[string]interface{}, 0)

	// TODO: Adicionar impressoras TCP configuradas se houver
	// Essas sim devem ser cadastradas permanentemente

	localIP := metrics.GetLocalIP()
	macAddr := metrics.GetMacAddress()

	agentData := map[string]interface{}{
		"agentFingerprint": c.cfg.AgentFingerprint,
		"name":             deviceName,
		"hostname":         hostname,
		"location":         c.deviceCfg.Location,
		"version":          c.deviceCfg.Version,
		"platform":         "linux-arm64", // Raspberry Pi
		"type":             "edge-pro",
		"ip":               localIP,
		"mac":              macAddr,
		"printers":         printersForRegister, // Vazio para USB (efêmero)
		"capabilities": map[string]interface{}{
			"usb":         true,
			"display":     false, // Será true quando implementarmos
			"maxPrinters": 1,
			"protocols":   []string{"ZPL", "TSPL"},
		},
	}

	c.log.Info().
		Str("fingerprint", c.cfg.AgentFingerprint).
		Str("name", deviceName).
		Int("usb_printers", len(usbPrinters)).
		Msg("📝 Enviando agent-register (USB efêmero)...")

	return c.Emit("agent-register", agentData)
}

// Linha 469 nos logs: "💓 Enviando heartbeat..."
func (c *Client) SendHeartbeat() error {
	if !c.IsConnected() {
		return fmt.Errorf("cliente não conectado")
	}

	systemMetrics := c.metricsCollector.GetSystemMetrics()

	// ⭐ DETECTAR IMPRESSORAS USB DINAMICAMENTE (EFÊMERO) ⭐
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

	heartbeat := map[string]interface{}{
		"agentFingerprint": c.cfg.AgentFingerprint,
		"uptimeSeconds":    systemMetrics.Uptime,
		"cpuUsage":         systemMetrics.CPUUsage,
		"memoryUsage":      systemMetrics.MemoryUsage,
		"temperature":      systemMetrics.Temperature,
		"diskUsage":        systemMetrics.DiskUsage,
		"ip":               localIP,
		"mac":              macAddr,
		"printers":         printersForHeartbeat, // ⭐ IMPRESSORAS USB EFÊMERAS ⭐
		"queueStats":       queueStats,
	}

	c.log.Info().
		Float64("cpu", systemMetrics.CPUUsage).
		Float64("memory", systemMetrics.MemoryUsage).
		Float64("temp", systemMetrics.Temperature).
		Int64("uptime", systemMetrics.Uptime).
		Int("usb_printers", len(usbPrinters)).
		Msg("💓 Enviando heartbeat...")

	return c.Emit("heartbeat", heartbeat)
}

func (c *Client) StartHeartbeat(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	c.log.Info().Dur("interval", interval).Msg("💓 Heartbeat iniciado")

	for range ticker.C {
		if c.IsConnected() {
			if err := c.SendHeartbeat(); err != nil {
				c.log.Error().Err(err).Msg("Erro ao enviar heartbeat")
			}
		}
	}
}

func (c *Client) processPrintJob(data interface{}) {
	jobData, err := json.Marshal(data)
	if err != nil {
		c.log.Error().Err(err).Msg("❌ Erro ao serializar job")
		return
	}

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
		Int("priority", job.GetPriority()).
		Int("copies", job.Copies).
		Msg("📨 Print job recebido do servidor")

	// Adicionar job à fila (com retry automático)
	if err := c.printQueue.Enqueue(job); err != nil {
		c.log.Error().Err(err).Str("job_id", job.JobID).Msg("❌ Erro ao adicionar job à fila")

		// Enviar erro imediatamente
		result := models.PrintJobResult{
			JobID:     job.JobID,
			Status:    "error",
			Message:   "Erro ao adicionar job à fila",
			Error:     err.Error(),
			PrintedAt: time.Now(),
		}
		c.Emit("print-job-result", result)
		return
	}

	c.log.Debug().
		Str("job_id", job.JobID).
		Msg("✅ Job adicionado à fila com sucesso")
}

// monitorPrintResults monitora resultados da fila e envia via Socket.IO
func (c *Client) monitorPrintResults() {
	resultChan := c.printQueue.GetResultChannel()

	for result := range resultChan {
		if c.IsConnected() {
			c.log.Info().
				Str("job_id", result.JobID).
				Str("status", result.Status).
				Msg("📤 Enviando resultado de impressão")

			if err := c.Emit("print-job-result", result); err != nil {
				c.log.Error().Err(err).Str("job_id", result.JobID).Msg("Erro ao enviar resultado")
			}
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

	c.Emit("command-response", response)
}

func (c *Client) processPrintersUpdate(data interface{}) {
	printersData, err := json.Marshal(data)
	if err != nil {
		c.log.Error().Err(err).Msg("Erro ao serializar impressoras")
		return
	}

	var printers []models.PrinterInfo
	if err := json.Unmarshal(printersData, &printers); err != nil {
		c.log.Error().Err(err).Msg("Erro ao parsear impressoras")
		return
	}

	c.printers = printers
	c.printerManager.LoadPrinters(printers)
	c.log.Info().Int("count", len(printers)).Msg("✅ Impressoras atualizadas")
}

func (c *Client) Emit(event string, data interface{}) error {
	if !c.IsConnected() {
		return fmt.Errorf("não conectado")
	}

	c.mu.RLock()
	conn := c.conn
	c.mu.RUnlock()

	if conn == nil {
		return fmt.Errorf("conexão não inicializada")
	}

	// Construir mensagem Socket.IO: 42["event",{data}]
	eventArray := []interface{}{event, data}
	eventJSON, err := json.Marshal(eventArray)
	if err != nil {
		return fmt.Errorf("erro ao serializar evento: %w", err)
	}

	namespace := c.cfg.Namespace
	if namespace == "" {
		namespace = "/agents"
	}

	message := fmt.Sprintf("42%s,%s", namespace, string(eventJSON))

	if err := conn.WriteMessage(websocket.TextMessage, []byte(message)); err != nil {
		return fmt.Errorf("erro ao enviar mensagem: %w", err)
	}

	c.log.Debug().Str("event", event).Msg("Evento emitido")
	return nil
}

func (c *Client) IsConnected() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.connected
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

		payload := map[string]interface{}{
			"name":         printerName,
			"type":         "edge",
			"deviceId":     c.cfg.AgentFingerprint,
			"ip":           localIP,
			"port":         9100, // Porta padrão para impressoras ZPL/ESC-POS
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
