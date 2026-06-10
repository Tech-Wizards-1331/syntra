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
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='registration_open', db_index=True)
    min_team_size = models.PositiveIntegerField(default=1)
    max_team_size = models.PositiveIntegerField(default=4)
    room_configuration = models.JSONField(null=True, blank=True)
    seating_allocation = models.JSONField(null=True, blank=True)
    
    # Pricing Configuration
    is_paid = models.BooleanField(default=False)
    fee_type = models.CharField(
        max_length=20, 
        choices=[('team', 'Team Wise'), ('participant', 'Participant Wise')], 
        null=True, blank=True
    )
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
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
        indexes = [
            # Speeds up the common filter: is_active=True filtered by hackathon
            models.Index(fields=['hackathon', 'is_active'], name='ps_hackathon_active_idx'),
        ]

    def __str__(self):
        return f"{self.title} — {self.hackathon.name}"


class HackathonCoordinator(models.Model):
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='coordinators')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coordinated_hackathons')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('hackathon', 'user')
        indexes = [
            models.Index(fields=['hackathon', 'user', 'is_active'], name='coord_h_u_active_idx'),
        ]

    def __str__(self):
        return f"{self.user.email} -> {self.hackathon.name}"


class ScanCategory(models.Model):
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='scan_categories')
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'created_at']
        unique_together = ('hackathon', 'name')
        indexes = [
            models.Index(fields=['hackathon', 'is_active'], name='sc_h_active_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.hackathon.name})"


class ScanRecord(models.Model):
    team_member = models.ForeignKey('participant.TeamMember', on_delete=models.CASCADE, related_name='scan_records')
    scan_category = models.ForeignKey(ScanCategory, on_delete=models.CASCADE, related_name='scan_records')
    scanned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scanned_records')
    device_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team_member', 'scan_category')
        indexes = [
            models.Index(fields=['scan_category', 'team_member'], name='sr_cat_member_idx'),
        ]

    def __str__(self):
        return f"{self.team_member.name} - {self.scan_category.name}"

