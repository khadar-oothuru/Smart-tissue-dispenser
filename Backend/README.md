# Smart Dispenser Backend

This is the backend API for the Smart Dispenser project, built with Django, Django REST Framework, Channels (WebSocket support), and PostgreSQL.

## Features
- JWT authentication (SimpleJWT)
- Google OAuth support
- WebSocket support via Django Channels and Redis
- CORS enabled for frontend integration
- Swagger/OpenAPI documentation
- Custom user model

---

## Prerequisites
- Python 3.9+
- PostgreSQL database
- Redis server (for Channels and caching)
- [pipenv](https://pipenv.pypa.io/en/latest/) or `pip` for dependency management

---

## Setup Instructions

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd Backend
```

### 2. Create and Activate Virtual Environment
#### Using venv (recommended)
```sh
python -m venv myenv
# On Windows:
myenv\Scripts\activate
# On Linux/Mac:
source myenv/bin/activate
```

### 3. Install Dependencies
```sh
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the `Backend/` directory with the following content:

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Database
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/1

# Email
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_email_password

# Google OAuth
GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id
```

---

## Database Setup
1. Ensure PostgreSQL is running and the database/user exist as per your `.env`.
2. Run migrations:
```sh
python manage.py migrate
```

---

## Create Superuser (for Django Admin)
```sh
python manage.py createsuperuser
```

---

## Run the Development Server
```sh
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`.

---

## API Documentation
Swagger/OpenAPI docs are available at:
- `http://127.0.0.1:8000/swagger/`
- `http://127.0.0.1:8000/redoc/`

---

## Running Tests
```sh
python manage.py test
```

---

## Notes
- Make sure Redis and PostgreSQL are running before starting the server.
- For production, set `DEBUG=False` and use strong, unique values for all secrets.
- Do **not** commit your `.env` file or sensitive credentials to version control.

---

## Project Structure
```
Backend/
├── backend/           # Django project settings
├── core/              # Core app
├── device/            # Device app
├── users/             # Users app
├── requirements.txt   # Python dependencies
├── manage.py          # Django management script
└── ...
```

---

