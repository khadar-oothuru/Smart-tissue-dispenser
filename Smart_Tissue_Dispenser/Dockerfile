# Smart_Tissue_Dispenser Dockerfile (Expo web)
FROM node:20-alpine
WORKDIR /app
COPY . /app
RUN npm install -g expo && npm install && npx expo doctor --fix-dependencies || true
EXPOSE 8081
CMD ["npx", "expo", "start", "--web", "--non-interactive"]
