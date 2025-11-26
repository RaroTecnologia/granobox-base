# 🏷️ Sistema de Versionamento de Firmware Edge-Go

## 🎯 **Visão Geral**

Sistema completo para gerenciar versões de firmware dos dispositivos Edge-Go, incluindo:

- ✅ **Versionamento automático** baseado em Git tags
- ✅ **Registro de firmwares** disponíveis no backend
- ✅ **Monitoramento de versões** da frota de dispositivos
- ✅ **Verificação automática** de atualizações
- ✅ **Comparação semântica** de versões
- ✅ **Integração com OTA** via WebSocket

---

## 🚀 **Como Usar**

### **1. Desenvolvimento e Build**

```bash
# Navegar para o projeto Edge-Go-WS
cd apps/edge-go-ws/

# Build com versionamento automático
./build_with_version.sh

# Build limpo (remove cache)
./build_with_version.sh --clean

# Apenas atualizar versão (sem build)
./scripts/auto-version.sh

# Atualizar versão e fazer commit
./scripts/auto-version.sh --commit
```

### **2. Versionamento Baseado em Git**

```bash
# Criar uma nova versão
git tag v1.2.3
git push origin v1.2.3

# Build automático usará a tag
./build_with_version.sh
# Resultado: EDGE_GO_VERSION "1.2.3"

# Desenvolvimento (sem tag)
./build_with_version.sh
# Resultado: EDGE_GO_VERSION "1.2.2-dev.5+abc1234"
```

### **3. Registrar Firmware no Backend**

```bash
# Após build bem-sucedido, registrar no backend
curl -X POST http://localhost:3001/firmware/versions \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.2.3",
    "type": "edge-go-ws",
    "status": "stable",
    "description": "Correções de bugs e melhorias de performance",
    "checksum": "sha256-hash-do-firmware",
    "fileSize": 1048576,
    "gitTag": "v1.2.3",
    "idfVersion": "5.1.0",
    "chipTarget": "esp32s3"
  }'
```

### **4. Monitorar Frota de Dispositivos**

```bash
# Resumo geral da frota
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3001/firmware/fleet/summary

# Dispositivos que precisam de atualização
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3001/firmware/fleet/outdated

# Versão de um dispositivo específico
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3001/firmware/devices/edge-go-abc123/version
```

---

## 📊 **Endpoints da API**

### **Gerenciamento de Firmware**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/firmware/versions` | Registrar nova versão |
| `GET` | `/firmware/versions` | Listar versões disponíveis |
| `GET` | `/firmware/versions/latest` | Versão mais recente |

### **Monitoramento de Dispositivos**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/firmware/devices/:id/version` | Versão do dispositivo |
| `GET` | `/firmware/devices/:id/check-updates` | Verificar atualizações |
| `POST` | `/firmware/devices/:id/version` | Atualizar versão reportada |

### **Monitoramento da Frota**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/firmware/fleet/summary` | Resumo das versões |
| `GET` | `/firmware/fleet/outdated` | Dispositivos desatualizados |

---

## 🔄 **Fluxo Automático**

### **1. Quando o Edge-Go se conecta:**

```
Edge-Go → WebSocket → Backend
├── Envia version_info com versão atual
├── Backend salva no banco (device_versions)
├── Backend verifica se precisa atualização
└── Log: "Dispositivo X precisa atualização: 1.0.0 -> 1.2.3"
```

### **2. Verificação de Atualizações:**

```typescript
// Automático a cada version_info
const updateCheck = await firmwareService.checkForUpdates(deviceId);

if (updateCheck.needsUpdate) {
  console.log(`🔄 ${deviceId}: ${updateCheck.currentVersion} -> ${updateCheck.latestVersion}`);
  
  // Opcional: Notificar dispositivo
  websocket.send({
    type: 'update_available',
    latestVersion: updateCheck.latestVersion
  });
}
```

### **3. Processo de OTA:**

```bash
# 1. Verificar versão atual
curl /edge-go-ws/device/edge-go-abc123/version

# 2. Iniciar OTA
curl -X POST /edge-go-ws/device/edge-go-abc123/ota \
  -d '{"version": "1.2.3", "firmware": "base64...", "checksum": "sha256..."}'

# 3. Monitorar progresso via WebSocket
# 4. Confirmar sucesso
```

---

## 📈 **Exemplo de Dashboard**

```json
{
  "fleetSummary": {
    "totalDevices": 150,
    "upToDate": 120,
    "needsUpdate": 30,
    "versions": [
      {"version": "1.2.3", "count": 120, "percentage": 80},
      {"version": "1.2.2", "count": 20, "percentage": 13},
      {"version": "1.2.1", "count": 10, "percentage": 7}
    ]
  },
  "outdatedDevices": [
    {
      "deviceId": "edge-go-abc123",
      "currentVersion": "1.2.1",
      "targetVersion": null,
      "lastCheck": "2025-11-26T10:30:00Z",
      "needsUpdate": true
    }
  ]
}
```

---

## 🛠️ **Arquivos Criados**

### **Backend (API)**
- `src/modules/firmware/firmware.module.ts` - Módulo principal
- `src/modules/firmware/firmware.service.ts` - Lógica de negócio
- `src/modules/firmware/firmware.controller.ts` - Endpoints REST
- `src/modules/firmware/entities/firmware-version.entity.ts` - Entidade de versões
- `src/modules/firmware/entities/device-version.entity.ts` - Entidade de dispositivos
- `migrations/1732640000000-create-firmware-tables.sql` - Migração do banco

### **Firmware (ESP32)**
- `apps/edge-go-ws/scripts/auto-version.sh` - Versionamento automático
- `apps/edge-go-ws/build_with_version.sh` - Build com versionamento
- `apps/edge-go-ws/build_info.json` - Metadados do build (gerado)
- `apps/edge-go-ws/build/firmware_info.json` - Info do firmware (gerado)

### **Integração**
- Modificações em `edge-go-websocket.gateway.ts` para salvar versões automaticamente
- Modificações em `mqtt.module.ts` para incluir `FirmwareModule`

---

## 🎯 **Próximos Passos**

1. **Executar migração** do banco de dados
2. **Testar versionamento** com build local
3. **Registrar primeira versão** via API
4. **Implementar dashboard** no Flutter (opcional)
5. **Configurar CI/CD** para versionamento automático

---

## 🔍 **Comandos de Teste**

```bash
# 1. Testar versionamento
cd apps/edge-go-ws/
./scripts/auto-version.sh

# 2. Build com versão
./build_with_version.sh

# 3. Verificar versão gerada
grep EDGE_GO_VERSION main/config.h

# 4. Ver metadados
cat build_info.json
cat build/firmware_info.json

# 5. Testar API (após migração)
curl http://localhost:3001/firmware/versions/latest?type=edge-go-ws
```

**🎉 Sistema completo de versionamento implementado!**
