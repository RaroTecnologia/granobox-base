package socketio

import (
	"fmt"
	"net/http"

	socketio "github.com/googollee/go-socket.io"
	"github.com/rs/zerolog"
	"github.com/granobox/edge-pro/internal/config"
	"github.com/granobox/edge-pro/pkg/logger"
)

// Server servidor Socket.IO local
type Server struct {
	cfg    *config.SocketIOConfig
	server *socketio.Server
	log    zerolog.Logger
}

// NewServer cria um novo servidor Socket.IO
func NewServer(cfg *config.SocketIOConfig) (*Server, error) {
	server := socketio.NewServer(nil)

	s := &Server{
		cfg:    cfg,
		server: server,
		log:    logger.New("socketio-server"),
	}

	s.setupHandlers()

	return s, nil
}

// setupHandlers configura os event handlers
func (s *Server) setupHandlers() {
	// Namespace padrão "/"
	s.server.OnConnect("/", func(conn socketio.Conn) error {
		s.log.Info().Str("id", conn.ID()).Msg("🔗 Cliente conectado")
		conn.Emit("welcome", "Conectado ao Granobox Edge-Pro")
		return nil
	})

	s.server.OnEvent("/", "ping", func(conn socketio.Conn, msg string) {
		s.log.Debug().Str("id", conn.ID()).Str("msg", msg).Msg("📡 Ping recebido")
		conn.Emit("pong", msg)
	})

	s.server.OnDisconnect("/", func(conn socketio.Conn, reason string) {
		s.log.Info().Str("id", conn.ID()).Str("reason", reason).Msg("🔌 Cliente desconectado")
	})

	s.server.OnError("/", func(conn socketio.Conn, err error) {
		s.log.Error().Err(err).Str("id", conn.ID()).Msg("❌ Erro no Socket.IO")
	})

	// Namespace "/agents"
	s.server.OnConnect("/agents", func(conn socketio.Conn) error {
		s.log.Info().Str("id", conn.ID()).Msg("🤖 Agent conectado")
		conn.Emit("welcome", "Conectado como Agent")
		return nil
	})

	s.server.OnEvent("/agents", "agent-register", func(conn socketio.Conn, data map[string]interface{}) {
		s.log.Info().Str("id", conn.ID()).Interface("data", data).Msg("📝 Agent registrando")
		conn.Emit("registered", "Agent registrado com sucesso")
	})

	s.server.OnEvent("/agents", "ping", func(conn socketio.Conn, msg string) {
		s.log.Debug().Str("id", conn.ID()).Str("msg", msg).Msg("📡 Ping do agent")
		conn.Emit("pong", msg)
	})

	s.server.OnDisconnect("/agents", func(conn socketio.Conn, reason string) {
		s.log.Info().Str("id", conn.ID()).Str("reason", reason).Msg("🔌 Agent desconectado")
	})
}

// Start inicia o servidor Socket.IO
func (s *Server) Start() error {
	go func() {
		if err := s.server.Serve(); err != nil {
			s.log.Fatal().Err(err).Msg("Erro ao iniciar servidor Socket.IO")
		}
	}()

	http.Handle("/socket.io/", s.server)

	addr := fmt.Sprintf(":%d", s.cfg.LocalPort)
	s.log.Info().Str("addr", addr).Msg("🚀 Servidor Socket.IO local iniciado")

	return http.ListenAndServe(addr, nil)
}

// Stop para o servidor Socket.IO
func (s *Server) Stop() error {
	if s.server != nil {
		s.server.Close()
		s.log.Info().Msg("Servidor Socket.IO local parado")
	}
	return nil
}



