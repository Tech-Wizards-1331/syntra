import uuid

from django.db import migrations


def repair_team_invite_token(apps, schema_editor):
    connection = schema_editor.connection

    if connection.vendor != 'sqlite':
        return

    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(participant_team)")
        columns = {row[1] for row in cursor.fetchall()}

        if 'invite_token' not in columns:
            cursor.execute("ALTER TABLE participant_team ADD COLUMN invite_token char(32)")

        cursor.execute(
            "SELECT id FROM participant_team WHERE invite_token IS NULL OR invite_token = ''"
        )
        team_ids = [row[0] for row in cursor.fetchall()]

        for team_id in team_ids:
            cursor.execute(
                "UPDATE participant_team SET invite_token = %s WHERE id = %s",
                [uuid.uuid4().hex, team_id],
            )

        cursor.execute("PRAGMA index_list(participant_team)")
        has_unique_index = False

        for _, index_name, is_unique, *_ in cursor.fetchall():
            if not is_unique:
                continue

            cursor.execute(f'PRAGMA index_info("{index_name}")')
            index_columns = [row[2] for row in cursor.fetchall()]
            if 'invite_token' in index_columns:
                has_unique_index = True
                break

        if not has_unique_index:
            cursor.execute(
                "CREATE UNIQUE INDEX participant_team_invite_token_uniq ON participant_team(invite_token)"
            )


class Migration(migrations.Migration):

    dependencies = [
        ('participant', '0007_merge_0006_add_teamrequest_indexes_0006_sync_leaders_to_teammembers'),
    ]

    operations = [
        migrations.RunPython(repair_team_invite_token, migrations.RunPython.noop),
    ]