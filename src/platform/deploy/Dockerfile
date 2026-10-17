FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 RUNTIME_DIR=/data

# gcc is only needed to build pycryptodome from source on s390x (no wheel); removed afterwards
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && pip install --no-cache-dir fastapi==0.143.3 uvicorn==0.54.0 httpx==0.28.1 pycryptodome==4.0.0 \
 && apt-get purge -y build-essential && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

RUN useradd --uid 10001 --create-home app && mkdir /data && chown app:app /data
WORKDIR /app
COPY audit/auditlog.py /app/audit/auditlog.py
COPY api/app.py /app/api/app.py
COPY api/tiers.json /app/api/tiers.json
USER app
WORKDIR /app/api
EXPOSE 8000
CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
