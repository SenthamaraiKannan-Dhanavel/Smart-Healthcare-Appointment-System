from django.core.management.base import BaseCommand
from users.models import Specialty

class Command(BaseCommand):
    help = 'Adds initial specialties to the database'

    def handle(self, *args, **kwargs):
        specialties = [
            'Cardiology',
            'Dermatology',
            'Endocrinology',
            'Gastroenterology',
            'Neurology',
            'Oncology',
            'Pediatrics',
            'Psychiatry',
            'Orthopedics',
            'Urology'
        ]

        for specialty_name in specialties:
            Specialty.objects.get_or_create(name=specialty_name)
            self.stdout.write(self.style.SUCCESS(f'Successfully added specialty: {specialty_name}'))

        self.stdout.write(self.style.SUCCESS('Successfully added all specialties'))