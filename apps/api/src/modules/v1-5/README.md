# API v1.5 - Endpoint de Impressão Simplificado

## 📋 Visão Geral

O endpoint `/v1.5/print-label` simplifica a impressão de etiquetas movendo toda a lógica de processamento para o backend.

### ❌ Antes (v1)
```
Flutter → Tagment API (gera ZPL) → Flutter recebe ZPL → Granobox API → Edge-Go
```

### ✅ Agora (v1.5)
```
Flutter → Granobox API v1.5 (processa template + envia) → Edge-Go
```

---

## 🎯 Endpoint

```
POST /v1.5/print-label
Authorization: Bearer <token>
```

---

## 📊 Tipos de Etiquetas

### 1. `validity` - Etiqueta de Validade (Rastreável)

✅ **Características:**
- Cada etiqueta tem código único (QR Code/Barcode)
- Cria registros na tabela `labels`
- Usado para rastreabilidade
- Campo `metadata` é obrigatório

**Exemplo de Request:**
```json
{
  "printerId": "edge-go-d7e2b4",
  "labelType": "validity",
  "templateId": "1c12926f-849b-4bd7-8a61-05036f39f443",
  "copies": 5,
  "labelData": {
    "produto": "Manteiga",
    "marca": "Laticínios São João",
    "dataManipulacao": "30/11/2025",
    "dataValidade": "30/12/2025",
    "qtdPeso": "500G",
    "responsavel": "Tiago L",
    "armazenamento": "Geladeira 1",
    "conservacao": "ambiente"
  },
  "metadata": {
    "productId": "uuid-produto",
    "operationId": "uuid-operation",
    "storageLocationId": "uuid-local",
    "conservationType": "refrigerado",
    "productionDate": "2025-11-30",
    "validityDate": "2025-12-30"
  },
  "offsets": {
    "x": 0,
    "y": 0
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-1733012345678-abc123",
  "message": "5 etiqueta(s) enviada(s) para impressão",
  "labels": [
    { "id": "uuid-1", "code": "Q4A4C8" },
    { "id": "uuid-2", "code": "B2X9K1" },
    { "id": "uuid-3", "code": "M7P3F2" },
    { "id": "uuid-4", "code": "R8T5D9" },
    { "id": "uuid-5", "code": "K3N7H6" }
  ],
  "details": {
    "printer": "Impressora Principal",
    "copies": 5,
    "zplBytes": 12450,
    "timestamp": "2025-11-30T14:30:00.000Z"
  }
}
```

**Fluxo Backend:**
1. Cria 5 registros na tabela `labels` (cada um com código único)
2. Processa template 5 vezes (cada um com seu código)
3. Concatena os 5 ZPLs
4. Envia para Edge-Go

---

### 2. `label` - Rótulo Genérico (Não Rastreável)

✅ **Características:**
- Todas as etiquetas são idênticas
- NÃO cria registros no banco
- Usado para etiquetas de preço, informações
- Campo `metadata` é opcional

**Exemplo de Request:**
```json
{
  "printerId": "edge-go-d7e2b4",
  "labelType": "label",
  "templateId": "template-rotulo-preco",
  "copies": 10,
  "labelData": {
    "produto": "Manteiga",
    "preco": "R$ 15,00",
    "validade": "30/12/2025",
    "logo": "uuid-logo"
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-1733012345678-xyz789",
  "message": "10 etiqueta(s) enviada(s) para impressão",
  "details": {
    "printer": "Impressora Principal",
    "copies": 10,
    "zplBytes": 2490,
    "timestamp": "2025-11-30T14:35:00.000Z"
  }
}
```

**Fluxo Backend:**
1. Processa template 1 vez
2. Adiciona comando ZPL `^PQ10` (Print Quantity)
3. Envia para Edge-Go

---

## 📐 Offsets (Ajuste de Posição)

Use `offsets` para ajustar a posição da etiqueta:

```json
{
  "offsets": {
    "x": 10,   // Move 10 pontos para a direita
    "y": -5    // Move 5 pontos para cima
  }
}
```

---

## 🚀 Vantagens

| Vantagem | Descrição |
|----------|-----------|
| **Simplicidade** | Flutter só envia dados, não processa ZPL |
| **Segurança** | API Key do Tagment não vai para o cliente |
| **Performance** | Processamento no servidor é mais rápido |
| **Rastreabilidade** | Todos os prints são logados no backend |
| **Manutenibilidade** | Lógica centralizada, fácil de atualizar |
| **Códigos Únicos** | Backend garante unicidade dos códigos |

---

## 🛠️ Estrutura Técnica

### Arquivos Criados

```
apps/api/src/modules/v1-5/
├── dto/
│   └── print-label.dto.ts        # DTOs e validações
├── v1-5.controller.ts            # Controller REST
├── v1-5.service.ts               # Lógica de negócio
└── v1-5.module.ts                # Módulo NestJS
```

### Dependências

- `TagmentModule` - Processar templates
- `EdgeModule` - WebSocket para Edge-Go
- `PrintersModule` - Validar impressoras
- `LabelsModule` - Criar etiquetas rastreáveis

---

## 🔍 Logs

O endpoint gera logs detalhados:

```
📋 [v1.5] Print label request: { labelType: 'validity', copies: 5, ... }
📦 [v1.5] Creating 5 validity labels...
✅ [v1.5] Created 5 labels: ['Q4A4C8', 'B2X9K1', 'M7P3F2', 'R8T5D9', 'K3N7H6']
✅ [v1.5] Generated 5 ZPLs (12450 bytes)
🚀 [v1.5] Sending to Edge-Go: edge-go-d7e2b4
   Job ID: job-1733012345678-abc123
   ZPL size: 12450 bytes
   Copies: 5
   Label IDs: uuid-1, uuid-2, uuid-3, uuid-4, uuid-5
✅ [v1.5] Job sent successfully: job-1733012345678-abc123
```

---

## ⚠️ Validações

### Para `labelType=validity`:
- ✅ `metadata.productId` é obrigatório
- ✅ `metadata.validityDate` é obrigatório
- ✅ Impressora deve estar `active`
- ✅ Edge-Go deve estar conectado

### Para `labelType=label`:
- ✅ `copies` deve estar entre 1 e 100
- ✅ Impressora deve estar `active`
- ✅ Edge-Go deve estar conectado

---

## 🧪 Testando

### Com cURL:

```bash
# Validity (rastreável)
curl -X POST http://localhost:3000/v1.5/print-label \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "printerId": "edge-go-d7e2b4",
    "labelType": "validity",
    "templateId": "1c12926f-849b-4bd7-8a61-05036f39f443",
    "copies": 3,
    "labelData": {
      "produto": "Manteiga",
      "dataValidade": "30/12/2025"
    },
    "metadata": {
      "productId": "uuid-produto",
      "validityDate": "2025-12-30"
    }
  }'

# Label (genérico)
curl -X POST http://localhost:3000/v1.5/print-label \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "printerId": "edge-go-d7e2b4",
    "labelType": "label",
    "templateId": "template-preco",
    "copies": 10,
    "labelData": {
      "produto": "Manteiga",
      "preco": "R$ 15,00"
    }
  }'
```

---

## 📚 Próximos Passos

1. ✅ Backend implementado
2. 🔄 Atualizar Flutter para usar o novo endpoint
3. 🧪 Testar impressão com múltiplas etiquetas
4. 📊 Adicionar métricas e analytics


