FROM node:22-slim
WORKDIR /app
COPY . /app
RUN apt-get update
RUN apt-get -y install python3 sqlite3 make g++
RUN npm install --global pnpm
RUN pnpm install
CMD ["pnpm", "start"]
