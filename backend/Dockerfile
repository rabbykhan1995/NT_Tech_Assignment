# FROM oven/bun:1 AS base
# WORKDIR /app

# COPY package.json bun.lockb ./
# RUN bun install --frozen-lockfile

# COPY . .

# EXPOSE 5000
# CMD ["bun", "index.ts"]


FROM oven/bun:1 AS base
WORKDIR /app

# শুধু package.json কপি করুন (লক ফাইল বাদ দিন)
COPY package.json ./

# লক ফাইল না থাকলে bun নিজেই সেটা বানিয়ে নেবে
RUN bun install

COPY . .

EXPOSE 5000
CMD ["bun", "index.ts"]