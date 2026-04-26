from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_signup(self):
        url = reverse('signup')
        response = self.client.post(url, {
            'full_name': 'Test User',
            'email': 'test@example.com',
            'password1': 'StrongPassword123!',
            'password2': 'StrongPassword123!'
        })
        self.assertEqual(response.status_code, 302)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_login(self):
        user = User.objects.create_user(email='testlogin@example.com', password='StrongPassword123!')
        url = reverse('login')
        response = self.client.post(url, {
            'email': 'testlogin@example.com',
            'password': 'StrongPassword123!'
        })
        self.assertEqual(response.status_code, 302)
        self.assertTrue('_auth_user_id' in self.client.session)
