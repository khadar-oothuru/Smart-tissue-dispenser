

# Backend Dockerfile (Django Production)
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project files
COPY . /app

# Install python-dotenv for .env support
RUN pip install python-dotenv gunicorn

# Collect static files and run migrations
RUN python manage.py collectstatic --noinput || true
RUN python manage.py migrate || true

EXPOSE 8000

# Start Gunicorn with .env support
CMD ["gunicorn", "backend.wsgi:application", "--bind", "127.0.0.1:8000"]
