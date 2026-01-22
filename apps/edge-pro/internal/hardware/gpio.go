package hardware

import (
	"fmt"

	"github.com/rs/zerolog"
	"github.com/granobox/edge-pro/pkg/logger"
	"periph.io/x/conn/v3/gpio"
	"periph.io/x/conn/v3/gpio/gpioreg"
	"periph.io/x/host/v3"
)

// Manager gerenciador de hardware GPIO
type Manager struct {
	log  zerolog.Logger
	pins map[string]gpio.PinIO
}

// New cria um novo gerenciador de hardware
func New() (*Manager, error) {
	// Inicializar periph.io
	if _, err := host.Init(); err != nil {
		return nil, fmt.Errorf("erro ao inicializar periph.io: %w", err)
	}

	return &Manager{
		log:  logger.New("hardware"),
		pins: make(map[string]gpio.PinIO),
	}, nil
}

// GetPin retorna um pino GPIO
func (m *Manager) GetPin(name string) (gpio.PinIO, error) {
	// Verificar se já está em cache
	if pin, ok := m.pins[name]; ok {
		return pin, nil
	}

	// Buscar o pino
	pin := gpioreg.ByName(name)
	if pin == nil {
		return nil, fmt.Errorf("pino %s não encontrado", name)
	}

	m.pins[name] = pin
	m.log.Debug().Str("pin", name).Msg("Pino GPIO obtido")
	return pin, nil
}

// SetOutput configura um pino como saída
func (m *Manager) SetOutput(name string, high bool) error {
	pin, err := m.GetPin(name)
	if err != nil {
		return err
	}

	level := gpio.Low
	if high {
		level = gpio.High
	}

	if err := pin.Out(level); err != nil {
		return fmt.Errorf("erro ao configurar pino %s: %w", name, err)
	}

	m.log.Debug().Str("pin", name).Bool("high", high).Msg("Pino configurado como saída")
	return nil
}

// ReadInput lê o valor de um pino de entrada
func (m *Manager) ReadInput(name string) (bool, error) {
	pin, err := m.GetPin(name)
	if err != nil {
		return false, err
	}

	if err := pin.In(gpio.PullDown, gpio.NoEdge); err != nil {
		return false, fmt.Errorf("erro ao configurar pino %s como entrada: %w", name, err)
	}

	return pin.Read() == gpio.High, nil
}

// Close fecha o gerenciador de hardware
func (m *Manager) Close() {
	m.log.Info().Msg("Hardware manager fechado")
}



