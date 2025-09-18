# Use the official Bun image
FROM oven/bun:1.2.21-slim as base

# Install necessary dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libxss1 \
    libdrm2 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create directory for WhatsApp session data
RUN mkdir -p /app/.wwebjs_auth && \
    mkdir -p /app/.wwebjs_cache && \
    chmod 755 /app/.wwebjs_auth && \
    chmod 755 /app/.wwebjs_cache

# Expose port (default 5000, can be overridden by ENV)
ARG PORT=5000
EXPOSE $PORT

# Set environment variables
ENV NODE_ENV=production
ENV PORT=${PORT:-5000}
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Create non-root user for security
RUN groupadd -r wagateway && useradd -r -g wagateway -s /bin/bash -m wagateway
RUN chown -R wagateway:wagateway /app

# Create necessary directories for Chrome
RUN mkdir -p /home/wagateway/.local/share/applications && \
    mkdir -p /home/wagateway/.config && \
    chown -R wagateway:wagateway /home/wagateway

# Switch to non-root user
USER wagateway

# Set Chrome flags for container environment
ENV CHROME_FLAGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-accelerated-2d-canvas --no-first-run --no-zygote --single-process --disable-gpu --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-features=TranslateUI"

# Start the application
CMD ["bun", "run", "index.ts"]
