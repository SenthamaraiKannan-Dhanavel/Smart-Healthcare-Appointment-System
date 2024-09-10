from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer, SpecialtySerializer, AppointmentSerializer, AppointmentCreateSerializer, DoctorAvailabilitySerializer
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from .models import Appointment, User, Specialty, DoctorAvailability
from django.contrib.auth.hashers import make_password
import logging
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from datetime import datetime, timedelta, time
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import pytz
from django.utils.timezone import is_aware, make_aware
from django.utils import timezone as tz
from django.contrib.auth import authenticate
from .email_utils import send_booking_confirmation, send_cancellation_notification, send_reschedule_notification
from django.conf import settings  # Add this import at the top of the file
from django.db.models import Q

User = get_user_model()

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        username = request.data.get('username')
        password = request.data.get('password')
        logger.debug(f"Login attempt for user: {username}")
        
        try:
            user = User.objects.get(username=username)
            logger.debug(f"User found: {user.username}, is_active: {user.is_active}")
        except User.DoesNotExist:
            logger.debug(f"User not found: {username}")
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(password):
            logger.debug(f"Invalid password for user: {username}")
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.is_active:
            logger.debug(f"User is not active: {username}")
            return Response({'error': 'User account is disabled'}, status=status.HTTP_400_BAD_REQUEST)
        
        token, created = Token.objects.get_or_create(user=user)
        logger.debug(f"Login successful for user: {user.username}, is_doctor: {user.is_doctor}")
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'is_doctor': user.is_doctor
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_dashboard(request):
    appointments = Appointment.objects.filter(patient=request.user).exclude(status='Cancelled').select_related('doctor', 'doctor__specialty')
    serializer = AppointmentSerializer(appointments, many=True)
    return Response({'appointments': serializer.data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doctor_dashboard(request):
    if not request.user.is_doctor:
        return Response({'error': 'Only doctors can access this dashboard'}, status=403)
    
    appointments = Appointment.objects.filter(doctor=request.user).select_related('patient')
    serializer = AppointmentSerializer(appointments, many=True)
    return Response({'appointments': serializer.data})

@api_view(['GET'])
@permission_classes([AllowAny])
def get_specialties(request):
    specialties = Specialty.objects.all()
    serializer = SpecialtySerializer(specialties, many=True)
    print("Specialties data:", serializer.data)  # Add this line
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_doctors_by_specialty(request):
    specialty_id = request.GET.get('specialty')
    if not specialty_id:
        return Response({'error': 'Specialty parameter is required'}, status=400)
    
    try:
        specialty = Specialty.objects.get(id=specialty_id)
    except Specialty.DoesNotExist:
        return Response({'error': f'Specialty with id {specialty_id} not found'}, status=404)
    
    doctors = User.objects.filter(is_doctor=True, specialty=specialty)
    
    print(f"Specialty: {specialty.name}")
    print(f"Number of doctors found: {doctors.count()}")
    print(f"Doctors: {[f'{doctor.id}: {doctor.get_full_name()}' for doctor in doctors]}")
    
    serializer = UserSerializer(doctors, many=True)
    return Response(serializer.data)

def send_appointment_update(user_id, message):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{user_id}',
        {
            'type': 'appointment_update',
            'message': message
        }
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def book_appointment(request):
    serializer = AppointmentCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        doctor = serializer.validated_data['doctor']
        appointment_date = serializer.validated_data['date']
        
        logger.info(f"Attempting to book appointment: Doctor: {doctor}, Date: {appointment_date}")
        
        if not is_aware(appointment_date):
            appointment_date = make_aware(appointment_date, pytz.UTC)
        else:
            appointment_date = appointment_date.astimezone(pytz.UTC)
        
        date_obj = appointment_date.date()
        time_obj = appointment_date.time()
        
        availability = DoctorAvailability.objects.filter(
            doctor=doctor,
            date=date_obj,
            start_time__lte=time_obj,
            end_time__gt=time_obj,
            is_available=True
        ).first()
        
        logger.info(f"Availability found: {availability}")
        
        if not availability:
            logger.warning(f"No availability found for Doctor: {doctor}, Date: {date_obj}, Time: {time_obj}")
            return Response({'error': 'This slot is not available'}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_appointment = Appointment.objects.filter(
            doctor=doctor,
            date=appointment_date,
            status='Scheduled'
        ).exists()
        
        logger.info(f"Existing appointment found: {existing_appointment}")
        
        if existing_appointment:
            logger.warning(f"Slot already booked: Doctor: {doctor}, Date: {appointment_date}")
            return Response({'error': 'This slot is already booked'}, status=status.HTTP_400_BAD_REQUEST)
        
        appointment = serializer.save(date=appointment_date, status='Scheduled')
        
        logger.info(f"Appointment booked successfully: {appointment}")
        
        send_appointment_update(appointment.patient.id, {
            'action': 'booked',
            'appointment': AppointmentSerializer(appointment).data
        })
        send_appointment_update(appointment.doctor.id, {
            'action': 'booked',
            'appointment': AppointmentSerializer(appointment).data
        })
        
        logger.info(f"Sending booking confirmation email to {appointment.patient.email}")
        send_booking_confirmation(appointment)
        
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)
    logger.error(f"Invalid appointment data: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_appointment(request, appointment_id):
    try:
        appointment = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user != appointment.patient and request.user != appointment.doctor:
        return Response({'error': 'You do not have permission to cancel this appointment'}, status=status.HTTP_403_FORBIDDEN)

    appointment.status = 'Cancelled'
    appointment.save()

    send_appointment_update(appointment.patient.id, {
        'action': 'cancelled',
        'appointment_id': appointment.id
    })
    send_appointment_update(appointment.doctor.id, {
        'action': 'cancelled',
        'appointment_id': appointment.id
    })

    logger.info(f"Sending cancellation notification email to {appointment.patient.email}")
    send_cancellation_notification(appointment, 'patient' if request.user == appointment.patient else 'doctor')

    return Response({'message': 'Appointment cancelled successfully'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reschedule_appointment(request, appointment_id):
    try:
        appointment = Appointment.objects.get(id=appointment_id, patient=request.user)
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    new_date_str = request.data.get('date')
    if not new_date_str:
        return Response({'error': 'New date is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Parse the datetime string and make it timezone-aware
        new_date = parse_datetime(new_date_str)
        if new_date is None:
            raise ValueError("Invalid date format")
        if not is_aware(new_date):
            new_date = make_aware(new_date, timezone=pytz.UTC)
        
        # Store the new date in UTC
        appointment.date = new_date
        appointment.save()

    except ValueError:
        return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)

    old_date = appointment.date
    
    # Serialize the updated appointment
    serialized_appointment = AppointmentSerializer(appointment).data

    send_appointment_update(appointment.patient.id, {
        'action': 'rescheduled',
        'appointment': serialized_appointment,
        'old_date': old_date.isoformat()
    })
    send_appointment_update(appointment.doctor.id, {
        'action': 'rescheduled',
        'appointment': serialized_appointment,
        'old_date': old_date.isoformat()
    })

    logger.info(f"Sending reschedule notification email to {appointment.patient.email}")
    send_reschedule_notification(appointment, old_date)

    return Response({
        'message': 'Appointment rescheduled successfully',
        'appointment': serialized_appointment
    }, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def doctor_availability(request):
    if not request.user.is_doctor:
        return Response({'error': 'Only doctors can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        availabilities = DoctorAvailability.objects.filter(doctor=request.user)
        serializer = DoctorAvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = DoctorAvailabilitySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(doctor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def doctor_availability_detail(request, pk):
    if not request.user.is_doctor:
        return Response({'error': 'Only doctors can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    try:
        availability = DoctorAvailability.objects.get(pk=pk, doctor=request.user)
    except DoctorAvailability.DoesNotExist:
        return Response({'error': 'Availability not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = DoctorAvailabilitySerializer(availability, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        availability.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import DoctorAvailability, Appointment, User
from django.utils import timezone
from datetime import datetime, timedelta

@require_http_methods(["GET"])
def doctor_available_slots(request, doctor_id, date):
    try:
        doctor = User.objects.get(Q(username=doctor_id) | Q(id=doctor_id), is_doctor=True)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Doctor not found'}, status=404)
    except ValueError:
        try:
            doctor = User.objects.get(username=doctor_id, is_doctor=True)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Doctor not found'}, status=404)

    try:
        requested_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'error': 'Invalid date format'}, status=400)

    # Get doctor's availability for the requested date
    availabilities = DoctorAvailability.objects.filter(doctor=doctor, date=requested_date)

    if not availabilities:
        return JsonResponse({'error': 'No availability for the selected date'}, status=404)

    # Get existing appointments for the doctor on the requested date
    existing_appointments = Appointment.objects.filter(
        doctor=doctor,
        date__date=requested_date,
        status='Scheduled'
    )

    all_slots = []
    for availability in availabilities:
        start_time = datetime.combine(requested_date, availability.start_time)
        end_time = datetime.combine(requested_date, availability.end_time)
        current_slot = start_time

        while current_slot < end_time:
            slot_end = current_slot + timedelta(minutes=30)
            is_available = not existing_appointments.filter(date__gte=current_slot, date__lt=slot_end).exists()
            
            all_slots.append({
                'time': current_slot.strftime('%H:%M'),
                'available': is_available
            })
            
            current_slot = slot_end

    return JsonResponse({'all_slots': all_slots})
