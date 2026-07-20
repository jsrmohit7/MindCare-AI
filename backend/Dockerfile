# =========================================================
# Stage 1: Build Dependencies
# =========================================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system utilities needed for building packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into a wheels directory
RUN pip install --no-cache-dir --user -r requirements.txt

# =========================================================
# Stage 2: Final Production Release
# =========================================================
FROM python:3.12-slim AS runner

WORKDIR /app

# Disable bytecode generation and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install curl for health check utility
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root system user and group
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -d /app -s /sbin/nologin appuser

# Copy installed Python packages from the builder stage
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# Copy project source files
COPY --chown=appuser:appgroup . .

# Set permissions
RUN chmod -R 755 /app

# Switch to the non-root runner user
USER appuser

# Expose port
EXPOSE 8000

# Configure production Docker health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production startup command
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
