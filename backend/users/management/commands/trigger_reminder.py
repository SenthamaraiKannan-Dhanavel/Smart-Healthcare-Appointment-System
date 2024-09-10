from django.core.management.base import BaseCommand
from users.tasks import send_appointment_reminder
from users.models import Appointment
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Trigger appointment reminders'

    def handle(self, *args, **options):
        logger.info("Starting trigger_reminder command")
        
        now = timezone.now()
        upcoming_appointments = Appointment.objects.filter(
            date__gt=now,
            date__lte=now + timezone.timedelta(days=1)
        )
        
        logger.info(f"Found {upcoming_appointments.count()} upcoming appointments")
        
        for appointment in upcoming_appointments:
            logger.info(f"Sending reminder for appointment {appointment.id}")
            send_appointment_reminder.delay(appointment.id)  # Use .delay() to send task to Celery
        
        logger.info("trigger_reminder command completed")