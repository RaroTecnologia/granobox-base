package printer

import (
	"fmt"
	"sync"
	"time"

	"github.com/rs/zerolog"
	"github.com/granobox/edge-pro/internal/models"
)

// JobStatus representa o status de um job na fila
type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
	JobStatusRetrying   JobStatus = "retrying"
)

// QueuedJob representa um job de impressão na fila
type QueuedJob struct {
	Job         models.PrintJob
	Status      JobStatus
	Attempts    int
	MaxAttempts int
	LastError   string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CompletedAt *time.Time
}

// Queue gerencia fila de jobs de impressão com retry
type Queue struct {
	log         zerolog.Logger
	manager     *Manager
	jobs        map[string]*QueuedJob
	mu          sync.RWMutex
	maxAttempts int
	retryDelay  time.Duration
	workers     int
	jobChan     chan *QueuedJob
	stopCh      chan struct{}
	resultChan  chan models.PrintJobResult
}

// NewQueue cria uma nova fila de jobs
func NewQueue(manager *Manager, log zerolog.Logger, workers int) *Queue {
	if workers <= 0 {
		workers = 2 // Default: 2 workers
	}

	return &Queue{
		log:         log.With().Str("component", "print-queue").Logger(),
		manager:     manager,
		jobs:        make(map[string]*QueuedJob),
		maxAttempts: 3,
		retryDelay:  5 * time.Second,
		workers:     workers,
		jobChan:     make(chan *QueuedJob, 100), // Buffer de 100 jobs
		stopCh:      make(chan struct{}),
		resultChan:  make(chan models.PrintJobResult, 100),
	}
}

// Start inicia os workers da fila
func (q *Queue) Start() {
	q.log.Info().Int("workers", q.workers).Msg("🚀 Iniciando fila de impressão")

	for i := 0; i < q.workers; i++ {
		go q.worker(i)
	}
}

// Stop para todos os workers
func (q *Queue) Stop() {
	q.log.Info().Msg("🛑 Parando fila de impressão")
	close(q.stopCh)
}

// Enqueue adiciona um job à fila
func (q *Queue) Enqueue(job models.PrintJob) error {
	q.mu.Lock()
	defer q.mu.Unlock()

	// Verificar se job já existe
	if _, exists := q.jobs[job.JobID]; exists {
		return fmt.Errorf("job %s já está na fila", job.JobID)
	}

	queuedJob := &QueuedJob{
		Job:         job,
		Status:      JobStatusPending,
		Attempts:    0,
		MaxAttempts: q.maxAttempts,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	q.jobs[job.JobID] = queuedJob

	printerTarget := job.PrinterID
	if printerTarget == "" || printerTarget == "USE_FIRST_AVAILABLE" {
		printerTarget = "primeira USB disponível"
	}

	q.log.Info().
		Str("job_id", job.JobID).
		Str("printer_target", printerTarget).
		Int("priority", job.GetPriority()).
		Int("copies", job.Copies).
		Bool("has_zpl", job.ZPL != "").
		Msg("➕ Job adicionado à fila")

	// Enviar para canal de processamento
	go func() {
		q.jobChan <- queuedJob
	}()

	return nil
}

// GetResultChannel retorna o canal de resultados
func (q *Queue) GetResultChannel() <-chan models.PrintJobResult {
	return q.resultChan
}

// worker processa jobs da fila
func (q *Queue) worker(id int) {
	q.log.Debug().Int("worker_id", id).Msg("👷 Worker iniciado")

	for {
		select {
		case <-q.stopCh:
			q.log.Debug().Int("worker_id", id).Msg("👷 Worker encerrado")
			return

		case queuedJob := <-q.jobChan:
			q.processJob(id, queuedJob)
		}
	}
}

// processJob processa um job individual
func (q *Queue) processJob(workerID int, queuedJob *QueuedJob) {
	q.mu.Lock()
	queuedJob.Status = JobStatusProcessing
	queuedJob.Attempts++
	queuedJob.UpdatedAt = time.Now()
	q.mu.Unlock()

	job := queuedJob.Job

	q.log.Info().
		Int("worker_id", workerID).
		Str("job_id", job.JobID).
		Int("attempt", queuedJob.Attempts).
		Int("max_attempts", queuedJob.MaxAttempts).
		Msg("🔄 Processando job")

	// Determinar impressora
	var targetPrinter *models.PrinterInfo
	var err error

	if job.PrinterID == "USE_FIRST_AVAILABLE" || job.PrinterID == "" {
		q.log.Info().Msg("🔍 Buscando primeira impressora USB disponível...")
		targetPrinter, err = q.manager.GetFirstAvailable()
		if err != nil {
			q.log.Warn().Msg("❌ Nenhuma impressora USB detectada no momento")
			q.handleJobError(queuedJob, "Nenhuma impressora USB conectada. Por favor, conecte uma impressora USB e tente novamente.")
			return
		}
		q.log.Info().Str("printer", targetPrinter.Name).Str("path", *targetPrinter.DevicePath).Msg("✅ Impressora USB encontrada")
	} else {
		q.log.Info().Str("printer_id", job.PrinterID).Msg("🔍 Buscando impressora específica...")
		targetPrinter, err = q.manager.GetPrinter(job.PrinterID)
		if err != nil {
			q.log.Warn().Str("printer_id", job.PrinterID).Msg("❌ Impressora não encontrada")
			q.handleJobError(queuedJob, fmt.Sprintf("Impressora '%s' não encontrada. Verifique se está conectada.", job.PrinterID))
			return
		}
		q.log.Info().Str("printer", targetPrinter.Name).Msg("✅ Impressora encontrada")
	}

	// Validar ZPL
	if job.ZPL == "" {
		q.handleJobError(queuedJob, "Job sem dados ZPL")
		return
	}

	// Determinar número de cópias
	copies := job.Copies
	if copies <= 0 {
		copies = 1
	}

	// Enviar para impressora (com todas as cópias)
	var lastPrinterStatus *PrinterStatus
	for i := 0; i < copies; i++ {
		q.log.Debug().
			Int("copy", i+1).
			Int("total", copies).
			Str("printer", targetPrinter.Name).
			Msg("🖨️ Imprimindo cópia")

		// ⭐ Usar SendToUSBWithStatus para obter feedback detalhado
		if targetPrinter.Connection == "usb" && targetPrinter.DevicePath != nil {
			status, err := q.manager.SendToUSBWithStatus(*targetPrinter.DevicePath, []byte(job.ZPL))
			lastPrinterStatus = status
			if err != nil {
				// Erro com detalhes da impressora
				errorMsg := fmt.Sprintf("Erro ao imprimir cópia %d/%d: %v", i+1, copies, err)
				if status != nil && status.ErrorMessage != "" {
					errorMsg = status.ErrorMessage
				}
				q.handleJobErrorWithStatus(queuedJob, errorMsg, status)
				return
			}
		} else {
			err = q.manager.SendToPrinter(targetPrinter, []byte(job.ZPL))
			if err != nil {
				q.handleJobError(queuedJob, fmt.Sprintf("Erro ao imprimir cópia %d/%d: %v", i+1, copies, err))
				return
			}
		}
	}

	// Sucesso
	q.handleJobSuccessWithStatus(queuedJob, copies, lastPrinterStatus)
}

// handleJobError trata erro no processamento
func (q *Queue) handleJobError(queuedJob *QueuedJob, errorMsg string) {
	q.mu.Lock()
	defer q.mu.Unlock()

	queuedJob.LastError = errorMsg
	queuedJob.UpdatedAt = time.Now()

	job := queuedJob.Job

	// Verificar se deve retentar
	if queuedJob.Attempts < queuedJob.MaxAttempts {
		queuedJob.Status = JobStatusRetrying

		q.log.Warn().
			Str("job_id", job.JobID).
			Int("attempt", queuedJob.Attempts).
			Int("max_attempts", queuedJob.MaxAttempts).
			Str("error", errorMsg).
			Msg("⚠️ Job falhou, retentando...")

		// Agendar retry
		go func() {
			time.Sleep(q.retryDelay)
			q.jobChan <- queuedJob
		}()

		return
	}

	// Falha definitiva
	queuedJob.Status = JobStatusFailed
	now := time.Now()
	queuedJob.CompletedAt = &now

	q.log.Error().
		Str("job_id", job.JobID).
		Int("attempts", queuedJob.Attempts).
		Str("error", errorMsg).
		Msg("❌ Job falhou definitivamente")

	// Enviar resultado
	result := models.PrintJobResult{
		JobID:     job.JobID,
		Status:    "error",
		Message:   fmt.Sprintf("Falha após %d tentativas", queuedJob.Attempts),
		Error:     errorMsg,
		PrintedAt: time.Now(),
	}

	go func() {
		q.resultChan <- result
	}()
}

// handleJobSuccess trata sucesso no processamento (sem status detalhado)
func (q *Queue) handleJobSuccess(queuedJob *QueuedJob, copies int) {
	q.handleJobSuccessWithStatus(queuedJob, copies, nil)
}

// handleJobSuccessWithStatus trata sucesso com status detalhado da impressora
func (q *Queue) handleJobSuccessWithStatus(queuedJob *QueuedJob, copies int, printerStatus *PrinterStatus) {
	q.mu.Lock()
	defer q.mu.Unlock()

	queuedJob.Status = JobStatusCompleted
	queuedJob.UpdatedAt = time.Now()
	now := time.Now()
	queuedJob.CompletedAt = &now

	job := queuedJob.Job

	q.log.Info().
		Str("job_id", job.JobID).
		Int("copies", copies).
		Int("attempts", queuedJob.Attempts).
		Msg("✅ Job processado com sucesso")

	// Enviar resultado com status da impressora
	result := models.PrintJobResult{
		JobID:     job.JobID,
		Status:    "success",
		Message:   fmt.Sprintf("Impressão concluída (%d cópias)", copies),
		PrintedAt: time.Now(),
	}

	// ⭐ Incluir status detalhado da impressora
	if printerStatus != nil {
		result.PrinterStatus = &models.PrinterStatusResult{
			OK:           printerStatus.OK,
			ErrorCode:    printerStatus.ErrorCode,
			ErrorMessage: printerStatus.ErrorMessage,
			PaperOut:     printerStatus.PaperOut,
			RibbonOut:    printerStatus.RibbonOut,
			HeadOpen:     printerStatus.HeadOpen,
			Paused:       printerStatus.Paused,
		}
	}

	go func() {
		q.resultChan <- result
	}()
}

// handleJobErrorWithStatus trata erro com status detalhado da impressora
func (q *Queue) handleJobErrorWithStatus(queuedJob *QueuedJob, errorMsg string, printerStatus *PrinterStatus) {
	q.mu.Lock()
	defer q.mu.Unlock()

	queuedJob.LastError = errorMsg
	queuedJob.UpdatedAt = time.Now()

	job := queuedJob.Job

	// Verificar se deve retentar (NÃO retentar erros de hardware)
	shouldRetry := queuedJob.Attempts < queuedJob.MaxAttempts
	
	// ⭐ NÃO retentar se for erro de hardware (papel, ribbon, tampa)
	if printerStatus != nil && (printerStatus.PaperOut || printerStatus.RibbonOut || printerStatus.HeadOpen) {
		shouldRetry = false
		q.log.Warn().
			Str("job_id", job.JobID).
			Str("error_code", printerStatus.ErrorCode).
			Msg("⚠️ Erro de hardware - não retentando")
	}

	if shouldRetry {
		queuedJob.Status = JobStatusRetrying

		q.log.Warn().
			Str("job_id", job.JobID).
			Int("attempt", queuedJob.Attempts).
			Int("max_attempts", queuedJob.MaxAttempts).
			Str("error", errorMsg).
			Msg("⚠️ Job falhou, retentando...")

		// Agendar retry
		go func() {
			time.Sleep(q.retryDelay)
			q.jobChan <- queuedJob
		}()

		return
	}

	// Falha definitiva
	queuedJob.Status = JobStatusFailed
	now := time.Now()
	queuedJob.CompletedAt = &now

	q.log.Error().
		Str("job_id", job.JobID).
		Int("attempts", queuedJob.Attempts).
		Str("error", errorMsg).
		Msg("❌ Job falhou definitivamente")

	// Enviar resultado com status da impressora
	result := models.PrintJobResult{
		JobID:     job.JobID,
		Status:    "error",
		Message:   fmt.Sprintf("Falha após %d tentativas", queuedJob.Attempts),
		Error:     errorMsg,
		PrintedAt: time.Now(),
	}

	// ⭐ Incluir status detalhado da impressora
	if printerStatus != nil {
		result.PrinterStatus = &models.PrinterStatusResult{
			OK:           printerStatus.OK,
			ErrorCode:    printerStatus.ErrorCode,
			ErrorMessage: printerStatus.ErrorMessage,
			PaperOut:     printerStatus.PaperOut,
			RibbonOut:    printerStatus.RibbonOut,
			HeadOpen:     printerStatus.HeadOpen,
			Paused:       printerStatus.Paused,
		}
	}

	go func() {
		q.resultChan <- result
	}()
}

// GetStats retorna estatísticas da fila
func (q *Queue) GetStats() map[string]interface{} {
	q.mu.RLock()
	defer q.mu.RUnlock()

	stats := map[string]interface{}{
		"total":      len(q.jobs),
		"pending":    0,
		"processing": 0,
		"completed":  0,
		"failed":     0,
		"retrying":   0,
	}

	for _, job := range q.jobs {
		switch job.Status {
		case JobStatusPending:
			stats["pending"] = stats["pending"].(int) + 1
		case JobStatusProcessing:
			stats["processing"] = stats["processing"].(int) + 1
		case JobStatusCompleted:
			stats["completed"] = stats["completed"].(int) + 1
		case JobStatusFailed:
			stats["failed"] = stats["failed"].(int) + 1
		case JobStatusRetrying:
			stats["retrying"] = stats["retrying"].(int) + 1
		}
	}

	return stats
}

// GetJob retorna um job específico
func (q *Queue) GetJob(jobID string) (*QueuedJob, bool) {
	q.mu.RLock()
	defer q.mu.RUnlock()

	job, exists := q.jobs[jobID]
	return job, exists
}

// CleanOldJobs remove jobs completados antigos (mais de 1 hora)
func (q *Queue) CleanOldJobs() int {
	q.mu.Lock()
	defer q.mu.Unlock()

	cutoff := time.Now().Add(-1 * time.Hour)
	cleaned := 0

	for jobID, job := range q.jobs {
		if (job.Status == JobStatusCompleted || job.Status == JobStatusFailed) &&
			job.CompletedAt != nil &&
			job.CompletedAt.Before(cutoff) {
			delete(q.jobs, jobID)
			cleaned++
		}
	}

	if cleaned > 0 {
		q.log.Info().Int("count", cleaned).Msg("🧹 Jobs antigos removidos da fila")
	}

	return cleaned
}

