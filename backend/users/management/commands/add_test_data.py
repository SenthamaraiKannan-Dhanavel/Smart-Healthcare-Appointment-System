from django.core.management.base import BaseCommand
from users.models import User, Specialty, Appointment, DoctorAvailability
from django.utils import timezone
from datetime import date, time, timedelta

class Command(BaseCommand):
    help = 'Adds test data to the database'

    def handle(self, *args, **kwargs):
        # Create specialties
        cardiology = Specialty.objects.create(name='Cardiology')
        neurology = Specialty.objects.create(name='Neurology')

        # Create doctors
        User.objects.create_user(
            username='doctor1',
            email='doctor1@example.com',
            password='password123',
            is_doctor=True,
            specialty=cardiology,
            first_name='John',
            last_name='Doe'
        )
        User.objects.create_user(
            username='doctor2',
            email='doctor2@example.com',
            password='password123',
            is_doctor=True,
            specialty=neurology,
            first_name='Jane',
            last_name='Smith'
        )

        # Create doctor availabilities
        doctor1 = User.objects.get(username='doctor1')
        DoctorAvailability.objects.create(
            doctor=doctor1,
            date=date(2024, 9, 11),
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_available=True
        )

        # Create doctor availabilities for the next 30 days
        start_date = date.today()
        for i in range(30):
            current_date = start_date + timedelta(days=i)
            DoctorAvailability.objects.create(
                doctor=doctor1,
                date=current_date,
                start_time=time(9, 0),
                end_time=time(17, 0),
                is_available=True
            )

        # Create a test appointment for 2 hours from now
        test_patient = User.objects.filter(is_doctor=False).first()
        test_doctor = User.objects.filter(is_doctor=True).first()
        
        if test_patient and test_doctor:
            appointment_time = timezone.now() + timedelta(hours=2)
            Appointment.objects.create(
                patient=test_patient,
                doctor=test_doctor,
                date=appointment_time,
                reason="Test appointment for reminder",
                status="Scheduled"
            )
            self.stdout.write(self.style.SUCCESS(f'Created test appointment for {appointment_time}'))

        self.stdout.write(self.style.SUCCESS('Successfully added test data'))