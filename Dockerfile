# Dockerfile para Granobox - Otimizado para Easypanel
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Stage 1: Instalar dependências
FROM base AS deps
COPY apps/web/package*.json ./
RUN npm install --only=production && npm cache clean --force

# Stage 2: Build da aplicação
FROM base AS builder
COPY apps/web/package*.json ./
COPY apps/web/prisma ./prisma/
RUN npm install
COPY apps/web/ ./

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação Next.js
RUN npm run build

# Stage 3: Imagem de produção
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar apenas dependências de runtime
RUN apk add --no-cache libc6-compat

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Expor porta
EXPOSE 3000

# Definir variáveis de ambiente
ENV PORT=3000
ENV NODE_ENV=production

# Mudar para usuário não-root
USER nextjs

# Comando para iniciar a aplicação
CMD ["node", "server.js"] 