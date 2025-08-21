# Aplicação Offline para Impressora Térmica - Granobox

## 📋 Visão Geral

Este documento apresenta as opções de aplicação offline para trabalhar com impressoras térmicas no Granobox, permitindo impressão mesmo quando a aplicação web principal estiver indisponível.

## 🎯 Soluções Implementadas

### 1. **Serviço Offline Expandido** (Implementado)

**Localização:** `bluetooth-service/`

**Características:**
- ✅ Fila de impressão com persistência local (SQLite)
- ✅ Processamento automático a cada 10 segundos
- ✅ Retry automático (até 3 tentativas)
- ✅ Interface web de monitoramento
- ✅ WebSocket para atualizações em tempo real
- ✅ Descoberta automática de impressoras Bluetooth
- ✅ Instalação como serviço do sistema
- ✅ Fallback para impressão direta

**Como usar:**
```bash
cd bluetooth-service
npm install
npm start

# Instalar como serviço
npm run install-service
```

**Acesso:**
- API: http://localhost:3001
- Interface: http://localhost:3001
- WebSocket: ws://localhost:3002

### 2. **Integração Híbrida** (Implementado)

**Localização:** `app/api/imprimir-separacao-offline/route.ts`

**Funcionamento:**
1. Tenta enviar para o serviço offline primeiro
2. Se falhar, executa impressão direta
3. Retorna informação sobre qual método foi usado

**Vantagens:**
- Funciona online e offline
- Transparente para o usuário
- Melhor confiabilidade

## 🚀 Outras Opções Recomendadas

### 3. **Aplicação Desktop com Electron**

**Vantagens:**
- Interface familiar (React/HTML)
- Acesso completo ao sistema
- Pode reutilizar código existente
- Funciona completamente offline

**Estrutura sugerida:**
```
granobox-desktop/
├── main.js              # Processo principal Electron
├── renderer/            # Interface React
├── printer/             # Módulo de impressão
├── sync/                # Sincronização com web app
└── package.json
```

**Funcionalidades:**
- Interface para configurar impressoras
- Visualizar e gerenciar fila de impressão
- Sincronização bidirecional com web app
- Notificações de desktop
- Auto-update

### 4. **Aplicação Mobile (React Native)**

**Vantagens:**
- Portabilidade (tablets na cozinha)
- Conexão Bluetooth nativa
- Interface touch otimizada
- Funciona offline

**Funcionalidades:**
- Conectar impressoras via Bluetooth
- Receber comandos via API/WebSocket
- Interface simplificada para cozinha
- Sincronização quando online

### 5. **Serviço Windows/Linux Nativo**

**Vantagens:**
- Máxima performance
- Integração profunda com SO
- Menor consumo de recursos
- Mais estável para produção

**Tecnologias:**
- **Windows:** C# + .NET Service
- **Linux:** Go/Rust + systemd
- **macOS:** Swift + LaunchAgent

## 📊 Comparação das Soluções

| Solução | Complexidade | Offline | Performance | Manutenção |
|---------|-------------|---------|-------------|------------|
| Serviço Node.js | ⭐⭐ | ✅ | ⭐⭐⭐ | ⭐⭐⭐ |
| Electron | ⭐⭐⭐ | ✅ | ⭐⭐ | ⭐⭐ |
| React Native | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ | ⭐⭐ |
| Nativo | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ | ⭐ |

## 🔧 Implementação Recomendada

### Fase 1: Usar Serviço Atual (Implementado)
- Expandir o `bluetooth-service` existente
- Adicionar mais funcionalidades conforme necessário
- Testar em ambiente de produção

### Fase 2: Aplicação Desktop (Opcional)
Se precisar de interface mais rica:

```bash
# Criar aplicação Electron
npm install -g electron
mkdir granobox-desktop
cd granobox-desktop
npm init -y
npm install electron --save-dev
```

### Fase 3: Mobile (Futuro)
Para tablets na cozinha:

```bash
# Criar app React Native
npx react-native init GranoboxPrinter
cd GranoboxPrinter
npm install react-native-bluetooth-serial
```

## 🛠️ Configuração de Produção

### 1. Instalar Serviço

**Windows:**
```bash
cd bluetooth-service
npm run install-service
# Seguir instruções para adicionar ao startup
```

**macOS:**
```bash
cd bluetooth-service
npm run install-service
# Serviço será instalado automaticamente
```

**Linux:**
```bash
cd bluetooth-service
sudo npm run install-service
sudo systemctl enable granobox-printer
sudo systemctl start granobox-printer
```

### 2. Configurar Firewall

Permitir portas 3001 e 3002 para comunicação local.

### 3. Monitoramento

- Interface web: http://localhost:3001
- Logs do serviço conforme plataforma
- WebSocket para atualizações em tempo real

## 📱 Casos de Uso

### Cenário 1: Cozinha com Tablet
- Tablet Android/iPad na cozinha
- App mobile conecta via Bluetooth
- Recebe comandos da web app via WebSocket
- Funciona offline com sincronização

### Cenário 2: Computador Dedicado
- PC/Mac dedicado na cozinha
- Serviço rodando em background
- Interface web para monitoramento
- Impressão automática via fila

### Cenário 3: Híbrido
- Serviço no servidor principal
- Apps mobile como backup
- Web app usa ambos conforme disponibilidade

## 🔍 Próximos Passos

1. **Testar serviço atual** em ambiente real
2. **Coletar feedback** dos usuários
3. **Identificar limitações** específicas
4. **Decidir** se precisa de app desktop/mobile
5. **Implementar** solução escolhida

## 📞 Suporte

Para dúvidas sobre implementação:
- Verificar logs do serviço
- Testar conectividade (http://localhost:3001/api/status)
- Verificar configuração da impressora
- Consultar interface web de monitoramento

---

**Recomendação:** Comece com o serviço Node.js expandido (já implementado) e evolua conforme necessidade. 