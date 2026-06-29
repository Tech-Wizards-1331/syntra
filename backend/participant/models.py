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
    invite_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    is_registered = models.BooleanField(default=False)
    qr_code = models.ImageField(upload_to='team_qr_codes/', blank=True, null=True)
    qr_token = models.UUIDField(unique=True, null=True, blank=True, db_index=True, editable=False)
    is_qr_active = models.BooleanField(default=True)

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

    @property
    def occupied_slots(self):
        # Pending invites do not reserve seats. Capacity is leader + accepted members only.
        member_count = self.members.count()
        if self.members.filter(email=self.leader.email).exists():
            return member_count
        return 1 + member_count

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_registered:
            leader_profile = getattr(self.leader, 'participant_profile', None)
            college = leader_profile.college if leader_profile else ""
            semester = leader_profile.semester if leader_profile else None
            degree = leader_profile.degree if leader_profile else ""

            TeamMember.objects.get_or_create(
                team=self,
                email=self.leader.email,
                defaults={
                    'name': self.leader.full_name or self.leader.email,
                    'college': college,
                    'semester': semester,
                    'degree': degree,
                }
            )
        else:
            TeamMember.objects.filter(team=self, email=self.leader.email).delete()


class TeamMember(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    name = models.CharField(max_length=255)
    email = models.EmailField(db_index=True)
    college = models.CharField(max_length=255, blank=True)
    semester = models.IntegerField(blank=True, null=True)
    degree = models.CharField(max_length=255, blank=True)
    skills = models.ManyToManyField(Skill, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        from django.core.exceptions import ValidationError
        if self.team_id and self.email:
            if TeamMember.objects.filter(email=self.email, team__hackathon=self.team.hackathon).exclude(pk=self.pk).exists():
                raise ValidationError("This email is already registered for this hackathon.")

    class Meta:
        unique_together = ('team', 'email')

    def __str__(self):
        return f"{self.name} - {self.team.name}"

    def get_missing_fields(self):
        missing = []
        if not self.college:
            missing.append("College")
        if not self.semester:
            missing.append("Semester")
        if not self.degree:
            missing.append("Degree")
        return ", ".join(missing)


class TeamRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined')
    )
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='requests')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_team_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team', 'receiver')

    def __str__(self):
        return f"{self.team.name} -> {self.receiver.email} ({self.status})"

class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('successful', 'Successful'),
        ('failed', 'Failed'),
    )
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments_made')
    razorpay_order_id = models.CharField(max_length=255, unique=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.id} for Team {self.team.name} - {self.status}"


from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

def sync_user_visibility_by_email(email):
    User = get_user_model()
    user = User.objects.filter(email=email).first()
    if user:
        sync_user_visibility(user)

def sync_user_visibility(user):
    profile = getattr(user, 'participant_profile', None)
    if profile:
        is_in_team = Team.objects.filter(leader=user).exists() or TeamMember.objects.filter(email=user.email).exists()
        expected_visibility = not is_in_team
        if profile.visibility != expected_visibility:
            profile.visibility = expected_visibility
            profile.save()

@receiver(post_save, sender=Team)
@receiver(post_delete, sender=Team)
def handle_team_change(sender, instance, **kwargs):
    # Leader is affected
    sync_user_visibility(instance.leader)
    # Members (by email) are affected
    member_emails = TeamMember.objects.filter(team=instance).values_list('email', flat=True)
    for email in member_emails:
        sync_user_visibility_by_email(email)

@receiver(post_save, sender=TeamMember)
@receiver(post_delete, sender=TeamMember)
def handle_member_change(sender, instance, **kwargs):
    sync_user_visibility_by_email(instance.email)

