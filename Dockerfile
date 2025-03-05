# Imagem base Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar o código-fonte
COPY . .

# Compilar o frontend
WORKDIR /app/client
RUN npm install && npm run build

# Voltar para o diretório principal
WORKDIR /app

# Expor a porta que a aplicação utiliza
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"]
