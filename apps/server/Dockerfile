# ============================================
# VECTRYS Backend — Dockerfile Production
# Multi-stage build optimisé
# ============================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances (y compris devDependencies pour le build)
RUN npm install

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY . .

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

# Installer curl + openssl pour health checks et Prisma
RUN apk add --no-cache curl openssl

# Copier les dépendances de production uniquement
COPY package*.json ./
RUN npm install --omit=dev

# Copier le client Prisma généré
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copier le code source et les migrations Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server ./server
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/services ./services
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/src ./src
COPY --from=builder /app/config ./config

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S vectrys -u 1001 -G nodejs

# Créer les dossiers nécessaires
RUN mkdir -p /app/uploads /app/logs && \
    chown -R vectrys:nodejs /app

USER vectrys

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Script de démarrage : migrations Prisma + serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node server/index.js"]
