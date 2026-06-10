from django.urls import path
from .views import (
    CreateHackathonView,
    HackathonDetailView,
    EditHackathonView,
    AddProblemStatementView,
    EditProblemStatementView,
    DeleteProblemStatementView,
    RunSeatingAllocationView,
    QRScannerView,
)

urlpatterns = [
    path('create-hackathon/', CreateHackathonView.as_view(), name='organizer-create-hackathon'),
    path('hackathon/<int:pk>/', HackathonDetailView.as_view(), name='organizer-hackathon-detail'),
    path('hackathon/<int:pk>/edit/', EditHackathonView.as_view(), name='organizer-edit-hackathon'),
    path('hackathon/<int:hackathon_id>/add-problem-statement/', AddProblemStatementView.as_view(), name='organizer-add-problem-statement'),
    path('hackathon/<int:hackathon_id>/edit-problem-statement/<int:pk>/', EditProblemStatementView.as_view(), name='organizer-edit-problem-statement'),
    path('hackathon/<int:hackathon_id>/delete-problem-statement/<int:pk>/', DeleteProblemStatementView.as_view(), name='organizer-delete-problem-statement'),
    path('hackathon/<int:hackathon_id>/run-seating/', RunSeatingAllocationView.as_view(), name='organizer-run-seating'),
    path('hackathon/<int:hackathon_id>/scanner/', QRScannerView.as_view(), name='organizer-qr-scanner'),
]
