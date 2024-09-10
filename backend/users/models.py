from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    is_doctor = models.BooleanField(default=False)
    specialty = models.ForeignKey('Specialty', on_delete=models.SET_NULL, null=True, blank=True)

    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    # Add this property
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    # Override the groups field
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
    )

    # Override the user_permissions field
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.',
    )

    def __str__(self):
        return self.username

class Specialty(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Appointment(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_appointments')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments')
    date = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=20, default='Scheduled')

    def __str__(self):
        return f"{self.patient.username} - {self.doctor.username} - {self.date}"

class DoctorAvailability(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availabilities')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        unique_together = ('doctor', 'date', 'start_time', 'end_time')

    def __str__(self):
        return f"{self.doctor.username} - {self.date} {self.start_time}-{self.end_time}"
