import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Appointment
from datetime import timedelta
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()

@shared_task
def send_appointment_reminder(appointment_id):
    from .models import Appointment  # Import here to avoid circular import
    
    logger.info(f"Celery task send_appointment_reminder[{appointment_id}] started")
    
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        logger.info(f"Found appointment: {appointment}")
        
        subject = 'Appointment Reminder'
        message = f'This is a reminder for your appointment with Dr. {appointment.doctor.get_full_name()} on {appointment.date}'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [appointment.patient.email]
        
        logger.info(f"Sending email to {recipient_list}")
        send_mail(subject, message, from_email, recipient_list)
        
        logger.info("Email sent successfully")
    except Exception as e:
        logger.error(f"Error in send_appointment_reminder task: {str(e)}")

    logger.info(f"Celery task send_appointment_reminder[{appointment_id}] completed")