# Multi-stage build para otimizar o tamanho da imagem
FROM node:18-alpine AS builder

# Instalar dependências necessárias para compilação
RUN apk add --no-cache python3 make g++

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação NestJS
RUN npm run build

# Estágio de produção
FROM node:18-alpine AS production

# Instalar dependências de runtime
RUN apk add --no-cache dumb-init

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar node_modules e build da etapa anterior
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Criar diretório de uploads se necessário
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Health check - verificar se a API está respondendo
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode < 500 ? 0 : 1) })" || exit 1

# Comando de inicialização com dumb-init para gerenciamento de processos
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
