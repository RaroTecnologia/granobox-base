package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Init inicializa o logger global
func Init(debug bool) {
	// Pretty logging no desenvolvimento
	if debug {
		log.Logger = log.Output(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		})
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	// Adiciona caller info
	log.Logger = log.With().Caller().Logger()
}

// New cria um novo logger com contexto
func New(component string) zerolog.Logger {
	return log.With().Str("component", component).Logger()
}



