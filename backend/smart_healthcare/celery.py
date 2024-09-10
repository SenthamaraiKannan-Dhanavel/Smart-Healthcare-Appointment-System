import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_healthcare.settings')

app = Celery('smart_healthcare')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

# Move this to a separate file, e.g., smart_healthcare/celery_beat.py
# from users.tasks import send_appointment_reminder
# from users.models import Appointment
# from django.utils import timezone

# @app.task
# def schedule_appointment_reminders():
#     now = timezone.now()
#     upcoming_appointments = Appointment.objects.filter(
#         date__gt=now,
#         date__lte=now + timezone.timedelta(days=1)
#     )
#     for appointment in upcoming_appointments:
#         send_appointment_reminder.delay(appointment.id)

# # Update the beat schedule
# app.conf.beat_schedule = {
#     'send-appointment-reminders': {
#         'task': 'smart_healthcare.celery_beat.schedule_appointment_reminders',
#         'schedule': crontab(minute='*/15'),  # Run every 15 minutes
#     },
# }

app.conf.broker_connection_retry_on_startup = True