FROM node:20-slim
WORKDIR /home/app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
