FROM python:3.12-slim

# Install uv + curl (for healthcheck)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY external/open-trading-api/backtester/pyproject.toml ./
COPY external/open-trading-api/backtester/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy source
COPY external/open-trading-api/backtester/ .

ENV PYTHONUNBUFFERED=1

EXPOSE 8002

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8002"]
