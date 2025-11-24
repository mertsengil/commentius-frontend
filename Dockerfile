# ---------- AŞAMA 1: Build ----------
    FROM node:20-alpine AS builder

    # Çalışma dizini
    WORKDIR /app
    
    # Bağımlılık dosyaları
    COPY package.json package-lock.json ./
    RUN npm install --legacy-peer-deps
    
    # Tüm kaynakları kopyala
    COPY . .
    
    # Production build al
    RUN npm run build
    
    # ---------- AŞAMA 2: Production ----------
    FROM node:20-alpine
    
    # Çalışma dizini
    WORKDIR /app
    
    # Yalnızca çalışmak için gereken dosyaları kopyala
    COPY --from=builder /app/package.json ./
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/next.config.ts ./next.config.ts
    COPY --from=builder /app/tsconfig.json ./tsconfig.json
    
    # Next.js uygulamasını başlat (EXPOSE kullanılmaz)
    CMD ["npx", "next", "start"]
    # Portu aç    