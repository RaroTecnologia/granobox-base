# Dockerfile para Granobox API - Otimizado para Easypanel
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Stage 1: Instalar dependências
FROM base AS deps
COPY apps/api/package*.json ./
RUN npm install --only=production && npm cache clean --force

# Stage 2: Build da aplicação
FROM base AS builder
COPY apps/api/package*.json ./
RUN npm install
COPY apps/api/ ./

# Build da aplicação NestJS
RUN npm run build

# Stage 3: Imagem de produção
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar apenas dependências de runtime
RUN apk add --no-cache libc6-compat

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copiar arquivos necessários
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Expor porta
EXPOSE 3001

# Definir variáveis de ambiente
ENV PORT=3001
ENV NODE_ENV=production

# Mudar para usuário não-root
USER nestjs

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"] 