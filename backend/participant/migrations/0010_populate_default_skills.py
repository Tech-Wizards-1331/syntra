from django.db import migrations

def populate_skills(apps, schema_editor):
    Skill = apps.get_model('participant', 'Skill')
    skills_data = [
        # Frontend
        'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Next.js', 'Tailwind CSS',
        # Backend
        'Python', 'Django', 'Flask', 'FastAPI', 'Node.js', 'Express', 'Go', 'Rust', 'Ruby on Rails', 'Java', 'Spring Boot', 'PHP', 'Laravel',
        # Mobile
        'Flutter', 'React Native', 'Swift', 'Kotlin',
        # Database & DevOps
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'GitHub Actions',
        # Data Science & AI
        'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
        # Design & Other
        'Figma', 'UI/UX Design', 'Product Management'
    ]
    for name in skills_data:
        Skill.objects.get_or_create(name=name)

def reverse_populate_skills(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('participant', '0009_payment_remove_teamrequest_tr_receiver_status_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_skills, reverse_populate_skills),
    ]
