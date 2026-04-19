FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p db uploads
EXPOSE 4000
CMD ["node", "server.js"]
