import uuid
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from organizer.models import Hackathon, OrganizerProfile, ScanCategory, ScanRecord, HackathonCoordinator
from participant.models import Team, TeamMember
from participant.services import generate_team_qr_code

User = get_user_model()

class QRScannerSystemTests(APITestCase):
    def setUp(self):
        # 1. Create Organizer User and Profile
        self.organizer_user = User.objects.create_user(
            email='organizer@example.com',
            password='Password123!',
            role='organizer'
        )
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Org'
        )

        # 2. Create Hackathon
        self.hackathon = Hackathon.objects.create(
            organizer=self.organizer_profile,
            name='Syntra Hackathon 2026',
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=2),
            registration_deadline=timezone.now() + timezone.timedelta(days=1),
            status='ongoing'
        )

        # 3. Create Team and Members
        self.team_leader = User.objects.create_user(
            email='leader@example.com',
            password='Password123!',
            role='participant'
        )
        self.team = Team.objects.create(
            hackathon=self.hackathon,
            name='ByteBusters',
            leader=self.team_leader,
            is_registered=True
        )
        # Generate QR code & token
        generate_team_qr_code(self.team)
        self.team.refresh_from_db()

        self.member1 = TeamMember.objects.create(team=self.team, name='Alice', email='alice@example.com')
        self.member2 = TeamMember.objects.create(team=self.team, name='Bob', email='bob@example.com')

        # 4. Create Scan Category
        self.category = ScanCategory.objects.create(
            hackathon=self.hackathon,
            name='Lunch Day 1',
            is_active=True
        )

        # 5. Create Coordinator User
        self.coordinator_user = User.objects.create_user(
            email='coordinator@example.com',
            password='Password123!',
            role='participant'  # Will gain coordinator role per-hackathon
        )
        self.coord_rel = HackathonCoordinator.objects.create(
            hackathon=self.hackathon,
            user=self.coordinator_user,
            is_active=True
        )

        # 6. Create normal participant user (unauthorized scanner)
        self.unauth_user = User.objects.create_user(
            email='unauth@example.com',
            password='Password123!',
            role='participant'
        )

        # URLs
        self.scan_url = reverse('scanner-scan')
        self.submit_url = reverse('scanner-submit')

    def test_unauthenticated_denied(self):
        """Verify that anonymous requests are rejected."""
        response = self.client.post(self.scan_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.submit_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthorized_role_denied(self):
        """Verify that a standard participant user is denied scanner access."""
        self.client.force_authenticate(user=self.unauth_user)
        
        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": self.category.id
        }
        response = self.client.post(self.scan_url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_organizer_scanner_access_success(self):
        """Verify organizer gets access and scan returns team and members."""
        self.client.force_authenticate(user=self.organizer_user)

        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": self.category.id
        }
        response = self.client.post(self.scan_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['team_name'], self.team.name)
        self.assertEqual(len(response.data['members']), 3)

    def test_coordinator_scanner_access_success(self):
        """Verify assigned active coordinator can scan and submit."""
        self.client.force_authenticate(user=self.coordinator_user)

        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": self.category.id
        }
        response = self.client.post(self.scan_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_inactive_coordinator_scanner_access_denied(self):
        """Verify inactive coordinator is denied access."""
        self.coord_rel.is_active = False
        self.coord_rel.save()

        self.client.force_authenticate(user=self.coordinator_user)
        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": self.category.id
        }
        # Lightweight check passes, but view scoped check fails contextually
        response = self.client.post(self.scan_url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_inactive_qr_validation(self):
        """Verify scan is blocked if Team qr_token is inactive."""
        self.team.is_qr_active = False
        self.team.save()

        self.client.force_authenticate(user=self.organizer_user)
        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": self.category.id
        }
        response = self.client.post(self.scan_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("inactive", response.data['qr_token'])

    def test_submit_scans_success(self):
        """Verify successful scan record creation and audit tracking."""
        self.client.force_authenticate(user=self.coordinator_user)

        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": self.category.id,
            "member_ids": [self.member1.id],
            "device_id": "scanner_device_abc"
        }
        response = self.client.post(self.submit_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

        # Check record creation
        record = ScanRecord.objects.get(team_member=self.member1, scan_category=self.category)
        self.assertEqual(record.scanned_by, self.coordinator_user)
        self.assertEqual(record.device_id, "scanner_device_abc")

    def test_submit_scans_outside_team_raises_validation_error(self):
        """Verify scanner cannot submit member IDs not belonging to the team."""
        # Create another team and member
        other_team = Team.objects.create(hackathon=self.hackathon, name='OtherTeam', leader=self.team_leader)
        other_member = TeamMember.objects.create(team=other_team, name='Charlie', email='charlie@example.com')

        self.client.force_authenticate(user=self.organizer_user)
        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": self.category.id,
            "member_ids": [self.member1.id, other_member.id]
        }
        response = self.client.post(self.submit_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("do not belong to the scanned team", response.data['member_ids'])

    def test_duplicate_scans_prevention(self):
        """Verify member cannot be double-scanned in the same category."""
        self.client.force_authenticate(user=self.organizer_user)

        # First scan
        ScanRecord.objects.create(
            team_member=self.member1,
            scan_category=self.category,
            scanned_by=self.organizer_user
        )

        # Attempt duplicate submit
        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": self.category.id,
            "member_ids": [self.member1.id]
        }
        response = self.client.post(self.submit_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already been scanned", response.data['detail'])

    def test_cross_hackathon_scans_blocked(self):
        """Verify that team and scan category from different hackathons are blocked."""
        other_organizer = User.objects.create_user(
            email='other_org@example.com',
            password='Password123!',
            role='organizer'
        )
        other_profile = OrganizerProfile.objects.create(
            user=other_organizer,
            organization_name='Other Org'
        )
        other_hackathon = Hackathon.objects.create(
            organizer=other_profile,
            name='Other Hackathon',
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=2),
            registration_deadline=timezone.now() + timezone.timedelta(days=1),
            status='ongoing'
        )
        other_category = ScanCategory.objects.create(
            hackathon=other_hackathon,
            name='Day 1 Dinner'
        )

        self.client.force_authenticate(user=self.organizer_user)
        payload = {
            "qr_token": str(self.team.qr_token),
            "scan_category_id": other_category.id
        }
        response = self.client.post(self.scan_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_scan_category_success(self):
        """Verify organizer and coordinator can create scan categories, but unauthorized users cannot."""
        url = reverse('scancategory-list')
        
        # 1. Organizer create
        self.client.force_authenticate(user=self.organizer_user)
        payload = {
            "hackathon": self.hackathon.id,
            "name": "New Category Org",
            "is_active": True,
            "display_order": 1
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ScanCategory.objects.filter(name="New Category Org").exists())

        # 2. Coordinator create
        self.client.force_authenticate(user=self.coordinator_user)
        payload = {
            "hackathon": self.hackathon.id,
            "name": "New Category Coord",
            "is_active": True,
            "display_order": 2
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ScanCategory.objects.filter(name="New Category Coord").exists())

        # 3. Unauth user create
        self.client.force_authenticate(user=self.unauth_user)
        payload = {
            "hackathon": self.hackathon.id,
            "name": "New Category Unauth",
            "is_active": True,
            "display_order": 3
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_scan_category_prevented_when_scan_records_exist(self):
        """Verify that a category cannot be deleted if it has scan records."""
        # Create scan record
        ScanRecord.objects.create(
            team_member=self.member1,
            scan_category=self.category,
            scanned_by=self.organizer_user
        )

        detail_url = reverse('scancategory-detail', kwargs={'pk': self.category.id})
        
        # Authenticate as organizer
        self.client.force_authenticate(user=self.organizer_user)
        
        # Delete attempt
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("associated scan records", response.data['detail'])
        # Category should still exist
        self.assertTrue(ScanCategory.objects.filter(id=self.category.id).exists())

    def test_delete_scan_category_success_when_empty(self):
        """Verify category can be deleted if no scan records exist."""
        detail_url = reverse('scancategory-detail', kwargs={'pk': self.category.id})
        
        # Authenticate as organizer
        self.client.force_authenticate(user=self.organizer_user)
        
        # Delete attempt
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ScanCategory.objects.filter(id=self.category.id).exists())
