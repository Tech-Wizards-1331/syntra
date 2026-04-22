from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_profile_complete', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        PARTICIPANT = 'participant', 'Participant'
        ORGANIZER = 'organizer', 'Organizer'
        JUDGE = 'judge', 'Judge'
        VOLUNTEER = 'volunteer', 'Volunteer'
        SUPER_ADMIN = 'super_admin', 'Super Admin'
        COORDINATOR = 'coordinator', 'Coordinator'

    ROLE_CHOICES = (
        (Role.PARTICIPANT, 'Participant'),
        (Role.ORGANIZER, 'Organizer'),
        (Role.JUDGE, 'Judge'),
        (Role.VOLUNTEER, 'Volunteer'),
        (Role.SUPER_ADMIN, 'Super Admin'),
        (Role.COORDINATOR, 'Coordinator'),
    )

    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=True, null=True)
    is_profile_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email