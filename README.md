# Smart Healthcare Appointment System

A comprehensive web application designed to streamline the process of scheduling and managing healthcare appointments. This system caters to both patients and healthcare providers, offering a user-friendly interface for booking appointments, managing schedules, and facilitating efficient communication between all parties involved.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact Information](#contact-information)

## Features

### For Patients:
1. User Registration and Authentication
2. Browse and Select Healthcare Providers by Specialty
3. View Available Appointment Slots
4. Book, Reschedule, and Cancel Appointments
5. Receive Appointment Reminders
6. Access Personal Appointment History

### For Healthcare Providers:
1. Manage Personal Profile and Specialties
2. Set and Update Availability
3. View Upcoming Appointments
4. Approve or Reject Appointment Requests
5. Access Patient Information for Scheduled Appointments

### System Features:
1. Real-time Updates using WebSocket Technology
2. Automated Email Notifications
3. Secure Authentication and Authorization
4. Responsive Design for Various Devices

## Project Structure

The project is organized into two main directories:

- `frontend/`: Contains the Angular application
- `backend/`: Contains the Django application

Key files and directories:

```
smart-healthcare-appointment/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── app.component.ts
│   │   └── main.ts
│   ├── angular.json
│   └── package.json
├── backend/
│   ├── smart_healthcare/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── appointments/
│   ├── users/
│   └── manage.py
├── docker-compose.yml
├── Dockerfile
├── backend/Dockerfile
└── README.md

```
## Tech Stack

### Frontend:
- Angular 18.2.0
- Angular Material 18.2.3
- TypeScript 5.5.2
- HTML5 & CSS3
- Tailwind CSS 3.4.10
- Bootstrap 5.3.3
- jQuery 3.7.1

### Backend:
- Django 5.0.2
- Django REST Framework 3.14.0
- Python 3.10
- PostgreSQL 13
- Redis (for caching and as message broker)

### Task Queue and Scheduling:
- Celery (for background tasks and scheduling)

### WebSocket:
- Django Channels (for real-time communication)

### Containerization:
- Docker
- Docker Compose

### Deployment:
- Kubernetes (K8s) for orchestration

## Prerequisites

- Node.js (v18 or later)
- Python (3.10 or later)
- PostgreSQL
- Redis
- Docker and Docker Compose (for containerized deployment)
- Kubernetes (for production deployment)
- jQuery (3.7.1 or later)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/smart-healthcare-appointment.git
   cd smart-healthcare-appointment
   ```

2. Set up the frontend:
   ```
   cd frontend
   npm install
   ```

3. Set up the backend:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

## Configuration

1. Create a `.env` file in the backend directory with the following content:
   ```
   DEBUG=True
   SECRET_KEY=your_secret_key
   DATABASE_URL=postgres://user:password@localhost:5432/dbname
   REDIS_URL=redis://localhost:6379/0
   EMAIL_HOST=smtp.your-email-provider.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=your-email@example.com
   EMAIL_HOST_PASSWORD=your-email-password
   EMAIL_USE_TLS=True
   ```

2. Update the `docker-compose.yml` file with your database credentials and other environment-specific settings.

## Usage

1. Start the backend server:
   ```
   cd backend
   python manage.py migrate
   python manage.py runserver
   ```

2. Start the Celery worker and beat:
   ```
   celery -A smart_healthcare worker -l info
   celery -A smart_healthcare beat -l info
   ```

3. Start the frontend development server:
   ```
   cd frontend
   ng serve
   ```

4. Access the application at `http://localhost:4200`

## API Documentation

The main API endpoints include:

- `/api/users/register/`: User registration
- `/api/users/login/`: User login
- `/api/users/patient-dashboard/`: Patient dashboard data
- `/api/users/doctor-dashboard/`: Doctor dashboard data
- `/api/users/specialties/`: List of medical specialties
- `/api/users/doctors-by-specialty/`: List doctors by specialty
- `/api/users/doctor-available-slots/`: Get available appointment slots
- `/api/users/book-appointment/`: Book an appointment
- `/api/users/reschedule-appointment/`: Reschedule an appointment
- `/api/users/cancel-appointment/`: Cancel an appointment

For detailed API documentation, refer to the Django REST Framework browsable API interface available at `http://localhost:8000/api/`.

## Database Schema

The main models in the application include:

- User: Extends Django's built-in User model
- Doctor: Represents a healthcare provider
- Patient: Represents a patient
- Appointment: Stores appointment information
- Specialty: Represents medical specialties
- Availability: Stores doctor availability

For a detailed database schema, refer to the models defined in the Django app's `models.py` files.

## Testing

To run the backend tests:

```
cd backend
python manage.py test
```

To run the frontend tests:

```
cd frontend
ng test
```

## Deployment

### Docker Deployment

1. Build and run the containers:
   ```
   docker-compose up --build
   ```

2. Access the application at `http://localhost:4200` for the frontend and `http://localhost:8000` for the backend API.

### Kubernetes Deployment

1. Ensure you have `kubectl` installed and configured to connect to your Kubernetes cluster.

2. Apply the Kubernetes configurations:
   ```
   kubectl apply -f k8s/
   ```

3. Set up an Ingress controller or LoadBalancer service to expose your application to the internet.

## Contributing

We welcome contributions to the Smart Healthcare Appointment System. Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact Information

For support or questions, please contact me at https://www.linkedin.com/in/senthamarai-kannan-dhanavel.

---

Thank you for your interest in the Smart Healthcare Appointment System!
