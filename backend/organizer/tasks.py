"""
organizer/tasks.py — Celery tasks for the organizer app.

This module contains the periodic task that automatically transitions each
hackathon's registration_status field based on the current wall-clock time
and team capacity.

Status transition rules
───────────────────────
  UPCOMING  current time < registration_start
  OPEN      within [registration_start, registration_deadline]
              AND (max_teams == 0 OR team_count < max_teams)
  CLOSED    current time > registration_deadline
              OR (max_teams > 0 AND team_count >= max_teams)

DB-write optimisation
─────────────────────
Only hackathons whose computed status *differs* from the stored value are
updated.  The task fetches all hackathons in one query, computes the new
status in Python, then performs a single bulk_update for the changed rows.

Race-condition safety (team capacity)
──────────────────────────────────────
When a team registers, registration_status is re-evaluated inside an
atomic select_for_update() block.  The Celery task itself doesn't need
locks because it is the *only writer* of registration_status; team
registration logic (future participant app) should call
Hackathon.objects.select_for_update() before incrementing the team count.
See the note at the bottom of this file for the recommended pattern.
"""

import logging
from typing import NamedTuple

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import Hackathon

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class _StatusUpdate(NamedTuple):
    hackathon: Hackathon
    new_status: str


def _compute_registration_status(hackathon: Hackathon, now, team_count: int) -> str:
    """Pure function — derives the correct RegistrationStatus from inputs."""
    RS = Hackathon.RegistrationStatus

    if now < hackathon.registration_start:
        return RS.UPCOMING

    if now > hackathon.registration_deadline:
        return RS.CLOSED

    # Within registration window — check capacity.
    if hackathon.is_registration_full(team_count):
        return RS.CLOSED

    return RS.OPEN


def _get_team_count(hackathon: Hackathon) -> int:
    """Return the current number of registered teams for this hackathon.

    TODO: Replace with the real Team queryset once the participant app ships:
        from participant.models import Team
        return Team.objects.filter(hackathon=hackathon).count()
    """
    # Placeholder — no Team model yet.
    return 0


# ---------------------------------------------------------------------------
# Shared task
# ---------------------------------------------------------------------------

@shared_task(
    name='organizer.tasks.update_hackathon_registration_statuses',
    bind=True,
    max_retries=3,
    default_retry_delay=10,  # seconds between retries
    ignore_result=True,
)
def update_hackathon_registration_statuses(self):
    """Evaluate and persist registration_status for every Hackathon.

    Runs every 60 seconds via Celery Beat.  Only performs DB writes for rows
    whose status has actually changed (avoids churning the DB unnecessarily).
    """
    try:
        now = timezone.now()

        # Single query — fetch only the fields we need.
        hackathons = list(
            Hackathon.objects.only(
                'id',
                'registration_start',
                'registration_deadline',
                'registration_status',
                'max_teams',
            )
        )

        updates: list[Hackathon] = []

        for hackathon in hackathons:
            team_count = _get_team_count(hackathon)
            new_status = _compute_registration_status(hackathon, now, team_count)

            if hackathon.registration_status != new_status:
                hackathon.registration_status = new_status
                updates.append(hackathon)

        if updates:
            # Bulk update — single SQL statement regardless of how many rows changed.
            with transaction.atomic():
                Hackathon.objects.bulk_update(updates, ['registration_status'])
            logger.info(
                '[Celery] Updated registration_status for %d hackathon(s).', len(updates)
            )
        else:
            logger.debug('[Celery] No registration_status changes detected.')

    except Exception as exc:  # noqa: BLE001
        logger.exception('[Celery] update_hackathon_registration_statuses failed: %s', exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Race-condition pattern — for use in the future participant app
# ---------------------------------------------------------------------------
#
# When a team attempts to register, use this pattern to safely check capacity:
#
#   from django.db import transaction
#   from organizer.models import Hackathon
#
#   def register_team(hackathon_id: int, team_data: dict):
#       with transaction.atomic():
#           hackathon = (
#               Hackathon.objects
#               .select_for_update()          # row-level DB lock
#               .get(pk=hackathon_id)
#           )
#           team_count = Team.objects.filter(hackathon=hackathon).count()
#           if hackathon.is_registration_full(team_count):
#               raise ValidationError('Registration is closed — teams are full.')
#           team = Team.objects.create(hackathon=hackathon, **team_data)
#           # The Celery task will pick up the updated count on the next pass.
#           return team
#
# The select_for_update() lock ensures that two concurrent requests can't
# both pass the capacity check simultaneously.
