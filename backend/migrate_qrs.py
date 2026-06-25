import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'syntra.settings')
django.setup()

from participant.models import Team
from participant.services import generate_team_qr_code

def main():
    teams = Team.objects.all()
    print(f"Found {teams.count()} teams. Migrating QR codes to Cloudinary...")

    for team in teams:
        print(f"Migrating QR for team {team.id} ({team.name})...")
        # Clear the existing local qr_code reference
        team.qr_code = None
        team.save(update_fields=['qr_code'])
        
        # Regenerate which will automatically use the new Cloudinary storage backend
        generate_team_qr_code(team)
        print(f"  -> Successfully migrated to: {team.qr_code.url}")

    print("Migration complete!")

if __name__ == '__main__':
    main()
