package metrics

import (
	"net"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/granobox/edge-pro/internal/models"
	"github.com/granobox/edge-pro/pkg/logger"
)

// Collector coleta métricas do sistema
type Collector struct {
	log          zerolog.Logger
	startTime    time.Time
	lastCPUStats cpuStats
	lastCPUTime  time.Time
}

// cpuStats armazena estatísticas de CPU
type cpuStats struct {
	user   uint64
	nice   uint64
	system uint64
	idle   uint64
	iowait uint64
	irq    uint64
	softirq uint64
}

// NewCollector cria um novo coletor de métricas
func NewCollector() *Collector {
	return &Collector{
		log:       logger.New("metrics"),
		startTime: time.Now(),
	}
}

// GetSystemMetrics coleta métricas do sistema
func (c *Collector) GetSystemMetrics() models.SystemMetrics {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// CPU usage real lendo /proc/stat
	cpuUsage := c.GetCPUUsage()

	// Memory usage em percentual (RAM total do sistema)
	totalMemory := c.GetTotalMemory()
	usedMemory := float64(m.Alloc)
	memoryUsage := 0.0
	if totalMemory > 0 {
		memoryUsage = (usedMemory / float64(totalMemory)) * 100.0
	}

	// Disk usage - simplificado por enquanto
	diskUsage := 0.0

	uptime := int64(time.Since(c.startTime).Seconds())

	// Temperatura da CPU (Raspberry Pi)
	temperature := GetCPUTemperature()

	return models.SystemMetrics{
		CPUUsage:    cpuUsage,
		MemoryUsage: memoryUsage,
		DiskUsage:   diskUsage,
		Uptime:      uptime,
		Temperature: temperature,
	}
}

// GetCPUUsage calcula o uso de CPU real lendo /proc/stat
func (c *Collector) GetCPUUsage() float64 {
	currentStats, err := c.readCPUStats()
	if err != nil {
		c.log.Debug().Err(err).Msg("Erro ao ler CPU stats")
		return 0.0
	}

	now := time.Now()
	
	// Primeira leitura, não temos dados anteriores
	if c.lastCPUTime.IsZero() {
		c.lastCPUStats = currentStats
		c.lastCPUTime = now
		return 0.0
	}

	// Calcular diferenças
	userDiff := currentStats.user - c.lastCPUStats.user
	niceDiff := currentStats.nice - c.lastCPUStats.nice
	systemDiff := currentStats.system - c.lastCPUStats.system
	idleDiff := currentStats.idle - c.lastCPUStats.idle
	iowaitDiff := currentStats.iowait - c.lastCPUStats.iowait
	irqDiff := currentStats.irq - c.lastCPUStats.irq
	softirqDiff := currentStats.softirq - c.lastCPUStats.softirq

	// Total time = todas as categorias
	totalDiff := userDiff + niceDiff + systemDiff + idleDiff + iowaitDiff + irqDiff + softirqDiff
	
	// Active time = tudo menos idle
	activeDiff := userDiff + niceDiff + systemDiff + iowaitDiff + irqDiff + softirqDiff

	// Calcular percentual
	cpuUsage := 0.0
	if totalDiff > 0 {
		cpuUsage = (float64(activeDiff) / float64(totalDiff)) * 100.0
	}

	// Atualizar para próxima leitura
	c.lastCPUStats = currentStats
	c.lastCPUTime = now

	return cpuUsage
}

// readCPUStats lê estatísticas de CPU de /proc/stat
func (c *Collector) readCPUStats() (cpuStats, error) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return cpuStats{}, err
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "cpu ") {
			fields := strings.Fields(line)
			if len(fields) < 8 {
				continue
			}

			stats := cpuStats{}
			stats.user, _ = strconv.ParseUint(fields[1], 10, 64)
			stats.nice, _ = strconv.ParseUint(fields[2], 10, 64)
			stats.system, _ = strconv.ParseUint(fields[3], 10, 64)
			stats.idle, _ = strconv.ParseUint(fields[4], 10, 64)
			stats.iowait, _ = strconv.ParseUint(fields[5], 10, 64)
			stats.irq, _ = strconv.ParseUint(fields[6], 10, 64)
			stats.softirq, _ = strconv.ParseUint(fields[7], 10, 64)

			return stats, nil
		}
	}

	return cpuStats{}, os.ErrNotExist
}

// GetTotalMemory retorna a memória total do sistema em bytes
func (c *Collector) GetTotalMemory() uint64 {
	data, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return 0
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "MemTotal:") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				totalKB, _ := strconv.ParseUint(fields[1], 10, 64)
				return totalKB * 1024 // Converter de KB para bytes
			}
		}
	}

	return 0
}

// GetLocalIP retorna o endereço IP local (primeiro disponível - LAN ou WiFi)
func GetLocalIP() string {
	// Priorizar LAN (eth0) sobre WiFi (wlan0)
	if lanIP := GetLANIP(); lanIP != "" {
		return lanIP
	}
	if wifiIP := GetWiFiIP(); wifiIP != "" {
		return wifiIP
	}
	
	// Fallback: qualquer IP não-loopback
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "unknown"
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}

	return "unknown"
}

// GetLANIP retorna o IP da interface Ethernet (eth0)
func GetLANIP() string {
	return getInterfaceIP("eth0")
}

// GetWiFiIP retorna o IP da interface WiFi (wlan0)
func GetWiFiIP() string {
	return getInterfaceIP("wlan0")
}

// getInterfaceIP obtém o IP de uma interface específica
func getInterfaceIP(ifaceName string) string {
	iface, err := net.InterfaceByName(ifaceName)
	if err != nil {
		return ""
	}
	
	addrs, err := iface.Addrs()
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

// GetMacAddress retorna o endereço MAC
func GetMacAddress() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "unknown"
	}

	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagLoopback == 0 {
			mac := iface.HardwareAddr.String()
			if mac != "" {
				return mac
			}
		}
	}

	return "unknown"
}

// GetCPUTemperature retorna a temperatura da CPU (Raspberry Pi)
func GetCPUTemperature() float64 {
	// Tentar ler do arquivo de temperatura do Raspberry Pi
	data, err := os.ReadFile("/sys/class/thermal/thermal_zone0/temp")
	if err != nil {
		return 0.0
	}

	// Converter para float (valor vem em miligraus)
	tempStr := strings.TrimSpace(string(data))
	tempMilli, err := strconv.ParseFloat(tempStr, 64)
	if err != nil {
		return 0.0
	}

	// Converter de miligraus para graus Celsius
	return tempMilli / 1000.0
}
