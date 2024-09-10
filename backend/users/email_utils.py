import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def send_appointment_email(subject, message, recipient_list):
    try:
        sent = send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            recipient_list,
            fail_silently=False,
        )
        if sent:
            logger.info(f"Email sent successfully to {recipient_list}")
        else:
            logger.error(f"Failed to send email to {recipient_list}")
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")

def send_booking_confirmation(appointment):
    subject = 'Appointment Confirmation'
    message = f"""
    Dear {appointment.patient.get_full_name()},

    Your appointment with Dr. {appointment.doctor.get_full_name()} has been confirmed for {appointment.date}.

    Reason: {appointment.reason}

    Thank you for using our healthcare service.
    """
    recipient_list = [appointment.patient.email]
    send_appointment_email(subject, message, recipient_list)

def send_cancellation_notification(appointment, cancelled_by):
    subject = 'Appointment Cancellation'
    if cancelled_by == 'doctor':
        message = f"""
        Dear {appointment.patient.get_full_name()},

        We regret to inform you that your appointment with Dr. {appointment.doctor.get_full_name()} scheduled for {appointment.date} has been cancelled by the doctor.

        Please book a new appointment at your earliest convenience.

        We apologize for any inconvenience caused.
        """
    else:
        message = f"""
        Dear {appointment.patient.get_full_name()},

        This is to confirm that your appointment with Dr. {appointment.doctor.get_full_name()} scheduled for {appointment.date} has been cancelled as per your request.

        If you need to book a new appointment, please visit our website.

        Thank you for using our healthcare service.
        """
    recipient_list = [appointment.patient.email]
    send_appointment_email(subject, message, recipient_list)

def send_reschedule_notification(appointment, old_date):
    subject = 'Appointment Rescheduled'
    message = f"""
    Dear {appointment.patient.get_full_name()},

    Your appointment with Dr. {appointment.doctor.get_full_name()} has been rescheduled.

    Old date and time: {old_date}
    New date and time: {appointment.date}

    If this change doesn't work for you, please contact us to reschedule or cancel the appointment.

    Thank you for your understanding.
    """
    recipient_list = [appointment.patient.email]
    send_appointment_email(subject, message, recipient_list)