from django.urls import path
from .views import RegisterView, LoginView, patient_dashboard, doctor_dashboard, cancel_appointment, reschedule_appointment
from . import views

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('patient-dashboard/', patient_dashboard, name='patient_dashboard'),
    path('doctor-dashboard/', doctor_dashboard, name='doctor_dashboard'),
    path('specialties/', views.get_specialties, name='get_specialties'),
    path('doctors-by-specialty/', views.get_doctors_by_specialty, name='doctors-by-specialty'),
    path('book-appointment/', views.book_appointment, name='book_appointment'),
    path('cancel-appointment/<int:appointment_id>/', cancel_appointment, name='cancel_appointment'),
    path('reschedule-appointment/<int:appointment_id>/', views.reschedule_appointment, name='reschedule_appointment'),
    path('doctor-availability/', views.doctor_availability, name='doctor_availability'),
    path('doctor-availability/<int:pk>/', views.doctor_availability_detail, name='doctor_availability_detail'),
    path('doctor-available-slots/<int:doctor_id>/<str:date>/', views.doctor_available_slots, name='doctor_available_slots'),
]
