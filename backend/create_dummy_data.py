import os
import django
from django.utils import timezone
from datetime import timedelta

# Set up django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from accounts.models import User
from participant.models import ParticipantProfile, Skill
from organizer.models import Hackathon, OrganizerProfile

def create_data():
    # 1. Create Skills
    skills_data = ['Python', 'React', 'UI/UX', 'Node.js', 'Machine Learning']
    skills = {}
    for name in skills_data:
        skill, _ = Skill.objects.get_or_create(name=name)
        skills[name] = skill

    # 2. Create Organizer
    org_user, created_org = User.objects.get_or_create(
        email='organizer@example.com',
        defaults={'full_name': 'Test Organizer', 'role': 'organizer'}
    )
    if created_org:
        org_user.set_password('password123')
        org_user.save()

    org_profile, _ = OrganizerProfile.objects.get_or_create(
        user=org_user, 
        defaults={'organization_name': 'Syntra Hackathons'}
    )

    # 3. Create Hackathon
    now = timezone.now()
    hackathon, _ = Hackathon.objects.get_or_create(
        name='Syntra Hackathon 2026',
        defaults={
            'description': 'A test hackathon for dummy data.',
            'start_date': now + timedelta(days=10),
            'end_date': now + timedelta(days=12),
            'registration_start': now - timedelta(days=1),
            'registration_deadline': now + timedelta(days=5),
            'status': 'published',
            'organizer': org_profile,
            'max_team_size': 4,
            'min_team_size': 2,
            'max_teams': 100
        }
    )

    # 4. Create Participants
    dummy_participants = [
        {'email': 'p1@example.com', 'name': 'Alice Frontend', 'skills': ['React', 'UI/UX']},
        {'email': 'p2@example.com', 'name': 'Bob Backend', 'skills': ['Python', 'Node.js']},
        {'email': 'p3@example.com', 'name': 'Charlie AI', 'skills': ['Python', 'Machine Learning']},
    ]

    for p in dummy_participants:
        user, created = User.objects.get_or_create(
            email=p['email'],
            defaults={'full_name': p['name'], 'role': 'participant'}
        )
        if created:
            user.set_password('password123')
            user.save()
            
        profile, _ = ParticipantProfile.objects.get_or_create(
            user=user, 
            defaults={'looking_for_team': True}
        )
        
        # Add skills
        for s_name in p['skills']:
            profile.skills.add(skills[s_name])

    print("\n--- Dummy Data Report ---")
    print("Dummy data created successfully!")
    print(f"Hackathon Name: {hackathon.name} | ID: {hackathon.id}")
    print("Organizer Email: organizer@example.com | Pass: password123")
    print("Participant Emails (Pass: password123):")
    for p in dummy_participants:
        print(f"  - {p['email']} (Skills: {', '.join(p['skills'])})")

if __name__ == '__main__':
    create_data()
