# 📋 Edge-Pro - Sumário Executivo

## 🎯 O Que É

**Edge-Pro** é um dispositivo IoT (Raspberry Pi) que conecta impressoras USB ao ecossistema Granobox via WebSocket, permitindo impressão de etiquetas em tempo real.

## 🏗️ Arquitetura Simplificada

```
┌─────────────┐
│ Flutter App │  (apps/tag/flutter)
└──────┬──────┘
       │ HTTP REST
       ▼
┌─────────────┐
│  Backend    │  (apps/api - NestJS)
│  Granobox   │
└──────┬──────┘
       │ WebSocket (Socket.IO)
       ▼
┌─────────────┐
│  Edge-Pro   │  (Go - baseado em edge-pi)
└──────┬──────┘
       │ USB
       ▼
┌─────────────┐
│ Impressora  │  (Zebra, C3TECH, etc)
└─────────────┘
```

## 📦 Componentes

### 1. **Backend Granobox** (`apps/api/src/modules/edge/`)

**Copiar do Tagment:**
- `agents.gateway.ts` → `edge.gateway.ts`
- `agents.service.ts` → `edge.service.ts`
- `agents.module.ts` → `edge.module.ts`

**Eventos WebSocket:**
```typescript
// Cliente → Servidor
- agent-register
- heartbeat
- print-job-status

// Servidor → Cliente
- print-job
- heartbeat-ack
- connection-established
```

**Endpoints REST:**
```
GET  /edge/devices
POST /edge/devices/:id/generate-key
POST /edge/print
```

### 2. **Edge-Pro** (`apps/edge-pro/`)

**Baseado em:** `apps/edge-pi`

**Estrutura:**
```
apps/edge-pro/
├── cmd/edge-pro/main.go
├── internal/
│   ├── websocket/     (Socket.IO client)
│   ├── printer/       (USB printer)
│   ├── display/       (Python service)
│   └── config/
├── pkg/logger/
└── configs/
```

**Diferenças do edge-pi:**
- ✅ Conecta em `api.granobox.com.br` (não Tagment)
- ❌ Remove MQTT client
- ❌ Remove servidor Socket.IO local
- ✅ Mantém display Python
- ✅ Mantém printer USB

### 3. **Templates** (Tagment - sem mudanças)

- Continua gerenciado no Tagment
- Apenas admins acessam
- Backend Granobox consulta API Tagment

## 🚀 Fluxo de Impressão

```
1. Usuário cria etiqueta no web-vite
   └─► Frontend chama backend Granobox

2. Backend processa template (consulta Tagment)
   └─► Gera ZPL

3. Backend envia job via WebSocket
   └─► Edge-Pro recebe evento 'print-job'

4. Edge-Pro imprime via USB
   └─► Envia status via 'print-job-status'

5. Backend atualiza status
   └─► Frontend mostra confirmação
```

## ⏱️ Cronograma

### Fase 1: Backend (3-4 dias)
- Criar módulo `edge`
- Implementar WebSocket gateway
- Testar com mock client

### Fase 2: Edge-Pro (4-5 dias)
- Copiar base do edge-pi
- Adaptar Socket.IO client
- Testar conexão

### Fase 3: Integração (2-3 dias)
- Deploy staging
- Teste E2E
- Ajustes

### Fase 4: Produção (1-2 dias)
- Documentação
- Deploy
- Treinamento

**Total: ~2-3 semanas**

## 🔑 Checklist de Sucesso

### Backend ✅
- [ ] WebSocket `/agents` respondendo
- [ ] Agent consegue se registrar
- [ ] Jobs sendo enviados
- [ ] Status sendo recebido

### Edge-Pro ✅
- [ ] Conecta no WebSocket
- [ ] Registra com sucesso
- [ ] Recebe jobs
- [ ] Imprime via USB
- [ ] Reporta status

### Integração ✅
- [ ] Flutter → Backend → Edge-Pro → Impressora
- [ ] Status em tempo real
- [ ] Logs ok

## 📚 Documentação

- **README.md** - Guia de instalação e uso
- **PLAN_SIMPLE.md** - Plano de implementação detalhado
- **PRODUCT_STRATEGY.md** - Estratégia de produtos
- **SUMMARY.md** - Este arquivo

## 🎯 Diferencial

| Produto | Público | Conexão | Backend |
|---------|---------|---------|---------|
| Edge-Go | Pequeno negócio | TCP direto | Sem backend |
| Edge-Pi | SaaS (Tagment) | WebSocket | Tagment |
| Edge-Pro | Granobox | WebSocket | Granobox |

## 💡 Por Que Simplicidade

1. **Rápido para implementar** - 2-3 semanas
2. **Menos bugs** - Código mais simples
3. **Fácil manutenção** - Menos componentes
4. **Reutiliza código** - edge-pi + Tagment gateway
5. **Foco no essencial** - Impressão online primeiro

## 🔮 Futuro (Depois de Funcionar)

- Queue offline com SQLite
- Sync automático
- TCP fallback (porta 9100)
- Múltiplas impressoras
- BLE configuration
- Dashboard web local

## 🚦 Próximo Passo

Começar pelo **Backend** (mais fácil de testar):

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/api

# Criar módulo
nest g module edge
nest g service edge
nest g gateway edge/edge
```

Depois copiar lógica do Tagment:
```bash
# Ver estrutura
ls -la /Volumes/DadosTiago/Dev/Tagment/apps/api/src/agents/
```

---

**Mantenha simples. Faça funcionar. Depois melhore. 🎯**


