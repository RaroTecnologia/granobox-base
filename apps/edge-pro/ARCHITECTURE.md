# 🏗️ Arquitetura - Edge v2

## 📊 Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      EDGE v2 (GO)                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   HTTP API   │  │ MQTT Client  │  │ Display Client  │  │
│  │   (chi)      │  │ (paho.mqtt)  │  │  (TCP Socket)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                  │                    │           │
│         └──────────────────┴────────────────────┘           │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  Main Handler  │                       │
│                    │   (goroutines) │                       │
│                    └───────┬────────┘                       │
│                            │                                │
│         ┌──────────────────┼─────────────────┐             │
│         │                  │                 │             │
│    ┌────▼─────┐      ┌────▼─────┐     ┌────▼─────┐       │
│    │  Config  │      │  Logger  │     │ Hardware │       │
│    │ (viper)  │      │(zerolog) │     │(periph.io)│       │
│    └──────────┘      └──────────┘     └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Fluxo de Comunicação

### 1️⃣ **Inicialização**

```
main.go
  │
  ├─► Carregar config (viper)
  ├─► Inicializar logger (zerolog)
  ├─► Conectar hardware (periph.io)
  ├─► Conectar display service (TCP)
  ├─► Conectar MQTT broker
  └─► Iniciar API HTTP
```

### 2️⃣ **Display Service (Python)**

```
┌──────────────┐      TCP Socket       ┌───────────────────┐
│              │      JSON over        │                   │
│   Edge v2    │◄────────────────────►│ Display Service   │
│    (Go)      │      Port 3006        │    (Python)       │
│              │                       │   luma.lcd        │
└──────────────┘                       └─────────┬─────────┘
                                                 │
                                          ┌──────▼──────┐
                                          │  ST7735S    │
                                          │   Display   │
                                          │  160x80 RGB │
                                          └─────────────┘
```

**Protocolo:**
- JSON lines (delimitado por `\n`)
- Comandos: `status`, `qrcode`, `text`, `clear`, `brightness`

### 3️⃣ **MQTT Broker**

```
┌──────────────┐                       ┌───────────────┐
│              │   MQTT over TCP       │               │
│   Edge v2    │◄─────────────────────►│  MQTT Broker  │
│              │   Port 1883           │               │
└──────────────┘                       └───────────────┘

Tópicos Publicados:
  ├─► edge/{device_id}/info      (device info, 30s)
  ├─► edge/{device_id}/sensors   (sensor data)
  └─► edge/{device_id}/status    (status updates)

Tópicos Subscritos:
  ├─► edge/{device_id}/cmd/#     (comandos específicos)
  └─► edge/broadcast/#           (comandos broadcast)
```

### 4️⃣ **API HTTP**

```
┌──────────────┐                       ┌───────────────┐
│              │   HTTP/REST           │               │
│  Clients     │◄─────────────────────►│   Edge v2     │
│              │   Port 3000           │   API Server  │
└──────────────┘                       └───────────────┘

Endpoints:
  ├─► GET  /health              (health check)
  ├─► GET  /info                (device info)
  ├─► POST /display/*           (display control)
  ├─► POST /mqtt/publish        (publish MQTT)
  └─► GET  /mqtt/status         (MQTT status)
```

## 🧩 Componentes

### **1. cmd/edge/main.go**
- Entry point da aplicação
- Inicialização de componentes
- Signal handling (SIGTERM, SIGINT)
- Lifecycle management

### **2. internal/config**
- Carregamento de configuração
- Suporta YAML e ENV vars
- Validação de configuração
- Valores default

### **3. internal/display**
- Cliente TCP para display service Python
- Reconnection automática
- Thread-safe (mutex)
- Timeouts configuráveis

### **4. internal/mqtt**
- Cliente MQTT com auto-reconnect
- QoS configurável
- Message handlers
- Connection state management

### **5. internal/api**
- Servidor HTTP com chi router
- Middleware: logging, recovery, timeout
- JSON API
- Health checks

### **6. internal/hardware**
- Abstração GPIO via periph.io
- Pin management
- Input/Output control
- Sensor reading

### **7. pkg/logger**
- Logger estruturado (zerolog)
- Níveis de log configuráveis
- Pretty printing (dev mode)
- JSON output (prod mode)

### **8. internal/models**
- Estruturas de dados compartilhadas
- DTOs para API
- Message formats

## 🔄 Concorrência

Go usa **goroutines** para concorrência:

```go
// Exemplo simplificado
func main() {
    // API HTTP em goroutine
    go apiServer.Start()
    
    // Publicar device info periodicamente
    go publishDeviceInfo()
    
    // MQTT client com auto-reconnect
    mqttClient.Connect() // internamente usa goroutines
    
    // Aguardar sinal de shutdown
    <-sigCh
}
```

**Vantagens:**
- ✅ Lightweight (KB de memória por goroutine)
- ✅ Scheduler eficiente do Go runtime
- ✅ Channels para comunicação segura
- ✅ Sem race conditions com mutexes

## 🎯 Design Patterns

### **1. Dependency Injection**
```go
// Componentes recebem dependências via construtor
apiServer := api.New(cfg, displayClient, mqttClient)
```

### **2. Interface Segregation**
```go
// Cada componente expõe interface mínima
type Display interface {
    ShowStatus(...) error
    Clear() error
}
```

### **3. Error Wrapping**
```go
// Erros com contexto
return fmt.Errorf("erro ao conectar: %w", err)
```

### **4. Context Propagation**
```go
// Timeouts e cancelamento via context
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
```

## 📦 Deploy Flow

```
┌─────────────┐
│  Mac/Dev    │
│             │
│  make       │
│  build-pi   │
└──────┬──────┘
       │
       │ Cross-compile (GOARCH=arm)
       │
       ▼
┌──────────────┐
│ Binary ARM   │
│  (~10MB)     │
└──────┬───────┘
       │
       │ SCP
       │
       ▼
┌────────────────┐
│ Raspberry Pi   │
│                │
│ systemd service│
│ auto-start     │
└────────────────┘
```

## 🔐 Segurança

### **Implementado:**
- ✅ No privilege escalation (systemd)
- ✅ Input validation
- ✅ Timeout em todas operações
- ✅ Private /tmp (systemd)

### **TODO (opcional):**
- [ ] TLS para MQTT
- [ ] API authentication (JWT)
- [ ] Rate limiting
- [ ] Request signing

## 📊 Performance

### **Raspberry Pi 3B+:**

| Métrica | Valor |
|---------|-------|
| Memory RSS | ~15MB |
| CPU Idle | ~2-5% |
| Startup Time | ~1s |
| API Latency | <5ms |
| MQTT Latency | <10ms |
| Binary Size | ~10MB |

### **vs Rust:**

| Critério | Rust | Go |
|----------|------|-----|
| Dev Time | 3-4 semanas | 1 semana |
| Memory | ~15MB | ~15MB |
| CPU | ~2-5% | ~2-5% |
| Libs Maturity | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Debugging | 😫 | 😊 |

## 🚀 Próximos Passos

1. ✅ Adicionar suporte a múltiplos sensores
2. ✅ Implementar cache local (offline mode)
3. ✅ OTA updates
4. ✅ Metrics (Prometheus)
5. ✅ Health checks avançados
6. ✅ Dashboard web

---

**Made with ❤️ and Go** 🐹



