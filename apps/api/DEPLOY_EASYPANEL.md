# Deploy da API Granobox no Easypanel

## 📋 Pré-requisitos

- Conta no Easypanel
- Repositório Git (GitHub, GitLab, etc.)
- Domínio configurado (opcional)

## 🚀 Passos para Deploy

### 1. Preparar Variáveis de Ambiente

No Easypanel, configure as seguintes variáveis:

```bash
# Banco de dados
DATABASE_URL=postgresql://granobox:${POSTGRES_PASSWORD}@granobox-db:5432/granobox

# Autenticação JWT
JWT_SECRET=sua-chave-jwt-super-segura-aqui-min-32-caracteres
JWT_EXPIRES_IN=7d

# CORS (domínios permitidos)
CORS_ORIGINS=https://granobox.com,https://www.granobox.com,https://app.granobox.com

# Senha do PostgreSQL
POSTGRES_PASSWORD=sua-senha-super-segura
```

### 2. Configurar no Easypanel

1. **Criar novo projeto** no Easypanel
2. **Conectar repositório** Git
3. **Usar o arquivo** `easypanel.yml` ou configurar manualmente

#### Configuração Manual:

**Serviço da API:**
- **Nome:** granobox-api
- **Tipo:** Build from source
- **Dockerfile:** `Dockerfile`
- **Porta:** 3001
- **Domínio:** api.granobox.com (ou seu domínio)

**Serviço do Banco:**
- **Nome:** granobox-db
- **Tipo:** PostgreSQL 15
- **Volume:** granobox-db-data
- **Porta:** 5432

### 3. Configurar Domínio

1. Aponte seu domínio para o IP do Easypanel
2. Configure SSL automático
3. Atualize `CORS_ORIGINS` com seus domínios

### 4. Executar Migrações

Após o primeiro deploy, execute as migrações do TypeORM:

```bash
# No terminal do container da API
npm run typeorm:migration:run
```

## 🔧 Configurações Importantes

### Recursos Recomendados:
- **CPU:** 0.5 vCPU
- **RAM:** 512MB (mínimo 256MB)
- **Storage:** 1GB para aplicação + volume para banco

### URLs da API:
- **Base:** `https://api.granobox.com`
- **Health Check:** `https://api.granobox.com/api/health`
- **Documentação:** `https://api.granobox.com/api/docs`
- **Login:** `https://api.granobox.com/auth/login`

## 🏥 Monitoramento

### Health Check
- **Endpoint:** `/api/health`
- **Método:** GET
- **Resposta esperada:** `{"status": "ok", "timestamp": "...", "uptime": 3600}`

### Logs
Monitore os logs no painel do Easypanel para:
- Erros de conexão com banco
- Problemas de autenticação
- Performance da aplicação

## 📱 Configuração do Flutter

Após o deploy, atualize o Flutter para usar a URL de produção:

```dart
// Em lib/config/app_config.dart
static const String _prodApiUrl = 'https://api.granobox.com/api';
```

## 🔄 Atualizações

Para atualizar a API:

1. Faça push das mudanças para o repositório
2. O Easypanel fará rebuild automático
3. A API será reiniciada automaticamente

## 🚨 Troubleshooting

### Problemas Comuns:

1. **API não inicia:**
   - Verifique as variáveis de ambiente
   - Confirme se o banco está rodando

2. **CORS errors:**
   - Adicione seu domínio em `CORS_ORIGINS`
   - Verifique se o domínio está correto

3. **Banco não conecta:**
   - Verifique `DATABASE_URL`
   - Confirme se o PostgreSQL está rodando

### Logs Úteis:
```bash
# Ver logs da API
docker logs granobox-api

# Ver logs do banco
docker logs granobox-db
```
