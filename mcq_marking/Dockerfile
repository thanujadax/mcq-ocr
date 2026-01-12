FROM python:3.11-slim

# Install build dependencies for numpy and other packages
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry with pip
RUN pip install poetry

# Disable Poetry virtualenvs (we're already in a container)
RUN poetry config virtualenvs.create false

WORKDIR /app

# Copy dependency files first (for better caching)
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# Copy the rest of your application
COPY . .

# Run the RabbitMQ worker
CMD ["python", "-m", "app.main"]
