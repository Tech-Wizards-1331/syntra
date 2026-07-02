from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = Client(HTTP_HOST='localhost')

    def test_signup(self):
        url = reverse('signup')
        response = self.client.post(url, {
            'full_name': 'Test User',
            'email': 'test@example.com',
            'password1': 'StrongPassword123!',
            'password2': 'StrongPassword123!'
        }, secure=True)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_login(self):
        user = User.objects.create_user(email='testlogin@example.com', password='StrongPassword123!')
        url = reverse('login')
        response = self.client.post(url, {
            'email': 'testlogin@example.com',
            'password': 'StrongPassword123!'
        }, secure=True)
        self.assertEqual(response.status_code, 302)
        self.assertTrue('_auth_user_id' in self.client.session)

    def test_declined_invitation_notification(self):
        # Create leader
        leader = User.objects.create_user(email='leader@example.com', password='StrongPassword123!', role='participant')
        # Create receiver
        receiver = User.objects.create_user(email='receiver@example.com', password='StrongPassword123!', role='participant')
        # Create organizer
        organizer = User.objects.create_user(email='organizer_test@example.com', password='StrongPassword123!', role='organizer')
        from organizer.models import OrganizerProfile
        organizer_profile = OrganizerProfile.objects.create(
            user=organizer,
            organization_name="Test Org"
        )
        
        # Create hackathon
        from organizer.models import Hackathon
        from django.utils import timezone
        hackathon = Hackathon.objects.create(
            organizer=organizer_profile,
            name="Test Hack",
            start_date=timezone.now() + timezone.timedelta(days=1),
            end_date=timezone.now() + timezone.timedelta(days=2),
            registration_deadline=timezone.now() + timezone.timedelta(hours=1),
            status="registration_open",
            min_team_size=2,
            max_team_size=4
        )
        
        # Create team
        from participant.models import Team, TeamRequest
        team = Team.objects.create(
            name="Leader Team",
            hackathon=hackathon,
            leader=leader
        )
        
        # Create declined request
        TeamRequest.objects.create(
            team=team,
            receiver=receiver,
            status='declined'
        )
        
        # Log leader in and load dashboard
        self.client.force_login(leader)
        url = reverse('dashboard')
        response = self.client.get(url)
        
        # Check that warning message is present in response
        messages = list(response.context['messages'])
        self.assertEqual(len(messages), 1)
        self.assertIn("was declined", messages[0].message)
        
        # Verify request got deleted
        self.assertFalse(TeamRequest.objects.filter(team=team, receiver=receiver).exists())

    def test_resend_declined_invitation(self):
        # Create leader
        leader = User.objects.create_user(email='leader2@example.com', password='StrongPassword123!', role='participant')
        # Create receiver
        receiver = User.objects.create_user(email='receiver2@example.com', password='StrongPassword123!', role='participant')
        # Create participant profile for visibility
        from participant.models import ParticipantProfile
        ParticipantProfile.objects.create(
            user=receiver,
            college='Test College',
            semester=2,
            degree='B.Tech',
            visibility=True
        )
        # Create organizer
        organizer = User.objects.create_user(email='organizer2@example.com', password='StrongPassword123!', role='organizer')
        from organizer.models import OrganizerProfile
        organizer_profile = OrganizerProfile.objects.create(
            user=organizer,
            organization_name="Test Org"
        )
        
        # Create hackathon
        from organizer.models import Hackathon
        from django.utils import timezone
        hackathon = Hackathon.objects.create(
            organizer=organizer_profile,
            name="Test Hack 2",
            start_date=timezone.now() + timezone.timedelta(days=1),
            end_date=timezone.now() + timezone.timedelta(days=2),
            registration_deadline=timezone.now() + timezone.timedelta(hours=1),
            status="registration_open",
            min_team_size=2,
            max_team_size=4
        )
        
        # Create team
        from participant.models import Team, TeamRequest
        team = Team.objects.create(
            name="Leader Team 2",
            hackathon=hackathon,
            leader=leader
        )
        
        # Create declined request
        TeamRequest.objects.create(
            team=team,
            receiver=receiver,
            status='declined'
        )
        
        # Perform resend invite call
        self.client.force_login(leader)
        url = '/api/participant/requests/'
        response = self.client.post(url, {
            'team': team.id,
            'receiver': receiver.id
        }, content_type='application/json')
        
        # Should succeed (201 Created) because the old declined one got deleted and a new pending one was created
        self.assertEqual(response.status_code, 201)
        
        # Verify a new pending request now exists
        new_req = TeamRequest.objects.filter(team=team, receiver=receiver).first()
        self.assertIsNotNone(new_req)
        self.assertEqual(new_req.status, 'pending')

    def test_accept_invitation_flow(self):
        # Create leader
        leader = User.objects.create_user(email='leader3@example.com', password='StrongPassword123!', role='participant')
        # Create receiver
        receiver = User.objects.create_user(email='receiver3@example.com', password='StrongPassword123!', role='participant')
        # Create participant profiles
        from participant.models import ParticipantProfile
        ParticipantProfile.objects.create(
            user=receiver,
            college='Receiver College',
            semester=3,
            degree='B.Tech',
            visibility=True
        )
        # Create organizer
        organizer = User.objects.create_user(email='organizer3@example.com', password='StrongPassword123!', role='organizer')
        from organizer.models import OrganizerProfile
        OrganizerProfile.objects.create(
            user=organizer,
            organization_name="Test Org"
        )
        
        # Create hackathon
        from organizer.models import Hackathon
        from django.utils import timezone
        hackathon = Hackathon.objects.create(
            organizer_id=organizer.organizer_profile.id,
            name="Test Hack 3",
            start_date=timezone.now() + timezone.timedelta(days=1),
            end_date=timezone.now() + timezone.timedelta(days=2),
            registration_deadline=timezone.now() + timezone.timedelta(hours=1),
            status="registration_open",
            min_team_size=2,
            max_team_size=4
        )
        
        # Create team
        from participant.models import Team, TeamRequest, TeamMember
        team = Team.objects.create(
            name="Leader Team 3",
            hackathon=hackathon,
            leader=leader
        )
        
        # Create pending invitation request
        req = TeamRequest.objects.create(
            team=team,
            receiver=receiver,
            status='pending'
        )
        
        # Accept invite via API
        self.client.force_login(receiver)
        accept_url = f'/api/participant/requests/{req.id}/accept/'
        response = self.client.post(accept_url)
        self.assertEqual(response.status_code, 200)
        
        # 1. Verify receiver is now in TeamMember list
        self.assertTrue(TeamMember.objects.filter(team=team, email=receiver.email).exists())
        member = TeamMember.objects.get(team=team, email=receiver.email)
        self.assertEqual(member.college, 'Receiver College')
        self.assertEqual(member.semester, 3)
        self.assertEqual(member.degree, 'B.Tech')
        
        # 2. Verify accepted request is not returned in pending inbox
        list_url = '/api/participant/requests/'
        list_response = self.client.get(list_url)
        self.assertEqual(list_response.status_code, 200)
        pending_requests = [r for r in list_response.json() if r['status'] == 'pending']
        self.assertEqual(len(pending_requests), 0)
        
        # 3. Verify they see the team on their dashboard under "My Teams & Registrations"
        dash_url = reverse('dashboard')
        dash_response = self.client.get(dash_url)
        self.assertEqual(dash_response.status_code, 200)
        my_teams = list(dash_response.context['my_teams'])
        self.assertEqual(len(my_teams), 1)
        self.assertEqual(my_teams[0], team)
        
        # 4. Verify they cannot register their own team for this hackathon
        register_url = reverse('hackathon-register', kwargs={'pk': hackathon.id})
        reg_response = self.client.get(register_url)
        self.assertEqual(reg_response.status_code, 302)  # Redirect
        self.assertEqual(reg_response.url, dash_url)

        # 5. Verify has_registered_team is True on dashboard load when team is registered
        team.is_registered = True
        team.save()
        dash_response = self.client.get(dash_url)
        self.assertEqual(dash_response.status_code, 200)
        self.assertTrue(dash_response.context['has_registered_team'])

        # 6. Verify leader hub page shows no recruiting panel once registered
        self.client.force_login(leader)
        hub_url = reverse('participant-hackathon-hub', kwargs={'pk': hackathon.id})
        hub_response = self.client.get(hub_url)
        self.assertEqual(hub_response.status_code, 200)
        self.assertNotIn("Find Solo Participants", hub_response.content.decode())

    def test_accept_safeguards(self):
        # Create leader
        leader = User.objects.create_user(email='leader4@example.com', password='StrongPassword123!', role='participant')
        # Create receiver
        receiver = User.objects.create_user(email='receiver4@example.com', password='StrongPassword123!', role='participant')
        # Create organizer
        organizer = User.objects.create_user(email='organizer4@example.com', password='StrongPassword123!', role='organizer')
        from organizer.models import OrganizerProfile
        OrganizerProfile.objects.create(
            user=organizer,
            organization_name="Test Org"
        )
        
        # Create hackathon with max size 2
        from organizer.models import Hackathon
        from django.utils import timezone
        hackathon = Hackathon.objects.create(
            organizer_id=organizer.organizer_profile.id,
            name="Test Hack 4",
            start_date=timezone.now() + timezone.timedelta(days=1),
            end_date=timezone.now() + timezone.timedelta(days=2),
            registration_deadline=timezone.now() + timezone.timedelta(hours=1),
            status="registration_open",
            min_team_size=2,
            max_team_size=2
        )
        
        # Create team
        from participant.models import Team, TeamRequest, TeamMember
        team = Team.objects.create(
            name="Leader Team 4",
            hackathon=hackathon,
            leader=leader
        )
        
        # Create invitation
        req = TeamRequest.objects.create(
            team=team,
            receiver=receiver,
            status='pending'
        )
        
        # Scenario 1: Team becomes full (leader adds another guest member manually)
        TeamMember.objects.create(
            team=team,
            name="Guest Member",
            email="guest@example.com"
        )
        
        # Try to accept invitation as receiver
        self.client.force_login(receiver)
        accept_url = f'/api/participant/requests/{req.id}/accept/'
        response = self.client.post(accept_url)
        # Should be rejected with 400 Bad Request
        self.assertEqual(response.status_code, 400)
        self.assertIn("This team is already full", response.json()['detail'])
        
        # Reset team by removing guest member to test next scenario
        TeamMember.objects.filter(team=team, email="guest@example.com").delete()
        
        # Scenario 2: Receiver joins another team in the meantime
        other_leader = User.objects.create_user(email='otherleader@example.com', password='StrongPassword123!', role='participant')
        other_team = Team.objects.create(
            name="Other Team",
            hackathon=hackathon,
            leader=other_leader
        )
        TeamMember.objects.create(
            team=other_team,
            name="Receiver Member",
            email=receiver.email
        )
        
        # Try to accept initial invitation
        response2 = self.client.post(accept_url)
        # Should be rejected with 404 Not Found (since it's securely excluded from the queryset because they joined a team)
        self.assertEqual(response2.status_code, 404)

    def test_complete_profile_custom_skills(self):
        user = User.objects.create_user(email='testprofile@example.com', password='StrongPassword123!', role='participant')
        self.client.force_login(user)
        
        # Post to complete-profile with multiple custom skills (comma-separated)
        url = reverse('complete_profile')
        response = self.client.post(url, {
            'full_name': 'Test Participant',
            'college': 'Test University',
            'degree': 'B.Tech',
            'semester': 4,
            'custom_skill': 'Django, React, Docker',
        }, secure=True)
        
        self.assertEqual(response.status_code, 302)
        
        # Verify the participant profile and custom skills were created and linked
        user.refresh_from_db()
        self.assertTrue(user.is_profile_complete)
        
        profile = user.participant_profile
        self.assertEqual(profile.college, 'Test University')
        
        skills = list(profile.skills.values_list('name', flat=True))
        self.assertIn('Django', skills)
        self.assertIn('React', skills)
        self.assertIn('Docker', skills)
