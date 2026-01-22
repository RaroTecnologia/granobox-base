# 🎯 Edge-Pro - Plano Simplificado (Online)

## 📋 Objetivo

Trazer o **edge-pi** para dentro do ecossistema Granobox, conectando via WebSocket ao backend `apps/api`.

**Não fazer**: TCP offline, queue SQLite, interface web nova
**Fazer**: WebSocket online, impressão USB, display opcional

---

## 🏗️ Arquitetura Simplificada

```
┌────────────┐                          ┌─────────────┐
│  Flutter   │◄────────────────────────►│  Edge-Pro   │
│    App     │      via Backend         │   (Go)      │
└─────┬──────┘                          └──────┬──────┘
      │                                         │
      │             ┌─────────────────┐         │
      └────────────►│ Backend         │◄────────┘
                    │ Granobox API    │  WebSocket
                    │ (apps/api)      │  Socket.IO
                    │                 │
                    │ Templates       │
                    │ (Tagment)       │
                    └─────────────────┘
```

### Fluxo de Impressão

1. Usuário cria etiqueta no **apps/tag/web-vite** (online)
2. Template é gerenciado no **Tagment** (admin apenas)
3. **Backend Granobox** processa template → gera ZPL
4. **Backend** envia job via **WebSocket** para **Edge-Pro**
5. **Edge-Pro** imprime via **USB**
6. **Edge-Pro** reporta status de volta

---

## 📦 Componentes

### 1️⃣ **Edge-Pro (Go)** - `apps/edge-pro/`

Basear em `apps/edge-pi` com as seguintes alterações:

**Manter:**
- ✅ Estrutura Go
- ✅ Socket.IO client
- ✅ Display Python service
- ✅ USB printer manager
- ✅ Logger estruturado
- ✅ Configuração via YAML

**Adaptar:**
- 🔧 URL do WebSocket: `wss://api.granobox.com.br` (ao invés de Tagment)
- 🔧 Namespace: `/agents` (igual Tagment)
- 🔧 Eventos: mesmos do Tagment (já padronizado)
- 🔧 Autenticação: API Key do Granobox

**Remover:**
- ❌ MQTT client (não vamos usar)
- ❌ Servidor Socket.IO local (não precisa)

### 2️⃣ **Backend Granobox** - `apps/api/src/modules/edge/`

Copiar módulo `agents` do Tagment e adaptar:

**Arquivos a criar:**

```
apps/api/src/modules/edge/
├── edge.module.ts         (copiar agents.module.ts)
├── edge.gateway.ts        (copiar agents.gateway.ts)
├── edge.service.ts        (copiar agents.service.ts)
├── edge.controller.ts     (novo - API REST)
├── entities/
│   └── edge-device.entity.ts
└── dto/
    ├── register-edge.dto.ts
    └── heartbeat.dto.ts
```

**Eventos WebSocket** (mesmos do Tagment):

**Recebidos do Edge-Pro:**
- `agent-register` - Registro inicial
- `heartbeat` - Heartbeat periódico
- `print-job-status` - Status de impressão
- `printer-status` - Status da impressora

**Enviados para Edge-Pro:**
- `connection-established` - Conexão OK
- `agent-registered` - Registro confirmado
- `print-job` - Job para imprimir
- `heartbeat-ack` - Resposta do heartbeat

### 3️⃣ **Templates** - Tagment (sem mudanças)

- ✅ Continua gerenciado pelos admins no Tagment
- ✅ Backend Granobox consulta API do Tagment para processar templates
- ✅ Zero mudanças necessárias

---

## 🚀 Plano de Implementação

### **FASE 1: Backend Granobox (3-4 dias)**

- [ ] **1.1** Criar módulo `edge` em `apps/api`
  - Copiar estrutura do `agents` do Tagment
  - Adaptar para entities do Granobox
  
- [ ] **1.2** Implementar `EdgeGateway` (WebSocket)
  - Namespace `/agents`
  - Eventos: register, heartbeat, job-status
  - Autenticação via API Key
  
- [ ] **1.3** Implementar `EdgeService`
  - CRUD de dispositivos edge
  - Gerenciar conexões
  - Enviar jobs via WebSocket
  
- [ ] **1.4** Criar entity `EdgeDevice`
  ```typescript
  EdgeDevice {
    id: uuid
    fingerprint: string (único)
    name: string
    type: 'edge-pro' | 'edge-go'
    status: 'online' | 'offline'
    lastSeen: Date
    clientId: uuid (FK)
    metadata: json
  }
  ```
  
- [ ] **1.5** Criar endpoint REST
  ```
  GET    /edge/devices       (listar dispositivos)
  GET    /edge/devices/:id   (ver device)
  POST   /edge/devices/:id/generate-key (gerar API Key)
  POST   /edge/print         (enviar job para edge)
  ```

- [ ] **1.6** Testar com mock client
  - Conectar via Socket.IO client
  - Simular agent-register
  - Simular heartbeat
  - Receber print-job

### **FASE 2: Edge-Pro (4-5 dias)**

- [ ] **2.1** Setup projeto
  - Copiar `apps/edge-pi` → `apps/edge-pro`
  - Ajustar `go.mod`
  - Limpar código desnecessário (MQTT)
  
- [ ] **2.2** Adaptar configuração
  ```yaml
  device:
    id: "edge-001"
    type: "edge-pro"
  
  websocket:
    server_url: "wss://api.granobox.com.br"
    namespace: "/agents"
    api_key: "grx_..."
  
  printer:
    type: "usb"
    device: "/dev/usb/lp0"
  
  display:
    enabled: true
    service_url: "localhost:3006"
  ```
  
- [ ] **2.3** Adaptar Socket.IO client
  - Conectar em `wss://api.granobox.com.br/agents`
  - Auth com API Key
  - Implementar eventos
  
- [ ] **2.4** Implementar event handlers
  ```go
  func (c *Client) OnPrintJob(job *PrintJob) {
      // Receber job do backend
      // Imprimir via USB
      // Enviar status de volta
  }
  
  func (c *Client) SendHeartbeat() {
      // Enviar métricas
      // jobs_today, status, etc
  }
  ```
  
- [ ] **2.5** Reutilizar printer manager
  - Copiar `internal/printer/` do edge-pi
  - Manter impressão USB
  - Remover TCP printer (não precisa por enquanto)
  
- [ ] **2.6** Display service
  - Copiar Python service do edge-pi
  - Reutilizar sem mudanças

### **FASE 3: Integração (2-3 dias)**

- [ ] **3.1** Deploy do backend
  - Deploy em staging
  - Testar WebSocket gateway
  - Verificar logs
  
- [ ] **3.2** Deploy do Edge-Pro
  - Build para Raspberry Pi
  - Deploy em dispositivo teste
  - Verificar conexão WebSocket
  
- [ ] **3.3** Teste E2E
  - Backend → Edge-Pro → Impressora
  - Monitorar logs
  - Verificar status
  
- [ ] **3.4** Flutter App
  - Adaptar chamadas para backend Granobox
  - Testar fluxo completo
  - UI de status do edge

### **FASE 4: Produção (1-2 dias)**

- [ ] **4.1** Documentação
  - README do edge-pro
  - Guia de instalação
  - API documentation
  
- [ ] **4.2** Scripts de deploy
  - `install.sh` para Raspberry Pi
  - Systemd service
  - Auto-start
  
- [ ] **4.3** Monitoramento
  - Logs estruturados
  - Health checks
  - Alertas

---

## 📊 Cronograma

| Fase | Duração | Acumulado |
|------|---------|-----------|
| 1. Backend | 3-4 dias | 4 dias |
| 2. Edge-Pro | 4-5 dias | 9 dias |
| 3. Integração | 2-3 dias | 12 dias |
| 4. Produção | 1-2 dias | **14 dias** |

**Total: ~2-3 semanas** (1 desenvolvedor)

---

## 🔧 Stack Tecnológico

### Backend (apps/api)
- NestJS (já existe)
- Socket.IO (WebSocket)
- TypeORM + PostgreSQL
- JWT + API Keys

### Edge-Pro (Go)
- Socket.IO client
- USB printer (periph.io)
- Display Python service
- Systemd

### Flutter App
- Já existe
- Adaptar endpoints

---

## 📝 Checklist de Sucesso

### Backend ✅
- [x] WebSocket `/agents` respondendo
- [x] Agent consegue se registrar
- [x] Heartbeat sendo recebido
- [x] Jobs sendo enviados
- [x] Status sendo recebido

### Edge-Pro ✅
- [x] Conecta no WebSocket
- [x] Registra com sucesso
- [x] Envia heartbeat
- [x] Recebe jobs
- [x] Imprime via USB
- [x] Reporta status

### Integração ✅
- [x] Flutter → Backend → Edge-Pro → Impressora
- [x] Status em tempo real
- [x] Display mostrando info
- [x] Logs ok

---

## 🎯 Próximos Passos (Futuro)

Depois de funcionar em produção:

1. **Modo Offline** - Queue SQLite + Sync
2. **TCP Fallback** - Porta 9100 como backup
3. **Múltiplas Impressoras** - Suporte a várias impressoras
4. **Dashboard Web** - Interface web local
5. **BLE Config** - Configuração via Bluetooth (como edge-go)

---

## 🚀 Como Começar

```bash
# 1. Backend primeiro
cd /Volumes/DadosTiago/Dev/granobox/apps/api

# Criar módulo edge
nest g module edge
nest g service edge
nest g controller edge
nest g gateway edge/edge

# 2. Copiar base do Tagment
# Ver /Volumes/DadosTiago/Dev/Tagment/apps/api/src/agents/

# 3. Edge-Pro
cd /Volumes/DadosTiago/Dev/granobox/apps/edge-pro

# Copiar base do edge-pi
cp -r ../edge-pi/* .

# Adaptar código
# ...
```

---

**Foco: Fazer funcionar ONLINE primeiro. Resto vem depois! 🎯**


