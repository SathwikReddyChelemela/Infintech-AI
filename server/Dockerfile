FROM python:3.12-slim

# Prevents Python from writing pyc files and enables unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first (leverage Docker layer caching)
COPY server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY server/ ./server/
WORKDIR /app/server

EXPOSE 8000

# Start FastAPI with Uvicorn (no reload in containers)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
