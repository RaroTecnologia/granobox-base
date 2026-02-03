package printer

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/granobox/edge-pro/internal/models"
	"github.com/rs/zerolog"
)

// PrinterStatus representa o status detalhado da impressora ZPL
type PrinterStatus struct {
	OK              bool   `json:"ok"`
	PaperOut        bool   `json:"paperOut"`        // Sem papel/etiqueta
	RibbonOut       bool   `json:"ribbonOut"`       // Sem ribbon
	HeadOpen        bool   `json:"headOpen"`        // Tampa/cabeça aberta
	Paused          bool   `json:"paused"`          // Impressora pausada
	BufferFull      bool   `json:"bufferFull"`      // Buffer cheio
	DiagnosticMode  bool   `json:"diagnosticMode"`  // Modo diagnóstico
	PartialFormat   bool   `json:"partialFormat"`   // Formato parcial em buffer
	Corrupt         bool   `json:"corrupt"`         // RAM corrompida
	HeadTempError   bool   `json:"headTempError"`   // Erro temperatura cabeça
	ErrorCode       string `json:"errorCode"`       // Código de erro
	ErrorMessage    string `json:"errorMessage"`    // Mensagem de erro legível
	RawResponse     string `json:"rawResponse"`     // Resposta bruta para debug
}

// Manager gerencia impressoras USB e Network
type Manager struct {
	log      zerolog.Logger
	printers map[string]models.PrinterInfo
}

// NewManager cria um novo gerenciador de impressoras
func NewManager(log zerolog.Logger) *Manager {
	return &Manager{
		log:      log.With().Str("component", "printer-manager").Logger(),
		printers: make(map[string]models.PrinterInfo),
	}
}

// USBPrinterInfo informações de uma impressora USB detectada
type USBPrinterInfo struct {
	DevicePath string
	Vendor     string
	Model      string
	Serial     string
}

// DetectUSBPrinters detecta impressoras USB conectadas em /dev/usb/lp*
func (m *Manager) DetectUSBPrinters() ([]string, error) {
	var devices []string

	// Verificar se /dev/usb existe
	if _, err := os.Stat("/dev/usb"); os.IsNotExist(err) {
		m.log.Debug().Msg("Diretório /dev/usb não existe")
		return devices, nil
	}

	// Listar arquivos em /dev/usb
	entries, err := os.ReadDir("/dev/usb")
	if err != nil {
		return nil, fmt.Errorf("erro ao ler /dev/usb: %w", err)
	}

	// Filtrar apenas dispositivos lp*
	for _, entry := range entries {
		name := entry.Name()
		if strings.HasPrefix(name, "lp") {
			devicePath := filepath.Join("/dev/usb", name)
			devices = append(devices, devicePath)
			m.log.Info().
				Str("device", devicePath).
				Msg("🖨️ Impressora USB detectada")
		}
	}

	return devices, nil
}

// DetectUSBPrintersWithInfo detecta impressoras USB e retorna informações detalhadas
func (m *Manager) DetectUSBPrintersWithInfo() ([]USBPrinterInfo, error) {
	var printers []USBPrinterInfo

	// Verificar se /dev/usb existe
	if _, err := os.Stat("/dev/usb"); os.IsNotExist(err) {
		m.log.Debug().Msg("Diretório /dev/usb não existe")
		return printers, nil
	}

	// Listar arquivos em /dev/usb
	entries, err := os.ReadDir("/dev/usb")
	if err != nil {
		return nil, fmt.Errorf("erro ao ler /dev/usb: %w", err)
	}

	// Filtrar apenas dispositivos lp*
	for _, entry := range entries {
		name := entry.Name()
		if strings.HasPrefix(name, "lp") {
			devicePath := filepath.Join("/dev/usb", name)

			// ⭐ VERIFICAR SE O DISPOSITIVO ESTÁ REALMENTE ACESSÍVEL
			// Tentar abrir o dispositivo para verificar se está realmente conectado
			// (o arquivo pode existir mesmo após desconexão - cache do kernel)
			if !m.isDeviceAccessible(devicePath) {
				m.log.Debug().
					Str("device", devicePath).
					Msg("⚠️  Dispositivo encontrado mas não acessível (provavelmente desconectado)")
				continue // Pular este dispositivo
			}

			// Obter informações do dispositivo
			info := m.getUSBDeviceInfo(devicePath)
			printers = append(printers, info)

			m.log.Info().
				Str("device", devicePath).
				Str("vendor", info.Vendor).
				Str("model", info.Model).
				Msg("🖨️ Impressora USB detectada com informações")
		}
	}

	return printers, nil
}

// isDeviceAccessible verifica se um dispositivo USB está realmente acessível
// (não apenas se o arquivo existe, mas se pode ser aberto para escrita)
func (m *Manager) isDeviceAccessible(devicePath string) bool {
	// Tentar abrir o dispositivo em modo write-only para verificar se está acessível
	// Para impressoras, precisamos de escrita, então testamos O_WRONLY
	file, err := os.OpenFile(devicePath, os.O_WRONLY, 0)
	if err != nil {
		// Se não conseguir abrir, o dispositivo não está acessível
		m.log.Debug().
			Str("device", devicePath).
			Err(err).
			Msg("⚠️  Dispositivo não acessível (erro ao abrir)")
		return false
	}
	file.Close()
	return true
}

// getUSBDeviceInfo obtém informações detalhadas de um dispositivo USB
func (m *Manager) getUSBDeviceInfo(devicePath string) USBPrinterInfo {
	info := USBPrinterInfo{
		DevicePath: devicePath,
		Vendor:     "Unknown",
		Model:      "USB Printer",
		Serial:     "",
	}

	// Tentar usar udevadm para obter informações
	cmd := exec.Command("udevadm", "info", "--query=all", "--name="+devicePath)
	output, err := cmd.Output()
	if err != nil {
		m.log.Debug().Err(err).Msg("Erro ao executar udevadm, tentando lsusb")
		return m.getUSBInfoFromLsusb(devicePath, info)
	}

	outputStr := string(output)

	// Parsear vendor
	if match := regexp.MustCompile(`ID_VENDOR=([^\n]+)`).FindStringSubmatch(outputStr); len(match) > 1 {
		info.Vendor = strings.TrimSpace(match[1])
	} else if match := regexp.MustCompile(`ID_VENDOR_ID=([^\n]+)`).FindStringSubmatch(outputStr); len(match) > 1 {
		info.Vendor = strings.TrimSpace(match[1])
	}

	// Parsear model
	if match := regexp.MustCompile(`ID_MODEL=([^\n]+)`).FindStringSubmatch(outputStr); len(match) > 1 {
		info.Model = strings.TrimSpace(match[1])
	} else if match := regexp.MustCompile(`ID_MODEL_ID=([^\n]+)`).FindStringSubmatch(outputStr); len(match) > 1 {
		info.Model = strings.TrimSpace(match[1])
	}

	// Parsear serial
	if match := regexp.MustCompile(`ID_SERIAL_SHORT=([^\n]+)`).FindStringSubmatch(outputStr); len(match) > 1 {
		info.Serial = strings.TrimSpace(match[1])
	}

	// Limpar underscores e substituir por espaços
	info.Vendor = strings.ReplaceAll(info.Vendor, "_", " ")
	info.Model = strings.ReplaceAll(info.Model, "_", " ")

	return info
}

// getUSBInfoFromLsusb tenta obter informações usando lsusb como fallback
func (m *Manager) getUSBInfoFromLsusb(devicePath string, fallback USBPrinterInfo) USBPrinterInfo {
	cmd := exec.Command("lsusb", "-v")
	output, err := cmd.Output()
	if err != nil {
		m.log.Debug().Err(err).Msg("Erro ao executar lsusb")
		return fallback
	}

	outputStr := string(output)

	// Procurar por printer class (classe 7)
	printerRegex := regexp.MustCompile(`(?s)Bus.*?idVendor.*?0x([0-9a-fA-F]+).*?idProduct.*?0x([0-9a-fA-F]+).*?bInterfaceClass.*?7.*?iManufacturer.*?\d+\s+([^\n]+).*?iProduct.*?\d+\s+([^\n]+)`)
	matches := printerRegex.FindAllStringSubmatch(outputStr, -1)

	if len(matches) > 0 {
		match := matches[0]
		if len(match) >= 5 {
			fallback.Vendor = strings.TrimSpace(match[3])
			fallback.Model = strings.TrimSpace(match[4])
		}
	}

	return fallback
}

// CreateAutoUSBPrinters cria registros automáticos para impressoras USB detectadas
func (m *Manager) CreateAutoUSBPrinters() []models.PrinterInfo {
	printers := []models.PrinterInfo{}

	usbPrinters, err := m.DetectUSBPrintersWithInfo()
	if err != nil {
		m.log.Error().Err(err).Msg("Erro ao detectar impressoras USB")
		return printers
	}

	for _, usbInfo := range usbPrinters {
		// Extrair número do device (lp0 -> 0)
		deviceNum := strings.TrimPrefix(filepath.Base(usbInfo.DevicePath), "lp")

		// Criar ID único
		id := fmt.Sprintf("auto-usb-lp%s", deviceNum)

		// Nome descritivo
		name := fmt.Sprintf("%s %s", usbInfo.Vendor, usbInfo.Model)
		if name == "Unknown USB Printer" || strings.TrimSpace(name) == "" {
			name = fmt.Sprintf("USB Printer (lp%s)", deviceNum)
		}

		// Determinar tipo baseado no vendor
		printerType := "thermal"
		vendorLower := strings.ToLower(usbInfo.Vendor)
		if strings.Contains(vendorLower, "zebra") {
			printerType = "zebra"
		} else if strings.Contains(vendorLower, "tsc") {
			printerType = "tsc"
		} else if strings.Contains(vendorLower, "epson") {
			printerType = "epson"
		}

		printer := models.PrinterInfo{
			ID:         &id,
			Name:       name,
			Connection: "usb",
			DevicePath: &usbInfo.DevicePath,
			Status:     "online",
			Type:       printerType,
			Model:      usbInfo.Model,
		}

		printers = append(printers, printer)

		m.log.Info().
			Str("id", id).
			Str("name", name).
			Str("device", usbInfo.DevicePath).
			Str("type", printerType).
			Msg("✨ Impressora USB auto-registrada")
	}

	return printers
}

// SendToUSB envia dados para impressora USB via device path
func (m *Manager) SendToUSB(devicePath string, data []byte) error {
	m.log.Info().
		Str("device", devicePath).
		Int("bytes", len(data)).
		Msg("📤 Enviando para impressora USB")

	// 1. Verificar se device existe
	if _, err := os.Stat(devicePath); os.IsNotExist(err) {
		return fmt.Errorf("device %s não existe (impressora desconectada)", devicePath)
	}

	// 2. Abrir device para escrita
	file, err := os.OpenFile(devicePath, os.O_WRONLY, 0)
	if err != nil {
		return fmt.Errorf("não foi possível abrir %s: %w", devicePath, err)
	}
	defer file.Close()

	// 3. Enviar dados em chunks de 1KB
	chunkSize := 1024
	totalChunks := (len(data) + chunkSize - 1) / chunkSize

	m.log.Debug().
		Int("total_chunks", totalChunks).
		Msg("📝 Enviando em chunks")

	startTime := time.Now()

	for i := 0; i < len(data); i += chunkSize {
		end := i + chunkSize
		if end > len(data) {
			end = len(data)
		}

		chunk := data[i:end]
		n, err := file.Write(chunk)
		if err != nil {
			return fmt.Errorf("falha ao escrever chunk %d/%d: %w", (i/chunkSize)+1, totalChunks, err)
		}

		if n != len(chunk) {
			return fmt.Errorf("escrita incompleta no chunk %d/%d: escrito %d de %d bytes",
				(i/chunkSize)+1, totalChunks, n, len(chunk))
		}

		// Pequeno delay entre chunks
		if end < len(data) {
			time.Sleep(10 * time.Millisecond)
		}
	}

	writeTime := time.Since(startTime)
	m.log.Debug().Dur("write_time", writeTime).Msg("✍️ Escrita concluída")

	// 4. Flush removido - não é necessário para impressoras USB e causa erros
	// O kernel já faz flush automaticamente ao fechar o arquivo

	// 5. Aguardar tempo estimado de impressão (ajuste fino)
	// Considerar throughput médio de ~2KB/s para não atrasar confirmação
	estimatedPrintMs := (len(data) * 1000) / 2000 // 2KB/s
	minWaitMs := 250                              // mínimo 0,25s
	maxWaitMs := 1200                             // máximo 1,2s

	waitTime := time.Duration(estimatedPrintMs) * time.Millisecond
	if waitTime < time.Duration(minWaitMs)*time.Millisecond {
		waitTime = time.Duration(minWaitMs) * time.Millisecond
	}
	if waitTime > time.Duration(maxWaitMs)*time.Millisecond {
		waitTime = time.Duration(maxWaitMs) * time.Millisecond
	}

	m.log.Debug().
		Dur("wait_time", waitTime).
		Int("bytes", len(data)).
		Msg("⏱️ Aguardando impressão")

	time.Sleep(waitTime)

	// 6. Verificar se device ainda existe
	if _, err := os.Stat(devicePath); os.IsNotExist(err) {
		return fmt.Errorf("device %s desapareceu durante impressão", devicePath)
	}

	// 7. Aguardar mais um pouco para garantir finalização
	time.Sleep(100 * time.Millisecond)

	totalTime := time.Since(startTime)
	m.log.Info().
		Dur("total_time", totalTime).
		Msg("✅ Impressão USB finalizada")

	return nil
}

// SendToUSBWithStatus envia dados e retorna status detalhado da impressora
func (m *Manager) SendToUSBWithStatus(devicePath string, data []byte) (*PrinterStatus, error) {
	// Primeiro, enviar o ZPL
	err := m.SendToUSB(devicePath, data)
	if err != nil {
		return &PrinterStatus{
			OK:           false,
			ErrorMessage: err.Error(),
		}, err
	}

	// Depois, consultar status da impressora
	status := m.GetPrinterStatus(devicePath)
	
	if !status.OK {
		return status, fmt.Errorf("erro na impressora: %s", status.ErrorMessage)
	}

	return status, nil
}

// GetPrinterStatus consulta o status da impressora ZPL usando comando ~HS
func (m *Manager) GetPrinterStatus(devicePath string) *PrinterStatus {
	status := &PrinterStatus{OK: true}

	// Verificar se device existe
	if _, err := os.Stat(devicePath); os.IsNotExist(err) {
		status.OK = false
		status.ErrorMessage = "Impressora desconectada"
		return status
	}

	// Abrir device para leitura e escrita
	file, err := os.OpenFile(devicePath, os.O_RDWR, 0)
	if err != nil {
		m.log.Debug().Err(err).Msg("⚠️ Não foi possível abrir device para consulta de status")
		// Não é erro crítico - retornar OK assumindo que funcionou
		return status
	}
	defer file.Close()

	// Enviar comando Host Status Query (~HS)
	_, err = file.Write([]byte("~HS\r\n"))
	if err != nil {
		m.log.Debug().Err(err).Msg("⚠️ Erro ao enviar comando ~HS")
		return status
	}

	// Aguardar resposta
	time.Sleep(200 * time.Millisecond)

	// Ler resposta (com timeout)
	file.SetReadDeadline(time.Now().Add(500 * time.Millisecond))
	reader := bufio.NewReader(file)
	
	var response strings.Builder
	for i := 0; i < 3; i++ { // Ler até 3 linhas
		line, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		response.WriteString(line)
	}

	rawResponse := response.String()
	status.RawResponse = rawResponse

	if rawResponse == "" {
		m.log.Debug().Msg("📋 Sem resposta do ~HS (impressora pode não suportar)")
		return status
	}

	m.log.Debug().Str("response", rawResponse).Msg("📋 Resposta ~HS recebida")

	// Parsear resposta ZPL Host Status
	// Formato típico: <STX><STX>aaa,b,c,d,e,f,g,h,i,j,k,l,<ETX><CR><LF>
	status = m.parseHostStatus(rawResponse)

	return status
}

// parseHostStatus parseia a resposta do comando ~HS
func (m *Manager) parseHostStatus(response string) *PrinterStatus {
	status := &PrinterStatus{
		OK:          true,
		RawResponse: response,
	}

	// Limpar caracteres de controle
	response = strings.ReplaceAll(response, "\x02", "") // STX
	response = strings.ReplaceAll(response, "\x03", "") // ETX
	response = strings.TrimSpace(response)

	// Dividir por vírgulas
	parts := strings.Split(response, ",")
	if len(parts) < 11 {
		m.log.Debug().Int("parts", len(parts)).Msg("⚠️ Resposta ~HS com formato inesperado")
		return status
	}

	// Parsear flags do primeiro grupo (posições 0-7 são flags de status)
	// Posição 1: Paper Out flag
	// Posição 2: Pause flag
	// Posição 3: Buffer Full flag
	// etc.

	// Verificar flags principais
	if len(parts) > 1 && parts[1] == "1" {
		status.PaperOut = true
		status.OK = false
		status.ErrorCode = "PAPER_OUT"
		status.ErrorMessage = "Sem papel/etiqueta"
	}

	if len(parts) > 2 && parts[2] == "1" {
		status.Paused = true
		status.OK = false
		status.ErrorCode = "PAUSED"
		status.ErrorMessage = "Impressora pausada"
	}

	// Segundo grupo de resposta geralmente indica erros de hardware
	// Buscar por indicadores comuns
	responseUpper := strings.ToUpper(response)

	if strings.Contains(responseUpper, "HEAD OPEN") || strings.Contains(responseUpper, "HEADOPEN") {
		status.HeadOpen = true
		status.OK = false
		status.ErrorCode = "HEAD_OPEN"
		status.ErrorMessage = "Tampa/cabeça aberta"
	}

	if strings.Contains(responseUpper, "RIBBON OUT") || strings.Contains(responseUpper, "RIBBONOUT") {
		status.RibbonOut = true
		status.OK = false
		status.ErrorCode = "RIBBON_OUT"
		status.ErrorMessage = "Sem ribbon"
	}

	if strings.Contains(responseUpper, "PAPER OUT") || strings.Contains(responseUpper, "PAPEROUT") ||
		strings.Contains(responseUpper, "MEDIA OUT") {
		status.PaperOut = true
		status.OK = false
		status.ErrorCode = "PAPER_OUT"
		status.ErrorMessage = "Sem papel/etiqueta"
	}

	if strings.Contains(responseUpper, "HEAD TEMP") || strings.Contains(responseUpper, "OVERHEAT") {
		status.HeadTempError = true
		status.OK = false
		status.ErrorCode = "HEAD_TEMP"
		status.ErrorMessage = "Erro de temperatura da cabeça de impressão"
	}

	// Se múltiplos erros, combinar mensagens
	if status.ErrorMessage == "" && !status.OK {
		status.ErrorMessage = "Erro desconhecido na impressora"
	}

	return status
}

// SendToNetwork envia dados para impressora de rede via TCP (porta 9100)
// NOTA: Impressoras TCP são gerenciadas pelo app Flutter (Granobox)
// Esta função está aqui apenas para compatibilidade, mas NÃO é usada no fluxo principal
func (m *Manager) SendToNetwork(hostOrIP string, port int, data []byte) error {
	m.log.Warn().
		Str("host", hostOrIP).
		Msg("⚠️ SendToNetwork chamado - Impressoras TCP devem ser gerenciadas pelo Flutter")

	return fmt.Errorf("impressoras TCP não são suportadas no edge-go (use Flutter/Granobox)")
}

// resolveHost resolve hostname (suporta .local mDNS) para endereço TCP
func (m *Manager) resolveHost(hostOrIP string, port int) (string, error) {
	// Se já é IP:porta, retorna direto
	if _, _, err := net.SplitHostPort(hostOrIP); err == nil {
		return hostOrIP, nil
	}

	// Tentar resolver via DNS/mDNS
	ips, err := net.LookupIP(hostOrIP)
	if err != nil {
		// Se falhou, tentar como endereço direto (hostname:porta ou ip:porta)
		addr := net.JoinHostPort(hostOrIP, fmt.Sprintf("%d", port))
		// Testar se consegue conectar
		conn, err := net.DialTimeout("tcp", addr, 2*time.Second)
		if err != nil {
			return "", fmt.Errorf("falha ao resolver ou conectar em %s: %w", hostOrIP, err)
		}
		conn.Close()
		return addr, nil
	}

	// Retornar primeiro IP encontrado com a porta
	if len(ips) > 0 {
		return net.JoinHostPort(ips[0].String(), fmt.Sprintf("%d", port)), nil
	}

	return "", fmt.Errorf("nenhum IP encontrado para %s", hostOrIP)
}

// TestNetworkPrinter testa conectividade com impressora de rede
func (m *Manager) TestNetworkPrinter(hostOrIP string, port int) error {
	resolvedAddr, err := m.resolveHost(hostOrIP, port)
	if err != nil {
		return err
	}

	conn, err := net.DialTimeout("tcp", resolvedAddr, 5*time.Second)
	if err != nil {
		return fmt.Errorf("falha ao conectar em %s: %w", resolvedAddr, err)
	}
	conn.Close()

	m.log.Info().
		Str("host", hostOrIP).
		Str("resolved", resolvedAddr).
		Msg("✅ Impressora de rede acessível")

	return nil
}

// SendToPrinter envia dados para uma impressora baseado no tipo de conexão
func (m *Manager) SendToPrinter(printer *models.PrinterInfo, data []byte) error {
	connection := strings.ToLower(printer.Connection)

	switch connection {
	case "usb":
		if printer.DevicePath == nil || *printer.DevicePath == "" {
			return fmt.Errorf("impressora USB sem devicePath configurado")
		}
		return m.SendToUSB(*printer.DevicePath, data)

	case "network", "tcp":
		// Impressoras TCP são gerenciadas pelo Flutter
		return fmt.Errorf("impressoras TCP não são suportadas (use Flutter/Granobox)")

	default:
		return fmt.Errorf("tipo de conexão desconhecido: %s (apenas 'usb' suportado)", connection)
	}
}

// LoadPrinters carrega impressoras da configuração
func (m *Manager) LoadPrinters(printers []models.PrinterInfo) {
	m.printers = make(map[string]models.PrinterInfo)

	for _, printer := range printers {
		key := printer.Name
		if printer.ID != nil {
			key = *printer.ID
		}
		m.printers[key] = printer
	}

	m.log.Info().Int("count", len(m.printers)).Msg("📋 Impressoras carregadas")
}

// GetPrinter obtém uma impressora pelo ID ou nome
func (m *Manager) GetPrinter(idOrName string) (*models.PrinterInfo, error) {
	if printer, ok := m.printers[idOrName]; ok {
		return &printer, nil
	}

	// Buscar por nome se não encontrou por ID
	for _, printer := range m.printers {
		if printer.Name == idOrName {
			return &printer, nil
		}
	}

	return nil, fmt.Errorf("impressora não encontrada: %s", idOrName)
}

// GetFirstAvailable retorna a primeira impressora disponível
// Prioridade: USB > Network
func (m *Manager) GetFirstAvailable() (*models.PrinterInfo, error) {
	if len(m.printers) == 0 {
		return nil, fmt.Errorf("nenhuma impressora configurada")
	}

	// 1. Preferir USB com devicePath
	for _, printer := range m.printers {
		if strings.ToLower(printer.Connection) == "usb" &&
			printer.DevicePath != nil && *printer.DevicePath != "" {
			return &printer, nil
		}
	}

	// 2. Qualquer outra impressora
	for _, printer := range m.printers {
		return &printer, nil
	}

	return nil, fmt.Errorf("nenhuma impressora disponível")
}

// ListPrinters lista todas as impressoras configuradas
func (m *Manager) ListPrinters() []models.PrinterInfo {
	printers := make([]models.PrinterInfo, 0, len(m.printers))
	for _, printer := range m.printers {
		printers = append(printers, printer)
	}
	return printers
}
