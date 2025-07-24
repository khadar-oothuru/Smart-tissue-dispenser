# smart_tissue_web Dockerfile (Vite/React)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Increase npm fetch timeout and retry npm install up to 3 times
RUN npm config set fetch-timeout 60000 && npm install || npm install || npm install
COPY . ./
EXPOSE 5173
CMD ["npm", "run", "dev"]
