package models

import (
	"strconv"
	"time"
)

// DeviceInfo contém informações sobre o dispositivo edge
type DeviceInfo struct {
	DeviceID    string    `json:"device_id"`
	MacAddress  string    `json:"mac_address"`
	IPAddress   string    `json:"ip_address"`
	Version     string    `json:"version"`
	Uptime      int64     `json:"uptime"`
	LastSeen    time.Time `json:"last_seen"`
	Temperature float64   `json:"temperature,omitempty"`
}

// PrinterInfo informações sobre uma impressora
type PrinterInfo struct {
	ID                 *string               `json:"id,omitempty"`
	Name               string                `json:"name"`
	ExternalPrinterRef *string               `json:"externalPrinterRef,omitempty"`
	Status             string                `json:"status"`
	Model              string                `json:"model,omitempty"`
	Type               string                `json:"type,omitempty"`
	Connection         string                `json:"connection"`           // "usb", "network", "cups"
	DevicePath         *string               `json:"devicePath,omitempty"` // Para USB: /dev/usb/lp0
	CupsName           *string               `json:"cupsName,omitempty"`   // Para CUPS: nome da impressora
	Network            *PrinterNetworkConfig `json:"network,omitempty"`
	Stats              *PrinterStats         `json:"stats,omitempty"`
}

// PrinterNetworkConfig configuração de rede da impressora
type PrinterNetworkConfig struct {
	IP   *string `json:"ip,omitempty"`
	Port *int    `json:"port,omitempty"`
}

// PrinterStats estatísticas de impressão
type PrinterStats struct {
	Today       int     `json:"today"`
	Total       int     `json:"total"`
	LastPrintAt *string `json:"lastPrintAt,omitempty"`
}

// AgentInfo informações do agent para registro
type AgentInfo struct {
	AgentFingerprint string        `json:"agentFingerprint"`
	Name             string        `json:"name"`
	Version          string        `json:"version"`
	Platform         string        `json:"platform"`
	Capabilities     []string      `json:"capabilities"`
	Printers         []PrinterInfo `json:"printers"`
	Status           string        `json:"status"`
	Hostname         *string       `json:"hostname,omitempty"`
	IP               *string       `json:"ip,omitempty"`
	Location         string        `json:"location,omitempty"`
	Metadata         Metadata      `json:"metadata"`
}

// Metadata metadados do agent
type Metadata struct {
	AgentType string `json:"agentType"`
	OS        string `json:"os"`
	Arch      string `json:"arch"`
}

// HeartbeatData dados do heartbeat periódico
type HeartbeatData struct {
	AgentFingerprint string        `json:"agentFingerprint"`
	Metrics          SystemMetrics `json:"metrics"`
	Printers         []PrinterInfo `json:"printers"`
	Status           string        `json:"status"`
	Timestamp        time.Time     `json:"timestamp"`
}

// SystemMetrics métricas do sistema
type SystemMetrics struct {
	CPUUsage    float64 `json:"cpu_usage"`
	MemoryUsage float64 `json:"memory_usage"`
	DiskUsage   float64 `json:"disk_usage"`
	Uptime      int64   `json:"uptime"`
	Temperature float64 `json:"temperature"`
}

// DisplayMessage representa uma mensagem para o display
type DisplayMessage struct {
	Type    string                 `json:"type"` // "status", "qrcode", "text", "clear"
	Content map[string]interface{} `json:"content,omitempty"`
	Data    map[string]interface{} `json:"data,omitempty"`
}

// StatusContent conteúdo para display de status
type StatusContent struct {
	Icon       string `json:"icon"`
	Message    string `json:"message"`
	IP         string `json:"ip,omitempty"`
	DeviceID   string `json:"device_id,omitempty"`
	Version    string `json:"version,omitempty"`
	Brightness int    `json:"brightness,omitempty"`
}

// QRCodeContent conteúdo para display de QR code
type QRCodeContent struct {
	Data string `json:"data"`
	Size int    `json:"size,omitempty"`
}

// TextContent conteúdo para display de texto
type TextContent struct {
	Text       string `json:"text"`
	FontSize   int    `json:"font_size,omitempty"`
	Brightness int    `json:"brightness,omitempty"`
}

// SensorData dados dos sensores
type SensorData struct {
	Timestamp   time.Time `json:"timestamp"`
	Temperature float64   `json:"temperature,omitempty"`
	Humidity    float64   `json:"humidity,omitempty"`
	Pressure    float64   `json:"pressure,omitempty"`
}

// WebSocketMessage mensagem WebSocket genérica
type WebSocketMessage struct {
	Event     string                 `json:"event"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// PrintJob job de impressão recebido do servidor
type PrintJob struct {
	JobID     string                 `json:"jobId"`
	PrinterID string                 `json:"printerId"`
	ZPL       string                 `json:"zpl,omitempty"`
	Template  interface{}            `json:"template,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Priority  interface{}            `json:"priority,omitempty"` // Pode vir como string ou int
	Copies    int                    `json:"copies,omitempty"`
	LabelIDs  []string               `json:"labelIds,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// GetPriority retorna a prioridade como int, tratando string ou int
func (p *PrintJob) GetPriority() int {
	switch v := p.Priority.(type) {
	case int:
		return v
	case float64:
		return int(v)
	case string:
		// Tentar converter string para int
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
		return 0
	default:
		return 0
	}
}

// AgentCommand comando do servidor para o agent
type AgentCommand struct {
	CommandID string                 `json:"commandId"`
	Type      string                 `json:"type"` // "update_config", "restart", "update_printers", "display_message"
	Payload   map[string]interface{} `json:"payload,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
}

// CommandResponse resposta de execução de comando
type CommandResponse struct {
	CommandID string                 `json:"commandId"`
	Status    string                 `json:"status"` // "success", "error", "processing"
	Message   string                 `json:"message,omitempty"`
	Result    map[string]interface{} `json:"result,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
}

// PrintJobResult resultado de impressão
type PrintJobResult struct {
	JobID     string    `json:"jobId"`
	Status    string    `json:"status"` // "success", "error", "processing"
	Message   string    `json:"message,omitempty"`
	PrintedAt time.Time `json:"printedAt,omitempty"`
	Error     string    `json:"error,omitempty"`
}
