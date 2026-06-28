# Muallim

Muallim is a UAE-focused micro-learning marketplace connecting students with teachers for personalized learning sessions. The platform facilitates teacher discovery, direct messaging, calendar scheduling with automated timezone conversion, secure payment processing simulation, platform-generated video meeting links, and post-session teacher reviews.

## Key Features

- User Authentication and Roles: Login and registration with distinct workflows for students, teachers, and administrators.
- Email Verification: Secure verification process required before booking or teaching.
- Admin Panel: Verification queue for reviewing teacher applications with support for approval and custom rejection reasons.
- Profile Settings: Custom profile pictures, bio details, location settings, and timezone management.
- Availability Management: Teachers can set a recurring weekly availability grid using 30-minute or 60-minute slots, configuring their primary duration setting (30 or 60 minutes) which default-selects the booking length for students.
- Strict Session Duration Isolation: 30-minute and 60-minute availability blocks generate distinct, isolated booking slots. The system prevents contiguous 30-minute blocks from merging into 60-minute slots or 60-minute blocks from splitting into 30-minute slots.
- Real-Time Slot Booking: Dynamic calendar booking screen showing available times in the viewer's local timezone. Students can select between 30-minute and 60-minute session tabs if both availability blocks are configured.
- Double-Booking Prevention: Automatic backend and frontend slot checking. Booked slots are immediately removed from the available list.
- Automated Meeting Links: Randomly generated Google Meet style meeting URLs are attached to confirmed bookings.
- Feedback System: Students can review and rate teachers on communication, punctuality, and teaching quality.

## Tech Stack

### Backend
- Django and Django REST Framework (DRF)
- PostgreSQL database (production/Docker)
- zoneinfo (Python 3.9+) for timezone management
- Django Mail for admin notifications and verification alerts

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Lucide React icons

### Containerization
- Docker and Docker Compose

## Getting Started

### Prerequisites
- Docker and Docker Compose (recommended)
- Node.js (v18+) and npm (if running frontend locally)
- Python (v3.11+) (if running backend locally)

### Setup Environment Variables
Create a `.env` file in the project root directory. Use the following template:

```env
SECRET_KEY=your-django-secret-key-here
DEBUG=True

# PostgreSQL configuration (used by Docker Compose)
DATABASE_URL=postgresql://postgres:admin123@db:5432/muallim

# Google OAuth Client ID (optional)
GOOGLE_CLIENT_ID=your-google-client-id

# Email Settings for Alerts and Verification
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Running with Docker Compose

To build and launch the database, Django backend, and React frontend containers:

```bash
docker compose up --build
```

The services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin (create a superuser using the command below to access)

To create a superuser for access to the Django Admin panel:

```bash
docker compose exec backend python manage.py createsuperuser
```

### Running Locally without Docker

#### 1. Database
Make sure you have PostgreSQL running locally, or modify `DATABASE_URL` in `.env` to point to a local SQLite database (e.g. `sqlite:///db.sqlite3`).

#### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment and activate it:
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

Run database migrations:
```bash
python manage.py migrate
```

Start the Django development server:
```bash
python manage.py runserver
```

#### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```

Install npm packages:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The frontend will run at http://localhost:5173 (or another port output by Vite).

## Timezone Architecture

Muallim handles scheduling seamlessly across different timezones:
- Database Storage: All booking datetimes are stored in UTC (`USE_TZ = True` in settings).
- Weekly Availability: Teachers define recurring slots in their local timezone.
- Dynamic Conversion: When a student views a teacher's schedule, the slots are converted from the teacher's timezone to the student's timezone.
- Booking Validation: The backend validates timezone-aware datetimes to ensure a slot is within the teacher's availability and does not overlap with any existing bookings.

## Running Tests

To run the backend test suite inside Docker:
```bash
docker compose exec backend python manage.py test
```

To run the tests locally:
```bash
cd backend
python manage.py test
```
