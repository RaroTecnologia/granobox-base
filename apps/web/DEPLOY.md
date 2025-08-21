# Deploy do Granobox no Easypanel

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

# Autenticação (gere uma chave secreta)
NEXTAUTH_SECRET=sua-chave-secreta-super-segura-aqui

# URL da aplicação
NEXTAUTH_URL=https://seu-dominio.com

# Senha do PostgreSQL
POSTGRES_PASSWORD=sua-senha-super-segura
```

### 2. Configurar no Easypanel

1. **Criar novo projeto** no Easypanel
2. **Conectar repositório** Git
3. **Usar o arquivo** `easypanel.yml` ou configurar manualmente:

#### Configuração Manual:

**Serviço da Aplicação:**
- **Nome:** granobox-app
- **Tipo:** Build from source
- **Dockerfile:** `Dockerfile`
- **Porta:** 3000
- **Domínio:** seu-dominio.com

**Serviço do Banco:**
- **Nome:** granobox-db
- **Tipo:** PostgreSQL 15
- **Volume:** granobox-db-data
- **Porta:** 5432

### 3. Configurar Domínio

1. Aponte seu domínio para o IP do Easypanel
2. Configure SSL automático
3. Atualize `NEXTAUTH_URL` com seu domínio

### 4. Executar Migrações

Após o primeiro deploy, execute as migrações do Prisma:

```bash
# No terminal do container
npx prisma db push
```

## 🔧 Configurações Importantes

### Recursos Recomendados:
- **CPU:** 0.5 vCPU
- **RAM:** 512MB (mínimo 256MB)
- **Storage:** 1GB para aplicação + volume para banco

### Variáveis de Ambiente Opcionais:
```bash
# Para impressão (se necessário)
PRINTER_IP=192.168.1.100
PRINTER_PORT=9100

# Para logs
LOG_LEVEL=info
```

## 🏥 Monitoramento

### Health Check
- **Endpoint:** `/api/health`
- **Método:** GET
- **Resposta esperada:** `{"status": "healthy"}`

### Logs
Monitore os logs no painel do Easypanel para:
- Erros de conexão com banco
- Problemas de impressão
- Performance da aplicação

## 🔄 Atualizações

Para atualizar a aplicação:
1. Faça push das mudanças para o repositório
2. O Easypanel fará rebuild automático
3. Verifique os logs durante o deploy

## 🐛 Troubleshooting

### Problemas Comuns:

**1. Erro de conexão com banco:**
```bash
# Verificar se DATABASE_URL está correto
# Verificar se o serviço do banco está rodando
```

**2. Erro de build (dependências nativas):**
```bash
# Se houver erro com módulos USB/nativos:
# As bibliotecas escpos e escpos-usb foram removidas para compatibilidade
# Use apenas node-thermal-printer que é mais estável
```

**3. Erro de impressão:**
```bash
# Verificar conectividade de rede com impressora
# Verificar configurações de impressora no sistema
# Para USB: pode não funcionar em containers Docker
# Recomendado: usar TCP/IP ou PDF
```

**4. Erro de Python/node-gyp:**
```bash
# O Dockerfile já inclui Python3 e ferramentas de build
# Se persistir, verifique se todas as dependências nativas foram removidas
```

## 📞 Suporte

Para problemas específicos do Granobox:
- Verifique os logs da aplicação
- Teste o endpoint `/api/health`
- Verifique as configurações de impressora em `/configuracoes/impressora`

## 🔐 Segurança

- Use senhas fortes para `POSTGRES_PASSWORD`
- Mantenha `NEXTAUTH_SECRET` seguro
- Configure HTTPS sempre
- Faça backups regulares do banco de dados 