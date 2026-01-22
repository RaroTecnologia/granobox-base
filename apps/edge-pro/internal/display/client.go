package display

import (
	"encoding/json"
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/rs/zerolog"
	"github.com/granobox/edge-pro/internal/models"
	"github.com/granobox/edge-pro/pkg/logger"
)

// Client cliente para comunicação com o display service (Python)
type Client struct {
	serviceURL string
	mu         sync.Mutex
	log        zerolog.Logger
	enabled    bool
}

// New cria um novo cliente de display
func New(serviceURL string, enabled bool) *Client {
	return &Client{
		serviceURL: serviceURL,
		log:        logger.New("display"),
		enabled:    enabled,
	}
}

// Connect testa a conexão com o display service
func (c *Client) Connect() error {
	if !c.enabled {
		c.log.Info().Msg("Display desabilitado")
		return nil
	}

	// Testar conexão
	conn, err := net.DialTimeout("tcp", c.serviceURL, 2*time.Second)
	if err != nil {
		return fmt.Errorf("erro ao conectar ao display service: %w", err)
	}
	conn.Close()

	c.log.Info().Str("url", c.serviceURL).Msg("✅ Conectado ao display service")
	return nil
}

// Disconnect não faz nada (sem conexão persistente)
func (c *Client) Disconnect() error {
	return nil
}

// sendMessage envia uma mensagem para o display service
// Cria uma nova conexão para cada mensagem (Python fecha após cada resposta)
func (c *Client) sendMessage(msg *models.DisplayMessage) error {
	if !c.enabled {
		return nil
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	// Criar nova conexão para cada mensagem
	conn, err := net.DialTimeout("tcp", c.serviceURL, 2*time.Second)
	if err != nil {
		return fmt.Errorf("erro ao conectar ao display: %w", err)
	}
	defer conn.Close()

	// Serializar mensagem
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("erro ao serializar mensagem: %w", err)
	}

	// Enviar dados (sem newline)
	if _, err := conn.Write(data); err != nil {
		return fmt.Errorf("erro ao enviar mensagem: %w", err)
	}

	// Aguardar resposta (Python envia {"status":"ok"})
	response := make([]byte, 1024)
	conn.SetReadDeadline(time.Now().Add(1 * time.Second))
	n, err := conn.Read(response)
	if err != nil {
		c.log.Warn().Err(err).Msg("Aviso: erro ao ler resposta do display")
		// Não retorna erro, pois a mensagem foi enviada
	} else {
		c.log.Debug().Str("response", string(response[:n])).Msg("Resposta do display")
	}

	return nil
}

// ShowStatus exibe status no display
func (c *Client) ShowStatus(icon, message, ip, deviceID, version string, brightness int) error {
	msg := &models.DisplayMessage{
		Type: "status",
		Content: map[string]interface{}{
			"icon":       icon,
			"message":    message,
			"ip":         ip,
			"device_id":  deviceID,
			"version":    version,
			"brightness": brightness,
		},
	}

	if err := c.sendMessage(msg); err != nil {
		c.log.Error().Err(err).Msg("Erro ao exibir status")
		return err
	}

	c.log.Debug().Str("icon", icon).Str("message", message).Msg("Status exibido")
	return nil
}

// UpdateStatus atualiza o status do display com dados de rede e jobs
func (c *Client) UpdateStatus(jobsToday int, wsConnected bool, wifiSignal int, lanConnected bool, wifiIP, lanIP string) error {
	msg := &models.DisplayMessage{
		Type: "status",
		Data: map[string]interface{}{
			"jobs_today":    jobsToday,
			"ws_connected":  wsConnected,
			"wifi_signal":   wifiSignal,
			"lan_connected": lanConnected,
			"wifi_ip":       wifiIP,
			"lan_ip":        lanIP,
		},
	}

	if err := c.sendMessage(msg); err != nil {
		c.log.Error().Err(err).Msg("Erro ao atualizar status")
		return err
	}

	c.log.Debug().Int("jobs", jobsToday).Str("wifi_ip", wifiIP).Str("lan_ip", lanIP).Msg("Status atualizado")
	return nil
}

// ShowQRCode exibe QR code no display
func (c *Client) ShowQRCode(data string, size int) error {
	msg := &models.DisplayMessage{
		Type: "qrcode",
		Content: map[string]interface{}{
			"data": data,
			"size": size,
		},
	}

	if err := c.sendMessage(msg); err != nil {
		c.log.Error().Err(err).Msg("Erro ao exibir QR code")
		return err
	}

	c.log.Debug().Str("data", data).Msg("QR code exibido")
	return nil
}

// ShowText exibe texto no display
func (c *Client) ShowText(text string, fontSize, brightness int) error {
	msg := &models.DisplayMessage{
		Type: "text",
		Content: map[string]interface{}{
			"text":       text,
			"font_size":  fontSize,
			"brightness": brightness,
		},
	}

	if err := c.sendMessage(msg); err != nil {
		c.log.Error().Err(err).Msg("Erro ao exibir texto")
		return err
	}

	c.log.Debug().Str("text", text).Msg("Texto exibido")
	return nil
}

// Clear limpa o display
func (c *Client) Clear() error {
	msg := &models.DisplayMessage{
		Type:    "clear",
		Content: map[string]interface{}{},
	}

	if err := c.sendMessage(msg); err != nil {
		c.log.Error().Err(err).Msg("Erro ao limpar display")
		return err
	}

	c.log.Debug().Msg("Display limpo")
	return nil
}

// SetBrightness ajusta o brilho do display
func (c *Client) SetBrightness(brightness int) error {
	msg := &models.DisplayMessage{
		Type: "brightness",
		Content: map[string]interface{}{
			"brightness": brightness,
		},
	}

	if err := c.sendMessage(msg); err != nil {
		c.log.Error().Err(err).Msg("Erro ao ajustar brilho")
		return err
	}

	c.log.Debug().Int("brightness", brightness).Msg("Brilho ajustado")
	return nil
}
