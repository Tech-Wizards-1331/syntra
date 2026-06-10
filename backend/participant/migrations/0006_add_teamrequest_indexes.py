from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('participant', '0005_team_invite_token_teamrequest'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='teamrequest',
            index=models.Index(fields=['receiver', 'status'], name='tr_receiver_status_idx'),
        ),
        migrations.AddIndex(
            model_name='teamrequest',
            index=models.Index(fields=['team', 'status'], name='tr_team_status_idx'),
        ),
    ]
