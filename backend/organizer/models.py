from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator


class OrganizerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organizer_profile')
    organization_name = models.CharField(max_length=255)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='organizer_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.organization_name


class Hackathon(models.Model):
    STATUS_CHOICES = (
        ('registration_open', 'Registration Open'),
        ('registration_closed', 'Registration Closed'),
        ('problem_selection', 'Problem Selection'),
        ('ongoing', 'Ongoing'),
        ('evaluation', 'Evaluation'),
        ('result_published', 'Result Published'),
    )

    organizer = models.ForeignKey(OrganizerProfile, on_delete=models.CASCADE, related_name='hackathons')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    registration_deadline = models.DateTimeField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='registration_open')
    min_team_size = models.PositiveIntegerField(default=1)
    max_team_size = models.PositiveIntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProblemStatement(models.Model):
    hackathon = models.ForeignKey(
        Hackathon,
        on_delete=models.CASCADE,
        related_name='problem_statements',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    pdf_file = models.FileField(
        upload_to='problem_statements/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])],
    )
    max_teams_allowed = models.PositiveIntegerField(
        help_text="Maximum number of teams that can select this problem statement.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — {self.hackathon.name}"
