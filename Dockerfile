# Dockerfile optimizado para Easypanel

# Dashboard Odontológico - Build multi-stage

# Etapa 1: Build de la aplicación React

FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias

COPY package*.json ./

# Instalar dependencias

RUN npm ci –only=production –silent

# Copiar código fuente

COPY . .

# Build para producción

RUN npm run build

# Etapa 2: Servir con Nginx

FROM nginx:1.25-alpine

# Copiar configuración de Nginx

COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos build desde la etapa anterior

COPY –from=builder /app/build /usr/share/nginx/html

# Crear directorio para logs

RUN mkdir -p /var/log/nginx

# Exponer puerto (Easypanel manejará el mapping)

EXPOSE 80

# Comando de inicio

CMD [“nginx”, “-g”, “daemon off;”]
