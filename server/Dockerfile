FROM node:18-alpine
WORKDIR /app

# Install dependencies (including dev deps so `tsx` and `typescript` are available)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Run TypeScript directly with tsx so imports can remain extensionless (.ts)
CMD ["npx", "tsx", "src/index.ts"]
