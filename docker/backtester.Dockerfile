FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY external/open-trading-api/backtester/ .

RUN uv sync --no-dev

ENV PYTHONUNBUFFERED=1

EXPOSE 8002

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8002"]
