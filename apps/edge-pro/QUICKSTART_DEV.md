# ⚡ Edge-Pro - Guia Rápido para Desenvolvimento

## 🎯 Objetivo

Fazer o Edge-Pro funcionar **online** conectando ao backend Granobox em **2-3 semanas**.

---

## 📍 Onde Começar

### ✅ **Comece pelo Backend** (mais fácil de testar)

**Por quê?**
- Mais rápido de testar (usa Postman/Insomnia)
- Pode usar mock client Socket.IO
- Define o "contrato" que o Edge-Pro vai seguir

---

## 🚀 PASSO 1: Backend Granobox (3-4 dias)

### 1.1 Criar módulo Edge

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/api

# Gerar módulo NestJS
npm run nest -- g module modules/edge
npm run nest -- g service modules/edge
npm run nest -- g controller modules/edge
npm run nest -- g gateway modules/edge/edge
```

### 1.2 Copiar base do Tagment

```bash
# Abrir para referência
code /Volumes/DadosTiago/Dev/Tagment/apps/api/src/agents/agents.gateway.ts
code /Volumes/DadosTiago/Dev/Tagment/apps/api/src/agents/agents.service.ts
```

**Copiar e adaptar:**

**`edge.gateway.ts`** (copiar de `agents.gateway.ts`):
```typescript
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/agents',
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
})
export class EdgeGateway {
  // Copiar toda lógica do agents.gateway.ts
  // Adaptar para entities do Granobox
}
```

**Principais métodos:**
- `handleConnection` - Autenticação via API Key
- `handleAgentRegister` - Registro do device
- `handleHeartbeat` - Receber heartbeat
- `handlePrintJobStatus` - Receber status de impressão
- `sendPrintJob` - Enviar job para device

### 1.3 Criar Entity EdgeDevice

```bash
# Criar migration
npm run typeorm migration:create src/migrations/CreateEdgeDevices
```

```typescript
// src/modules/edge/entities/edge-device.entity.ts
@Entity('edge_devices')
export class EdgeDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  fingerprint: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['edge-go', 'edge-pro'] })
  type: string;

  @Column({ default: 'offline' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen: Date;

  @ManyToOne(() => Client)
  client: Client;

  @Column()
  clientId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
```

### 1.4 Implementar EdgeService

```typescript
// src/modules/edge/edge.service.ts
@Injectable()
export class EdgeService {
  async register(fingerprint: string, data: any, clientId: string) {
    // Criar ou atualizar device
  }

  async updateStatus(fingerprint: string, status: string) {
    // Atualizar status
  }

  async findByClient(clientId: string) {
    // Listar devices do cliente
  }

  async generateApiKey(deviceId: string) {
    // Gerar API Key para device
  }
}
```

### 1.5 Criar REST Endpoints

```typescript
// src/modules/edge/edge.controller.ts
@Controller('edge')
export class EdgeController {
  @Get('devices')
  async listDevices(@Request() req) {
    return this.edgeService.findByClient(req.user.clientId);
  }

  @Post('devices/:id/generate-key')
  async generateKey(@Param('id') id: string) {
    return this.edgeService.generateApiKey(id);
  }

  @Post('print')
  async sendPrintJob(@Body() dto: SendPrintJobDto) {
    // Processar template → gerar ZPL
    // Enviar via gateway.sendPrintJob()
  }
}
```

### 1.6 Testar com Mock Client

Criar arquivo `test-edge-websocket.js`:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000/agents', {
  auth: {
    token: 'SUA_API_KEY_AQUI'
  },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Conectado!');
  
  // Registrar
  socket.emit('agent-register', {
    agentFingerprint: 'test-device-001',
    name: 'Test Device',
    version: '1.0.0',
    platform: 'darwin',
    type: 'edge-pro'
  });
});

socket.on('agent-registered', (data) => {
  console.log('✅ Registrado:', data);
  
  // Enviar heartbeat
  setInterval(() => {
    socket.emit('heartbeat', {
      agentFingerprint: 'test-device-001',
      status: 'online',
      cpuUsage: 25,
      memoryUsage: 50
    });
  }, 30000);
});

socket.on('print-job', (job) => {
  console.log('📄 Job recebido:', job);
  
  // Simular impressão
  setTimeout(() => {
    socket.emit('print-job-status', {
      jobId: job.jobId,
      status: 'completed'
    });
  }, 2000);
});

socket.on('heartbeat-ack', (data) => {
  console.log('💓 Heartbeat ack:', data);
});
```

**Executar:**
```bash
node test-edge-websocket.js
```

---

## 🚀 PASSO 2: Edge-Pro (4-5 dias)

### 2.1 Copiar base do edge-pi

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps

# Copiar edge-pi → edge-pro
cp -r edge-pi edge-pro

cd edge-pro

# Limpar
rm -rf bin/ edge edge-arm64
rm -rf internal/mqtt/
```

### 2.2 Ajustar go.mod

```bash
# Editar go.mod
module github.com/granobox/edge-pro

# Atualizar dependências
go mod tidy
```

### 2.3 Adaptar configuração

**`configs/config.yaml`:**
```yaml
device:
  id: "edge-001"
  name: "Edge Pro Device"
  type: "edge-pro"

websocket:
  server_url: "ws://localhost:3000"  # Dev
  # server_url: "wss://api.granobox.com.br"  # Prod
  namespace: "/agents"
  api_key: ""  # Será gerado pelo backend

printer:
  type: "usb"
  device: "/dev/usb/lp0"

display:
  enabled: false  # true quando tiver display
  service_url: "localhost:3006"

debug: true
```

### 2.4 Adaptar Socket.IO Client

**`internal/websocket/client.go`:**

Ajustar URL:
```go
func (c *Client) Connect() error {
    // Conectar em api.granobox.com.br/agents
    url := fmt.Sprintf("%s%s", c.config.ServerURL, c.config.Namespace)
    
    // Auth com API Key
    header := http.Header{}
    header.Add("Authorization", fmt.Sprintf("Bearer %s", c.config.APIKey))
    
    // ... resto do código
}
```

Eventos:
```go
func (c *Client) setupEventHandlers() {
    // Receber print-job
    c.conn.On("print-job", c.handlePrintJob)
    
    // Receber heartbeat-ack
    c.conn.On("heartbeat-ack", c.handleHeartbeatAck)
    
    // Conexão estabelecida
    c.conn.On("connection-established", c.handleConnectionEstablished)
}

func (c *Client) handlePrintJob(data interface{}) {
    // Parse job
    // Imprimir via printer manager
    // Enviar status
}
```

### 2.5 Build e Testar

```bash
# Build local
go build -o bin/edge-pro ./cmd/edge-pro/main.go

# Executar
./bin/edge-pro --config configs/config.yaml --debug
```

**Output esperado:**
```
🚀 Iniciando Edge-Pro v1.0.0
✅ Configuração carregada
✅ Logger inicializado
🔌 Conectando WebSocket: ws://localhost:3000/agents
✅ WebSocket conectado
📝 Enviando agent-register...
✅ Agent registrado: edge-001
💓 Heartbeat iniciado (30s)
```

---

## 🚀 PASSO 3: Integração (2-3 dias)

### 3.1 Teste Completo

1. **Backend rodando:**
```bash
cd apps/api
npm run start:dev
```

2. **Edge-Pro rodando:**
```bash
cd apps/edge-pro
./bin/edge-pro --debug
```

3. **Enviar job via API:**
```bash
curl -X POST http://localhost:3000/edge/print \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "uuid",
    "data": { "PRODUTO": "Teste" },
    "deviceFingerprint": "edge-001"
  }'
```

4. **Verificar:**
- ✅ Job chegou no Edge-Pro
- ✅ Edge-Pro imprimiu (ou simulou)
- ✅ Status voltou para backend
- ✅ Logs ok em ambos

### 3.2 Deploy Staging

```bash
# Backend
git push origin staging

# Edge-Pro (Raspberry Pi)
./scripts/deploy.sh PI_IP=192.168.1.100
```

---

## 📋 Checklist Final

### Backend ✅
- [ ] Módulo `edge` criado
- [ ] WebSocket gateway funcionando
- [ ] Entities e migrations ok
- [ ] REST endpoints respondendo
- [ ] Teste com mock client ok
- [ ] Deploy staging ok

### Edge-Pro ✅
- [ ] Projeto copiado do edge-pi
- [ ] Socket.IO adaptado
- [ ] Eventos implementados
- [ ] Build ok (local)
- [ ] Teste com backend ok
- [ ] Build para Pi ok
- [ ] Deploy em Pi ok

### Integração ✅
- [ ] Flutter → Backend ok
- [ ] Backend → Edge-Pro ok
- [ ] Edge-Pro → Impressora ok
- [ ] Status de volta ok
- [ ] Logs claros
- [ ] Performance ok

---

## 🐛 Troubleshooting

### WebSocket não conecta

```bash
# Verificar se backend está rodando
curl http://localhost:3000/health

# Verificar logs do backend
# Procurar por "WebSocket Gateway inicializado"

# Verificar se porta está aberta
nc -zv localhost 3000
```

### Agent não registra

```bash
# Verificar API Key
# Deve estar no formato: grx_...

# Verificar logs do Edge-Pro
# Procurar por "agent-register" ou erro de auth

# Testar manualmente com curl
curl -H "Authorization: Bearer API_KEY" \
  http://localhost:3000/edge/devices
```

### Job não chega no Edge-Pro

```bash
# Verificar se agent está online
# Backend deve mostrar agent conectado

# Verificar fingerprint
# Deve ser exatamente o mesmo nos dois lados

# Verificar logs do gateway
# Procurar por "sendPrintJob"
```

---

## 📚 Referências

**Tagment (base):**
- `/Volumes/DadosTiago/Dev/Tagment/apps/api/src/agents/`
- `/Volumes/DadosTiago/Dev/Tagment/apps/api/PRINT_AGENT_WEBSOCKET_GUIDE.md`

**Edge-Pi (base):**
- `/Volumes/DadosTiago/Dev/granobox/apps/edge-pi/`
- `/Volumes/DadosTiago/Dev/granobox/apps/edge-pi/README.md`

**Edge-Go (referência):**
- `/Volumes/DadosTiago/Dev/granobox/apps/edge-go/`

---

## 🎯 Próximo Passo

**Começar AGORA pelo Backend:**

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/api
npm run nest -- g module modules/edge
```

**Tempo estimado total: 2-3 semanas** ⏱️

---

**Mantenha o foco. Faça simples. Teste sempre. 🚀**


