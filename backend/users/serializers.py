from rest_framework import serializers
from .models import User, Appointment, Specialty, DoctorAvailability
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware, is_aware
from django.conf import settings
import pytz
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_doctor', 'specialty', 'specialty_name', 'full_name']
        extra_kwargs = {'password': {'write_only': True}}

    def get_full_name(self, obj):
        return obj.get_full_name()

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_doctor=validated_data.get('is_doctor', False),
            specialty=validated_data.get('specialty')
        )
        return user

class AppointmentSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    date = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S%z")

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'date', 'reason', 'status']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Ensure the date is in UTC
        utc_date = instance.date.astimezone(pytz.UTC)
        representation['date'] = utc_date.strftime("%Y-%m-%dT%H:%M:%S%z")
        return representation

class AppointmentCreateSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(input_formats=['iso-8601'])

    class Meta:
        model = Appointment
        fields = ['doctor', 'date', 'reason']

    def create(self, validated_data):
        validated_data['patient'] = self.context['request'].user
        return super().create(validated_data)

# Add the DoctorAvailabilitySerializer
class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorAvailability
        fields = ['id', 'doctor', 'date', 'start_time', 'end_time', 'is_available']
        read_only_fields = ['doctor']

# ... other serializers ...
