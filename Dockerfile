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
WORKDIR /app
# Copiar dependências do backend
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package*.json ./
# Copiar código fonte do backend
COPY --from=server-builder /app/src ./src
# Copiar build do frontend
COPY --from=client-builder /app/client/build ./client/build
# Copiar arquivos de configuração e outros necessários
COPY --from=server-builder /app/.env* ./

# Expor a porta que a aplicação utiliza
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"]
