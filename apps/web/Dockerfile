# Dockerfile para Granobox - Otimizado para Easypanel
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Stage 1: Instalar dependências
FROM base AS deps
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Stage 2: Build da aplicação
FROM base AS builder
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .

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

# Copiar arquivos necessários do builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar arquivos do Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Definir permissões
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Comando de inicialização
CMD ["node", "server.js"] 