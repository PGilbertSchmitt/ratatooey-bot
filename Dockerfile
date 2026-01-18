FROM node:22-slim
WORKDIR /app
COPY . /app
RUN apt-get update
RUN apt-get -y install make python3 sqlite3
RUN npm install --global pnpm
RUN pnpm install
CMD ["pnpm", "start"]