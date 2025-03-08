# Estágio de build para o frontend
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Estágio de build para o backend
FROM node:18-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Remover a pasta client original, pois só precisamos dos arquivos compilados
RUN rm -rf client

# Imagem final
FROM node:18-alpine
LABEL maintainer="Marcus Vinicius <marcussviniciusa@gmail.com>"
LABEL version="1.1.0"
LABEL description="Speed Funnels - Aplicação para sincronização em tempo real de dados de anúncios do Meta"

WORKDIR /app

# Copiar dependências do backend
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package*.json ./

# Copiar código fonte do backend
COPY --from=server-builder /app/src ./src

# Copiar build do frontend
COPY --from=client-builder /app/client/build ./client/build

# Copiar arquivos de configuração e outros necessários
COPY --from=server-builder /app/database ./database
COPY --from=server-builder /app/.env.example ./

# Criar diretório para logs
RUN mkdir -p /app/logs

# Criar variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001
ENV ENABLE_CRON_JOBS=true
ENV RUN_MIGRATIONS=true
ENV META_SYNC_INTERVAL=realtime
ENV LOG_LEVEL=info

# Expor a porta que a aplicação utiliza
EXPOSE 3001

# Define o volume para persistência dos logs
VOLUME ["/app/logs"]

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"]
