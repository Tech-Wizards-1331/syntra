import uuid

from django.conf import settings
from django.db import models
from organizer.models import Hackathon


class Skill(models.Model):
    """Reusable skill tag (e.g. Python, React, Machine Learning)."""
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ParticipantProfile(models.Model):
    EXPERIENCE_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='participant_profile',
    )
    skills = models.ManyToManyField(Skill, blank=True, related_name='participants')
    github_link = models.URLField(max_length=300, blank=True, default='')
    college = models.CharField(max_length=255, blank=True, default='')
    experience = models.CharField(
        max_length=20,
        choices=EXPERIENCE_CHOICES,
        blank=True,
        default='',
    )
    looking_for_team = models.BooleanField(
        default=True, 
        help_text='Make profile visible to team leaders looking for members.'
    )

    def __str__(self):
        return f'ParticipantProfile({self.user.email})'


class Team(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=255)
    leader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='led_teams')
    invite_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('hackathon', 'name')

    def __str__(self):
        return f"{self.name} ({self.hackathon.name})"


class TeamMember(models.Model):
    ROLE_CHOICES = [
        ('Leader', 'Leader'),
        ('Member', 'Member'),
    ]
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='all_team_members')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='team_memberships'
    )
    name = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    member_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['team', 'user'], name='unique_team_user', condition=models.Q(user__isnull=False)),
            models.UniqueConstraint(fields=['team', 'email'], name='unique_team_email', condition=~models.Q(email='')),
        ]

    def __str__(self):
        display = self.user.email if self.user else self.email
        return f"{display} in {self.team.name}"


class HackathonRegistration(models.Model):
    team = models.OneToOneField(Team, on_delete=models.CASCADE, related_name='registration')
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=50, default='REGISTERED')
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Registration: {self.team.name} for {self.hackathon.name}"
