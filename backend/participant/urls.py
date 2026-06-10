from django.urls import path
from .views import (
    HackathonListView, HackathonRegisterWizardView, ParticipantHackathonHubView, ParticipantTeamPassView,
    PaymentCheckoutView, PaymentVerifyView
)

urlpatterns = [
    path('hackathons/', HackathonListView.as_view(), name='hackathon-list'),
    path('hackathons/<int:pk>/register/', HackathonRegisterWizardView.as_view(), name='hackathon-register'),
    path('hackathons/<int:pk>/hub/', ParticipantHackathonHubView.as_view(), name='participant-hackathon-hub'),
    path('hackathons/<int:pk>/team-pass/', ParticipantTeamPassView.as_view(), name='participant-team-pass'),
    path('payment/<int:pk>/checkout/', PaymentCheckoutView.as_view(), name='payment-checkout'),
    path('payment/<int:pk>/verify/', PaymentVerifyView.as_view(), name='payment-verify'),
]
