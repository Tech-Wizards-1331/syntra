import os

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def validate_pdf_file(value):
    """Allow only .pdf uploads."""
    ext = os.path.splitext(value.name)[1].lower()
    if ext != '.pdf':
        raise ValidationError('Only PDF files are allowed.')
    # Belt-and-suspenders: also check content-type when available
    if hasattr(value.file, 'content_type'):
        if value.file.content_type != 'application/pdf':
            raise ValidationError('Uploaded file is not a valid PDF.')


class OrganizerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organizer_profile',
    )
    organization_name = models.CharField(max_length=255, blank=True, default='')

    def __str__(self):
        return f'OrganizerProfile({self.user.email})'


class Hackathon(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        ONGOING = 'ongoing', 'Ongoing'
        COMPLETED = 'completed', 'Completed'

    class RegistrationStatus(models.TextChoices):
        UPCOMING = 'upcoming', 'Upcoming'
        OPEN     = 'open',     'Open'
        CLOSED   = 'closed',   'Closed'

    name        = models.CharField(max_length=255)
    description = models.TextField()
    start_date              = models.DateTimeField()
    end_date                = models.DateTimeField()
    registration_start      = models.DateTimeField()
    registration_deadline   = models.DateTimeField()

    # Organizer-controlled lifecycle status
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )

    # Automatically managed by Celery task
    registration_status = models.CharField(
        max_length=10,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.UPCOMING,
    )

    max_team_size = models.IntegerField(default=4)   # max members per team
    min_team_size = models.IntegerField(default=1)
    max_teams     = models.IntegerField(
        default=0,
        help_text='Maximum number of teams allowed. 0 = unlimited.',
    )

    organizer            = models.ForeignKey(OrganizerProfile, on_delete=models.CASCADE, related_name='hackathons')
    certificates_enabled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def is_registration_full(self, current_team_count: int) -> bool:
        """Return True if the hackathon has reached its team capacity.

        When max_teams is 0 the limit is unlimited and this always returns False.
        """
        if self.max_teams == 0:
            return False
        return current_team_count >= self.max_teams


class HackathonCoordinator(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coordinated_hackathons')
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='coordinators')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'hackathon')

    def __str__(self):
        return f'{self.user.email} - {self.hackathon.name}'


def problem_pdf_upload_path(instance, filename):
    """Store PDFs in: problem_statements/pdfs/<hackathon_id>/<filename>"""
    return f'problem_statements/pdfs/{instance.hackathon_id}/{filename}'


class ProblemStatement(models.Model):
    hackathon = models.ForeignKey(
        Hackathon,
        on_delete=models.CASCADE,
        related_name='problem_statements',
    )
    title       = models.CharField(max_length=255)
    description = models.TextField()
    pdf_file    = models.FileField(
        upload_to=problem_pdf_upload_path,
        validators=[validate_pdf_file],
        help_text='Upload a PDF file only.',
    )
    max_team_allowed = models.PositiveIntegerField(
        default=0,
        help_text='Maximum teams that can pick this problem. 0 = unlimited.',
    )
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} — {self.hackathon.name}'
