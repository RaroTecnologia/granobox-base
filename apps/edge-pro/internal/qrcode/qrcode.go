package qrcode

import (
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog"
	"github.com/skip2/go-qrcode"
)

// Generator gerencia a geração de QR codes
type Generator struct {
	log zerolog.Logger
}

// New cria um novo Generator
func New(log zerolog.Logger) *Generator {
	return &Generator{
		log: log,
	}
}

// GenerateProvisioning gera um QR code com dados de provisionamento
func (g *Generator) GenerateProvisioning(data map[string]string) ([]byte, error) {
	// Serializar dados para JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar dados: %w", err)
	}

	// Gerar QR code
	qr, err := qrcode.New(string(jsonData), qrcode.Medium)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar QR code: %w", err)
	}

	// Converter para PNG
	pngBytes, err := qr.PNG(256)
	if err != nil {
		return nil, fmt.Errorf("erro ao converter para PNG: %w", err)
	}

	g.log.Info().
		Int("size", len(pngBytes)).
		Msg("QR code gerado")

	return pngBytes, nil
}

// GenerateURL gera um QR code simples com URL
func (g *Generator) GenerateURL(url string) ([]byte, error) {
	qr, err := qrcode.New(url, qrcode.Medium)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar QR code: %w", err)
	}

	pngBytes, err := qr.PNG(256)
	if err != nil {
		return nil, fmt.Errorf("erro ao converter para PNG: %w", err)
	}

	return pngBytes, nil
}

// SaveToFile salva o QR code em um arquivo
func (g *Generator) SaveToFile(data map[string]string, filename string) error {
	qrBytes, err := g.GenerateProvisioning(data)
	if err != nil {
		return err
	}

	if err := qrcode.WriteFile(string(qrBytes), qrcode.Medium, 256, filename); err != nil {
		return fmt.Errorf("erro ao salvar arquivo: %w", err)
	}

	g.log.Info().Str("file", filename).Msg("QR code salvo")
	return nil
}

// GetASCIIArt retorna o QR code como arte ASCII (para terminal)
func (g *Generator) GetASCIIArt(data map[string]string) (string, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	qr, err := qrcode.New(string(jsonData), qrcode.Medium)
	if err != nil {
		return "", err
	}

	return qr.ToSmallString(false), nil
}


