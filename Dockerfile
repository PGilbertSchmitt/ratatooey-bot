FROM node:25-slim
WORKDIR /app
COPY . /app
RUN apt-get update
RUN apt-get -y install sqlite3
RUN npm install --global pnpm
RUN pnpm install
CMD ["pnpm", "start"]