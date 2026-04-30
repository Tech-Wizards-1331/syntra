from django.db import models
from django.conf import settings
import uuid


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class ParticipantProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='participant_profile')
    skills = models.ManyToManyField(Skill, blank=True)
    college = models.CharField(max_length=255)
    semester = models.IntegerField()
    degree = models.CharField(max_length=255)
    visibility = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - Profile"


class Team(models.Model):
    hackathon = models.ForeignKey('organizer.Hackathon', on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=255)
    leader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='led_teams')
    qr_code = models.ImageField(upload_to='team_qr_codes/', blank=True, null=True)
    food_tokens_total = models.PositiveIntegerField(default=0)
    food_tokens_used = models.PositiveIntegerField(default=0)
    selected_problem_statement = models.ForeignKey(
        'organizer.ProblemStatement',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='selected_by_teams',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.hackathon.name})"


class TeamMember(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    college = models.CharField(max_length=255, blank=True)
    semester = models.IntegerField(blank=True, null=True)
    degree = models.CharField(max_length=255, blank=True)
    skills = models.ManyToManyField(Skill, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team', 'email')

    def __str__(self):
        return f"{self.name} - {self.team.name}"

