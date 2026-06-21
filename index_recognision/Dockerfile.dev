FROM python:3.11-slim
COPY requirements.txt ./
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

COPY cacheLoader.py .

RUN python cacheLoader.py

# Remove cacheLoader.py after execution
RUN rm cacheLoader.py

# Now copy the rest of the application code
COPY . .

CMD ["python", "main.py"]
