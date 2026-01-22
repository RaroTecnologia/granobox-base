package certmanager

import (
	"bytes"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/rs/zerolog"

	"github.com/granobox/edge-pro/internal/config"
)

const (
	refreshMargin    = 15 * 24 * time.Hour
	forcedRefreshAge = 4 * time.Hour
	metadataFileName = "granobox-cert.json"
	certificateFile  = "granobox-cert.pem"
)

type metadata struct {
	SHA256    string `json:"sha256"`
	Version   string `json:"version"`
	ExpiresAt string `json:"expiresAt"`
	UpdatedAt string `json:"updatedAt"`
}

type certificatePayload struct {
	CertificatePem string `json:"certificatePem"`
	Sha256         string `json:"sha256"`
	Version        string `json:"version"`
	ExpiresAt      string `json:"expiresAt"`
}

type authResponse struct {
	AccessToken string `json:"access_token"`
}

type Manager struct {
	cfg      *config.SocketIOConfig
	log      zerolog.Logger
	certPath string
	metaPath string

	mu        sync.Mutex
	metadata  *metadata
	tlsConfig atomic.Value // stores *tls.Config

	stopCh chan struct{}
}

func NewManager(cfg *config.SocketIOConfig, log zerolog.Logger) (*Manager, error) {
	if cfg == nil {
		return nil, errors.New("nil socket configuration")
	}

	baseDir, err := resolveBaseDir()
	if err != nil {
		return nil, err
	}

	m := &Manager{
		cfg:      cfg,
		log:      log.With().Str("component", "cert-manager").Logger(),
		certPath: filepath.Join(baseDir, certificateFile),
		metaPath: filepath.Join(baseDir, metadataFileName),
	}
	m.tlsConfig.Store((*tls.Config)(nil))
	return m, nil
}

func resolveBaseDir() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = "."
	}
	base := filepath.Join(dir, "granobox", "edge-pro")
	if err := os.MkdirAll(base, 0o755); err != nil {
		return "", err
	}
	return base, nil
}

func (m *Manager) EnsureCertificate(force bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	pemData, meta, err := m.loadLocal()
	if err != nil {
		m.log.Warn().Err(err).Msg("Falha ao carregar certificado local")
	}

	if !force && len(pemData) > 0 && !m.shouldRefresh(meta) {
		m.metadata = meta
		if err := m.updateTLSConfig(pemData); err != nil {
			return err
		}
		return nil
	}

	payload, err := m.downloadCertificate()
	if err != nil {
		if len(pemData) == 0 {
			return fmt.Errorf("falha ao baixar certificado e nenhum certificado local disponível: %w", err)
		}
		m.log.Warn().Err(err).Msg("Usando certificado local devido a erro no download")
		if err := m.updateTLSConfig(pemData); err != nil {
			return err
		}
		m.metadata = meta
		return nil
	}

	pemBytes := []byte(payload.CertificatePem)
	if err := os.WriteFile(m.certPath, pemBytes, 0o600); err != nil {
		return fmt.Errorf("falha ao salvar certificado: %w", err)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	newMeta := &metadata{
		SHA256:    payload.Sha256,
		Version:   payload.Version,
		ExpiresAt: payload.ExpiresAt,
		UpdatedAt: now,
	}

	metaBytes, err := json.MarshalIndent(newMeta, "", "  ")
	if err == nil {
		if err := os.WriteFile(m.metaPath, metaBytes, 0o600); err != nil {
			m.log.Warn().Err(err).Msg("Falha ao salvar metadata do certificado")
		}
	}

	if err := m.updateTLSConfig(pemBytes); err != nil {
		return err
	}

	m.metadata = newMeta
	m.log.Info().Str("version", newMeta.Version).Msg("Certificado Edge atualizado")
	return nil
}

func (m *Manager) StartAutoRefresh() {
	if m.stopCh != nil {
		return
	}
	m.stopCh = make(chan struct{})

	go func() {
		ticker := time.NewTicker(forcedRefreshAge)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := m.EnsureCertificate(false); err != nil {
					m.log.Error().Err(err).Msg("Falha ao atualizar certificado Edge")
				}
			case <-m.stopCh:
				return
			}
		}
	}()
}

func (m *Manager) Stop() {
	if m.stopCh != nil {
		close(m.stopCh)
		m.stopCh = nil
	}
}

func (m *Manager) TLSConfig() *tls.Config {
	cfg, _ := m.tlsConfig.Load().(*tls.Config)
	return cfg
}

func (m *Manager) NewHTTPClient(timeout time.Duration) *http.Client {
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
	}
	if tlsCfg := m.TLSConfig(); tlsCfg != nil {
		transport.TLSClientConfig = tlsCfg
	}
	return &http.Client{
		Timeout:   timeout,
		Transport: transport,
	}
}

func (m *Manager) shouldRefresh(meta *metadata) bool {
	if meta == nil {
		return true
	}

	if meta.ExpiresAt != "" {
		if expiry, err := time.Parse(time.RFC3339, meta.ExpiresAt); err == nil {
			if time.Until(expiry) <= refreshMargin {
				return true
			}
		} else {
			return true
		}
	}

	if meta.UpdatedAt != "" {
		if updated, err := time.Parse(time.RFC3339, meta.UpdatedAt); err == nil {
			if time.Since(updated) >= forcedRefreshAge {
				return true
			}
		} else {
			return true
		}
	}

	return false
}

func (m *Manager) loadLocal() ([]byte, *metadata, error) {
	pemBytes, err := os.ReadFile(m.certPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil, nil
		}
		return nil, nil, err
	}

	var meta metadata
	metaBytes, err := os.ReadFile(m.metaPath)
	if err == nil {
		if err := json.Unmarshal(metaBytes, &meta); err != nil {
			m.log.Warn().Err(err).Msg("Metadata do certificado inválida")
			return pemBytes, nil, nil
		}
		return pemBytes, &meta, nil
	}

	if !errors.Is(err, os.ErrNotExist) {
		m.log.Warn().Err(err).Msg("Falha ao ler metadata do certificado")
	}
	return pemBytes, nil, nil
}

func (m *Manager) updateTLSConfig(pemBytes []byte) error {
	pool, err := x509.SystemCertPool()
	if err != nil {
		pool = x509.NewCertPool()
	}

	if ok := pool.AppendCertsFromPEM(pemBytes); !ok {
		return errors.New("falha ao adicionar certificado à pool")
	}

	cfg := &tls.Config{
		MinVersion: tls.VersionTLS12,
		RootCAs:    pool,
	}
	m.tlsConfig.Store(cfg)
	return nil
}

func (m *Manager) downloadCertificate() (*certificatePayload, error) {
	baseURL := strings.TrimSuffix(m.cfg.ServerURL, "/")
	if baseURL == "" {
		return nil, errors.New("server URL inválida")
	}

	client := &http.Client{Timeout: 15 * time.Second}

	authBody := map[string]string{
		"device_id": m.cfg.AgentFingerprint,
		"api_key":   m.cfg.APIKey,
	}
	bodyBytes, _ := json.Marshal(authBody)

	authURL := fmt.Sprintf("%s/auth/device", baseURL)
	resp, err := client.Post(authURL, "application/json", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("falha ao autenticar device: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("auth/device retornou status %d", resp.StatusCode)
	}

	var auth authResponse
	if err := json.NewDecoder(resp.Body).Decode(&auth); err != nil {
		return nil, fmt.Errorf("falha ao decodificar resposta de autenticação: %w", err)
	}
	if auth.AccessToken == "" {
		return nil, errors.New("token de acesso vazio")
	}

	certURL := fmt.Sprintf("%s/edge/certificates/latest", baseURL)
	req, err := http.NewRequest(http.MethodGet, certURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+auth.AccessToken)

	respCert, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falha ao buscar certificado: %w", err)
	}
	defer respCert.Body.Close()

	if respCert.StatusCode < 200 || respCert.StatusCode >= 300 {
		return nil, fmt.Errorf("certificados/latest retornou status %d", respCert.StatusCode)
	}

	var payload certificatePayload
	if err := json.NewDecoder(respCert.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("falha ao decodificar certificado: %w", err)
	}

	if strings.TrimSpace(payload.CertificatePem) == "" {
		return nil, errors.New("payload do certificado vazio")
	}

	if payload.Sha256 == "" {
		hash := sha256Hex([]byte(payload.CertificatePem))
		payload.Sha256 = hash
	}

	if payload.Version == "" {
		payload.Version = time.Now().UTC().Format(time.RFC3339)
	}

	return &payload, nil
}

func sha256Hex(data []byte) string {
	sum := sha256.Sum256(data)
	return fmt.Sprintf("%x", sum[:])
}
