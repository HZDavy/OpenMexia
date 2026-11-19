# OpenMexia Web 版镜像：服务端复用米家登录与设备控制，浏览器只负责界面。
# 构建：docker build -t openmexia-web .
# 运行：docker run -d -p 8787:8787 -e OPENMEXIA_WEB_TOKEN=你的口令 -v ./data:/data openmexia-web

# ---- 构建阶段：TypeScript 编译 + 渲染层打包 ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

# 只需要类型定义，跳过 Electron 二进制下载
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- 运行阶段：只保留生产依赖与构建产物 ----
FROM node:20-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/build ./build

# 容器内必须监听 0.0.0.0 才能被映射出去；对外访问需要口令（见环境变量说明）
ENV HOST=0.0.0.0 \
    PORT=8787 \
    OPENMEXIA_DATA_DIR=/data

EXPOSE 8787
VOLUME ["/data"]

CMD ["node", "build/server.js"]
