from django.core.management.base import BaseCommand
from users.models import User, Specialty
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Adds test doctors to the database'

    def handle(self, *args, **kwargs):
        specialties = Specialty.objects.all()
        
        for i, specialty in enumerate(specialties):
            username = f'doctor{i+1}'
            email = f'doctor{i+1}@example.com'
            password = make_password('testpassword')
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'password': password,
                    'is_doctor': True,
                    'specialty': specialty
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created doctor: {username}'))
            else:
                self.stdout.write(self.style.WARNING(f'Doctor {username} already exists'))

        self.stdout.write(self.style.SUCCESS('Successfully added all test doctors'))