from celery import shared_task
from celery.schedules import crontab
from django.utils import timezone
from smart_healthcare.celery import app

@shared_task
def schedule_appointment_reminders():
    from users.models import Appointment
    from users.tasks import send_appointment_reminder
    
    now = timezone.now()
    upcoming_appointments = Appointment.objects.filter(
        date__gt=now,
        date__lte=now + timezone.timedelta(days=1)
    )
    for appointment in upcoming_appointments:
        send_appointment_reminder.delay(appointment.id)

app.conf.beat_schedule = {
    'send-appointment-reminders': {
        'task': 'smart_healthcare.celery_beat.schedule_appointment_reminders',
        'schedule': crontab(minute='*/15'),  # Run every 15 minutes
    },
}