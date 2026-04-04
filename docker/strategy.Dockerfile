FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install dependencies
COPY external/open-trading-api/strategy_builder/pyproject.toml ./
COPY external/open-trading-api/strategy_builder/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy source
COPY external/open-trading-api/strategy_builder/ .
COPY external/open-trading-api/kis_devlp.yaml ./kis_devlp.yaml 2>/dev/null || true

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
