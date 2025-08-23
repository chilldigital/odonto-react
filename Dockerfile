# Dockerfile simple para debug

# Usar este si el multi-stage sigue fallando

FROM node:18-alpine

WORKDIR /app

# Instalar serve globalmente para servir la aplicación

RUN npm install -g serve

# Copiar archivos de dependencias

COPY package*.json ./

# Instalar dependencias

RUN npm install

# Copiar código fuente

COPY . .

# Build para producción

RUN npm run build

# Exponer puert

EXPOSE 3000

# Servir la aplicación con serve

CMD [“serve”, “-s”, “build”, “-l”, “3000”]
